-- =============================================================================
-- FlaireStack CMS — Remove "unknown role → administrator" defaults
--
-- Problem (before this migration):
--   1. public.handle_auth_user_created() created an ACTIVE ADMINISTRATOR profile for
--      any new auth user that had no pending invite and no recognised role. It also
--      read the role from raw_user_meta_data, which the person signing up controls
--      (supabase.auth.signUp({ options: { data: { role: 'admin' } } })).
--      If "Allow new users to sign up" is enabled in Supabase Auth (the default), anyone
--      holding the public anon key could create a CMS administrator account.
--   2. profiles.role and user_invites.role defaulted to 'administrator', so any insert
--      that omitted the role silently granted full access.
--
-- After this migration:
--   - A role is granted only by (a) a pending admin-created invite or (b) app_metadata,
--     which only the service role can write. raw_user_meta_data is never trusted.
--   - Any other new account gets a profile with status 'disabled' and the
--     least-privileged placeholder role: it has NO CMS access (active_cms_role() is
--     NULL for non-active profiles) until an administrator deliberately assigns a role
--     and enables it from the Users screen.
--   - Invitees still start as 'invited'; the server sets their role from the invite.
--   - role columns have no default: every insert must name a role explicitly.
--
-- App changes shipped alongside (required for invites to keep their chosen role):
--   server/lib/adminUsersHandlers.mjs now writes profiles.role from the invite on
--   invite creation and on first acceptance. Deploy that code with/before this.
--
-- Bootstrap note: a user added manually in the Supabase dashboard (no invite, no
-- app_metadata role) now starts disabled. Promote such an account explicitly:
--   UPDATE public.profiles SET role = 'administrator', status = 'active' WHERE email = '...';
--
-- NOT applied automatically. Review, then run in the SQL editor / supabase db push.
-- =============================================================================

BEGIN;

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.user_invites ALTER COLUMN role DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trusted_role_text text;
  invite_role public.cms_role;
  profile_role public.cms_role;
  profile_status public.cms_user_status;
  role_is_trusted boolean := false;
  display_name text;
BEGIN
  -- app_metadata is writable by the service role only. user_metadata is supplied by
  -- the signing-up client and is deliberately ignored for authorization.
  trusted_role_text := lower(COALESCE(
    NULLIF(NEW.raw_app_meta_data ->> 'cms_role', ''),
    NULLIF(NEW.raw_app_meta_data ->> 'role', ''),
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
    role_is_trusted := true;
  ELSIF trusted_role_text IN ('administrator', 'admin') THEN
    profile_role := 'administrator'::public.cms_role;
    role_is_trusted := true;
  ELSIF trusted_role_text = 'editor' THEN
    profile_role := 'editor'::public.cms_role;
    role_is_trusted := true;
  ELSIF trusted_role_text = 'sales' THEN
    profile_role := 'sales'::public.cms_role;
    role_is_trusted := true;
  ELSE
    -- Placeholder only (the column is NOT NULL). The account is created disabled
    -- below, so this role grants nothing until an administrator reviews it.
    profile_role := 'sales'::public.cms_role;
  END IF;

  IF NEW.invited_at IS NOT NULL OR invite_role IS NOT NULL THEN
    profile_status := 'invited'::public.cms_user_status;
  ELSIF role_is_trusted THEN
    profile_status := 'active'::public.cms_user_status;
  ELSE
    profile_status := 'disabled'::public.cms_user_status;
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
    profile_status,
    NEW.last_sign_in_at,
    NEW.invited_at
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
        -- An untrusted placeholder never overwrites an existing role.
        role = CASE WHEN role_is_trusted THEN EXCLUDED.role ELSE public.profiles.role END,
        status = CASE
          WHEN public.profiles.status = 'disabled'::public.cms_user_status
            THEN public.profiles.status
          WHEN public.profiles.status = 'active'::public.cms_user_status
            THEN public.profiles.status
          ELSE EXCLUDED.status
        END,
        last_sign_in_at = COALESCE(EXCLUDED.last_sign_in_at, public.profiles.last_sign_in_at),
        updated_at = now();

  -- Intentionally do NOT mark user_invites accepted here.
  -- Acceptance is completed after password setup via handleAcceptInvite.

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_auth_user_created() IS
  'Creates profiles for new auth users. Role only from a pending invite or service-role app_metadata; otherwise the account starts disabled with no CMS access.';

COMMIT;

NOTIFY pgrst, 'reload schema';

-- -----------------------------------------------------------------------------
-- Post-apply audit (run manually). Administrators that were NOT created through an
-- administrator invite may have been created by the old fallback — review each one.
-- -----------------------------------------------------------------------------
--   SELECT p.id, p.email, p.status, p.created_at
--   FROM public.profiles p
--   WHERE p.role = 'administrator'
--     AND NOT EXISTS (
--       SELECT 1 FROM public.user_invites ui
--       WHERE ui.accepted_user_id = p.id AND ui.role = 'administrator'
--     )
--   ORDER BY p.created_at;
--
-- Verify defaults are gone (expect NULL column_default for both):
--   SELECT table_name, column_default FROM information_schema.columns
--   WHERE table_schema = 'public' AND column_name = 'role'
--     AND table_name IN ('profiles', 'user_invites');
--
-- Rollback (restores the previous, unsafe behaviour — not recommended):
--   re-run supabase/migrations/20260809140000_invite_onboarding_gate.sql and
--   ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'administrator';
--   ALTER TABLE public.user_invites ALTER COLUMN role SET DEFAULT 'administrator';
