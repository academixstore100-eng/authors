-- =========================================================
-- AcademixStore — Author Applications table
-- Run this once in your Supabase project's SQL Editor
-- (Dashboard → SQL Editor → New query → paste → Run)
-- =========================================================

create table if not exists author_applications (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  email           text not null,
  phone           text not null,
  city            text not null,
  state           text not null,
  institution     text not null,
  qualification   text not null,
  experience      text not null,
  subject         text not null,
  book_idea       text,
  portfolio       text,
  motivation      text not null,
  agree           boolean not null default false,
  status          text not null default 'pending' check (status in ('pending','reviewing','accepted','rejected')),
  submitted_at    timestamptz not null default now()
);

-- Helpful for spotting duplicate applications later
create index if not exists author_applications_email_idx on author_applications (email);

-- Row Level Security: locked down by default, and we
-- deliberately only open the door we need (public INSERT).
alter table author_applications enable row level security;

-- Allow anyone (the public form, using the anon key) to submit
-- an application, but NOT to read, update, or delete any row.
create policy "public can insert applications"
  on author_applications
  for insert
  to anon
  with check (true);

-- Nothing else is granted to `anon` — no select/update/delete.
-- To review applications yourself, use the Supabase Table Editor
-- (you're logged in as the project owner, which bypasses RLS),
-- or query as an authenticated admin user in a future admin panel.
