-- =============================================================================
-- FlaireStack CMS — SEO Module (extensible page SEO)
-- Adds focus keyword, cached score, extensions bag; opens seo_metadata writes
-- to content managers (administrator + editor). Sales remains excluded.
-- =============================================================================

ALTER TABLE public.seo_metadata
  ADD COLUMN IF NOT EXISTS focus_keyword text;

ALTER TABLE public.seo_metadata
  ADD COLUMN IF NOT EXISTS seo_score integer;

ALTER TABLE public.seo_metadata
  ADD COLUMN IF NOT EXISTS extensions jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'seo_metadata_seo_score_range'
      AND conrelid = 'public.seo_metadata'::regclass
  ) THEN
    ALTER TABLE public.seo_metadata
      ADD CONSTRAINT seo_metadata_seo_score_range
      CHECK (seo_score IS NULL OR (seo_score >= 0 AND seo_score <= 100));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'seo_metadata_extensions_object'
      AND conrelid = 'public.seo_metadata'::regclass
  ) THEN
    ALTER TABLE public.seo_metadata
      ADD CONSTRAINT seo_metadata_extensions_object
      CHECK (jsonb_typeof(extensions) = 'object');
  END IF;
END
$$;

-- Allow JSON-LD object or array in structured_data
ALTER TABLE public.seo_metadata
  DROP CONSTRAINT IF EXISTS seo_metadata_structured_data_is_object;

ALTER TABLE public.seo_metadata
  ADD CONSTRAINT seo_metadata_structured_data_json
  CHECK (jsonb_typeof(structured_data) IN ('object', 'array'));

COMMENT ON COLUMN public.seo_metadata.focus_keyword IS
  'Primary focus keyword used for on-page SEO scoring.';

COMMENT ON COLUMN public.seo_metadata.seo_score IS
  'Cached SEO health score (0–100), computed by the CMS.';

COMMENT ON COLUMN public.seo_metadata.extensions IS
  'Extensibility bag for future AI suggestions, Search Console, Analytics, sitemap flags, etc.';

-- -----------------------------------------------------------------------------
-- RLS — content managers (admin + editor) may manage SEO metadata
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS seo_metadata_admin_insert ON public.seo_metadata;
DROP POLICY IF EXISTS seo_metadata_admin_update ON public.seo_metadata;
DROP POLICY IF EXISTS seo_metadata_admin_delete ON public.seo_metadata;
DROP POLICY IF EXISTS seo_metadata_admin_select ON public.seo_metadata;
DROP POLICY IF EXISTS seo_metadata_authenticated_select ON public.seo_metadata;
DROP POLICY IF EXISTS seo_metadata_content_select ON public.seo_metadata;
DROP POLICY IF EXISTS seo_metadata_content_insert ON public.seo_metadata;
DROP POLICY IF EXISTS seo_metadata_content_update ON public.seo_metadata;
DROP POLICY IF EXISTS seo_metadata_content_delete ON public.seo_metadata;

CREATE POLICY seo_metadata_content_select
  ON public.seo_metadata
  FOR SELECT
  TO authenticated
  USING (public.can_manage_content() OR public.is_admin());

CREATE POLICY seo_metadata_content_insert
  ON public.seo_metadata
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_content());

CREATE POLICY seo_metadata_content_update
  ON public.seo_metadata
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

CREATE POLICY seo_metadata_content_delete
  ON public.seo_metadata
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
