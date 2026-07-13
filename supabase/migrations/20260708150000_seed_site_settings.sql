-- =============================================================================
-- FlaireStack CMS — seed site_settings singleton
-- Backfills the default row when the table exists but is empty.
-- =============================================================================

-- Enforce at most one site_settings row.
CREATE UNIQUE INDEX IF NOT EXISTS site_settings_singleton_idx
  ON public.site_settings ((true));

INSERT INTO public.site_settings (
  company_name,
  tagline,
  email,
  phone,
  address,
  facebook_url,
  instagram_url,
  linkedin_url,
  timezone,
  copyright_text,
  default_meta_title,
  default_meta_description,
  default_keywords,
  business_hours
)
SELECT
  'FlaireStack LLC',
  'AI, cloud, and software — built for scale',
  'info@flairestack.com',
  '+1 (234) 567-890',
  'Chicago, IL — Serving clients worldwide',
  'https://facebook.com',
  'https://instagram.com',
  'https://linkedin.com',
  'America/Chicago',
  '© FlaireStack LLC. All rights reserved.',
  'FlaireStack | AI-First Software Development Studio',
  'FlaireStack is an AI-first software development studio delivering custom applications, cloud-native platforms, and intelligent automation with the latest technologies — from LLMs and modern frameworks to secure, scalable infrastructure.',
  'software development, AI, cloud, web development, mobile apps, enterprise software, Chicago',
  'Monday–Friday, 9:00 AM – 6:00 PM CT'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.site_settings
);
