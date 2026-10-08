import 'server-only';
import postgres from 'postgres';
import seedBars from '@/data/bars.json';

// One connection pool per server instance.
function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add your Supabase connection string in Vercel under Settings > Environment Variables.'
    );
  }
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  return postgres(url, {
    // Supabase's connection pooler does not support prepared statements.
    prepare: false,
    max: 5,
    idle_timeout: 20,
    ssl: local ? false : 'require',
  });
}

const g = globalThis;
export const sql = g.__sportsBarSql ?? (g.__sportsBarSql = createClient());

const SCHEMA = `
create table if not exists bars (
  id serial primary key,
  name text not null,
  type text not null default '',
  area text not null default '',
  address text not null default '',
  website text not null default '',
  facebook text not null default '',
  instagram text not null default '',
  notes text not null default '',
  claims_all_packages boolean not null default false,
  claim_text text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists bar_packages (
  bar_id integer not null references bars(id) on delete cascade,
  package text not null,
  status text not null check (status in ('has', 'not')),
  source text not null,
  evidence text not null default '',
  last_confirmed date,
  updated_at timestamptz not null default now(),
  primary key (bar_id, package)
);

-- Teams whose fans use a bar as their home for games, e.g. a Cleveland Browns bar.
create table if not exists bar_teams (
  bar_id integer not null references bars(id) on delete cascade,
  team text not null,
  source text not null,
  last_confirmed date,
  created_at timestamptz not null default now(),
  primary key (bar_id, team)
);

create table if not exists reports (
  id serial primary key,
  bar_id integer references bars(id) on delete set null,
  new_bar_name text not null default '',
  new_bar_address text not null default '',
  new_bar_area text not null default '',
  has_packages text not null default '',
  not_packages text not null default '',
  other_package text not null default '',
  relation text not null,
  seen_on date,
  link text not null default '',
  note text not null default '',
  email text not null,
  email_verified boolean not null default false,
  verify_token text unique,
  opt_in boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  ip_hash text not null default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists reports_status_idx on reports (status, created_at);
create index if not exists reports_ip_idx on reports (ip_hash, created_at);

create table if not exists subscribers (
  email text primary key,
  consent_text text not null,
  consented_at timestamptz not null default now(),
  source text not null default 'report form',
  verified boolean not null default false
);

alter table bars enable row level security;
alter table bar_packages enable row level security;
alter table bar_teams enable row level security;
alter table reports add column if not exists team text not null default '';
alter table reports enable row level security;
alter table subscribers enable row level security;
`;

async function initialize() {
  await sql.begin(async (tx) => {
    // Only one server instance sets up the database at a time.
    await tx`select pg_advisory_xact_lock(724301)`;
    await tx.unsafe(SCHEMA);
    // Adds ZIP codes to starting-list addresses that were saved without one (so ZIP search finds them).
    // Only touches an address still exactly as first loaded, so edits made in admin are kept.
    const zipFixes = seedBars.filter((b) => /, OR \d{5}$/.test(b.address ?? ''));
    await tx`
      update bars b set address = v.new_address
      from unnest(${zipFixes.map((b) => b.id)}::int[],
                  ${zipFixes.map((b) => b.address.replace(/ \d{5}$/, ''))}::text[],
                  ${zipFixes.map((b) => b.address)}::text[]) as v(id, old_address, new_address)
      where b.id = v.id and b.address = v.old_address`;
    const [{ count }] = await tx`select count(*)::int as count from bars`;
    if (count > 0) return;
    for (const b of seedBars) {
      await tx`
        insert into bars (id, name, type, area, address, website, facebook, instagram, notes, claims_all_packages, claim_text)
        values (${b.id}, ${b.name}, ${b.type}, ${b.area}, ${b.address}, ${b.website}, ${b.facebook},
                ${b.instagram}, ${b.notes}, ${b.claims_all_packages}, ${b.claim_text ?? ''})`;
      for (const p of b.packages) {
        await tx`
          insert into bar_packages (bar_id, package, status, source, evidence, last_confirmed)
          values (${b.id}, ${p.package}, ${p.status}, ${p.source}, ${p.evidence}, ${p.last_confirmed})`;
      }
    }
    await tx`select setval(pg_get_serial_sequence('bars', 'id'), (select max(id) from bars))`;
  });
}

// Creates the tables and loads the starting bar list the first time the app runs.
export function ensureDb() {
  if (!g.__sportsBarDbReady) {
    g.__sportsBarDbReady = initialize().catch((err) => {
      g.__sportsBarDbReady = null;
      throw err;
    });
  }
  return g.__sportsBarDbReady;
}
