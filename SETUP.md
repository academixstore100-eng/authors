# Phase 2 setup — Supabase + GitHub Pages

## 1. Create your Supabase project
1. Go to https://supabase.com and sign up / log in.
2. Click **New project**. Pick a name (e.g. `academixstore-authors`), a database password (save it somewhere safe), and a region close to India (e.g. Mumbai/Singapore).
3. Wait ~2 minutes for the project to spin up.

## 2. Create the table
1. In your project, open **SQL Editor** (left sidebar).
2. Click **New query**.
3. Paste the entire contents of `supabase-schema.sql` and click **Run**.
4. Confirm: go to **Table Editor** → you should see an `author_applications` table with all the form's columns.

This also turns on **Row Level Security** and adds one policy: the public form can *insert* new applications, but can't read, edit, or delete any — so nobody can see other applicants' data through the website.

## 3. Get your API keys
1. Go to **Project Settings** (gear icon) → **API**.
2. Copy the **Project URL**.
3. Copy the **anon public** key (NOT the `service_role` key — that one must never go in frontend code).
4. Open `config.js` and paste them in:
   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```

## 4. Test it locally
Open `index.html` in a browser (or run a local server, e.g. `python3 -m http.server`), fill out the form, and submit. Then check **Table Editor → author_applications** in Supabase — your test row should appear.

## 5. Deploy to GitHub Pages
1. Push these files (`index.html`, `style.css`, `script.js`, `config.js`) to a GitHub repo.
   - **Important:** `config.js` contains only your public `anon` key, which is safe to expose — but double check you did NOT paste the `service_role` key in there.
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose the branch (usually `main`) and root folder, then **Save**.
4. GitHub gives you a URL like `https://yourusername.github.io/repo-name/` — that's your live form.
5. Optional: point a subdomain like `authors.academixstore.com` at it via a custom domain in the same Pages settings.

## 6. Reviewing applications
For now, review submissions directly in Supabase's **Table Editor** (you're logged in as the project owner, so RLS doesn't block you). You can filter, sort, and manually update the `status` column (`pending` / `reviewing` / `accepted` / `rejected`) as you process applications.

**Phase 3** can build a proper admin dashboard on top of this — a login-protected page listing applications with filters and status updates — whenever you're ready for it.

---

## Phase 3 — Admin dashboard (`admin.html`)

A login-protected page at `admin.html` where you can search, filter, and update application statuses without opening the Supabase dashboard.

### 1. Run the extra policies
In Supabase **SQL Editor**, run everything in `supabase-admin-policies.sql`. This lets *logged-in* users read and update applications — the public form still can't.

### 2. Lock down who can log in
Two things, both in **Authentication** on the left sidebar:

1. **Authentication → Providers → Email** → turn **OFF** "Allow new users to sign up". This stops anyone from creating their own account via the API and getting into the dashboard.
2. **Authentication → Users → Add user** → create your own admin account (your email + a strong password). Use "Auto Confirm User" so you don't need to click an email link.

Without step 1, the admin policies technically let *any* signed-up user view applicant data — so don't skip it.

### 3. Log in
Open `admin.html` (same Live Server / GitHub Pages setup as `index.html`) and sign in with the account you just created. You'll see every submission in a table — click a row for full details, use the status dropdown to mark it reviewing/accepted/rejected, and search/filter above the table.

Both `index.html` (public form) and `admin.html` (private dashboard) read the same `config.js`, so no extra setup needed there.

