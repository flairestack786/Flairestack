-- =============================================================================
-- FlaireStack CMS — repair pages / page_sections RLS policies
-- Adds missing policies when RLS is enabled but pg_policies has no rows for
-- these tables (all SELECTs denied → PGRST116 on .single()).
-- Idempotent: creates only policies that do not already exist.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- pages
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pages'
      AND policyname = 'pages_public_read'
  ) THEN
    CREATE POLICY pages_public_read
      ON public.pages
      FOR SELECT
      TO anon, authenticated
      USING (status = 'published');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pages'
      AND policyname = 'pages_admin_insert'
  ) THEN
    CREATE POLICY pages_admin_insert
      ON public.pages
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pages'
      AND policyname = 'pages_admin_update'
  ) THEN
    CREATE POLICY pages_admin_update
      ON public.pages
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pages'
      AND policyname = 'pages_admin_delete'
  ) THEN
    CREATE POLICY pages_admin_delete
      ON public.pages
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- page_sections
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'page_sections'
      AND policyname = 'page_sections_public_read'
  ) THEN
    CREATE POLICY page_sections_public_read
      ON public.page_sections
      FOR SELECT
      TO anon, authenticated
      USING (
        is_enabled = true
        AND EXISTS (
          SELECT 1
          FROM public.pages p
          WHERE p.id = page_sections.page_id
            AND p.status = 'published'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'page_sections'
      AND policyname = 'page_sections_admin_insert'
  ) THEN
    CREATE POLICY page_sections_admin_insert
      ON public.page_sections
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'page_sections'
      AND policyname = 'page_sections_admin_update'
  ) THEN
    CREATE POLICY page_sections_admin_update
      ON public.page_sections
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'page_sections'
      AND policyname = 'page_sections_admin_delete'
  ) THEN
    CREATE POLICY page_sections_admin_delete
      ON public.page_sections
      FOR DELETE
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;
