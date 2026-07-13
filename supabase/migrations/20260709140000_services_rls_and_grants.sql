-- =============================================================================
-- FlaireStack CMS — services RLS policies and grants
-- Enables admin CMS access to services, service_sections, service_media,
-- service seo_metadata, and media_assets registry lookups.
-- Idempotent: creates only policies that do not already exist.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- services
-- -----------------------------------------------------------------------------

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'services_public_read'
  ) THEN
    CREATE POLICY services_public_read
      ON public.services
      FOR SELECT
      TO anon, authenticated
      USING (status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'services_admin_read'
  ) THEN
    CREATE POLICY services_admin_read
      ON public.services
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'services_admin_insert'
  ) THEN
    CREATE POLICY services_admin_insert
      ON public.services
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'services_admin_update'
  ) THEN
    CREATE POLICY services_admin_update
      ON public.services
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'services' AND policyname = 'services_admin_delete'
  ) THEN
    CREATE POLICY services_admin_delete
      ON public.services
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- service_sections
-- -----------------------------------------------------------------------------

ALTER TABLE public.service_sections ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.service_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_sections TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_sections' AND policyname = 'service_sections_public_read'
  ) THEN
    CREATE POLICY service_sections_public_read
      ON public.service_sections
      FOR SELECT
      TO anon, authenticated
      USING (
        is_enabled = true
        AND EXISTS (
          SELECT 1
          FROM public.services s
          WHERE s.id = service_sections.service_id
            AND s.status = 'published'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_sections' AND policyname = 'service_sections_admin_read'
  ) THEN
    CREATE POLICY service_sections_admin_read
      ON public.service_sections
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_sections' AND policyname = 'service_sections_admin_insert'
  ) THEN
    CREATE POLICY service_sections_admin_insert
      ON public.service_sections
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_sections' AND policyname = 'service_sections_admin_update'
  ) THEN
    CREATE POLICY service_sections_admin_update
      ON public.service_sections
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_sections' AND policyname = 'service_sections_admin_delete'
  ) THEN
    CREATE POLICY service_sections_admin_delete
      ON public.service_sections
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- service_media
-- -----------------------------------------------------------------------------

ALTER TABLE public.service_media ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.service_media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_media TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_media' AND policyname = 'service_media_public_read'
  ) THEN
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
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'service_media' AND policyname = 'service_media_admin_all'
  ) THEN
    CREATE POLICY service_media_admin_all
      ON public.service_media
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- seo_metadata (service rows)
-- -----------------------------------------------------------------------------

ALTER TABLE public.seo_metadata ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.seo_metadata TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.seo_metadata TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seo_metadata' AND policyname = 'seo_metadata_public_read'
  ) THEN
    CREATE POLICY seo_metadata_public_read
      ON public.seo_metadata
      FOR SELECT
      TO anon, authenticated
      USING (
        status = 'published'
        AND (
          (entity_type = 'page' AND EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = seo_metadata.page_id AND p.status = 'published'
          ))
          OR (entity_type = 'service' AND EXISTS (
            SELECT 1 FROM public.services s
            WHERE s.id = seo_metadata.service_id AND s.status = 'published'
          ))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'seo_metadata' AND policyname = 'seo_metadata_admin_all'
  ) THEN
    CREATE POLICY seo_metadata_admin_all
      ON public.seo_metadata
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- media_assets (registry for service_media FK)
-- -----------------------------------------------------------------------------

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE ON public.media_assets TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_assets' AND policyname = 'media_assets_public_read'
  ) THEN
    CREATE POLICY media_assets_public_read
      ON public.media_assets
      FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'media_assets' AND policyname = 'media_assets_admin_all'
  ) THEN
    CREATE POLICY media_assets_admin_all
      ON public.media_assets
      FOR ALL
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;
