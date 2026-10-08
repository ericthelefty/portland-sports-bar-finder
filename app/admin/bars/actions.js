'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql, ensureDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';
import { PACKAGE_KEYS, AREAS } from '@/lib/constants';
import { canonicalTeam } from '@/lib/teams';

const clean = (v, max = 300) => String(v ?? '').trim().slice(0, max);

// Accepts "example.com" or "https://example.com"; returns '' for blank.
function normalizeUrl(v) {
  const s = clean(v, 500);
  if (!s) return '';
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());

// Creates a bar (no id) or updates one, including its package listings.
export async function saveBar(_prev, formData) {
  if (!(await isAdmin())) redirect('/admin');
  const id = formData.get('id') ? Number(formData.get('id')) : null;
  const values = {
    name: clean(formData.get('name'), 120),
    type: clean(formData.get('type'), 60),
    area: clean(formData.get('area'), 4),
    address: clean(formData.get('address'), 200),
    website: normalizeUrl(formData.get('website')),
    facebook: normalizeUrl(formData.get('facebook')),
    instagram: normalizeUrl(formData.get('instagram')),
    notes: clean(formData.get('notes'), 1000),
    active: formData.get('active') === 'yes',
    claimsAll: formData.get('claimsAll') === 'yes',
  };
  const pkgs = Object.fromEntries(
    PACKAGE_KEYS.map((k) => [k, ['has', 'not', 'unknown'].includes(formData.get(`pkg_${k}`)) ? formData.get(`pkg_${k}`) : 'unknown'])
  );

  const keepTeams = new Set(formData.getAll('teamKeep').map(canonicalTeam).filter(Boolean));
  const newTeams = [0, 1].map((i) => ({ team: canonicalTeam(formData.get(`newTeam_${i}`)) })).filter((t) => t.team);

  const errors = {};
  if (values.name.length < 2) errors.name = 'Enter the bar\'s name.';
  if (values.area && !AREAS.includes(values.area)) errors.area = 'Choose an area.';
  for (const f of ['website', 'facebook', 'instagram']) {
    try {
      if (values[f]) new URL(values[f]);
    } catch {
      errors[f] = 'That doesn\'t look like a web address.';
    }
  }
  if (Object.keys(errors).length) return { values: { ...values, pkgs, newTeams }, errors };

  await ensureDb();
  let barId = id;
  await sql.begin(async (tx) => {
    if (barId) {
      const updated = await tx`
        update bars set name = ${values.name}, type = ${values.type}, area = ${values.area}, address = ${values.address},
          website = ${values.website}, facebook = ${values.facebook}, instagram = ${values.instagram},
          notes = ${values.notes}, active = ${values.active}, claims_all_packages = ${values.claimsAll}
        where id = ${barId} returning id`;
      if (!updated.length) throw new Error('Bar not found');
    } else {
      const [row] = await tx`
        insert into bars (name, type, area, address, website, facebook, instagram, notes, active, claims_all_packages)
        values (${values.name}, ${values.type}, ${values.area}, ${values.address}, ${values.website}, ${values.facebook},
                ${values.instagram}, ${values.notes}, ${values.active}, ${values.claimsAll})
        returning id`;
      barId = row.id;
    }
    const current = await tx`select package, status from bar_packages where bar_id = ${barId}`;
    const now = Object.fromEntries(current.map((r) => [r.package, r.status]));
    for (const k of PACKAGE_KEYS) {
      const want = pkgs[k];
      const have = now[k] ?? 'unknown';
      if (want === have) continue; // unchanged: keep its original source and date
      if (want === 'unknown') {
        await tx`delete from bar_packages where bar_id = ${barId} and package = ${k}`;
      } else {
        await tx`
          insert into bar_packages (bar_id, package, status, source, evidence, last_confirmed, updated_at)
          values (${barId}, ${k}, ${want}, 'admin', 'Updated by the site owner', ${today()}, now())
          on conflict (bar_id, package) do update
            set status = excluded.status, source = 'admin', evidence = excluded.evidence,
                last_confirmed = excluded.last_confirmed, updated_at = now()`;
      }
    }
    // Team tags: drop unchecked ones, add new ones.
    for (const t of await tx`select team from bar_teams where bar_id = ${barId}`) {
      if (!keepTeams.has(t.team)) await tx`delete from bar_teams where bar_id = ${barId} and team = ${t.team}`;
    }
    for (const t of newTeams) {
      await tx`
        insert into bar_teams (bar_id, team, source, last_confirmed)
        values (${barId}, ${t.team}, 'admin', ${today()})
        on conflict (bar_id, team) do update set last_confirmed = excluded.last_confirmed`;
    }
  });
  revalidatePath('/', 'layout');
  redirect(`/admin/bars?saved=${barId}`);
}

// Permanently removes a bar, its package listings, and unlinks its reports.
export async function deleteBar(formData) {
  if (!(await isAdmin())) redirect('/admin');
  const id = Number(formData.get('id'));
  if (formData.get('confirm') !== 'yes') redirect(`/admin/bars/${id}?confirm=1`);
  await ensureDb();
  await sql`delete from bars where id = ${id}`;
  revalidatePath('/', 'layout');
  redirect('/admin/bars?deleted=1');
}
