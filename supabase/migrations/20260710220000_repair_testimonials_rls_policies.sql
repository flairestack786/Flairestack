-- =============================================================================
-- FlaireStack CMS — repair testimonials RLS (match services pattern)
-- Symptom: Create Testimonial fails with:
--   "new row violates row-level security policy for table testimonials"
-- Cause (common): INSERT ... RETURNING / .insert().select() requires BOTH
--   1) testimonials_admin_insert WITH CHECK (is_admin())
--   2) testimonials_admin_read USING (is_admin()) so the new *draft* row
--      is visible (public_read only allows status = 'published')
-- Idempotent: DROP IF EXISTS + recreate grants + policies like services.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Diagnostic (run in SQL editor while logged in as the CMS user via Dashboard
-- "Role: authenticated" / or check JWT claims in Auth). Uncomment to inspect.
-- -----------------------------------------------------------------------------
-- SELECT auth.uid() AS uid, public.is_admin() AS is_admin;
-- SELECT policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--  WHERE schemaname = 'public' AND tablename = 'testimonials'
--  ORDER BY policyname;
-- SELECT policyname, cmd, roles, qual, with_check
--   FROM pg_policies
--  WHERE schemaname = 'public' AND tablename = 'services'
--  ORDER BY policyname;

-- -----------------------------------------------------------------------------
-- Ensure is_admin() matches the working definition used by services
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL
    AND COALESCE(
      NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', ''),
      NULLIF(auth.jwt() -> 'user_metadata' ->> 'role', ''),
      'admin'
    ) = 'admin';
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'Returns true for authenticated CMS users. Set app_metadata.role to restrict non-admin writers.';

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- Grants (identical pattern to services)
-- -----------------------------------------------------------------------------

GRANT SELECT ON TABLE public.testimonials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.testimonials TO authenticated;

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Drop all known testimonials policies, then recreate to match services
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS testimonials_public_read ON public.testimonials;
DROP POLICY IF EXISTS testimonials_admin_read ON public.testimonials;
DROP POLICY IF EXISTS testimonials_admin_insert ON public.testimonials;
DROP POLICY IF EXISTS testimonials_admin_update ON public.testimonials;
DROP POLICY IF EXISTS testimonials_admin_delete ON public.testimonials;

-- Public site: published rows only (same as services_public_read)
CREATE POLICY testimonials_public_read
  ON public.testimonials
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Admin CMS: read drafts/archived too (required for INSERT...RETURNING of drafts)
CREATE POLICY testimonials_admin_read
  ON public.testimonials
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY testimonials_admin_insert
  ON public.testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY testimonials_admin_update
  ON public.testimonials
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY testimonials_admin_delete
  ON public.testimonials
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
