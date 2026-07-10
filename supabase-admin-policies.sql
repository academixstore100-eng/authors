-- =========================================================
-- AcademixStore — Admin access policies
-- Run this AFTER supabase-schema.sql, once.
-- Grants read + status-update access to logged-in (authenticated)
-- users only. The public (anon) role still cannot read or edit
-- anything — it can only insert new applications via the form.
-- =========================================================

create policy "authenticated can view applications"
  on author_applications
  for select
  to authenticated
  using (true);

create policy "authenticated can update applications"
  on author_applications
  for update
  to authenticated
  using (true)
  with check (true);

-- Note: there is deliberately no delete policy — nobody can
-- delete an application through the app. If you ever need to
-- remove one, do it from the Supabase Table Editor directly.
