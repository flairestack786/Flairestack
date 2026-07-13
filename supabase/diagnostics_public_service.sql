-- =============================================================================
-- FlaireStack CMS — one-shot diagnostics for public service visibility
-- Run in Supabase SQL Editor (bypasses RLS). Compare with anon API results.
-- =============================================================================

-- 1) Exact row the public site looks for
select id, slug, title, status, published_at, updated_at
from public.services
where slug = 'test';

-- 2) Force publish if the row exists but is still draft
-- update public.services
-- set status = 'published', published_at = coalesce(published_at, now())
-- where slug = 'test';

-- 3) Confirm policies exist (anon needs services_public_read)
select policyname, cmd, roles::text, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('services', 'service_sections', 'service_media', 'seo_metadata')
order by tablename, policyname;

-- 4) Count sections for the test service (should be > 0 after create)
select ss.section_key, ss.is_enabled, ss.title
from public.service_sections ss
join public.services s on s.id = ss.service_id
where s.slug = 'test'
order by ss.section_key;
