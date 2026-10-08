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
// Messages from Cloudflare's bot-check frame are its own and not the site's.
page.on('console', (m) => m.type() === 'error' && !(m.location()?.url || '').includes('challenges.cloudflare.com') && errors.push(m.text()));

try {
  // Finder
  await page.goto(`${BASE}/pdx`, { waitUntil: 'networkidle' });
  check((await page.locator('li.bar').count()) === 82, 'home lists 82 bars');
  check((await page.textContent('#pk-wnba_league_pass'))?.includes('WNBA League Pass'), 'WNBA League Pass filter is shown');
  await page.click('#pk-wnba_league_pass');
  check((await page.locator('li.bar').count()) === 0, 'no bar has WNBA League Pass confirmed yet');
  await page.click('#pk-wnba_league_pass');
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
  check((await page.getAttribute('#q', 'placeholder')) === 'Search by bar, team or ZIP code', 'search box says bar, team or ZIP code');
  await page.fill('#q', '97206');
  const zipNames = await page.locator('li.bar h2').allTextContents();
  check(zipNames.includes('Bucket Brigade Sports Bar') && zipNames.includes('Scoreboard Sports Bar'), `ZIP search finds bars in 97206 (${zipNames.length})`);
  const [{ noZip }] = await sql`select count(*)::int as "noZip" from bars where active and address !~ ' 97[0-9]{3}$'`;
  check(noZip === 0, `every bar address has a ZIP code (${noZip} missing)`);
  await page.fill('#q', '');

  // Brand, city path and redirects
  check((await page.textContent('#tagline'))?.includes('not out of reach'), 'city page shows the Oombar tagline');
  check((await page.textContent('#city-name'))?.includes('Portland'), 'city page names Portland');
  check((await page.title()).includes('Oombar'), `page title mentions Oombar (${await page.title()})`);
  check((await page.textContent('.logo'))?.toLowerCase() === 'oombar', 'logo reads Oombar');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check(new URL(page.url()).pathname === '/', 'home page stays on the brand page');
  check((await page.textContent('#tagline'))?.includes('not out of reach'), 'home page shows the tagline');
  check((await page.textContent('#oom-def'))?.includes('out-of-market'), 'home page explains OOM');
  check((await page.textContent('#city-pdx'))?.includes('82 bars'), 'Portland card shows the bar count');
  check((await page.getAttribute('#contact-email', 'href')) === 'mailto:info@oombar.com', 'footer shows info@oombar.com');
  check((await page.title()).startsWith('Oombar'), `home title starts with Oombar (${await page.title()})`);
  await page.screenshot({ path: `${SHOTS}/brand-home.png`, fullPage: true });
  await Promise.all([page.waitForURL('**/pdx'), page.click('#city-pdx')]);
  check((await page.locator('li.bar').count()) === 82, 'Portland card opens the finder');
  const oldBar = await page.request.get(`${BASE}/bars/57`, { maxRedirects: 0 });
  check(oldBar.status() === 308 && oldBar.headers().location?.endsWith('/pdx/bars/57'), 'old bar links redirect to /pdx');
  const oldReport = await page.request.get(`${BASE}/report?bar=51&has=nfl_redzone`, { maxRedirects: 0 });
  check(oldReport.headers().location?.endsWith('/pdx/report?bar=51&has=nfl_redzone'), 'old report links keep their bar and package');
  const badCity = await page.request.get(`${BASE}/sea`);
  check(badCity.status() === 404, 'an unknown city returns 404');
  const privacy = await page.request.get(`${BASE}/privacy`);
  check(privacy.status() === 200, 'privacy page still lives at /privacy');

  // Bar page
  await page.goto(`${BASE}/pdx/bars/57`, { waitUntil: 'networkidle' });
  check((await page.textContent('h1'))?.includes('Garden Tavern'), 'bar page shows Garden Tavern');
  check(await page.locator('#row-nfl_sunday_ticket .st.has').isVisible(), 'Garden Tavern lists Sunday Ticket');
  await page.screenshot({ path: `${SHOTS}/bar-page.png`, fullPage: true });
  const r404 = await page.goto(`${BASE}/pdx/bars/99999`);
  check(r404.status() === 404, 'unknown bar returns 404');
  errors.length = 0; // the 404 above is expected

  // The report form waits for the bot check to pass before it can be sent.
  const captchaReady = () =>
    page.waitForFunction(() => {
      const b = document.getElementById('send-report');
      return b && !b.disabled;
    }, null, { timeout: 30000 });

  // Report form: no email field, bot check shown, validation errors
  await page.goto(`${BASE}/pdx/report`, { waitUntil: 'load' });
  check((await page.locator('#email, #optIn').count()) === 0, 'report form has no email or email-list fields');
  check((await page.locator('#has-wnba_league_pass').count()) === 1 && (await page.locator('#not-wnba_league_pass').count()) === 1, 'report form offers WNBA League Pass');
  await captchaReady();
  check(true, 'bot check passes and enables the Send button');
  check((await page.locator('#captcha > *').count()) > 0, 'bot check widget is shown');
  await page.click('#send-report');
  await page.waitForSelector('.error');
  check((await page.locator('.error').count()) >= 2, 'empty report shows field errors');
  await page.screenshot({ path: `${SHOTS}/report-errors.png`, fullPage: true });

  // A report without a valid bot-check pass is refused
  await page.goto(`${BASE}/pdx/report?bar=51&has=nfl_redzone`, { waitUntil: 'load' });
  await page.check('#rel-saw');
  await captchaReady();
  await page.evaluate(() => (document.querySelector('input[name=captchaToken]').value = ''));
  await page.click('#send-report');
  await page.waitForSelector('.error');
  check((await page.textContent('form.report')).includes('Verify you are human'), 'a report without the bot check is refused');
  const [{ n: noCaptchaRows }] = await sql`select count(*)::int as n from reports where bar_id = 51`;
  check(noCaptchaRows === 0, 'the refused report is not stored');

  // Report 1: Kooks has NHL Center Ice
  await page.goto(`${BASE}/pdx/report?bar=64&has=nhl_center_ice`, { waitUntil: 'load' });
  check(await page.isChecked('#has-nhl_center_ice'), 'report link pre-checks the package');
  check((await page.inputValue('#barSearch')) === 'Kooks (N)', 'report link fills in the bar');
  await page.check('#rel-saw');
  await page.fill('#seenOn', '2026-09-20');
  await page.fill('#team', 'cleveland browns');
  await captchaReady();
  await page.screenshot({ path: `${SHOTS}/report-filled.png`, fullPage: true });
  await Promise.all([page.waitForURL('**/report/thanks**'), page.click('#send-report')]);
  check(true, 'report 1 submitted');

  // Report 2: dispute Hop Haven's Sunday Ticket
  await page.goto(`${BASE}/pdx/report?bar=46&dispute=nfl_sunday_ticket`, { waitUntil: 'load' });
  check(await page.isChecked('#not-nfl_sunday_ticket'), '"Not right?" link pre-checks the doesn\'t-have box');
  await page.check('#rel-staff');
  await captchaReady();
  await Promise.all([page.waitForURL('**/report/thanks**'), page.click('#send-report')]);

  // Report 3: a bar that isn't listed
  await page.goto(`${BASE}/pdx/report`, { waitUntil: 'load' });
  // Bar search: type part of a name, pick from the narrowed list
  await page.fill('#barSearch', 'spirit');
  check((await page.locator('.picker-list [data-option]').count()) === 2, 'typing "spirit" narrows the list to Spirit of 77 plus "not listed"');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  check((await page.inputValue('input[name=barId]')) === '51', 'pressing Enter picks the highlighted bar');
  check((await page.locator('.picker-list').count()) === 0, 'the list closes after picking');
  await page.fill('#barSearch', 'kells');
  check((await page.locator(".picker-list [data-option='5']").count()) === 1, 'search ignores apostrophes and capitals');
  check((await page.inputValue('input[name=barId]')) === '', 'typing again clears the earlier choice');
  await page.fill('#barSearch', 'Joes Pub');
  check((await page.locator('.picker-empty').count()) === 1, 'no-match message appears');
  check((await page.textContent(".picker-list [data-option='new']")).includes('Add "Joes Pub" as a new bar'), 'with no match, the add option uses what was typed');
  await page.screenshot({ path: `${SHOTS}/bar-search-empty.png`, fullPage: true });
  await page.keyboard.press('Enter');
  check((await page.inputValue('input[name=barId]')) === 'new', 'pressing Enter with no match picks "add a new bar"');
  check((await page.inputValue('#newBarName')) === 'Joes Pub', 'the new bar name is filled in from the search');
  await page.fill('#newBarName', 'Test Taproom');
  await page.fill('#newBarAddress', '100 SE Test St, Portland, OR');
  await page.selectOption('#newBarArea', 'SE');
  await page.check('#has-mlb_extra_innings');
  await page.check('#rel-owner');
  await captchaReady();
  await Promise.all([page.waitForURL('**/report/thanks**'), page.click('#send-report')]);

  // Honeypot: a bot-filled report is silently dropped
  await page.goto(`${BASE}/pdx/report?bar=3`, { waitUntil: 'load' });
  await page.check('#has-nfl_redzone');
  await page.check('#rel-saw');
  await captchaReady();
  await page.evaluate(() => (document.getElementById('website_url').value = 'spam'));
  await Promise.all([page.waitForURL('**/report/thanks**'), page.click('#send-report')]);
  const [{ n: botRows }] = await sql`select count(*)::int as n from reports where bar_id = 3`;
  check(botRows === 0, 'honeypot report is not stored');
  const [{ n: emails }] = await sql`select count(*)::int as n from reports where email <> ''`;
  check(emails === 0, 'no email addresses are stored');

  // Admin: locked without the password
  const oldCsv = await page.request.get(`${BASE}/admin/subscribers.csv`);
  check(oldCsv.status() === 404, 'the old email-list download is gone');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  check((await page.locator('.report-card').count()) === 0, 'admin shows no reports before sign-in');
  await page.fill('#password', 'wrong-password');
  await page.click('button[type=submit]');
  await page.waitForSelector('.error');
  check(true, 'wrong password is refused');
  await page.fill('#password', process.env.ADMIN_PASSWORD);
  await Promise.all([page.waitForSelector('.report-card'), page.click('button[type=submit]')]);
  check((await page.locator('.report-card').count()) === 3, 'admin shows 3 pending reports');
  check((await page.locator('#captcha-off').count()) === 0, 'admin does not warn about the bot check when it is on');
  await page.screenshot({ path: `${SHOTS}/admin-queue.png`, fullPage: true });

  const ids = await sql`select id, bar_id, new_bar_name from reports order by id`;
  const idOfBar = (barId) => ids.find((r) => r.bar_id === barId).id;
  const idOfNew = (name) => ids.find((r) => r.new_bar_name === name).id;

  // Approve report 1 -> Kooks gains NHL Center Ice as a fan report
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST'), page.click(`#approve-${idOfBar(64)}`)]);
  await page.waitForTimeout(800);
  const [kooks] = await sql`select status, source from bar_packages where bar_id = 64 and package = 'nhl_center_ice'`;
  check(kooks?.status === 'has' && kooks?.source === 'fan', 'approving adds NHL Center Ice to Kooks as a fan report');
  const [kooksTeam] = await sql`select team, source from bar_teams where bar_id = 64`;
  check(kooksTeam?.team === 'Cleveland Browns' && kooksTeam?.source === 'fan', 'approving tags Kooks as a Cleveland Browns bar (standard spelling)');

  // Approve report 3 -> new bar is created
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST'), page.click(`#approve-${idOfNew('Test Taproom')}`)]);
  await page.waitForTimeout(800);
  const [newBar] = await sql`select id, area from bars where name = 'Test Taproom'`;
  const [newPkg] = newBar ? await sql`select source from bar_packages where bar_id = ${newBar.id}` : [];
  check(newBar?.area === 'SE' && newPkg?.source === 'owner', 'approving a new-bar report adds the bar with its package');

  // Reject report 2 -> Hop Haven keeps Sunday Ticket
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  await Promise.all([page.waitForResponse((r) => r.request().method() === 'POST'), page.click(`#reject-${idOfBar(46)}`)]);
  await page.waitForTimeout(800);
  const [hop] = await sql`select status from bar_packages where bar_id = 46 and package = 'nfl_sunday_ticket'`;
  check(hop?.status === 'has', 'rejecting a dispute leaves the listing unchanged');
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  check((await page.locator('.report-card').count()) === 0, 'queue is empty after review');
  await page.screenshot({ path: `${SHOTS}/admin-reviewed.png`, fullPage: true });

  // Updated listing shows on the site
  await page.goto(`${BASE}/pdx`, { waitUntil: 'networkidle' });
  await page.click('#pk-nhl_center_ice');
  check((await page.locator('li.bar').count()) === 2, 'NHL Center Ice filter now shows 2 bars');
  await page.goto(`${BASE}/pdx/bars/64`, { waitUntil: 'networkidle' });
  check((await page.textContent('#row-nhl_center_ice')).includes('Reported by a fan'), 'Kooks page credits the fan report');
  check((await page.textContent('#team-bars'))?.includes('Cleveland Browns fans meet here'), 'Kooks page shows it is a Browns bar');

  // Team search: "browns" finds the Browns bar first and highlights its tag
  await page.goto(`${BASE}/pdx`, { waitUntil: 'networkidle' });
  await page.fill('#q', 'browns');
  const brownsNames = await page.locator('li.bar h2').allTextContents();
  check(brownsNames[0] === 'Kooks', `searching "browns" lists Kooks first (${brownsNames.join(', ')})`);
  check((await page.locator('li.bar .tag.team.hit').count()) === 1, 'the matching team tag is highlighted');
  await page.fill('#q', 'cleveland brow');
  check((await page.locator('li.bar h2').first().textContent()) === 'Kooks', 'partial team names work');
  await page.screenshot({ path: `${SHOTS}/team-search.png`, fullPage: true });
  await page.fill('#q', '');

  // Manage bars: add, edit packages, hide, delete
  await page.goto(`${BASE}/admin/bars`, { waitUntil: 'networkidle' });
  check((await page.locator('#bar-table tbody tr').count()) === 83, 'Manage bars lists all 83 bars');
  await page.fill('#bar-search', 'garden');
  check((await page.locator('#bar-table tbody tr').count()) === 1, 'Manage bars search finds Garden Tavern');
  await page.screenshot({ path: `${SHOTS}/manage-bars.png`, fullPage: true });

  // Add a bar with NBA League Pass
  await page.goto(`${BASE}/admin/bars/new`, { waitUntil: 'networkidle' });
  await page.click('#save-bar');
  await page.waitForSelector('.error');
  check(true, 'adding a bar without a name shows an error');
  await page.fill('#name', 'E2E Test Pub');
  await page.fill('#type', 'Sports bar');
  await page.selectOption('#area', 'NE');
  await page.fill('#address', '1 NE Test Ave, Portland, OR');
  await page.fill('#website', 'e2etestpub.example');
  await page.check('#pkg_nba_league_pass_has');
  await page.check('#pkg_wnba_league_pass_has');
  await page.screenshot({ path: `${SHOTS}/add-bar.png`, fullPage: true });
  await Promise.all([page.waitForURL('**/admin/bars?saved=**'), page.click('#save-bar')]);
  const [added] = await sql`select id, website, area from bars where name = 'E2E Test Pub'`;
  const [addedPkg] = added ? await sql`select status, source from bar_packages where bar_id = ${added.id}` : [];
  check(added?.area === 'NE' && added?.website === 'https://e2etestpub.example', 'new bar saved with area and website');
  check(addedPkg?.status === 'has' && addedPkg?.source === 'admin', 'new bar has NBA League Pass marked by the site');
  const addedPkgs = added ? (await sql`select package from bar_packages where bar_id = ${added.id} and status = 'has'`).map((r) => r.package) : [];
  check(addedPkgs.includes('wnba_league_pass'), 'admin can mark WNBA League Pass');
  await page.goto(`${BASE}/pdx`, { waitUntil: 'networkidle' });
  await page.click('#pk-nba_league_pass');
  check((await page.locator('li.bar').count()) === 2, 'new bar appears in the NBA League Pass filter');

  // Edit Garden Tavern: MLS -> unknown, NBA -> has, Sunday Ticket unchanged
  await page.goto(`${BASE}/admin/bars/57`, { waitUntil: 'networkidle' });
  check((await page.inputValue('#name')) === 'Garden Tavern', 'edit form loads Garden Tavern');
  await page.check('#pkg_mls_season_pass_unknown');
  await page.check('#pkg_nba_league_pass_has');
  await page.fill('#newTeam_0', 'Sunderland AFC');
  await page.fill('#newTeam_1', 'man utd');
  await Promise.all([page.waitForURL('**/admin/bars?saved=57'), page.click('#save-bar')]);
  const gtTeams = (await sql`select team, source from bar_teams where bar_id = 57 order by team`).map((r) => r.team);
  check(gtTeams.join() === 'Manchester United,Sunderland', `typed club names save as the standard name (${gtTeams.join(', ')})`);
  const gt = Object.fromEntries((await sql`select package, source from bar_packages where bar_id = 57`).map((r) => [r.package, r.source]));
  check(!gt.mls_season_pass && gt.nba_league_pass === 'admin' && gt.nfl_sunday_ticket === 'bar_website',
    'editing packages updates only what changed');
  await page.goto(`${BASE}/pdx/bars/57`, { waitUntil: 'networkidle' });
  check((await page.textContent('#row-nba_league_pass')).includes('Confirmed by the site'), 'bar page credits the site');
  check((await page.textContent('#team-bars'))?.includes('Sunderland fans meet here'), 'bar page shows the Sunderland tag');
  check(!(await page.content()).toLowerCase().includes('official'), 'no "official club" wording anywhere');
  await page.goto(`${BASE}/pdx`, { waitUntil: 'networkidle' });
  await page.fill('#q', 'sunderland');
  check((await page.locator('li.bar h2').allTextContents()).join() === 'Garden Tavern', 'searching "sunderland" finds Garden Tavern');
  await page.fill('#q', 'red devils');
  check((await page.locator('li.bar h2').allTextContents()).join() === 'Garden Tavern', 'searching a nickname ("red devils") finds the Man United bar');
  await page.fill('#q', 'spurs');
  check((await page.locator('li.bar .tag.team').count()) === 0, 'searching "spurs" shows no team bars when none are tagged');
  await page.fill('#q', '');
  await page.goto(`${BASE}/admin/bars/57`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${SHOTS}/admin-team-tags.png`, fullPage: true });
  await page.uncheck('#team-keep-0');
  await page.uncheck('#team-keep-1');
  await Promise.all([page.waitForURL('**/admin/bars?saved=57'), page.click('#save-bar')]);
  const sundGone = await sql`select team from bar_teams where bar_id = 57`;
  check(sundGone.length === 0, 'unchecking a team removes the tag');

  // Hide the test bar
  await page.goto(`${BASE}/admin/bars/${added.id}`, { waitUntil: 'networkidle' });
  await page.uncheck('#active');
  await Promise.all([page.waitForURL('**/admin/bars?saved=**'), page.click('#save-bar')]);
  const hidden = await page.request.get(`${BASE}/pdx/bars/${added.id}`);
  check(hidden.status() === 404, 'a hidden bar is not shown on the site');
  await page.goto(`${BASE}/pdx`, { waitUntil: 'networkidle' });
  check((await page.locator('li.bar').count()) === 83, 'home lists 83 bars with the test bar hidden');

  // Delete it
  await page.goto(`${BASE}/admin/bars/${added.id}`, { waitUntil: 'networkidle' });
  await page.click('.danger-zone summary');
  await page.check('#confirm');
  await Promise.all([page.waitForURL('**/admin/bars?deleted=1'), page.click('#delete-bar')]);
  const gone = await sql`select id from bars where id = ${added.id}`;
  check(gone.length === 0, 'deleting removes the bar');

  // Admin pages are locked when signed out
  const fresh = await browser.newContext();
  const fp = await fresh.newPage();
  await fp.goto(`${BASE}/admin/bars/57`, { waitUntil: 'networkidle' });
  check((await fp.locator('#name').count()) === 0 && (await fp.locator('#password').count()) === 1, 'edit page asks for the password when signed out');
  await fresh.close();

  // Phone-width and dark-mode screenshots
  const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'dark' });
  const pp = await phone.newPage();
  await pp.goto(BASE, { waitUntil: 'networkidle' });
  check(!(await pp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), 'no sideways scrolling on the home page on a phone');
  await pp.screenshot({ path: `${SHOTS}/phone-brand-home-dark.png`, fullPage: true });
  await pp.goto(`${BASE}/pdx`, { waitUntil: 'networkidle' });
  const overflow = await pp.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  check(!overflow, 'no sideways scrolling on a phone');
  await pp.screenshot({ path: `${SHOTS}/phone-home-dark.png` });
  await pp.goto(`${BASE}/pdx/report?bar=51`, { waitUntil: 'load' });
  await pp.screenshot({ path: `${SHOTS}/phone-report-dark.png`, fullPage: true });
  await pp.goto(`${BASE}/pdx/bars/78`, { waitUntil: 'networkidle' });
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
