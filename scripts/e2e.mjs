// End-to-end check of every flow against a running app and a real Postgres database.
// Used by the GitHub build check. Needs BASE_URL, DATABASE_URL and ADMIN_PASSWORD.
import { chromium } from 'playwright';
import postgres from 'postgres';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const SHOTS = process.env.SHOTS_DIR || 'out/screenshots';
mkdirSync(SHOTS, { recursive: true });
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

let failures = 0;
const check = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) failures++;
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

try {
  // Setup check page
  await page.goto(`${BASE}/status`, { waitUntil: 'networkidle' });
  check((await page.textContent('#db-status')).includes('82 bars'), 'setup check reports a working database');
  await page.screenshot({ path: `${SHOTS}/status.png`, fullPage: true });

  // Finder
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check((await page.locator('li.bar').count()) === 82, 'home lists 82 bars');
  await page.click('#pk-nfl_sunday_ticket');
  check((await page.locator('li.bar').count()) === 6, 'Sunday Ticket filter shows 6 bars');
  await page.screenshot({ path: `${SHOTS}/home-filtered.png`, fullPage: true });
  await page.click('#pk-nba_league_pass');
  check((await page.locator('li.bar').count()) === 1, 'Sunday Ticket + League Pass shows 1 bar');
  await page.click('#pk-nfl_sunday_ticket');
  await page.click('#pk-nba_league_pass');
  await page.click('#area-SE');
  const se = await page.locator('li.bar').count();
  check(se > 5 && se < 82, `SE filter narrows the list (${se})`);
  await page.click('#area-all');
  await page.fill('#q', 'kooks');
  check((await page.locator('li.bar').count()) === 1, 'search finds Kooks');

  // Bar page
  await page.goto(`${BASE}/bars/57`, { waitUntil: 'networkidle' });
  check((await page.textContent('h1'))?.includes('Garden Tavern'), 'bar page shows Garden Tavern');
  check(await page.locator('#row-nfl_sunday_ticket .st.has').isVisible(), 'Garden Tavern lists Sunday Ticket');
  await page.screenshot({ path: `${SHOTS}/bar-page.png`, fullPage: true });
  const r404 = await page.goto(`${BASE}/bars/99999`);
  check(r404.status() === 404, 'unknown bar returns 404');
  errors.length = 0; // the 404 above is expected

  // Report form: validation errors
  await page.goto(`${BASE}/report`, { waitUntil: 'networkidle' });
  await page.click('button[type=submit]');
  await page.waitForSelector('.error');
  check((await page.locator('.error').count()) >= 3, 'empty report shows field errors');
  await page.screenshot({ path: `${SHOTS}/report-errors.png`, fullPage: true });

  // Report 1: Kooks has NHL Center Ice, with email-list opt-in
  await page.goto(`${BASE}/report?bar=64&has=nhl_center_ice`, { waitUntil: 'networkidle' });
  check(await page.isChecked('#has-nhl_center_ice'), 'report link pre-checks the package');
  await page.check('#rel-saw');
  await page.fill('#seenOn', '2026-09-20');
  await page.fill('#email', 'fan1@example.com');
  await page.check('#optIn');
  await page.screenshot({ path: `${SHOTS}/report-filled.png`, fullPage: true });
  await Promise.all([page.waitForURL('**/report/thanks**'), page.click('button[type=submit]')]);
  check(true, 'report 1 submitted');

  // Report 2: dispute Hop Haven's Sunday Ticket
  await page.goto(`${BASE}/report?bar=46&dispute=nfl_sunday_ticket`, { waitUntil: 'networkidle' });
  check(await page.isChecked('#not-nfl_sunday_ticket'), '"Not right?" link pre-checks the doesn\'t-have box');
  await page.check('#rel-staff');
  await page.fill('#email', 'fan2@example.com');
  await Promise.all([page.waitForURL('**/report/thanks**'), page.click('button[type=submit]')]);

  // Report 3: a bar that isn't listed
  await page.goto(`${BASE}/report`, { waitUntil: 'networkidle' });
  await page.selectOption('#barId', 'new');
  await page.fill('#newBarName', 'Test Taproom');
  await page.fill('#newBarAddress', '100 SE Test St, Portland, OR');
  await page.selectOption('#newBarArea', 'SE');
  await page.check('#has-mlb_extra_innings');
  await page.check('#rel-owner');
  await page.fill('#email', 'owner@example.com');
  await Promise.all([page.waitForURL('**/report/thanks**'), page.click('button[type=submit]')]);

  // Honeypot: a bot-filled report is silently dropped
  await page.goto(`${BASE}/report?bar=3`, { waitUntil: 'networkidle' });
  await page.check('#has-nfl_redzone');
  await page.check('#rel-saw');
  await page.fill('#email', 'bot@example.com');
  await page.evaluate(() => (document.getElementById('website_url').value = 'spam'));
  await Promise.all([page.waitForURL('**/report/thanks**'), page.click('button[type=submit]')]);
  const [{ n: botRows }] = await sql`select count(*)::int as n from reports where email = 'bot@example.com'`;
  check(botRows === 0, 'honeypot report is not stored');

  // Email confirmation link
  const [{ verify_token: token }] = await sql`select verify_token from reports where email = 'fan1@example.com'`;
  await page.goto(`${BASE}/confirm?token=${token}`, { waitUntil: 'networkidle' });
  check(page.url().endsWith('/confirmed'), 'confirmation link lands on /confirmed');
  const [{ email_verified }] = await sql`select email_verified from reports where email = 'fan1@example.com'`;
  const [{ verified }] = await sql`select verified from subscribers where email = 'fan1@example.com'`;
  check(email_verified && verified, 'confirming marks the report and the signup as confirmed');
  await page.goto(`${BASE}/confirm?token=${token}`, { waitUntil: 'networkidle' });
  check(page.url().includes('invalid=1'), 'a used link is rejected');

  // Admin: locked without the password
  const csvLocked = await page.request.get(`${BASE}/admin/subscribers.csv`);
  check(csvLocked.status() === 401, 'email list download is locked when signed out');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  check((await page.locator('.report-card').count()) === 0, 'admin shows no reports before sign-in');
  await page.fill('#password', 'wrong-password');
  await page.click('button[type=submit]');
  await page.waitForSelector('.error');
  check(true, 'wrong password is refused');
  await page.fill('#password', process.env.ADMIN_PASSWORD);
  await Promise.all([page.waitForSelector('.report-card'), page.click('button[type=submit]')]);
  check((await page.locator('.report-card').count()) === 3, 'admin shows 3 pending reports');
  await page.screenshot({ path: `${SHOTS}/admin-queue.png`, fullPage: true });

  const ids = await sql`select id, email from reports order by id`;
  const idOf = (email) => ids.find((r) => r.email === email).id;

  // Approve report 1 -> Kooks gains NHL Center Ice as a fan report
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST'), page.click(`#approve-${idOf('fan1@example.com')}`)]);
  await page.waitForTimeout(800);
  const [kooks] = await sql`select status, source from bar_packages where bar_id = 64 and package = 'nhl_center_ice'`;
  check(kooks?.status === 'has' && kooks?.source === 'fan', 'approving adds NHL Center Ice to Kooks as a fan report');

  // Approve report 3 -> new bar is created
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST'), page.click(`#approve-${idOf('owner@example.com')}`)]);
  await page.waitForTimeout(800);
  const [newBar] = await sql`select id, area from bars where name = 'Test Taproom'`;
  const [newPkg] = newBar ? await sql`select source from bar_packages where bar_id = ${newBar.id}` : [];
  check(newBar?.area === 'SE' && newPkg?.source === 'owner', 'approving a new-bar report adds the bar with its package');

  // Reject report 2 -> Hop Haven keeps Sunday Ticket
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST'), page.click(`#reject-${idOf('fan2@example.com')}`)]);
  await page.waitForTimeout(800);
  const [hop] = await sql`select status from bar_packages where bar_id = 46 and package = 'nfl_sunday_ticket'`;
  check(hop?.status === 'has', 'rejecting a dispute leaves the listing unchanged');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  check((await page.locator('.report-card').count()) === 0, 'queue is empty after review');
  await page.screenshot({ path: `${SHOTS}/admin-reviewed.png`, fullPage: true });

  const csv = await page.request.get(`${BASE}/admin/subscribers.csv`);
  const csvText = await csv.text();
  check(csv.status() === 200 && csvText.includes('fan1@example.com') && !csvText.includes('fan2@example.com'), 'email list CSV has only opted-in people');

  // Updated listing shows on the site
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.click('#pk-nhl_center_ice');
  check((await page.locator('li.bar').count()) === 2, 'NHL Center Ice filter now shows 2 bars');
  await page.goto(`${BASE}/bars/64`, { waitUntil: 'networkidle' });
  check((await page.textContent('#row-nhl_center_ice')).includes('Reported by a fan'), 'Kooks page credits the fan report');

  // Phone-width and dark-mode screenshots
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
  const pp = await phone.newPage();
  await pp.goto(BASE, { waitUntil: 'networkidle' });
  const overflow = await pp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check(!overflow, 'no sideways scrolling on a phone');
  await pp.screenshot({ path: `${SHOTS}/phone-home-dark.png` });
  await pp.goto(`${BASE}/report?bar=51`, { waitUntil: 'networkidle' });
  await pp.screenshot({ path: `${SHOTS}/phone-report-dark.png`, fullPage: true });
  await pp.goto(`${BASE}/bars/78`, { waitUntil: 'networkidle' });
  await pp.screenshot({ path: `${SHOTS}/phone-bar-dark.png`, fullPage: true });
  await phone.close();
} catch (err) {
  failures++;
  console.log('FAIL  unexpected error:', err?.stack || err);
  await page.screenshot({ path: `${SHOTS}/failure.png`, fullPage: true }).catch(() => {});
}

const relevant = errors.filter((e) => !/favicon/i.test(e));
check(relevant.length === 0, `no browser errors${relevant.length ? ': ' + relevant.join(' | ') : ''}`);
await browser.close();
await sql.end();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
