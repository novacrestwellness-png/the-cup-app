# THE CUP — Deployment Guide

You've got a Vercel account already, so you're ahead of the game. We just need to:

1. Set up a free Supabase project (10 min) — this is the database + login system
2. Drop the database schema in (1 min — copy/paste one SQL file)
3. Push this folder to a GitHub repo (5 min)
4. Connect Vercel to it and add 2 environment variables (5 min)
5. Sign up the two accounts and link them (5 min)

Total: ~25 minutes, all free.

---

## STEP 1 — Set up Supabase (the database & login)

Supabase is what holds her tracker entries and handles secure logins. Free tier is more than enough — you'd need hundreds of clients before you'd hit a limit.

1. Go to **https://supabase.com** and sign up (use your work email or whatever you prefer; this is *your* account, not hers).
2. Once logged in, click **"New Project"**.
3. Fill in:
   - **Name:** `the-cup` (or whatever)
   - **Database Password:** Click "Generate" and **save it somewhere safe** (you won't need it day-to-day, but you don't want to lose it). A password manager is ideal.
   - **Region:** Pick the one closest to Philadelphia — likely `East US (North Virginia)` or similar.
   - **Plan:** Free
4. Click **"Create new project"**. Wait ~2 minutes while it spins up. You'll see a green "Project is ready" indicator.

### Grab your two keys (you'll need them in Step 4)

1. In the left sidebar, click the **gear icon (⚙️ Settings)** → **API**.
2. You'll see two values — copy them somewhere temporary (a sticky note app):
   - **Project URL** — looks like `https://xxxxxxxxxxxxx.supabase.co`
   - **anon / public key** — long string starting with `eyJ...`

### Run the database setup script

1. In the left sidebar, click the **SQL Editor** icon (looks like a database with a "play" symbol).
2. Click **"+ New query"**.
3. Open the file `supabase_setup.sql` from this project folder, copy ALL of it, paste it into the SQL Editor.
4. Click **"Run"** (bottom right). You should see `Success. No rows returned`.

Done with Supabase setup. Don't close the tab — you'll come back here after both accounts are created.

---

## STEP 2 — Push the project to GitHub

Vercel pulls from a GitHub repo, so we need one. If you don't have GitHub set up yet, sign up at **https://github.com**.

### Easy way (GitHub Desktop):

1. Download **GitHub Desktop** from https://desktop.github.com if you don't have it.
2. Open it, sign in.
3. Click **File → Add local repository** and pick this `zamirah-app` folder.
4. It'll say "this is not a git repository — create one." Click that.
5. Click **"Publish repository"** at the top. Set it to **Private** (important — keep your code private).
6. Done.

### Or via the GitHub website:

1. Make a new private repo on github.com called `the-cup` (or whatever).
2. Follow the instructions on screen for "push an existing folder" (it gives you 3 commands to paste in Terminal).

---

## STEP 3 — Deploy to Vercel

1. Go to **https://vercel.com** and log in.
2. Click **"Add New..." → "Project"**.
3. Find the GitHub repo you just pushed and click **"Import"**.
   - First time only: Vercel will ask permission to access your GitHub. Approve.
4. On the configuration screen:
   - **Framework Preset:** Vite (should auto-detect)
   - **Root Directory:** leave as `.`
   - Expand **"Environment Variables"** and add these TWO (paste the values you copied from Supabase Step 1):
     - `VITE_SUPABASE_URL` → your Project URL
     - `VITE_SUPABASE_ANON_KEY` → your anon key
5. Click **"Deploy"**.
6. Wait ~1 minute. You'll get a live URL like `the-cup-xyz.vercel.app`.

Open that URL in your phone browser to confirm the welcome screen loads. You should see "The Cup — A space to fill, daily" with a sign-in form.

---

## STEP 4 — Create the two accounts and link them

Now we make her account, your account, and tell the database that you're allowed to view her data.

### Create Zamirah's account

