import 'server-only';
import { sql, ensureDb } from '@/lib/db';

function toDateString(d) {
  if (!d) return null;
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

// Calendar date in Portland time, as YYYY-MM-DD.
function pacificDate(ts) {
  if (!ts) return null;
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(ts));
}

function shapeTeams(rows) {
  return rows
    .map((t) => ({ team: t.team, source: t.source, lastConfirmed: toDateString(t.last_confirmed) }))
    .sort((a, b) => a.team.localeCompare(b.team));
}

const groupBy = (rows) => {
  const m = new Map();
  for (const r of rows) {
    if (!m.has(r.bar_id)) m.set(r.bar_id, []);
    m.get(r.bar_id).push(r);
  }
  return m;
};

function shapePackages(rows) {
  return rows.map((p) => ({
    package: p.package,
    status: p.status,
    source: p.source,
    evidence: p.evidence,
    lastConfirmed: toDateString(p.last_confirmed),
  }));
}

// All active bars with their package listings, for the finder.
export async function getBars() {
  await ensureDb();
  const bars = await sql`
    select id, name, type, area, address, website, facebook, instagram, claims_all_packages, claim_text
    from bars where active order by name`;
  const byBar = groupBy(await sql`select * from bar_packages`);
  const teamsByBar = groupBy(await sql`select * from bar_teams`);
  return bars.map((b) => ({
    id: b.id,
    name: b.name,
    type: b.type,
    area: b.area,
    address: b.address,
    website: b.website,
    facebook: b.facebook,
    instagram: b.instagram,
    claimsAll: b.claims_all_packages,
    claimText: b.claim_text,
    packages: shapePackages(byBar.get(b.id) ?? []),
    teams: shapeTeams(teamsByBar.get(b.id) ?? []),
  }));
}

export async function getBar(id) {
  await ensureDb();
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const [b] = await sql`select * from bars where id = ${n} and active`;
  if (!b) return null;
  const pk = await sql`select * from bar_packages where bar_id = ${n}`;
  const teams = await sql`select * from bar_teams where bar_id = ${n}`;
  return {
    id: b.id,
    name: b.name,
    type: b.type,
    area: b.area,
    address: b.address,
    website: b.website,
    facebook: b.facebook,
    instagram: b.instagram,
    claimsAll: b.claims_all_packages,
    claimText: b.claim_text,
    packages: shapePackages(pk),
    teams: shapeTeams(teams),
  };
}

// Bar names for the report form's drop-down.
export async function getBarOptions() {
  await ensureDb();
  return sql`select id, name, area from bars where active order by name`;
}

const splitList = (s) => (s ? s.split(',').filter(Boolean) : []);

function shapeReport(r) {
  return {
    id: r.id,
    barId: r.bar_id,
    barName: r.bar_name,
    newBarName: r.new_bar_name,
    newBarAddress: r.new_bar_address,
    newBarArea: r.new_bar_area,
    has: splitList(r.has_packages),
    not: splitList(r.not_packages),
    otherPackage: r.other_package,
    team: r.team ?? '',
    relation: r.relation,
    seenOn: toDateString(r.seen_on),
    link: r.link,
    note: r.note,
    status: r.status,
    createdAt: pacificDate(r.created_at),
    reviewedAt: pacificDate(r.reviewed_at),
  };
}

// Reports waiting for review, with each bar's current listings for comparison.
export async function getPendingReports() {
  await ensureDb();
  const rows = await sql`
    select r.*, b.name as bar_name
    from reports r left join bars b on b.id = r.bar_id
    where r.status = 'pending'
    order by r.created_at asc`;
  const barIds = [...new Set(rows.map((r) => r.bar_id).filter(Boolean))];
  const current = barIds.length
    ? await sql`select * from bar_packages where bar_id in ${sql(barIds)}`
    : [];
  const currentTeams = barIds.length ? await sql`select * from bar_teams where bar_id in ${sql(barIds)}` : [];
  return rows.map((r) => ({
    ...shapeReport(r),
    current: shapePackages(current.filter((p) => p.bar_id === r.bar_id)),
    currentTeams: shapeTeams(currentTeams.filter((t) => t.bar_id === r.bar_id)),
  }));
}

export async function getRecentReviewed(limit = 15) {
  await ensureDb();
  const rows = await sql`
    select r.*, b.name as bar_name
    from reports r left join bars b on b.id = r.bar_id
    where r.status <> 'pending'
    order by r.reviewed_at desc nulls last
    limit ${limit}`;
  return rows.map(shapeReport);
}

export async function getCounts() {
  await ensureDb();
  const [row] = await sql`
    select
      (select count(*)::int from reports where status = 'pending') as pending,
      (select count(*)::int from reports where status = 'approved') as approved`;
  return row;
}

// Every bar, including hidden ones, for the admin's Manage bars list.
export async function getAllBarsForAdmin() {
  await ensureDb();
  return sql`
    select b.id, b.name, b.area, b.address, b.active,
      (select count(*)::int from bar_packages p where p.bar_id = b.id and p.status = 'has') as has_count,
      (select coalesce(string_agg(t.team, ', ' order by t.team), '') from bar_teams t where t.bar_id = b.id) as teams
    from bars b
    order by b.active desc, b.name`;
}

// One bar with all its fields, including hidden bars, for the admin edit form.
export async function getBarForAdmin(id) {
  await ensureDb();
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  const [b] = await sql`select * from bars where id = ${n}`;
  if (!b) return null;
  const pk = await sql`select * from bar_packages where bar_id = ${n}`;
  const teams = await sql`select * from bar_teams where bar_id = ${n}`;
  return {
    id: b.id,
    name: b.name,
    type: b.type,
    area: b.area,
    address: b.address,
    website: b.website,
    facebook: b.facebook,
    instagram: b.instagram,
    notes: b.notes,
    active: b.active,
    claimsAll: b.claims_all_packages,
    claimText: b.claim_text,
    packages: shapePackages(pk),
    teams: shapeTeams(teams),
  };
}

// Headline numbers for the home page's city card.
export async function getCityStats() {
  await ensureDb();
  const [row] = await sql`
    select
      (select count(*)::int from bars where active) as bars,
      (select count(distinct p.bar_id)::int from bar_packages p join bars b on b.id = p.bar_id
        where b.active and p.status = 'has') as confirmed`;
  return row;
}
