# Oombar

**Out of market, not out of reach.** Oombar ("OOM" is short for out-of-market) helps fans find a sports bar showing their game. Bars are listed by the out-of-market TV packages they carry (NFL Sunday Ticket, NFL RedZone, NBA League Pass, WNBA League Pass, NHL Center Ice, MLB Extra Innings and MLS Season Pass) and by the teams whose fans gather there. It covers Portland, Oregon and Salt Lake City, Utah.

**Live site:** [oombar.com](https://oombar.com) · Portland: [oombar.com/pdx](https://oombar.com/pdx) · Salt Lake City: [oombar.com/slc](https://oombar.com/slc) · Questions: info@oombar.com

**To put the site online, follow [SETUP.md](SETUP.md).** No coding needed.

## What it does

- **Home** (`/`): the Oombar brand page, with the tagline, what OOM means and a card for each city.
- **Cities**: each city lives at its own path (`/pdx`, `/slc`) with its own bars and parts of town. Cities and their areas are listed in `lib/cities.js`; every bar and report is saved with its city.
- **Finder** (`/pdx`): every Portland bar, filtered by package and part of town. Search by bar name, team or ZIP code.
- **Team bars**: bars tagged as a home for a team's fans, like a Cleveland Browns bar or a Portland Timbers bar. Searching a team lists its bars first, and nicknames work ("Spurs" finds Tottenham Hotspur). Suggested teams cover the NFL, NBA, WNBA, NHL, MLB, MLS, NWSL and Premier League (`lib/teams.js`); any other team can be typed in.
- **Bar pages** (`/pdx/bars/[id]`): each package's status, where it came from and when it was confirmed, the bar's team tags, and a "Not right?" link.
- **Report form** (`/pdx/report`): anyone can report packages a bar has or doesn't have, name a team bar, or add a missing bar. No email needed; a Cloudflare Turnstile check blocks bots.
- **Review page** (`/admin`): password-protected queue to approve or reject reports, and a Manage bars section to add, edit, hide or delete bars and their team tags.
- **What's new** (`/changelog`): a list of site changes, linked in the footer. Add an entry to `lib/changelog.js` when a change goes live.

Older links (`/bars/12`, `/report`) redirect to their `/pdx` versions. A city's starting bar list (`data/bars.json` for Portland, `data/bars-slc.json` for Salt Lake City) is loaded once, the first time the site runs with that city.

## How it's built

- [Next.js](https://nextjs.org) on [Vercel](https://vercel.com)
- Postgres on [Supabase](https://supabase.com). The app creates its tables and loads `data/bars.json` on first run.
- Bot protection with [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)
- Domain: oombar.com, registered at Namecheap (DNS and email forwarding steps are in [SETUP.md](SETUP.md))

## Settings (environment variables)

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase "Transaction pooler" connection string |
| `ADMIN_PASSWORD` | Yes | Password for `/admin`. Use a long, unique password |
| `TURNSTILE_SITE_KEY` | For the bot check | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | For the bot check | Cloudflare Turnstile secret key |
| `CONTACT_EMAIL` | No | Shown in the footer and on the privacy page. Defaults to `info@oombar.com` |
| `SITE_URL` | No | The site's main address for link previews. Defaults to `https://oombar.com` |

## Tests

Every push to GitHub runs `.github/workflows/ci.yml`: it builds the app, starts it against a real Postgres database, and runs `scripts/e2e.mjs`, a browser test of every flow (filters, search, team tags, bar pages, reports, the bot check, admin sign-in, approve and reject, managing bars, phone layout). Results and screenshots are saved to the `ci-results` branch.
