-- =============================================================================
-- FlaireStack CMS — Leads module (leads + lead_timeline)
-- Lead ID format: FS-YYYY-000001 (e.g. FS-2026-000001)
-- Public can submit leads (contact form). Admins manage leads + timeline.
--
-- Prerequisites (already present in FlaireStack production):
--   - extension pgcrypto / gen_random_uuid()
--   - public.set_updated_at()
--   - public.is_admin()
--   - public.services
--   - auth.users
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Preconditions (fail fast with a clear message)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    RAISE EXCEPTION
      'Missing public.set_updated_at(). Apply phase1 core migrations before leads.';
  END IF;

  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION
      'Missing public.is_admin(). Apply phase1 core migrations before leads.';
  END IF;

  IF to_regclass('public.services') IS NULL THEN
    RAISE EXCEPTION
      'Missing public.services. Apply services migrations before leads.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'lead_status'
  ) THEN
    CREATE TYPE public.lead_status AS ENUM (
      'new',
      'contacted',
      'qualified',
      'proposal',
      'won',
      'lost',
      'archived'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'lead_priority'
  ) THEN
    CREATE TYPE public.lead_priority AS ENUM (
      'low',
      'medium',
      'high',
      'urgent'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'lead_timeline_event_type'
  ) THEN
    CREATE TYPE public.lead_timeline_event_type AS ENUM (
      'created',
      'status_changed',
      'priority_changed',
      'note',
      'assignment_changed',
      'email',
      'call',
      'system'
    );
  END IF;
END $$;

-- Required so PostgREST / anon can insert enum columns on public leads
GRANT USAGE ON TYPE public.lead_status TO anon, authenticated;
GRANT USAGE ON TYPE public.lead_priority TO anon, authenticated;
GRANT USAGE ON TYPE public.lead_timeline_event_type TO authenticated;

-- -----------------------------------------------------------------------------
-- Per-year Lead ID counter (FS-YYYY-000001)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lead_number_counters (
  year       integer PRIMARY KEY
    CHECK (year >= 2000 AND year <= 2100),
  last_value integer NOT NULL DEFAULT 0
    CHECK (last_value >= 0)
);

COMMENT ON TABLE public.lead_number_counters IS
  'Yearly sequence used to generate human-readable lead numbers (FS-YYYY-000001).';

CREATE OR REPLACE FUNCTION public.next_lead_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  y integer := EXTRACT(YEAR FROM timezone('utc', now()))::integer;
  next_val integer;
BEGIN
  INSERT INTO public.lead_number_counters AS c (year, last_value)
  VALUES (y, 1)
  ON CONFLICT (year) DO UPDATE
    SET last_value = c.last_value + 1
  RETURNING last_value INTO next_val;

  RETURN format('FS-%s-%s', y, lpad(next_val::text, 6, '0'));
END;
$$;

COMMENT ON FUNCTION public.next_lead_number() IS
  'Allocates the next Lead ID in the format FS-YYYY-000001 for the current UTC year.';

-- Invoked only by SECURITY DEFINER trigger helpers (not directly by clients)
REVOKE ALL ON FUNCTION public.next_lead_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_lead_number() TO postgres, service_role;

-- -----------------------------------------------------------------------------
-- leads
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Populated by BEFORE INSERT trigger leads_set_lead_number (not a column DEFAULT,
  -- so anon does not need EXECUTE on next_lead_number()).
  lead_number       text NOT NULL,
  full_name         text NOT NULL,
  email             text NOT NULL,
  phone             text NOT NULL DEFAULT '',
  company           text NOT NULL DEFAULT '',
  service_interest  text NOT NULL DEFAULT '',
  service_id        uuid REFERENCES public.services (id) ON DELETE SET NULL,
  message           text NOT NULL DEFAULT '',
  status            public.lead_status NOT NULL DEFAULT 'new',
  priority          public.lead_priority NOT NULL DEFAULT 'medium',
  source            text NOT NULL DEFAULT 'contact_form',
  admin_notes       text,
  assigned_to       uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  metadata          jsonb NOT NULL DEFAULT '{}'::jsonb,
  contacted_at      timestamptz,
  closed_at         timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT leads_lead_number_unique
    UNIQUE (lead_number),

  CONSTRAINT leads_lead_number_format
    CHECK (lead_number ~ '^FS-[0-9]{4}-[0-9]{6}$'),

  CONSTRAINT leads_email_format
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  CONSTRAINT leads_full_name_not_blank
    CHECK (length(btrim(full_name)) > 0),

  CONSTRAINT leads_closed_at_when_terminal
    CHECK (
      (status IN ('won'::public.lead_status, 'lost'::public.lead_status, 'archived'::public.lead_status)
        AND closed_at IS NOT NULL)
      OR (status NOT IN ('won'::public.lead_status, 'lost'::public.lead_status, 'archived'::public.lead_status))
    )
);

