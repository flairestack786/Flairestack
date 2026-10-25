-- =============================================================================
-- FlaireStack CMS — Home hero slideshow (video + image slides)
-- Idempotent: safe to re-apply. Preserves existing page_sections.hero as fallback.
-- Does NOT delete or mutate legacy hero section fields.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.home_hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_label text NOT NULL DEFAULT '',
  media_type text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video')),
  media_path text,
  poster_path text,
  media_alt text,
  eyebrow text,
  title text NOT NULL DEFAULT '',
  title_accent text,
  intro text,
  body text,
  cta_primary_label text,
  cta_primary_url text,
  cta_secondary_label text,
  cta_secondary_url text,
  sort_order integer NOT NULL DEFAULT 0
    CHECK (sort_order >= 0),
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT home_hero_slides_title_not_blank
    CHECK (length(trim(title)) > 0 OR is_enabled = false)
);

COMMENT ON TABLE public.home_hero_slides IS
  'CMS-managed homepage hero slideshow. Public reads only enabled rows; editors manage via can_manage_content().';

CREATE INDEX IF NOT EXISTS home_hero_slides_enabled_sort_idx
  ON public.home_hero_slides (sort_order ASC)
  WHERE is_enabled = true;

CREATE INDEX IF NOT EXISTS home_hero_slides_sort_idx
  ON public.home_hero_slides (sort_order ASC);

DROP TRIGGER IF EXISTS home_hero_slides_set_updated_at ON public.home_hero_slides;
CREATE TRIGGER home_hero_slides_set_updated_at
  BEFORE UPDATE ON public.home_hero_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Grants + RLS
-- -----------------------------------------------------------------------------

GRANT SELECT ON TABLE public.home_hero_slides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.home_hero_slides TO authenticated;

ALTER TABLE public.home_hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS home_hero_slides_public_read ON public.home_hero_slides;
CREATE POLICY home_hero_slides_public_read
  ON public.home_hero_slides
  FOR SELECT
  TO anon, authenticated
  USING (is_enabled = true);

DROP POLICY IF EXISTS home_hero_slides_cms_read ON public.home_hero_slides;
CREATE POLICY home_hero_slides_cms_read
  ON public.home_hero_slides
  FOR SELECT
  TO authenticated
  USING (public.can_manage_content());

DROP POLICY IF EXISTS home_hero_slides_cms_insert ON public.home_hero_slides;
CREATE POLICY home_hero_slides_cms_insert
  ON public.home_hero_slides
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_content());

DROP POLICY IF EXISTS home_hero_slides_cms_update ON public.home_hero_slides;
CREATE POLICY home_hero_slides_cms_update
  ON public.home_hero_slides
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_content())
  WITH CHECK (public.can_manage_content());

DROP POLICY IF EXISTS home_hero_slides_cms_delete ON public.home_hero_slides;
CREATE POLICY home_hero_slides_cms_delete
  ON public.home_hero_slides
  FOR DELETE
  TO authenticated
  USING (public.can_manage_content());

-- -----------------------------------------------------------------------------
-- Seed slide 1 from existing home hero section (exact CMS wording).
-- Chicago skyline video was NOT verified in-repo — media_path left null with a
-- clearly labeled CMS media-selection placeholder. Legacy hero section remains.
-- Idempotent: only seeds when the table has zero rows.
-- -----------------------------------------------------------------------------

INSERT INTO public.home_hero_slides (
  admin_label,
  media_type,
  media_path,
  poster_path,
  media_alt,
  eyebrow,
  title,
  title_accent,
  intro,
  body,
  cta_primary_label,
  cta_primary_url,
  cta_secondary_label,
  cta_secondary_url,
  sort_order,
  is_enabled
)
SELECT
  'Slide 1 — Chicago skyline (SELECT MEDIA: upload verified Chicago skyline MP4)',
  'video',
  NULL,
  NULL,
  NULL,
  NULL,
  COALESCE(NULLIF(trim(ps.title), ''), 'Building intelligent'),
  COALESCE(NULLIF(trim(ps.title_accent), ''), 'digital experiences'),
  COALESCE(NULLIF(trim(ps.intro), ''), 'for the future.'),
  COALESCE(
    NULLIF(trim(ps.body), ''),
    'FlaireStack delivers elite software engineering, AI solutions, cloud systems, and modern digital products designed to scale businesses globally.'
  ),
  COALESCE(NULLIF(trim(ps.cta_primary_label), ''), 'Book Consultation'),
  COALESCE(NULLIF(trim(ps.cta_primary_url), ''), '#contact'),
  NULLIF(trim(ps.cta_secondary_label), ''),
  NULLIF(trim(ps.cta_secondary_url), ''),
  0,
  true
FROM public.pages p
LEFT JOIN public.page_sections ps
  ON ps.page_id = p.id
 AND ps.section_key = 'hero'
WHERE p.slug = 'home'
  AND NOT EXISTS (SELECT 1 FROM public.home_hero_slides LIMIT 1);

-- Fallback seed if home page row is missing (dev / empty DB)
INSERT INTO public.home_hero_slides (
  admin_label,
  media_type,
  media_path,
  title,
  title_accent,
  intro,
  body,
  cta_primary_label,
  cta_primary_url,
  sort_order,
  is_enabled
)
SELECT
  'Slide 1 — Chicago skyline (SELECT MEDIA: upload verified Chicago skyline MP4)',
  'video',
  NULL,
  'Building intelligent',
  'digital experiences',
  'for the future.',
  'FlaireStack delivers elite software engineering, AI solutions, cloud systems, and modern digital products designed to scale businesses globally.',
  'Book Consultation',
  '#contact',
  0,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.home_hero_slides LIMIT 1);

NOTIFY pgrst, 'reload schema';
