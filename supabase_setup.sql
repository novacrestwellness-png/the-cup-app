-- ============================================================
-- THE CUP — Supabase database setup
-- Paste this entire file into Supabase SQL Editor and click Run.
-- It creates 3 tables and the security rules so users can only
-- see their own data (and clinicians can only see clients
-- they've been explicitly linked to).
-- ============================================================

-- 1. PROFILES — extends auth.users with a role flag
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('client', 'clinician')),
  created_at timestamptz default now()
);

-- 2. DAILY_ENTRIES — the actual tracker data, one row per user per day
create table if not exists public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  payload jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, entry_date)
);

create index if not exists daily_entries_user_date_idx
  on public.daily_entries (user_id, entry_date desc);

-- 3. CLINICIAN_LINKS — explicit mapping of which clinician can view which client
create table if not exists public.clinician_links (
  id uuid primary key default gen_random_uuid(),
  clinician_user_id uuid not null references auth.users(id) on delete cascade,
  client_user_id uuid not null references auth.users(id) on delete cascade,
  client_label text,
  created_at timestamptz default now(),
  unique (clinician_user_id, client_user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY — locks down access at the database level
-- ============================================================

alter table public.profiles enable row level security;
alter table public.daily_entries enable row level security;
alter table public.clinician_links enable row level security;

-- Profiles: a user can read/write only their own profile row
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles self upsert" on public.profiles;
create policy "profiles self upsert" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles
  for update using (auth.uid() = user_id);

-- Daily entries:
--   - A user can read/write their own entries
--   - A linked clinician can read their client's entries (read only)
drop policy if exists "entries self all" on public.daily_entries;
create policy "entries self all" on public.daily_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "entries clinician read" on public.daily_entries;
create policy "entries clinician read" on public.daily_entries
  for select using (
    exists (
      select 1 from public.clinician_links cl
      where cl.client_user_id = daily_entries.user_id
        and cl.clinician_user_id = auth.uid()
    )
  );

-- Clinician links: a clinician can read their own links
drop policy if exists "links clinician read" on public.clinician_links;
create policy "links clinician read" on public.clinician_links
  for select using (auth.uid() = clinician_user_id);

-- ============================================================
-- AUTO-CREATE PROFILE on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'client')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- DONE. Now go create your accounts (sign up in the app),
-- then come back here and run the queries in SETUP_NOTES.md
-- to mark yourself as a clinician and link your client.
-- ============================================================
