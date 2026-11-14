-- =============================================================================
-- FlaireStack — Job applications + private resume storage
--
-- Applications are confidential. Public submission goes through a server-side
-- API using the service role. Only administrators can read/manage rows.
--
-- Do not apply automatically. Run in the Supabase SQL Editor (or via
-- supabase db push) before deploying the app that depends on these objects.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'job_application_status'
  ) THEN
    CREATE TYPE public.job_application_status AS ENUM (
      'new',
      'under_review',
      'shortlisted',
      'interview',
      'rejected',
      'hired'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- job_applications
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id uuid NOT NULL REFERENCES public.job_postings (id) ON DELETE RESTRICT,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  current_job_title text NOT NULL DEFAULT '',
  current_company text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  years_experience text NOT NULL DEFAULT '',
  notice_period text NOT NULL DEFAULT '',
  cover_letter text NOT NULL DEFAULT '',
  profile_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  resume_storage_path text NOT NULL,
  resume_original_filename text NOT NULL,
  resume_mime_type text NOT NULL,
  resume_size integer NOT NULL
    CHECK (resume_size > 0 AND resume_size <= 5242880),
  application_status public.job_application_status NOT NULL DEFAULT 'new',
  internal_notes text NOT NULL DEFAULT '',
  confirmation_email_status text NOT NULL DEFAULT 'pending',
  confirmation_email_error text NOT NULL DEFAULT '',
  source_ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_applications_email_format
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  CONSTRAINT job_applications_profile_links_is_array
    CHECK (jsonb_typeof(profile_links) = 'array')
);

CREATE INDEX IF NOT EXISTS job_applications_job_created_idx
  ON public.job_applications (job_posting_id, created_at DESC);

CREATE INDEX IF NOT EXISTS job_applications_status_created_idx
  ON public.job_applications (application_status, created_at DESC);

CREATE INDEX IF NOT EXISTS job_applications_email_idx
  ON public.job_applications (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS job_applications_job_email_unique
  ON public.job_applications (job_posting_id, lower(email));

DROP TRIGGER IF EXISTS job_applications_set_updated_at ON public.job_applications;
CREATE TRIGGER job_applications_set_updated_at
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Grants + RLS — administrators only (no public read/write)
-- -----------------------------------------------------------------------------

GRANT SELECT, UPDATE ON TABLE public.job_applications TO authenticated;
-- Inserts are performed by the service-role API only.
REVOKE INSERT, DELETE ON TABLE public.job_applications FROM anon, authenticated;
GRANT ALL ON TABLE public.job_applications TO service_role;

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_applications_admin_select ON public.job_applications;
CREATE POLICY job_applications_admin_select
  ON public.job_applications
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS job_applications_admin_update ON public.job_applications;
CREATE POLICY job_applications_admin_update
  ON public.job_applications
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------------------------------
-- Private Storage bucket: job-resumes
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL THEN
    RAISE NOTICE 'storage.buckets not present — skip job-resumes bucket setup';
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'job-resumes') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'job-resumes',
      'job-resumes',
      false,
      5242880,
      ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]::text[]
    );
    RAISE NOTICE 'Created private storage.buckets job-resumes';
  ELSE
    UPDATE storage.buckets
    SET
      public = false,
      file_size_limit = GREATEST(COALESCE(file_size_limit, 0), 5242880),
      allowed_mime_types = ARRAY[
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]::text[]
    WHERE id = 'job-resumes';
    RAISE NOTICE 'Updated private storage.buckets job-resumes';
  END IF;
END $$;

-- No Storage policies for anon/authenticated. Service role bypasses RLS for
-- uploads. Administrators download via short-lived signed URLs from a
-- server route that verifies administrator auth.

NOTIFY pgrst, 'reload schema';
