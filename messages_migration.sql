-- ============================================================
-- THE CUP — Messages Migration
-- Run this in Supabase SQL Editor to add the messaging feature.
-- Safe to run on an existing database — it only ADDS the new
-- messages table and policies, doesn't touch anything else.
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz default now()
);

create index if not exists messages_thread_idx
  on public.messages (sender_user_id, recipient_user_id, created_at desc);

create index if not exists messages_recipient_idx
  on public.messages (recipient_user_id, created_at desc);

alter table public.messages enable row level security;

-- Policy 1: You can read messages where you are the sender OR recipient
drop policy if exists "messages read own" on public.messages;
create policy "messages read own" on public.messages
  for select using (
    auth.uid() = sender_user_id or auth.uid() = recipient_user_id
  );

-- Policy 2: You can send messages only as yourself, only to someone
-- you have a clinician_link with (in either direction)
drop policy if exists "messages send linked" on public.messages;
create policy "messages send linked" on public.messages
  for insert with check (
    auth.uid() = sender_user_id
    and (
      exists (
        select 1 from public.clinician_links cl
        where (cl.clinician_user_id = auth.uid() and cl.client_user_id = recipient_user_id)
           or (cl.client_user_id = auth.uid() and cl.clinician_user_id = recipient_user_id)
      )
    )
  );

-- Done. The messages table is ready.