COMMENT ON TABLE public.leads IS
  'Contact-form and CRM leads. lead_number is the public-facing FS-YYYY-000001 ID.';

COMMENT ON COLUMN public.leads.lead_number IS
  'Human-readable Lead ID (FS-YYYY-000001), auto-generated on insert.';

COMMENT ON COLUMN public.leads.service_interest IS
  'Free-text service selection from the inquiry form (may not match a services row).';

COMMENT ON COLUMN public.leads.service_id IS
  'Optional FK to public.services when the interest can be resolved to a CMS service.';

-- Indexes
CREATE INDEX IF NOT EXISTS leads_status_created_idx
  ON public.leads (status, created_at DESC);

CREATE INDEX IF NOT EXISTS leads_priority_created_idx
  ON public.leads (priority, created_at DESC);

CREATE INDEX IF NOT EXISTS leads_created_at_idx
  ON public.leads (created_at DESC);

CREATE INDEX IF NOT EXISTS leads_email_idx
  ON public.leads (lower(email));

CREATE INDEX IF NOT EXISTS leads_assigned_to_idx
  ON public.leads (assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_service_id_idx
  ON public.leads (service_id)
  WHERE service_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS leads_source_idx
  ON public.leads (source);

DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;
CREATE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Assign Lead ID before insert (SECURITY DEFINER so counter RLS is bypassed)
CREATE OR REPLACE FUNCTION public.leads_set_lead_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.lead_number IS NULL OR btrim(NEW.lead_number) = '' THEN
    NEW.lead_number := public.next_lead_number();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_set_lead_number ON public.leads;
CREATE TRIGGER leads_set_lead_number
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.leads_set_lead_number();

-- Keep contacted_at / closed_at in sync with status transitions
CREATE OR REPLACE FUNCTION public.leads_sync_status_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR (TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status) THEN
    IF NEW.status = 'contacted'::public.lead_status AND NEW.contacted_at IS NULL THEN
      NEW.contacted_at := now();
    END IF;

    IF NEW.status IN (
      'won'::public.lead_status,
      'lost'::public.lead_status,
      'archived'::public.lead_status
    ) THEN
      NEW.closed_at := coalesce(NEW.closed_at, now());
    ELSIF TG_OP = 'UPDATE' THEN
      NEW.closed_at := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_sync_status_timestamps ON public.leads;
CREATE TRIGGER leads_sync_status_timestamps
  BEFORE INSERT OR UPDATE OF status ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.leads_sync_status_timestamps();

-- -----------------------------------------------------------------------------
-- lead_timeline
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lead_timeline (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES public.leads (id) ON DELETE CASCADE,
  event_type  public.lead_timeline_event_type NOT NULL,
  title       text NOT NULL DEFAULT '',
  body        text NOT NULL DEFAULT '',
  old_value   text,
  new_value   text,
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by  uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_timeline IS
  'Append-only activity log for leads (status changes, notes, system events).';

CREATE INDEX IF NOT EXISTS lead_timeline_lead_created_idx
  ON public.lead_timeline (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS lead_timeline_event_type_idx
  ON public.lead_timeline (event_type);

CREATE INDEX IF NOT EXISTS lead_timeline_created_at_idx
  ON public.lead_timeline (created_at DESC);

-- Auto-log lead creation (SECURITY DEFINER bypasses timeline RLS for public inserts)
CREATE OR REPLACE FUNCTION public.leads_log_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.lead_timeline (
    lead_id, event_type, title, body, new_value, created_by, metadata
  ) VALUES (
    NEW.id,
    'created'::public.lead_timeline_event_type,
    'Lead created',
    coalesce(nullif(btrim(NEW.message), ''), 'New inquiry received.'),
    NEW.status::text,
    auth.uid(),
    jsonb_build_object(
      'lead_number', NEW.lead_number,
      'source', NEW.source,
      'email', NEW.email
    )
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_log_created ON public.leads;
CREATE TRIGGER leads_log_created
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.leads_log_created();

-- Auto-log status / priority / assignment changes
CREATE OR REPLACE FUNCTION public.leads_log_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.lead_timeline (
      lead_id, event_type, title, old_value, new_value, created_by
    ) VALUES (
      NEW.id,
      'status_changed'::public.lead_timeline_event_type,
      'Status updated',
      OLD.status::text,
      NEW.status::text,
      auth.uid()
    );
  END IF;

  IF NEW.priority IS DISTINCT FROM OLD.priority THEN
    INSERT INTO public.lead_timeline (
      lead_id, event_type, title, old_value, new_value, created_by
    ) VALUES (
      NEW.id,
      'priority_changed'::public.lead_timeline_event_type,
      'Priority updated',
      OLD.priority::text,
      NEW.priority::text,
      auth.uid()
    );
  END IF;

  IF NEW.assigned_to IS DISTINCT FROM OLD.assigned_to THEN
    INSERT INTO public.lead_timeline (
      lead_id, event_type, title, old_value, new_value, created_by
    ) VALUES (
      NEW.id,
      'assignment_changed'::public.lead_timeline_event_type,
      'Assignment updated',
      OLD.assigned_to::text,
      NEW.assigned_to::text,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_log_changes ON public.leads;
CREATE TRIGGER leads_log_changes
  AFTER UPDATE OF status, priority, assigned_to ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.leads_log_changes();

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

GRANT SELECT ON TABLE public.leads TO authenticated;
GRANT INSERT ON TABLE public.leads TO anon, authenticated;
GRANT UPDATE, DELETE ON TABLE public.leads TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.lead_timeline TO authenticated;

-- Counters are only touched by SECURITY DEFINER helpers
REVOKE ALL ON TABLE public.lead_number_counters FROM PUBLIC;
REVOKE ALL ON TABLE public.lead_number_counters FROM anon;
REVOKE ALL ON TABLE public.lead_number_counters FROM authenticated;
GRANT ALL ON TABLE public.lead_number_counters TO postgres;
GRANT ALL ON TABLE public.lead_number_counters TO service_role;

-- -----------------------------------------------------------------------------
-- RLS — leads
-- -----------------------------------------------------------------------------

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_number_counters ENABLE ROW LEVEL SECURITY;

-- No direct client access to counters
DROP POLICY IF EXISTS lead_number_counters_deny_all ON public.lead_number_counters;
CREATE POLICY lead_number_counters_deny_all
  ON public.lead_number_counters
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Public contact form: create new unassigned leads only
DROP POLICY IF EXISTS leads_public_insert ON public.leads;
CREATE POLICY leads_public_insert
  ON public.leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    status = 'new'::public.lead_status
    AND assigned_to IS NULL
    AND (admin_notes IS NULL OR btrim(admin_notes) = '')
  );

-- Admins may insert with any allowed values (manual CRM entry)
DROP POLICY IF EXISTS leads_admin_insert ON public.leads;
CREATE POLICY leads_admin_insert
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS leads_admin_read ON public.leads;
CREATE POLICY leads_admin_read
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS leads_admin_update ON public.leads;
CREATE POLICY leads_admin_update
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS leads_admin_delete ON public.leads;
CREATE POLICY leads_admin_delete
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- RLS — lead_timeline (admin only; system triggers use SECURITY DEFINER)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS lead_timeline_admin_read ON public.lead_timeline;
CREATE POLICY lead_timeline_admin_read
  ON public.lead_timeline
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS lead_timeline_admin_insert ON public.lead_timeline;
CREATE POLICY lead_timeline_admin_insert
  ON public.lead_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lead_timeline_admin_update ON public.lead_timeline;
CREATE POLICY lead_timeline_admin_update
  ON public.lead_timeline
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS lead_timeline_admin_delete ON public.lead_timeline;
CREATE POLICY lead_timeline_admin_delete
  ON public.lead_timeline
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
