-- =============================================================================
-- FlaireStack CMS — SEO Module v2 (global settings, excerpts, keywords, templates)
-- Additive / production-safe. Preserves existing seo_metadata + site_settings.
-- =============================================================================

-- Global SEO columns on site_settings
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS website_name text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS canonical_base_url text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS default_robots text NOT NULL DEFAULT 'index,follow';

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS default_twitter_image text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS gsc_verification text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS bing_verification text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS organization_jsonld jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS website_jsonld jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS seo_templates jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS seo_extensions jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'site_settings_organization_jsonld_object'
      AND conrelid = 'public.site_settings'::regclass
  ) THEN
    ALTER TABLE public.site_settings
      ADD CONSTRAINT site_settings_organization_jsonld_object
      CHECK (jsonb_typeof(organization_jsonld) IN ('object', 'array'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'site_settings_website_jsonld_object'
      AND conrelid = 'public.site_settings'::regclass
  ) THEN
    ALTER TABLE public.site_settings
      ADD CONSTRAINT site_settings_website_jsonld_object
      CHECK (jsonb_typeof(website_jsonld) IN ('object', 'array'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'site_settings_seo_templates_object'
      AND conrelid = 'public.site_settings'::regclass
  ) THEN
    ALTER TABLE public.site_settings
      ADD CONSTRAINT site_settings_seo_templates_object
      CHECK (jsonb_typeof(seo_templates) = 'object');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'site_settings_seo_extensions_object'
      AND conrelid = 'public.site_settings'::regclass
  ) THEN
    ALTER TABLE public.site_settings
      ADD CONSTRAINT site_settings_seo_extensions_object
      CHECK (jsonb_typeof(seo_extensions) = 'object');
  END IF;
END
$$;

UPDATE public.site_settings
SET
  website_name = COALESCE(NULLIF(btrim(website_name), ''), company_name),
  seo_templates = CASE
    WHEN seo_templates = '{}'::jsonb THEN jsonb_build_object(
      'meta_title', '{{Page Title}} | {{Website Name}}',
      'meta_description', 'Learn more about {{Page Title}} from {{Company Name}}.',
      'og_title', '{{Page Title}} | {{Website Name}}',
      'og_description', 'Learn more about {{Page Title}} from {{Company Name}}.',
      'twitter_title', '{{Page Title}} | {{Website Name}}',
      'twitter_description', 'Learn more about {{Page Title}} from {{Company Name}}.'
    )
    ELSE seo_templates
  END
WHERE true;

COMMENT ON COLUMN public.site_settings.seo_templates IS
  'Reusable SEO string templates with {{variables}} for new pages.';
COMMENT ON COLUMN public.site_settings.seo_extensions IS
  'Future bag: AI suggestions, Search Console, sitemap/robots flags, analytics hooks.';

-- Per-entity SEO: page excerpt + related keywords
ALTER TABLE public.seo_metadata
  ADD COLUMN IF NOT EXISTS page_description text;

ALTER TABLE public.seo_metadata
  ADD COLUMN IF NOT EXISTS related_keywords jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'seo_metadata_related_keywords_array'
      AND conrelid = 'public.seo_metadata'::regclass
  ) THEN
    ALTER TABLE public.seo_metadata
      ADD CONSTRAINT seo_metadata_related_keywords_array
      CHECK (jsonb_typeof(related_keywords) = 'array');
  END IF;
END
$$;

COMMENT ON COLUMN public.seo_metadata.page_description IS
  'Public excerpt / page description — separate from meta_description.';
COMMENT ON COLUMN public.seo_metadata.related_keywords IS
  'Related keyword tags (JSON array). Not emitted as meta keywords.';

-- Optional page-level excerpt mirror for CMS pages (public display)
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS excerpt text;

COMMENT ON COLUMN public.pages.excerpt IS
  'Optional public page excerpt; may sync from seo_metadata.page_description.';

NOTIFY pgrst, 'reload schema';
