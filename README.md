# Oombar

**Out of market, not out of reach.** Oombar ("OOM" is short for out-of-market) finds sports bars by the out-of-market TV packages they carry: NFL Sunday Ticket, NFL RedZone, NBA League Pass, NHL Center Ice, MLB Extra Innings and MLS Season Pass. It starts with Portland, Oregon at [oombar.com/pdx](https://oombar.com/pdx).

**To put the site online, follow [SETUP.md](SETUP.md).** No coding needed.

## What it does

- **Home** (`/`): the Oombar brand page, with the tagline, what OOM means and a card for each city.
- **Finder** (`/pdx`): search 82 Portland bars, filter by package and part of town.
- **Bar pages** (`/pdx/bars/[id]`): each package's status, where it came from and when it was confirmed, with a "Not right?" link.
- **Report form** (`/pdx/report`): anyone can report packages a bar has or doesn't have, or add a missing bar. No email needed; a Cloudflare Turnstile check blocks bots.
- **Review page** (`/admin`): password-protected queue to approve or reject reports, and a Manage bars section to add, edit, hide or delete bars.

Older links (`/bars/12`, `/report`) redirect to their `/pdx` versions. Cities are listed in `lib/cities.js`; adding a second one also needs a city column on the bars table.

## How it's built

- [Next.js](https://nextjs.org) on [Vercel](https://vercel.com)
- Postgres on [Supabase](https://supabase.com). The app creates its tables and loads `data/bars.json` on first run.
- Bot protection with [Cloudflare Turnstile](https://www.cloudflare.com/products/turnstile/)

## Settings (environment variables)

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase "Transaction pooler" connection string |
| `ADMIN_PASSWORD` | Yes | Password for `/admin` (8+ characters) |
| `TURNSTILE_SITE_KEY` | For the bot check | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | For the bot check | Cloudflare Turnstile secret key |
| `CONTACT_EMAIL` | No | Shown in the footer and on the privacy page. Defaults to `info@oombar.com` |
| `SITE_URL` | No | The site's main address for link previews. Defaults to `https://oombar.com` |

## Tests

Every push to GitHub runs `.github/workflows/ci.yml`: it builds the app, starts it against a real Postgres database, and runs `scripts/e2e.mjs`, a browser test of every flow (filters, bar pages, reports, the bot check, admin sign-in, approve and reject, managing bars, phone layout). Results and screenshots are saved to the `ci-results` branch.
