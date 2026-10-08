'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sql, ensureDb } from '@/lib/db';
import { PACKAGE_KEYS, RELATIONS, AREAS } from '@/lib/constants';
import { verifyCaptcha } from '@/lib/captcha';
import { isAdmin, passwordMatches, startSession, endSession } from '@/lib/auth';
import { getCity, DEFAULT_CITY, cityPath } from '@/lib/cities';
import { canonicalTeam } from '@/lib/teams';

const MAX_REPORTS_PER_HOUR = 6;

const clean = (v, max = 500) => String(v ?? '').trim().slice(0, max);

async function visitorIp() {
  const h = await headers();
  return (h.get('x-forwarded-for') || h.get('x-real-ip') || 'unknown').split(',')[0].trim();
}

const hashIp = (ip) => createHash('sha256').update(`pdx-bars:${ip}`).digest('hex').slice(0, 32);

// Handles the public "Report a TV package" form.
export async function submitReport(_prev, formData) {
  const city = getCity(clean(formData.get('city'), 20))?.slug ?? DEFAULT_CITY;
  const thanks = cityPath(city, '/report/thanks');
  const values = Object.fromEntries(
    ['barId', 'newBarName', 'newBarAddress', 'newBarArea', 'relation', 'seenOn', 'link', 'note', 'otherPackage', 'team'].map(
      (k) => [k, clean(formData.get(k), k === 'note' ? 1000 : k === 'team' ? 60 : 300)]
    )
  );
  const has = formData.getAll('has').filter((k) => PACKAGE_KEYS.includes(k));
  const not = formData.getAll('not').filter((k) => PACKAGE_KEYS.includes(k) && !has.includes(k));
  const state = { values: { ...values, has, not } };

  // Bots fill in every field, including this hidden one.
  if (clean(formData.get('website_url'))) redirect(thanks);

  const addingBar = values.barId === 'new';
  const barId = addingBar ? null : Number(values.barId);
  const errors = {};
  if (!addingBar && !Number.isInteger(barId)) errors.barId = 'Choose a bar, or pick "My bar isn\'t listed."';
  if (addingBar && values.newBarName.length < 2) errors.newBarName = "Enter the bar's name.";
  if (addingBar && values.newBarAddress.length < 5) errors.newBarAddress = "Enter the bar's street address.";
  if (addingBar && values.newBarArea && !AREAS.includes(values.newBarArea)) errors.newBarArea = 'Choose an area.';
  if (!has.length && !not.length && !values.otherPackage && !values.team && !addingBar)
    errors.has = 'Check at least one package the bar has or doesn\'t have, or name a team below.';
  if (!RELATIONS.some((r) => r.key === values.relation)) errors.relation = 'Tell us how you know.';
  if (values.seenOn && !/^\d{4}-\d{2}-\d{2}$/.test(values.seenOn)) errors.seenOn = 'Enter a valid date.';
  if (values.seenOn && new Date(values.seenOn) > new Date(Date.now() + 86400000)) errors.seenOn = "The date can't be in the future.";
  if (values.link && !/^https?:\/\//i.test(values.link)) errors.link = 'Links need to start with http:// or https://';
  if (Object.keys(errors).length) return { ...state, errors };

  const ip = await visitorIp();
  if (!(await verifyCaptcha(clean(formData.get('captchaToken'), 2048), ip)))
    return { ...state, errors: { captcha: 'Complete the "Verify you are human" check, then send again.' } };

  await ensureDb();
  if (!addingBar) {
    const [bar] = await sql`select id from bars where id = ${barId} and active`;
    if (!bar) return { ...state, errors: { barId: "We couldn't find that bar. Choose it again from the list." } };
  }

  const ipHash = hashIp(ip);
  const [{ recent }] = await sql`
    select count(*)::int as recent from reports where ip_hash = ${ipHash} and created_at > now() - interval '1 hour'`;
  if (recent >= MAX_REPORTS_PER_HOUR)
    return { ...state, errors: { form: "You've sent several reports in the last hour. Try again later." } };

  await sql`
    insert into reports (bar_id, new_bar_name, new_bar_address, new_bar_area, has_packages, not_packages, other_package,
                         team, relation, seen_on, link, note, email, ip_hash)
    values (${barId}, ${addingBar ? values.newBarName : ''}, ${addingBar ? values.newBarAddress : ''},
            ${addingBar ? values.newBarArea : ''}, ${has.join(',')}, ${not.join(',')}, ${values.otherPackage},
            ${canonicalTeam(values.team)}, ${values.relation}, ${values.seenOn || null}, ${values.link}, ${values.note}, '', ${ipHash})`;
  redirect(thanks);
}

export async function adminLogin(_prev, formData) {
  if (!passwordMatches(clean(formData.get('password'), 200))) {
    await new Promise((r) => setTimeout(r, 600));
    return { error: "That password isn't right." };
  }
  await startSession();
  redirect('/admin');
}

export async function adminLogout() {
  await endSession();
  redirect('/admin');
}

async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin');
}

// Approving a report updates the bar's package listings (and adds the bar if it was new).
export async function approveReport(formData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const newBarArea = clean(formData.get('newBarArea'), 4);
  await ensureDb();
  await sql.begin(async (tx) => {
    const [r] = await tx`select * from reports where id = ${id} and status = 'pending' for update`;
    if (!r) return;
    let barId = r.bar_id;
    if (!barId && r.new_bar_name) {
      const area = AREAS.includes(newBarArea) ? newBarArea : r.new_bar_area;
      const [bar] = await tx`
        insert into bars (name, address, area, type) values (${r.new_bar_name}, ${r.new_bar_address}, ${area}, 'Bar')
        returning id`;
      barId = bar.id;
      await tx`update reports set bar_id = ${barId} where id = ${id}`;
    }
    if (barId) {
      const source = r.relation === 'owner' ? 'owner' : 'fan';
      const evidence = [RELATIONS.find((x) => x.key === r.relation)?.label, r.link].filter(Boolean).join(' · ');
      const confirmed =
        r.seen_on ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date(r.created_at));
      const upsert = (pkg, status) => tx`
        insert into bar_packages (bar_id, package, status, source, evidence, last_confirmed, updated_at)
        values (${barId}, ${pkg}, ${status}, ${source}, ${evidence}, ${confirmed}, now())
        on conflict (bar_id, package) do update
          set status = excluded.status, source = excluded.source, evidence = excluded.evidence,
              last_confirmed = excluded.last_confirmed, updated_at = now()`;
      for (const pkg of (r.has_packages || '').split(',').filter(Boolean)) await upsert(pkg, 'has');
      for (const pkg of (r.not_packages || '').split(',').filter(Boolean)) await upsert(pkg, 'not');
      const team = canonicalTeam(r.team);
      if (team) {
        await tx`
          insert into bar_teams (bar_id, team, source, last_confirmed)
          values (${barId}, ${team}, ${source}, ${confirmed})
          on conflict (bar_id, team) do update set last_confirmed = excluded.last_confirmed`;
      }
    }
    await tx`update reports set status = 'approved', reviewed_at = now() where id = ${id}`;
  });
  revalidatePath('/', 'layout');
}

export async function rejectReport(formData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  await ensureDb();
  await sql`update reports set status = 'rejected', reviewed_at = now() where id = ${id} and status = 'pending'`;
  revalidatePath('/admin');
}
