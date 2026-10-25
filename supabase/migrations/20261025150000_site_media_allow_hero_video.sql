-- =============================================================================
-- FlaireStack — allow hero background videos in the public site-media bucket
--
-- Root cause of CMS error "mime type video/mp4 is not supported":
-- the site-media bucket was created with an image-only allowed_mime_types list.
-- Hero slideshow needs video/mp4 and video/webm in addition to existing images.
--
-- Idempotent. Does not weaken Storage RLS policies (insert/update/delete remain
-- authenticated CMS-only; public retains read of public objects).
-- =============================================================================

DO $$
DECLARE
  next_mimes text[] := ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'image/avif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];
  existing_mimes text[];
  merged text[];
BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN
    RAISE NOTICE 'storage.buckets not present — skip site-media MIME update';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'site-media') THEN
    -- Create a public media bucket with image + hero video types if missing.
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'site-media',
      'site-media',
      true,
      104857600, -- 100 MiB (CMS validates videos at 80 MiB)
      next_mimes
    );
    RAISE NOTICE 'Created storage.buckets site-media with image+video MIME allowlist';
    RETURN;
  END IF;

  SELECT allowed_mime_types INTO existing_mimes
  FROM storage.buckets
  WHERE id = 'site-media';

  -- NULL allowlist already accepts all MIME types — leave it.
  IF existing_mimes IS NULL THEN
    UPDATE storage.buckets
    SET file_size_limit = GREATEST(COALESCE(file_size_limit, 0), 104857600)
    WHERE id = 'site-media'
      AND (file_size_limit IS NULL OR file_size_limit < 104857600);
    RAISE NOTICE 'site-media already allows all MIME types; ensured file_size_limit >= 100MiB';
    RETURN;
  END IF;

  SELECT ARRAY(
    SELECT DISTINCT mime
    FROM unnest(existing_mimes || next_mimes) AS mime
    ORDER BY 1
  ) INTO merged;

  UPDATE storage.buckets
  SET
    allowed_mime_types = merged,
    file_size_limit = GREATEST(COALESCE(file_size_limit, 0), 104857600)
  WHERE id = 'site-media';

  RAISE NOTICE 'Updated site-media allowed_mime_types to include hero videos';
END $$;
