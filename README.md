# The Cup

A personal daily check-in tracker for body, mind, and intention. Built with React + Vite + Supabase, deployed on Vercel.

## What's in this folder

| File | What it is |
|------|------------|
| `SETUP_GUIDE.md` | **Start here.** Step-by-step deployment from zero. |
| `supabase_setup.sql` | Database schema — paste into Supabase SQL Editor once. |
| `src/` | The React app source code. |
| `package.json` | Dependencies. |
| `.env.example` | Template showing which env vars Vercel needs. |

## Architecture in one paragraph

Two user roles: **client** (the default — sees the tracker) and **clinician** (sees a multi-client engagement dashboard, can view a client's tracker read-only). Roles are stored in `public.profiles`. Tracker entries are stored as JSON in `public.daily_entries`, one row per user per day. A clinician can only see entries from clients explicitly linked via `public.clinician_links`. Row Level Security enforces this at the database level — there's no way for a client to see another client's data, or for a clinician to see an unlinked client's data, even if the app code had a bug.

## Local development (optional)

If you want to run it on your laptop before deploying:

```bash
npm install
cp .env.example .env.local
# edit .env.local with your Supabase URL and anon key
npm run dev
```

Then open http://localhost:5173.

## Updating the app

Push changes to your GitHub repo and Vercel automatically redeploys within ~1 minute. No manual deploy step.
