-- =============================================================================
-- FlaireStack CMS — repair public SELECT on service child tables
-- Symptom: anon can read published services, but service_sections /
--   service_media / seo_metadata return [] with error: null.
-- Cause: RLS enabled without a matching public SELECT policy (or policy
--   was dropped). SQL Editor still shows rows because it bypasses RLS.
-- Idempotent: DROP IF EXISTS + recreate public + admin SELECT policies.
-- =============================================================================

GRANT SELECT ON public.service_sections TO anon, authenticated;
GRANT SELECT ON public.service_media TO anon, authenticated;
GRANT SELECT ON public.seo_metadata TO anon, authenticated;
GRANT SELECT ON public.media_assets TO anon, authenticated;

ALTER TABLE public.service_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- service_sections
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS service_sections_public_read ON public.service_sections;
DROP POLICY IF EXISTS "service_sections_public_read" ON public.service_sections;
DROP POLICY IF EXISTS service_sections_admin_read ON public.service_sections;
DROP POLICY IF EXISTS "service_sections_admin_read" ON public.service_sections;

CREATE POLICY service_sections_public_read
  ON public.service_sections
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.services s
      WHERE s.id = service_sections.service_id
        AND s.status = 'published'
    )
  );

CREATE POLICY service_sections_admin_read
  ON public.service_sections
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- service_media
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS service_media_public_read ON public.service_media;
DROP POLICY IF EXISTS "service_media_public_read" ON public.service_media;
DROP POLICY IF EXISTS service_media_admin_read ON public.service_media;
DROP POLICY IF EXISTS "service_media_admin_read" ON public.service_media;

CREATE POLICY service_media_public_read
  ON public.service_media
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.services s
      WHERE s.id = service_media.service_id
        AND s.status = 'published'
    )
  );

CREATE POLICY service_media_admin_read
  ON public.service_media
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- seo_metadata
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS seo_metadata_public_read ON public.seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_public_read" ON public.seo_metadata;
DROP POLICY IF EXISTS seo_metadata_admin_read ON public.seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_admin_read" ON public.seo_metadata;

CREATE POLICY seo_metadata_public_read
  ON public.seo_metadata
  FOR SELECT
  TO anon, authenticated
  USING (
    (
      entity_type = 'service'
      AND EXISTS (
        SELECT 1
        FROM public.services s
        WHERE s.id = seo_metadata.service_id
          AND s.status = 'published'
      )
    )
    OR (
      entity_type = 'page'
      AND EXISTS (
        SELECT 1
        FROM public.pages p
        WHERE p.id = seo_metadata.page_id
          AND p.status = 'published'
      )
    )
  );

CREATE POLICY seo_metadata_admin_read
  ON public.seo_metadata
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- media_assets (needed for nested service_media → media_assets selects)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS media_assets_public_read ON public.media_assets;
DROP POLICY IF EXISTS "media_assets_public_read" ON public.media_assets;
DROP POLICY IF EXISTS media_assets_admin_read ON public.media_assets;
DROP POLICY IF EXISTS "media_assets_admin_read" ON public.media_assets;

CREATE POLICY media_assets_public_read
  ON public.media_assets
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY media_assets_admin_read
  ON public.media_assets
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
