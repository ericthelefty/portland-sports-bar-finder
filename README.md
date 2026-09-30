# Portland Sports Bar Finder

Find sports bars in Portland, Oregon by the out-of-market TV packages they carry: NFL Sunday Ticket, NFL RedZone, NBA League Pass, NHL Center Ice, MLB Extra Innings and MLS Season Pass.

**To put the site online, follow [SETUP.md](SETUP.md).** No coding needed.

## What it does

- **Finder** (`/`): search 82 Portland bars, filter by package and part of town.
- **Bar pages** (`/bars/[id]`): each package's status, where it came from and when it was confirmed, with a "Not right?" link.
- **Report form** (`/report`): anyone can report packages a bar has or doesn't have, or add a missing bar. No email needed; a Cloudflare Turnstile check blocks bots.
- **Review page** (`/admin`): password-protected queue to approve or reject reports, and a Manage bars section to add, edit, hide or delete bars.

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
| `CONTACT_EMAIL` | No | Shown on the privacy page |

## Tests

Every push to GitHub runs `.github/workflows/ci.yml`: it builds the app, starts it against a real Postgres database, and runs `scripts/e2e.mjs`, a browser test of every flow (filters, bar pages, reports, the bot check, admin sign-in, approve and reject, managing bars, phone layout). Results and screenshots are saved to the `ci-results` branch.
