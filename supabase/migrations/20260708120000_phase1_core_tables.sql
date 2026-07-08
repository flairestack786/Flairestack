-- =============================================================================
-- FlaireStack CMS — Phase 1 Core Tables
-- Compatible with Supabase (PostgreSQL 15+)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

CREATE TYPE public.content_status AS ENUM (
  'draft',
  'published',
  'archived'
);

CREATE TYPE public.entity_type AS ENUM (
  'page',
  'service'
);

CREATE TYPE public.media_category AS ENUM (
  'hero',
  'service',
  'team',
  'partner',
  'general'
);

CREATE TYPE public.service_media_slot AS ENUM (
  'hero',
  'overview',
  'banner',
  'features',
  'tech',
  'process',
  'benefits',
  'cta',
  'framework1',
  'framework2',
  'framework3',
  'framework4',
  'framework5',
  'client_benefits',
  'implementation_approach',
  'business_outcomes'
);

-- -----------------------------------------------------------------------------
-- Utility: auto-update updated_at
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
-- site_settings
-- Singleton site-wide configuration (contact info, branding, social links).
-- -----------------------------------------------------------------------------

CREATE TABLE public.site_settings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        text NOT NULL,
  company_tagline     text,
  company_description text,
  company_email       text NOT NULL,
  phone_display       text NOT NULL,
  phone_tel           text NOT NULL,
  location_primary    text,
  location_secondary  text,
  copyright_template  text,
  loader_brand_text   text,
  social_links        jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active           boolean NOT NULL DEFAULT true,
  status              public.content_status NOT NULL DEFAULT 'draft',
  published_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  updated_by          uuid REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT site_settings_social_links_is_array
    CHECK (jsonb_typeof(social_links) = 'array'),

  CONSTRAINT site_settings_published_at_when_published
    CHECK (
      status <> 'published'
      OR published_at IS NOT NULL
    )
);

COMMENT ON TABLE public.site_settings IS
  'Site-wide configuration singleton (contact, branding, social).';

CREATE UNIQUE INDEX site_settings_single_active_idx
  ON public.site_settings (is_active)
  WHERE is_active = true;

CREATE INDEX site_settings_status_idx
  ON public.site_settings (status);

CREATE TRIGGER site_settings_set_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- media_assets
-- Central media registry; files live in Supabase Storage buckets.
-- -----------------------------------------------------------------------------

CREATE TABLE public.media_assets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_bucket   text NOT NULL,
  storage_path     text NOT NULL,
  public_url       text,
  filename         text NOT NULL,
  mime_type        text NOT NULL,
  file_size_bytes  bigint,
  width            integer,
  height           integer,
  alt_text         text NOT NULL DEFAULT '',
  title            text,
  category         public.media_category NOT NULL DEFAULT 'general',
  focal_point      text,
  source_type      text,
  source_id        text,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active        boolean NOT NULL DEFAULT true,
  uploaded_by      uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT media_assets_storage_path_unique
    UNIQUE (storage_bucket, storage_path),

  CONSTRAINT media_assets_file_size_non_negative
    CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),

  CONSTRAINT media_assets_dimensions_non_negative
    CHECK (
      (width IS NULL OR width >= 0)
      AND (height IS NULL OR height >= 0)
    ),

  CONSTRAINT media_assets_metadata_is_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.media_assets IS
  'Metadata for files stored in Supabase Storage; referenced by pages and services.';

CREATE INDEX media_assets_category_created_at_idx
  ON public.media_assets (category, created_at DESC);

CREATE INDEX media_assets_is_active_idx
  ON public.media_assets (is_active)
  WHERE is_active = true;

CREATE TRIGGER media_assets_set_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- pages
-- Top-level CMS pages (home, about).
-- -----------------------------------------------------------------------------

