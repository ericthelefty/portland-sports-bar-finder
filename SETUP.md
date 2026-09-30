# Putting the site online

This takes about 20 minutes and needs no coding. You'll create two free accounts, copy two values between them, and click Deploy. Confirmation emails and a custom web address are optional extras at the end.

**What you'll end up with**

- A public site anyone can use to find bars and report TV packages
- A private review page at `/admin` that only opens with your password
- A database you can open and edit like a spreadsheet

---

## Step 1: Create the database (Supabase)

1. Go to [supabase.com](https://supabase.com) and click **Start your project**. Sign up with your GitHub account.
2. Click **New project**.
3. Fill in:
   - **Name:** `portland-sports-bar-finder`
   - **Database password:** click **Generate a password**, or make up one that uses **only letters and numbers** (symbols like `@` or `#` break the connection string). **Save this password somewhere safe.** You'll need it in a minute.
   - **Region:** **West US (Oregon)**, the closest to Portland
4. Click **Create new project** and wait a minute or two while it sets up.
5. At the top of the project page, click **Connect**.
6. Find the connection string labeled **Transaction pooler**. It looks like this:
   ```
   postgresql://postgres.abcdefghij:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:6543/postgres
   ```
7. Copy it into a note and replace `[YOUR-PASSWORD]` (brackets included) with the password from step 3. This finished string is your **DATABASE_URL**.

You don't need to create any tables. The site does that itself the first time it runs, and loads the 82 bars.

---

## Step 2: Put the site online (Vercel)

1. Go to [vercel.com/signup](https://vercel.com/signup) and choose **Continue with GitHub**. Pick the free **Hobby** plan.
2. Click **Add New… → Project**.
3. Find **portland-sports-bar-finder** in the list and click **Import**. If it isn't listed, click **Adjust GitHub App Permissions** and give Vercel access to that repository.
4. Leave the build settings as they are. Vercel recognizes the project on its own.
5. Open **Environment Variables** and add these two:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | The finished connection string from Step 1 |
   | `ADMIN_PASSWORD` | A password you'll use to open the review page. At least 8 characters, and different from the database password. |

6. Click **Deploy**. After a minute or two you'll see a preview of the site and a web address like `portland-sports-bar-finder.vercel.app`.
7. Open the site. The first visit takes a few extra seconds while it sets up the database. You should see 82 bars.

**Check your review page:** go to `your-address.vercel.app/admin` and sign in with your `ADMIN_PASSWORD`.

---

## Using the site

- **Reviewing reports:** open `/admin`. Each report shows what the bar is listed with now next to what the report says. **Approve** updates the listing (or adds the bar if it's new), and **Reject** discards the report. Reports that would remove a package are marked **Disputes**.
- **Email list:** on `/admin`, click **Download email list (CSV)**. It includes only people who checked the opt-in box, with the date and exact wording they agreed to. Import it into Buttondown, Mailchimp or a similar service to send emails; they handle unsubscribes for you.
- **Editing a bar yourself:** in Supabase, open **Table Editor**:
  - **`bars`** holds names, addresses, areas and links. To hide a bar, set `active` to `false`.
  - **`bar_packages`** holds one row per bar and package. `status` is `has` or `not`, and `source` is `bar_website`, `owner`, `fan` or `admin`.
- **Updates to the code:** whenever new code is pushed to GitHub, Vercel republishes the site automatically.

---

## Optional: confirmation emails (Resend)

Without this, reports still arrive, but marked **Email not confirmed**. With it, each person gets a link to click before their report counts as confirmed. You need your own domain first (see the next section), because Resend only sends to the public from a domain you own.

1. Sign up at [resend.com](https://resend.com).
2. Go to **Domains → Add Domain** and enter your domain. Resend shows a few DNS records. Add them where you bought the domain (or in Vercel, if you bought it there), then click **Verify**.
3. Go to **API Keys → Create API Key** and copy the key.
4. In Vercel, open your project and go to **Settings → Environment Variables**. Add:

   | Name | Value |
   |---|---|
   | `RESEND_API_KEY` | The key from step 3 |
   | `EMAIL_FROM` | For example `PDX Game Finder <reports@yourdomain.com>` (it must use your verified domain) |
   | `SITE_URL` | Your site's address, for example `https://yourdomain.com` |

5. Go to **Deployments**, open the menu (**⋯**) on the latest one and choose **Redeploy**.

---

## Optional: your own web address

1. In Vercel, open your project and go to **Settings → Domains**.
2. Buy a domain there, or add one you already own and follow the DNS instructions Vercel shows.
3. If you set up Resend, update `SITE_URL` to the new address and redeploy.

## Optional: a contact email on the privacy page

Add an environment variable `CONTACT_EMAIL` with the address people should write to about removing their information, then redeploy.

---

## Good to know

- **Free plan limits:** Vercel's Hobby plan is for non-commercial projects. If you add ads or charge bars, move to Vercel's paid plan. Supabase pauses free projects after about a week with no activity. A site with regular visitors stays awake, and you can resume a paused project from the Supabase dashboard.
- **Privacy:** the database only accepts connections through the site. Supabase's built-in public API is locked (row-level security is on), so report emails aren't exposed.
- **Spam:** the form has a hidden trap field that bots fill in, and it allows at most six reports per hour from one internet connection.
- **Changing your admin password:** update `ADMIN_PASSWORD` in Vercel and redeploy. Anyone signed in is signed out.

## If something goes wrong

- **The site shows "Application error" or bars don't load:** `DATABASE_URL` is usually the culprit. Check that you replaced `[YOUR-PASSWORD]` completely (no brackets left), that you used the **Transaction pooler** string, and that the password has no symbols. Fix it in **Settings → Environment Variables**, then redeploy.
- **The review page says it's locked:** `ADMIN_PASSWORD` is missing or shorter than 8 characters.
- **You can see the error details** in Vercel under your project → **Logs**. Copy what you see there to Claude.
