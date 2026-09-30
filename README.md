# Portland Sports Bar Finder

Find sports bars in Portland, Oregon by the out-of-market TV packages they carry: NFL Sunday Ticket, NFL RedZone, NBA League Pass, NHL Center Ice, MLB Extra Innings and MLS Season Pass.

**To put the site online, follow [SETUP.md](SETUP.md).** No coding needed.

## What it does

- **Finder** (`/`): search 82 Portland bars, filter by package and part of town.
- **Bar pages** (`/bars/[id]`): each package's status, where it came from and when it was confirmed, with a "Not right?" link.
- **Report form** (`/report`): anyone can report packages a bar has or doesn't have, or add a missing bar. Email is required and confirmed by a link. Joining the email list is optional and unchecked by default.
- **Review page** (`/admin`): password-protected queue to approve or reject reports, and a download of the email list.

## How it's built

- [Next.js](https://nextjs.org) on [Vercel](https://vercel.com)
- Postgres on [Supabase](https://supabase.com). The app creates its tables and loads `data/bars.json` on first run.
- Optional confirmation emails through [Resend](https://resend.com)

## Settings (environment variables)

| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase "Transaction pooler" connection string |
| `ADMIN_PASSWORD` | Yes | Password for `/admin` (8+ characters) |
| `RESEND_API_KEY` | No | Turns on confirmation emails |
| `EMAIL_FROM` | With Resend | Sender, e.g. `PDX Game Finder <reports@yourdomain.com>` |
| `SITE_URL` | With Resend | Public address used in email links |
| `CONTACT_EMAIL` | No | Shown on the privacy page |

## Tests

Every push to GitHub runs `.github/workflows/ci.yml`: it builds the app, starts it against a real Postgres database, and runs `scripts/e2e.mjs`, a browser test of every flow (filters, bar pages, reports, email confirmation, admin sign-in, approve and reject, the email-list download, phone layout). Results and screenshots are saved to the `ci-results` branch.