CREATE TABLE public.pages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text NOT NULL,
  title        text NOT NULL,
  route_path   text NOT NULL,
  status       public.content_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   uuid REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT pages_slug_unique
    UNIQUE (slug),

  CONSTRAINT pages_route_path_unique
    UNIQUE (route_path),

  CONSTRAINT pages_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  CONSTRAINT pages_route_path_format
    CHECK (route_path ~ '^/[a-z0-9\-/]*$'),

  CONSTRAINT pages_published_at_when_published
    CHECK (
      status <> 'published'
      OR published_at IS NOT NULL
    )
);

COMMENT ON TABLE public.pages IS
  'CMS pages (e.g. home, about); parent for page_sections and SEO.';

CREATE INDEX pages_status_idx
  ON public.pages (status);

CREATE INDEX pages_published_idx
  ON public.pages (slug)
  WHERE status = 'published';

CREATE TRIGGER pages_set_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- page_sections
-- Ordered content sections within a page (hero, services header, etc.).
-- -----------------------------------------------------------------------------

CREATE TABLE public.page_sections (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id              uuid NOT NULL REFERENCES public.pages (id) ON DELETE CASCADE,
  section_key          text NOT NULL,
  eyebrow              text,
  title                text,
  title_accent         text,
  intro                text,
  body                 text,
  cta_primary_label    text,
  cta_primary_url      text,
  cta_secondary_label  text,
  cta_secondary_url    text,
  media_id             uuid REFERENCES public.media_assets (id) ON DELETE SET NULL,
  secondary_media_id   uuid REFERENCES public.media_assets (id) ON DELETE SET NULL,
  icon_name            text,
  config               jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order           integer NOT NULL DEFAULT 0,
  is_enabled           boolean NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT page_sections_page_section_key_unique
    UNIQUE (page_id, section_key),

  CONSTRAINT page_sections_config_is_object
    CHECK (jsonb_typeof(config) = 'object'),

  CONSTRAINT page_sections_sort_order_non_negative
    CHECK (sort_order >= 0)
);

COMMENT ON TABLE public.page_sections IS
  'Section-level content blocks for a page (hero, stats header, CTA, etc.).';

CREATE INDEX page_sections_page_id_sort_order_idx
  ON public.page_sections (page_id, sort_order);

CREATE INDEX page_sections_page_id_enabled_idx
  ON public.page_sections (page_id, is_enabled)
  WHERE is_enabled = true;

CREATE TRIGGER page_sections_set_updated_at
  BEFORE UPDATE ON public.page_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- services
-- Core service entities (16 public service detail pages + home grid).
-- -----------------------------------------------------------------------------

CREATE TABLE public.services (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text NOT NULL,
  title              text NOT NULL,
  short_description  text NOT NULL,
  description        text NOT NULL,
  icon_name          text,
  sort_order         integer NOT NULL DEFAULT 0,
  status             public.content_status NOT NULL DEFAULT 'draft',
  published_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  updated_by         uuid REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT services_slug_unique
    UNIQUE (slug),

  CONSTRAINT services_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),

  CONSTRAINT services_sort_order_non_negative
    CHECK (sort_order >= 0),

  CONSTRAINT services_published_at_when_published
    CHECK (
      status <> 'published'
      OR published_at IS NOT NULL
    )
);

COMMENT ON TABLE public.services IS
  'Service catalog entries; each maps to /services/:slug.';

CREATE INDEX services_status_sort_order_idx
  ON public.services (status, sort_order);

CREATE INDEX services_published_idx
  ON public.services (slug)
  WHERE status = 'published';

CREATE TRIGGER services_set_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- service_sections
-- Section headers and overrides per service page.
-- -----------------------------------------------------------------------------

CREATE TABLE public.service_sections (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id            uuid NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  section_key           text NOT NULL,
  eyebrow               text,
  title                 text,
  intro                 text,
  body                  text,
  cta_label             text,
  cta_url               text,
  secondary_cta_label   text,
  secondary_cta_url     text,
  use_global_template   boolean NOT NULL DEFAULT false,
  global_template_key   text,
  config                jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_enabled            boolean NOT NULL DEFAULT true,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT service_sections_service_section_key_unique
    UNIQUE (service_id, section_key),

  CONSTRAINT service_sections_config_is_object
    CHECK (jsonb_typeof(config) = 'object'),

  CONSTRAINT service_sections_global_template_key_when_used
    CHECK (
      use_global_template = false
      OR global_template_key IS NOT NULL
    )
);