Have her sit with you (or do this yourself with her email — you can change her password to her later). On the live site:

1. Tap **"First time? Create an account"**
2. Enter HER email + a password (at least 6 chars)
3. Check email for confirmation, click the link
4. Sign in. She should land directly on her tracker.

### Create your clinician account

1. Sign out (top-right log-out icon).
2. **"First time? Create an account"** with YOUR email + password.
3. Confirm via email, sign in.

You'll currently land on the tracker view too — that's because by default everyone is a client. We need to flip your role to clinician.

### Mark yourself as a clinician (one-time SQL)

1. Back to **Supabase → SQL Editor → New query**.
2. Paste this, **replacing the email with yours**:

```sql
update public.profiles
set role = 'clinician'
where user_id = (select id from auth.users where email = 'YOUR_EMAIL@example.com');
```

3. Click Run. Should say "Success".

### Link Zamirah to you

In the same SQL editor:

```sql
insert into public.clinician_links (clinician_user_id, client_user_id, client_label)
values (
  (select id from auth.users where email = 'YOUR_EMAIL@example.com'),
  (select id from auth.users where email = 'HER_EMAIL@example.com'),
  'Z'
);
```

Replace both emails. The `'Z'` is the label that'll show on your dashboard — you can use her first initial, a nickname, anything that means something to you but wouldn't identify her if someone glanced at your screen.

Click Run.

### Test it

1. Sign out, sign back in with your account.
2. You should now see the **Engagement Dashboard** with her listed.
3. Tap "view" — you'll see her tracker in read-only mode.
4. Sign out, sign in as her, tap things, sign out, sign in as you, refresh — her changes should be reflected.

---

## STEP 5 — Get it on her phone properly

Tell her to:

1. Open the Vercel URL in **Safari (iPhone) or Chrome (Android)**.
2. Sign in.
3. **iPhone:** Tap the share button (square with arrow) → "Add to Home Screen". Now there's an icon on her home screen that opens the tracker like an app.
4. **Android:** Tap the three-dot menu → "Add to Home screen" or "Install app".

It'll look and feel like a real native app from her perspective.

---

## Adding more clients later

Same pattern: have them sign up, then run the same `insert into clinician_links...` query with their email and a label.

To stop seeing a client (e.g., after discharge):

```sql
delete from public.clinician_links
where clinician_user_id = (select id from auth.users where email = 'YOUR_EMAIL@example.com')
  and client_user_id = (select id from auth.users where email = 'CLIENT_EMAIL@example.com');
```

Their data stays in their own account; you just lose access to view it.

---

## What if something doesn't work?

**"Failed to fetch" on sign-in** → environment variables in Vercel are wrong. Project Settings → Environment Variables. Make sure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set, with no quotes or spaces. After fixing them, you have to redeploy: Vercel → Deployments → click `…` on the latest → Redeploy.

**Sign up works but never get the email** → Supabase → Authentication → Email Templates. Make sure the "Confirm signup" template is enabled. Or temporarily turn off confirmation: Authentication → Providers → Email → toggle "Confirm email" off (re-enable for production).

**Clinician dashboard says "No clients linked yet"** → the `clinician_links` insert didn't run, or you used the wrong email. In SQL Editor: `select * from public.clinician_links;` to check what's actually in there.

**Want to wipe all her test data** → SQL Editor: `delete from public.daily_entries where user_id = (select id from auth.users where email = 'HER_EMAIL@example.com');`

---

## Privacy & data notes

- All data is stored in Supabase, encrypted at rest.
- Row Level Security policies are enforced at the database level — even if someone got the anon key, they couldn't read another user's data without being explicitly linked.
- Supabase free tier is **not HIPAA-compliant**, which is why the framing is "personal task manager, not clinical record" — make sure you've documented her informed consent for that.
- If you ever want to delete the whole project: Supabase → Settings → General → Delete project. It's permanent.

That's it. Tag me if you get stuck on any step.
