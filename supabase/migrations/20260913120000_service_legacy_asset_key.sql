-- =============================================================================
-- Immutable catalog asset key for bundled service imagery.
-- Public `services.slug` is editable; `/images/services/{key}/` folders are not.
-- CMS `service_media` remains keyed by service_id and still wins when assigned.
-- =============================================================================

BEGIN;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS legacy_asset_key text;

ALTER TABLE public.services
  DROP CONSTRAINT IF EXISTS services_legacy_asset_key_format;

ALTER TABLE public.services
  ADD CONSTRAINT services_legacy_asset_key_format
  CHECK (
    legacy_asset_key IS NULL
    OR legacy_asset_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  );

CREATE UNIQUE INDEX IF NOT EXISTS services_legacy_asset_key_unique
  ON public.services (legacy_asset_key)
  WHERE legacy_asset_key IS NOT NULL;

COMMENT ON COLUMN public.services.legacy_asset_key IS
  'Immutable bundled-asset pack key (original catalog folder). Never follows services.slug.';

-- Stamp from the current slug when it is still a known catalog folder.
UPDATE public.services
SET legacy_asset_key = slug
WHERE legacy_asset_key IS NULL
  AND slug IN (
    'web-development',
    'software-development',
    'domain-hosting',
    'software-quality-assurance',
    'mobile-app-development',
    'it-consultancy',
    'database-development',
    'e-commerce-website-development',
    'cloud-strategy',
    'ai-development',
    'data-analytics',
    'business-process-services',
    'digital-marketing',
    'graphic-design',
    'ui-ux-design',
    'game-development'
  );

-- Recover already-renamed catalog rows by their original title.
UPDATE public.services AS s
SET legacy_asset_key = m.asset_key
FROM (
  VALUES
    ('web development', 'web-development'),
    ('software development', 'software-development'),
    ('domain hosting', 'domain-hosting'),
    ('software quality assurance', 'software-quality-assurance'),
    ('mobile app development', 'mobile-app-development'),
    ('it consultancy', 'it-consultancy'),
    ('database development', 'database-development'),
    ('e-commerce website development', 'e-commerce-website-development'),
    ('cloud strategy', 'cloud-strategy'),
    ('artificial intelligence development services', 'ai-development'),
    ('data & analytics', 'data-analytics'),
    ('data and analytics', 'data-analytics'),
    ('business process services', 'business-process-services'),
    ('digital marketing', 'digital-marketing'),
    ('graphic design', 'graphic-design'),
    ('ui/ux design services', 'ui-ux-design'),
    ('ui ux design services', 'ui-ux-design'),
    ('game development services', 'game-development')
) AS m(title_key, asset_key)
WHERE s.legacy_asset_key IS NULL
  AND lower(trim(s.title)) = m.title_key
  AND NOT EXISTS (
    SELECT 1
    FROM public.services other
    WHERE other.legacy_asset_key = m.asset_key
      AND other.id <> s.id
  );

CREATE OR REPLACE FUNCTION public.protect_services_legacy_asset_key()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.legacy_asset_key IS NULL AND NEW.slug IN (
      'web-development',
      'software-development',
      'domain-hosting',
      'software-quality-assurance',
      'mobile-app-development',
      'it-consultancy',
      'database-development',
      'e-commerce-website-development',
      'cloud-strategy',
      'ai-development',
      'data-analytics',
      'business-process-services',
      'digital-marketing',
      'graphic-design',
      'ui-ux-design',
      'game-development'
    ) THEN
      NEW.legacy_asset_key := NEW.slug;
    END IF;
    RETURN NEW;
  END IF;

  IF OLD.legacy_asset_key IS NOT NULL THEN
    NEW.legacy_asset_key := OLD.legacy_asset_key;
  ELSIF NEW.legacy_asset_key IS NULL AND NEW.slug IN (
    'web-development',
    'software-development',
    'domain-hosting',
    'software-quality-assurance',
    'mobile-app-development',
    'it-consultancy',
    'database-development',
    'e-commerce-website-development',
    'cloud-strategy',
    'ai-development',
    'data-analytics',
    'business-process-services',
    'digital-marketing',
    'graphic-design',
    'ui-ux-design',
    'game-development'
  ) THEN
    NEW.legacy_asset_key := NEW.slug;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS services_protect_legacy_asset_key ON public.services;

CREATE TRIGGER services_protect_legacy_asset_key
  BEFORE INSERT OR UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_services_legacy_asset_key();

COMMIT;
