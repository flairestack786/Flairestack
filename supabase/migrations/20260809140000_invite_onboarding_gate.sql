-- Invite onboarding: Auth users created via invite get profiles.status = invited
-- until password setup + acceptUserInvite promotes them to active.
-- Do NOT auto-accept user_invites on auth.users INSERT (acceptance happens after set-password).
-- Allow service-role / system updates to set invited; block authenticated clients from assigning invited/suspended.

CREATE OR REPLACE FUNCTION public.profiles_restrict_manageable_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Client/JWT updates only. Service role (auth.uid() IS NULL) may set lifecycle statuses.
  IF auth.uid() IS NOT NULL
     AND NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status IN (
       'invited'::public.cms_user_status,
       'suspended'::public.cms_user_status
     )
  THEN
    RAISE EXCEPTION
      'Invalid user status. Existing CMS users can only be Active or Disabled.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.profiles_restrict_manageable_status() IS
  'Blocks authenticated users from assigning invited/suspended; service role may set lifecycle statuses.';

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
  profile_status public.cms_user_status;
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

  -- InviteUserByEmail sets invited_at; those users stay invited until acceptUserInvite.
  IF NEW.invited_at IS NOT NULL OR invite_role IS NOT NULL THEN
    profile_status := 'invited'::public.cms_user_status;
  ELSE
    profile_status := 'active'::public.cms_user_status;
  END IF;

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
        role = EXCLUDED.role,
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
  'Creates profiles for new auth users. Invitees start as invited until password setup + accept.';
