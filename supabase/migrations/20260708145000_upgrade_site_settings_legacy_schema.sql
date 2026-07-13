-- =============================================================================
-- FlaireStack CMS — upgrade legacy site_settings to final CMS schema
-- Safe for databases created from the original Phase 1 site_settings shape.
-- Does not drop or recreate the table; preserves and migrates existing row data.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Prerequisites (safe if Phase 1 already created these)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Detect legacy schema (original Phase 1 column names)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  has_legacy boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'site_settings'
      AND column_name = 'company_tagline'
  )
  INTO has_legacy;

  IF NOT has_legacy THEN
    RAISE NOTICE 'site_settings: current schema detected — skipping legacy data migration.';
    RETURN;
  END IF;

  RAISE NOTICE 'site_settings: legacy schema detected — migrating row data.';
END $$;

-- -----------------------------------------------------------------------------
-- Helper: extract a social URL from legacy social_links jsonb
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.site_settings_extract_social_url(
  links jsonb,
  needle text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (
    SELECT NULLIF(trim(COALESCE(link->>'url', link->>'href', '')), '')
    FROM jsonb_array_elements(COALESCE(links, '[]'::jsonb)) AS link
    WHERE lower(COALESCE(link->>'platform', link->>'label', link->>'name', '')) LIKE '%' || lower(needle) || '%'
       OR lower(COALESCE(link->>'url', link->>'href', '')) LIKE '%' || lower(needle) || '%'
    LIMIT 1
  );
$$;

-- -----------------------------------------------------------------------------
-- Add final CMS columns (idempotent)
-- -----------------------------------------------------------------------------

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS tagline                  text,
  ADD COLUMN IF NOT EXISTS logo_url                 text,
  ADD COLUMN IF NOT EXISTS favicon_url              text,
  ADD COLUMN IF NOT EXISTS phone                    text,
  ADD COLUMN IF NOT EXISTS email                    text,
  ADD COLUMN IF NOT EXISTS address                  text,
  ADD COLUMN IF NOT EXISTS google_maps_url          text,
  ADD COLUMN IF NOT EXISTS facebook_url             text,
  ADD COLUMN IF NOT EXISTS instagram_url            text,
  ADD COLUMN IF NOT EXISTS linkedin_url             text,
  ADD COLUMN IF NOT EXISTS x_url                    text,
  ADD COLUMN IF NOT EXISTS youtube_url              text,
  ADD COLUMN IF NOT EXISTS github_url               text,
  ADD COLUMN IF NOT EXISTS business_hours           text,
  ADD COLUMN IF NOT EXISTS timezone                 text DEFAULT 'America/Chicago',
  ADD COLUMN IF NOT EXISTS copyright_text           text,
  ADD COLUMN IF NOT EXISTS default_meta_title       text,
  ADD COLUMN IF NOT EXISTS default_meta_description text,
  ADD COLUMN IF NOT EXISTS default_keywords         text,
  ADD COLUMN IF NOT EXISTS default_og_image         text,
  ADD COLUMN IF NOT EXISTS google_analytics_id      text,
  ADD COLUMN IF NOT EXISTS google_tag_manager_id    text,
  ADD COLUMN IF NOT EXISTS meta_pixel_id            text,
  ADD COLUMN IF NOT EXISTS microsoft_clarity_id     text;

-- -----------------------------------------------------------------------------
-- Migrate legacy column values into the final CMS columns
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'site_settings'
      AND column_name = 'company_tagline'
  ) THEN
    RETURN;
  END IF;

  UPDATE public.site_settings
  SET
    tagline = COALESCE(tagline, company_tagline),
    email = COALESCE(email, company_email),
    phone = COALESCE(phone, phone_display, phone_tel),
    address = COALESCE(
      address,
      NULLIF(
        trim(concat_ws(E'\n', location_primary, location_secondary)),
        ''
      )
    ),
    copyright_text = COALESCE(copyright_text, copyright_template),
    default_meta_description = COALESCE(default_meta_description, company_description),
    default_meta_title = COALESCE(default_meta_title, company_name),
    facebook_url = COALESCE(
      facebook_url,
      public.site_settings_extract_social_url(social_links, 'facebook')
    ),
    instagram_url = COALESCE(
      instagram_url,
      public.site_settings_extract_social_url(social_links, 'instagram')
    ),
    linkedin_url = COALESCE(
      linkedin_url,
      public.site_settings_extract_social_url(social_links, 'linkedin')
    ),
    x_url = COALESCE(
      x_url,
      public.site_settings_extract_social_url(social_links, 'twitter'),
      public.site_settings_extract_social_url(social_links, 'x')
    ),
    youtube_url = COALESCE(
      youtube_url,
      public.site_settings_extract_social_url(social_links, 'youtube')
    ),
    github_url = COALESCE(
      github_url,
      public.site_settings_extract_social_url(social_links, 'github')
    ),
    timezone = COALESCE(NULLIF(btrim(timezone), ''), 'America/Chicago');