COMMENT ON TABLE public.service_sections IS
  'Per-service section configuration (challenges, framework, FAQ header, etc.).';

CREATE INDEX service_sections_service_id_idx
  ON public.service_sections (service_id);

CREATE INDEX service_sections_service_id_enabled_idx
  ON public.service_sections (service_id, is_enabled)
  WHERE is_enabled = true;

CREATE TRIGGER service_sections_set_updated_at
  BEFORE UPDATE ON public.service_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- service_media
-- Slot-based image assignments per service (hero, framework1, etc.).
-- -----------------------------------------------------------------------------

CREATE TABLE public.service_media (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    uuid NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  slot          public.service_media_slot NOT NULL,
  media_id      uuid NOT NULL REFERENCES public.media_assets (id) ON DELETE RESTRICT,
  alt_override  text,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT service_media_service_slot_unique
    UNIQUE (service_id, slot),

  CONSTRAINT service_media_sort_order_non_negative
    CHECK (sort_order >= 0)
);

COMMENT ON TABLE public.service_media IS
  'Maps each service image slot to a media_assets row.';

CREATE INDEX service_media_service_id_idx
  ON public.service_media (service_id);

CREATE INDEX service_media_media_id_idx
  ON public.service_media (media_id);

CREATE TRIGGER service_media_set_updated_at
  BEFORE UPDATE ON public.service_media
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- seo_metadata
-- 1:1 SEO records for pages and services.
-- Uses nullable FK columns for referential integrity (polymorphic pattern).
-- -----------------------------------------------------------------------------

CREATE TABLE public.seo_metadata (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type         public.entity_type NOT NULL,
  page_id             uuid REFERENCES public.pages (id) ON DELETE CASCADE,
  service_id          uuid REFERENCES public.services (id) ON DELETE CASCADE,
  meta_title          text,
  meta_description    text,
  canonical_url       text,
  robots              text NOT NULL DEFAULT 'index,follow',
  og_title            text,
  og_description      text,
  og_image_id         uuid REFERENCES public.media_assets (id) ON DELETE SET NULL,
  og_type             text NOT NULL DEFAULT 'website',
  twitter_card        text NOT NULL DEFAULT 'summary_large_image',
  twitter_title       text,
  twitter_description text,
  twitter_image_id    uuid REFERENCES public.media_assets (id) ON DELETE SET NULL,
  structured_data     jsonb NOT NULL DEFAULT '{}'::jsonb,
  status              public.content_status NOT NULL DEFAULT 'draft',
  published_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT seo_metadata_entity_xor
    CHECK (
      (
        entity_type = 'page'
        AND page_id IS NOT NULL
        AND service_id IS NULL
      )
      OR (
        entity_type = 'service'
        AND service_id IS NOT NULL
        AND page_id IS NULL
      )
    ),

  CONSTRAINT seo_metadata_structured_data_is_object
    CHECK (jsonb_typeof(structured_data) = 'object'),

  CONSTRAINT seo_metadata_published_at_when_published
    CHECK (
      status <> 'published'
      OR published_at IS NOT NULL
    )
);

COMMENT ON TABLE public.seo_metadata IS
  'SEO and social metadata; exactly one row per page or service.';

CREATE UNIQUE INDEX seo_metadata_page_id_unique_idx
  ON public.seo_metadata (page_id)
  WHERE page_id IS NOT NULL;

CREATE UNIQUE INDEX seo_metadata_service_id_unique_idx
  ON public.seo_metadata (service_id)
  WHERE service_id IS NOT NULL;

CREATE INDEX seo_metadata_entity_type_status_idx
  ON public.seo_metadata (entity_type, status);

CREATE TRIGGER seo_metadata_set_updated_at
  BEFORE UPDATE ON public.seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
