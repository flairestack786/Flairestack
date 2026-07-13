-- Ensure testimonials is visible to PostgREST after DDL / manual SQL creates.
-- PGRST205 ("Could not find the table 'public.testimonials' in the schema cache")
-- means Postgres has the table but PostgREST's in-memory cache does not yet.

notify pgrst, 'reload schema';

-- Re-assert grants (safe if already applied)
grant select on table public.testimonials to anon, authenticated;
grant insert, update, delete on table public.testimonials to authenticated;

-- Re-assert RLS policies used by admin list + public read
alter table public.testimonials enable row level security;

drop policy if exists testimonials_public_read on public.testimonials;
create policy testimonials_public_read
  on public.testimonials
  for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists testimonials_admin_read on public.testimonials;
create policy testimonials_admin_read
  on public.testimonials
  for select
  to authenticated
  using (public.is_admin());

drop policy if exists testimonials_admin_insert on public.testimonials;
create policy testimonials_admin_insert
  on public.testimonials
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists testimonials_admin_update on public.testimonials;
create policy testimonials_admin_update
  on public.testimonials
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists testimonials_admin_delete on public.testimonials;
create policy testimonials_admin_delete
  on public.testimonials
  for delete
  to authenticated
  using (public.is_admin());
