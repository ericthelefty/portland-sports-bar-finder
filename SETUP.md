# Putting the site online

This takes about 30 minutes and needs no coding. You'll create three free accounts (Supabase, Vercel and Cloudflare), copy a few values between them, and click Deploy. A custom web address is an optional extra at the end.

**What you'll end up with**

- A public site anyone can use to find bars and report TV packages, with a bot check on the report form
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

## Step 3: Turn on the bot check (Cloudflare Turnstile)

This adds a "Verify you are human" check to the report form. Most people pass it without clicking anything.

1. Go to [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) and create a free account. You don't need to move your domain to Cloudflare.
2. In the Cloudflare dashboard, open **Turnstile** in the left menu and click **Add widget**.
3. Fill in:
   - **Widget name:** `Sports bar finder`
   - **Hostnames:** add your site's address without `https://`, for example `portland-sports-bar-finder.vercel.app`. If you add your own domain later, add it here too.
   - **Widget mode:** **Managed**
4. Click **Create**. Cloudflare shows a **Site key** and a **Secret key**.
5. In Vercel, open your project and go to **Settings → Environment Variables**. Add both:

   | Name | Value |
   |---|---|
   | `TURNSTILE_SITE_KEY` | The Site key |
   | `TURNSTILE_SECRET_KEY` | The Secret key |

6. Go to **Deployments**, click **⋯** on the latest one and choose **Redeploy**.
7. Open `/report` on your site. You should see the check above the **Send report** button.

Until both keys are set, the form works without the check, and your review page shows a reminder.

---

## Using the site

- **Reviewing reports:** open `/admin`. Each report shows what the bar is listed with now next to what the report says. **Approve** updates the listing (or adds the bar if it's new), and **Reject** discards the report. Reports that would remove a package are marked **Disputes**.
- **Editing a bar yourself:** in Supabase, open **Table Editor**:
  - **`bars`** holds names, addresses, areas and links. To hide a bar, set `active` to `false`.
  - **`bar_packages`** holds one row per bar and package. `status` is `has` or `not`, and `source` is `bar_website`, `owner`, `fan` or `admin`.
- **Updates to the code:** whenever new code is pushed to GitHub, Vercel republishes the site automatically.

---

## Optional: your own web address

1. In Vercel, open your project and go to **Settings → Domains**.
2. Buy a domain there, or add one you already own and follow the DNS instructions Vercel shows.
3. In Cloudflare, open your Turnstile widget and add the new domain to its **Hostnames**.

## Optional: a contact email on the privacy page

Add an environment variable `CONTACT_EMAIL` with the address people can write to with questions, then redeploy.

---

## Good to know

- **Free plan limits:** Vercel's Hobby plan is for non-commercial projects. If you add ads or charge bars, move to Vercel's paid plan. Supabase pauses free projects after about a week with no activity. A site with regular visitors stays awake, and you can resume a paused project from the Supabase dashboard.
- **Privacy:** the report form doesn't ask for names or email addresses. The database only accepts connections through the site, and Supabase's built-in public API is locked (row-level security is on).
- **Spam:** besides the Cloudflare check, the form has a hidden trap field that bots fill in, and it allows at most six reports per hour from one internet connection.
- **Changing your admin password:** update `ADMIN_PASSWORD` in Vercel and redeploy. Anyone signed in is signed out.

## If something goes wrong

- **The site shows "Application error" or bars don't load:** `DATABASE_URL` is usually the culprit. Check that you replaced `[YOUR-PASSWORD]` completely (no brackets left), that you used the **Transaction pooler** string, and that the password has no symbols. Fix it in **Settings → Environment Variables**, then redeploy.
- **The review page says it's locked:** `ADMIN_PASSWORD` is missing or shorter than 8 characters.
- **The bot check doesn't appear, or says the site isn't allowed:** check that both Turnstile keys are in Vercel (no spaces), that your site's address is in the widget's **Hostnames** in Cloudflare, and that you redeployed after adding the keys.
- **You can see the error details** in Vercel under your project → **Logs**. Copy what you see there to Claude.
