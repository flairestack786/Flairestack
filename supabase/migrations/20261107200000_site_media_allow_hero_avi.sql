-- =============================================================================
-- FlaireStack — allow AVI hero background videos in the public site-media bucket
--
-- Additive MIME update for homepage hero slideshow uploads.
-- Preserves existing image + video types (MP4, WebM, QuickTime) from
-- 20261025150000_site_media_allow_hero_video.sql.
--
-- Primary type: video/x-msvideo (IANA). Also allow video/avi (common OS/picker).
-- Idempotent. Does not weaken Storage RLS or modify existing media objects.
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
    'video/quicktime',
    'video/x-msvideo',
    'video/avi'
  ];
  existing_mimes text[];
  merged text[];
BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN
    RAISE NOTICE 'storage.buckets not present — skip site-media AVI MIME update';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'site-media') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'site-media',
      'site-media',
      true,
      104857600, -- 100 MiB (CMS validates videos at 80 MiB)
      next_mimes
    );
    RAISE NOTICE 'Created storage.buckets site-media with image+video (incl. AVI) MIME allowlist';
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

  RAISE NOTICE 'Updated site-media allowed_mime_types to include AVI hero videos';
END $$;
