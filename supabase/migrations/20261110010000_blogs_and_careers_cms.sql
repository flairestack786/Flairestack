-- =============================================================================
-- FlaireStack CMS — Blogs + Careers modules
--
-- Blogs: administrators + editors (can_manage_content)
-- Careers: administrators only (is_admin)
-- Public: published blogs; published jobs that are not past closing_date
--
-- Do not apply automatically. Run this migration in the Supabase SQL Editor
-- (or via supabase db push) before deploying the app that depends on these tables.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'job_posting_status'
  ) THEN
    CREATE TYPE public.job_posting_status AS ENUM ('draft', 'published', 'closed');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'employment_type'
  ) THEN
    CREATE TYPE public.employment_type AS ENUM (
      'full_time',
      'part_time',
      'contract',
      'internship'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'work_arrangement'
  ) THEN
    CREATE TYPE public.work_arrangement AS ENUM ('on_site', 'hybrid', 'remote');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- blog_posts
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  slug text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  featured_image_path text,
  author_name text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}'::text[],
  seo_title text,
  meta_description text,
  og_image_path text,
  canonical_url text,
  status public.content_status NOT NULL DEFAULT 'draft',
  is_featured boolean NOT NULL DEFAULT false,
  reading_time_minutes integer NOT NULL DEFAULT 1
    CHECK (reading_time_minutes >= 1 AND reading_time_minutes <= 120),
  published_at timestamptz,
  created_by uuid REFERENCES auth.users (id),
  updated_by uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT blog_posts_published_at_check
    CHECK (
      (status = 'published' AND published_at IS NOT NULL)
      OR (status <> 'published')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_unique
  ON public.blog_posts (slug);

CREATE INDEX IF NOT EXISTS blog_posts_status_published_idx
  ON public.blog_posts (status, published_at DESC);

CREATE INDEX IF NOT EXISTS blog_posts_featured_idx
  ON public.blog_posts (is_featured, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS blog_posts_category_idx
  ON public.blog_posts (category)
  WHERE status = 'published';

DROP TRIGGER IF EXISTS blog_posts_set_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- job_postings
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  slug text NOT NULL,
  department text NOT NULL DEFAULT '',
  employment_type public.employment_type NOT NULL DEFAULT 'full_time',
  work_arrangement public.work_arrangement NOT NULL DEFAULT 'remote',
  location text NOT NULL DEFAULT '',
  short_description text NOT NULL DEFAULT '',
  description_html text NOT NULL DEFAULT '',
  responsibilities_html text NOT NULL DEFAULT '',
  qualifications_html text NOT NULL DEFAULT '',
  application_instructions text NOT NULL DEFAULT '',
  application_email text,
  application_url text,
  status public.job_posting_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  closing_date date,
  created_by uuid REFERENCES auth.users (id),
  updated_by uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_postings_slug_format
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CONSTRAINT job_postings_published_at_check
    CHECK (
      (status = 'published' AND published_at IS NOT NULL)
      OR (status <> 'published')
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS job_postings_slug_unique
  ON public.job_postings (slug);

CREATE INDEX IF NOT EXISTS job_postings_status_published_idx
  ON public.job_postings (status, published_at DESC);

CREATE INDEX IF NOT EXISTS job_postings_active_public_idx
  ON public.job_postings (status, closing_date)
  WHERE status = 'published';

DROP TRIGGER IF EXISTS job_postings_set_updated_at ON public.job_postings;
CREATE TRIGGER job_postings_set_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Grants + RLS — blog_posts (admin + editor)
-- -----------------------------------------------------------------------------

GRANT SELECT ON TABLE public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.blog_posts TO authenticated;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_posts_public_read ON public.blog_posts;
CREATE POLICY blog_posts_public_read
  ON public.blog_posts
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS blog_posts_cms_read ON public.blog_posts;
CREATE POLICY blog_posts_cms_read
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (public.can_manage_content());

DROP POLICY IF EXISTS blog_posts_cms_insert ON public.blog_posts;
CREATE POLICY blog_posts_cms_insert
  ON public.blog_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_content());

DROP POLICY IF EXISTS blog_posts_cms_update ON public.blog_posts;
CREATE POLICY blog_posts_cms_update
  ON public.blog_posts
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

DROP POLICY IF EXISTS blog_posts_cms_delete ON public.blog_posts;
CREATE POLICY blog_posts_cms_delete
  ON public.blog_posts
  FOR DELETE
  TO authenticated
  USING (public.can_manage_content());

-- -----------------------------------------------------------------------------
-- Grants + RLS — job_postings (administrator only)
-- -----------------------------------------------------------------------------

GRANT SELECT ON TABLE public.job_postings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.job_postings TO authenticated;

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_postings_public_read ON public.job_postings;
CREATE POLICY job_postings_public_read
  ON public.job_postings
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'published'
    AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)
  );

DROP POLICY IF EXISTS job_postings_admin_read ON public.job_postings;
CREATE POLICY job_postings_admin_read
  ON public.job_postings
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS job_postings_admin_insert ON public.job_postings;
CREATE POLICY job_postings_admin_insert
  ON public.job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS job_postings_admin_update ON public.job_postings;
CREATE POLICY job_postings_admin_update
  ON public.job_postings
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS job_postings_admin_delete ON public.job_postings;
CREATE POLICY job_postings_admin_delete
  ON public.job_postings
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
