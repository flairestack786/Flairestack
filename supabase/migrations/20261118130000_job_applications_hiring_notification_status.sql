-- =============================================================================
-- FlaireStack — Track the hiring-team notification email per application
--
-- The Careers API now sends one notification to careers@flairestack.com after an
-- application is saved. These two columns record whether that email was sent so
-- the CMS can show failures instead of losing them in server logs.
--
-- Safe to apply before OR after deploying the app:
--   - The app updates these columns in a separate, error-tolerant statement.
--   - The admin detail page reads them in a separate, error-tolerant query.
--
-- Historical applications get 'not_sent' (they predate the notification).
-- No RLS change: the existing admin-only policies on job_applications apply to
-- the new columns (SELECT/UPDATE are table-level grants).
-- =============================================================================

BEGIN;

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS hiring_notification_status text NOT NULL DEFAULT 'not_sent',
  ADD COLUMN IF NOT EXISTS hiring_notification_error text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.job_applications.hiring_notification_status IS
  'Hiring-team notification email result: sent | failed | skipped | not_sent (historical).';

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Verification:
--   SELECT hiring_notification_status, count(*) FROM public.job_applications GROUP BY 1;
-- Rollback:
--   ALTER TABLE public.job_applications
--     DROP COLUMN IF EXISTS hiring_notification_status,
--     DROP COLUMN IF EXISTS hiring_notification_error;