END $$;

-- Ensure timezone is populated before NOT NULL enforcement.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'site_settings'
      AND column_name = 'timezone'
  ) THEN
    UPDATE public.site_settings
    SET timezone = 'America/Chicago'
    WHERE timezone IS NULL OR btrim(timezone) = '';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Drop legacy constraints, indexes, and columns
-- -----------------------------------------------------------------------------

ALTER TABLE public.site_settings
  DROP CONSTRAINT IF EXISTS site_settings_social_links_is_array,
  DROP CONSTRAINT IF EXISTS site_settings_published_at_when_published;

-- Drop updated_by FK by column name (constraint name may vary across environments).
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT c.conname
  INTO fk_name
  FROM pg_constraint c
  JOIN pg_attribute a
    ON a.attrelid = c.conrelid
   AND a.attnum = ANY (c.conkey)
  WHERE c.conrelid = 'public.site_settings'::regclass
    AND c.contype = 'f'
    AND a.attname = 'updated_by'
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.site_settings DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

DROP INDEX IF EXISTS public.site_settings_single_active_idx;
DROP INDEX IF EXISTS public.site_settings_status_idx;

ALTER TABLE public.site_settings
  DROP COLUMN IF EXISTS company_tagline,
  DROP COLUMN IF EXISTS company_description,
  DROP COLUMN IF EXISTS company_email,
  DROP COLUMN IF EXISTS phone_display,
  DROP COLUMN IF EXISTS phone_tel,
  DROP COLUMN IF EXISTS location_primary,
  DROP COLUMN IF EXISTS location_secondary,
  DROP COLUMN IF EXISTS copyright_template,
  DROP COLUMN IF EXISTS loader_brand_text,
  DROP COLUMN IF EXISTS social_links,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS published_at,
  DROP COLUMN IF EXISTS updated_by;

-- -----------------------------------------------------------------------------
-- Final constraints, defaults, and metadata
-- -----------------------------------------------------------------------------

ALTER TABLE public.site_settings
  ALTER COLUMN timezone SET DEFAULT 'America/Chicago';

-- Normalize blank emails before adding the format constraint.
UPDATE public.site_settings
SET email = NULLIF(btrim(email), '')
WHERE email IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'site_settings'
      AND column_name = 'timezone'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.site_settings
      ALTER COLUMN timezone SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'site_settings_email_format'
      AND conrelid = 'public.site_settings'::regclass
  ) THEN
    ALTER TABLE public.site_settings
      ADD CONSTRAINT site_settings_email_format
      CHECK (email IS NULL OR email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'site_settings_timezone_not_blank'
      AND conrelid = 'public.site_settings'::regclass
  ) THEN
    ALTER TABLE public.site_settings
      ADD CONSTRAINT site_settings_timezone_not_blank
      CHECK (btrim(timezone) <> '');
  END IF;
END $$;

COMMENT ON TABLE public.site_settings IS
  'Global site configuration: branding, contact, social, SEO defaults, and analytics IDs.';

COMMENT ON COLUMN public.site_settings.business_hours IS
  'Human-readable business hours (e.g. Monday–Friday, 9:00 AM – 6:00 PM CT).';

COMMENT ON COLUMN public.site_settings.default_keywords IS
  'Comma-separated default SEO keywords for pages without explicit keywords.';

-- -----------------------------------------------------------------------------
-- Admin helper, trigger, RLS (idempotent)
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

DROP TRIGGER IF EXISTS site_settings_set_updated_at ON public.site_settings;

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'site_settings_public_read'
  ) THEN
    CREATE POLICY site_settings_public_read
      ON public.site_settings
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'site_settings_admin_insert'
  ) THEN
    CREATE POLICY site_settings_admin_insert
      ON public.site_settings
      FOR INSERT
      TO authenticated
      WITH CHECK (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'site_settings'
      AND policyname = 'site_settings_admin_update'
  ) THEN
    CREATE POLICY site_settings_admin_update
      ON public.site_settings
      FOR UPDATE
      TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
  END IF;
END $$;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.site_settings TO authenticated;

-- Migration-only helper; not needed after social_links extraction.
DROP FUNCTION IF EXISTS public.site_settings_extract_social_url(jsonb, text);
