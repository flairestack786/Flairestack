-- =============================================================================
-- FlaireStack CMS — Sales role (RBAC v1.1)
-- Roles: administrator (full) | editor (content) | sales (leads)
-- Preserves prior migrations; additive enum + helpers + leads RLS
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enum: sales
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'cms_role'
      AND e.enumlabel = 'sales'
  ) THEN
    ALTER TYPE public.cms_role ADD VALUE 'sales';
  END IF;
END
$$;

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.can_manage_leads()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.active_cms_role() IN (
    'administrator'::public.cms_role,
    'sales'::public.cms_role
  );
$$;

COMMENT ON FUNCTION public.can_manage_leads() IS
  'True for active administrator or sales profiles (leads module access).';

GRANT EXECUTE ON FUNCTION public.can_manage_leads() TO authenticated;

-- Last-admin guard: demotion to any non-administrator role is blocked
CREATE OR REPLACE FUNCTION public.guard_last_administrator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  remaining integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'administrator'::public.cms_role
       AND OLD.status = 'active'::public.cms_user_status
    THEN
      remaining := public.count_active_administrators(OLD.id);
      IF remaining = 0 THEN
        RAISE EXCEPTION
          'Cannot remove the last active Administrator. Assign another Administrator first.';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.role = 'administrator'::public.cms_role
     AND OLD.status = 'active'::public.cms_user_status
     AND (
       NEW.status = 'disabled'::public.cms_user_status
       OR NEW.role IS DISTINCT FROM 'administrator'::public.cms_role
     )
  THEN
    remaining := public.count_active_administrators(OLD.id);
    IF remaining = 0 THEN
      RAISE EXCEPTION
        'Cannot remove the last active Administrator. Assign another Administrator first.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Auth sync — recognize sales from invite / metadata
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jwt_role text;
  invite_role public.cms_role;
  profile_role public.cms_role;
  display_name text;
BEGIN
  jwt_role := lower(COALESCE(
    NULLIF(NEW.raw_app_meta_data ->> 'cms_role', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'cms_role', ''),
    NULLIF(NEW.raw_app_meta_data ->> 'role', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'role', ''),
    ''
  ));

  SELECT ui.role
  INTO invite_role
  FROM public.user_invites ui
  WHERE ui.status = 'pending'::public.cms_invite_status
    AND lower(ui.email) = lower(NEW.email)
  ORDER BY ui.invited_at DESC
  LIMIT 1;

  IF invite_role IS NOT NULL THEN
    profile_role := invite_role;
  ELSIF jwt_role = 'editor' THEN
    profile_role := 'editor'::public.cms_role;
  ELSIF jwt_role = 'sales' THEN
    profile_role := 'sales'::public.cms_role;
  ELSIF jwt_role IN ('admin', 'administrator') THEN
    profile_role := 'administrator'::public.cms_role;
  ELSE
    profile_role := 'administrator'::public.cms_role;
  END IF;

  display_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id, email, full_name, role, status, last_sign_in_at, invited_at
  )
  VALUES (
    NEW.id,
    lower(NEW.email),
    display_name,
    profile_role,
    'active'::public.cms_user_status,
    NEW.last_sign_in_at,
    NEW.invited_at
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        role = EXCLUDED.role,
        status = 'active'::public.cms_user_status,
        last_sign_in_at = COALESCE(EXCLUDED.last_sign_in_at, public.profiles.last_sign_in_at),
        updated_at = now();

  UPDATE public.user_invites
  SET
    status = 'accepted'::public.cms_invite_status,
    accepted_at = now(),
    accepted_user_id = NEW.id,
    updated_at = now()
  WHERE status = 'pending'::public.cms_invite_status
    AND lower(email) = lower(NEW.email);

  RETURN NEW;
END;
$$;

-- -----------------------------------------------------------------------------
-- Leads RLS — administrators + sales
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS leads_admin_insert ON public.leads;
CREATE POLICY leads_admin_insert
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_leads());

DROP POLICY IF EXISTS leads_admin_read ON public.leads;
CREATE POLICY leads_admin_read
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (public.can_manage_leads());

DROP POLICY IF EXISTS leads_admin_update ON public.leads;
CREATE POLICY leads_admin_update
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_leads())
  WITH CHECK (public.can_manage_leads());

DROP POLICY IF EXISTS leads_admin_delete ON public.leads;
CREATE POLICY leads_admin_delete
  ON public.leads
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS lead_timeline_admin_read ON public.lead_timeline;
CREATE POLICY lead_timeline_admin_read
  ON public.lead_timeline
  FOR SELECT
  TO authenticated
  USING (public.can_manage_leads());

DROP POLICY IF EXISTS lead_timeline_admin_insert ON public.lead_timeline;
CREATE POLICY lead_timeline_admin_insert
  ON public.lead_timeline
  FOR INSERT
  TO authenticated
  WITH CHECK (public.can_manage_leads());

DROP POLICY IF EXISTS lead_timeline_admin_update ON public.lead_timeline;
CREATE POLICY lead_timeline_admin_update
  ON public.lead_timeline
  FOR UPDATE
  TO authenticated
  USING (public.can_manage_leads())
  WITH CHECK (public.can_manage_leads());

DROP POLICY IF EXISTS lead_timeline_admin_delete ON public.lead_timeline;
CREATE POLICY lead_timeline_admin_delete
  ON public.lead_timeline
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
