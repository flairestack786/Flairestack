-- =============================================================================
-- FlaireStack CMS — repair services WRITE policies
-- Symptom: Save Changes fails with PostgREST PGRST116:
--   "Cannot coerce the result to a single JSON object"
-- Cause: .update(...).select().single() returns 0 rows when RLS blocks UPDATE
--   (or blocks SELECT of the updated row). No error is raised by the UPDATE
--   itself; .single() then fails because the result set is empty.
-- Idempotent: DROP IF EXISTS + recreate admin write policies + grants.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;

GRANT SELECT ON public.service_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_sections TO authenticated;

GRANT SELECT ON public.service_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_media TO authenticated;

GRANT SELECT ON public.seo_metadata TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seo_metadata TO authenticated;

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;

-- -----------------------------------------------------------------------------
-- services
-- -----------------------------------------------------------------------------

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_admin_insert ON public.services;
DROP POLICY IF EXISTS services_admin_update ON public.services;
DROP POLICY IF EXISTS services_admin_delete ON public.services;

CREATE POLICY services_admin_insert
  ON public.services
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY services_admin_update
  ON public.services
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY services_admin_delete
  ON public.services
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- service_sections
-- -----------------------------------------------------------------------------

ALTER TABLE public.service_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_sections_admin_insert ON public.service_sections;
DROP POLICY IF EXISTS service_sections_admin_update ON public.service_sections;
DROP POLICY IF EXISTS service_sections_admin_delete ON public.service_sections;
DROP POLICY IF EXISTS service_sections_admin_read ON public.service_sections;

CREATE POLICY service_sections_admin_read
  ON public.service_sections
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY service_sections_admin_insert
  ON public.service_sections
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY service_sections_admin_update
  ON public.service_sections
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY service_sections_admin_delete
  ON public.service_sections
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- service_media
-- -----------------------------------------------------------------------------

ALTER TABLE public.service_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_media_admin_all ON public.service_media;

CREATE POLICY service_media_admin_all
  ON public.service_media
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- seo_metadata
-- -----------------------------------------------------------------------------

ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seo_metadata_admin_all ON public.seo_metadata;

CREATE POLICY seo_metadata_admin_all
  ON public.seo_metadata
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- media_assets (needed when save creates registry rows for service_media)
-- -----------------------------------------------------------------------------

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS media_assets_admin_all ON public.media_assets;

CREATE POLICY media_assets_admin_all
  ON public.media_assets
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
