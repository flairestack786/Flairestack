-- =============================================================================
-- FlaireStack CMS — repair services SELECT policies
-- Symptom: /admin/services shows "No services yet" while Table Editor shows
-- 16 published rows. PostgREST returns { data: [], error: null } when RLS is
-- enabled without a matching SELECT policy (no error is thrown to the client).
-- Idempotent: recreates public + admin SELECT policies and grants.
-- =============================================================================

GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_public_read ON public.services;
DROP POLICY IF EXISTS services_admin_read ON public.services;

-- Public site + admin listing: published services are readable by everyone.
CREATE POLICY services_public_read
  ON public.services
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admin CMS: authenticated admins can read draft/archived rows too.
CREATE POLICY services_admin_read
  ON public.services
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
