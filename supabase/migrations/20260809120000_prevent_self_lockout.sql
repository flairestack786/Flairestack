-- Prevent authenticated users from disabling themselves or changing their own CMS role.
-- Service-role admin APIs still manage other users (auth.uid() is null for service role).
-- Does not weaken RLS or replace existing last-administrator guards.

CREATE OR REPLACE FUNCTION public.profiles_prevent_self_lockout()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR NEW.id IS DISTINCT FROM auth.uid() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     AND NEW.status = 'disabled'::public.cms_user_status
  THEN
    RAISE EXCEPTION
      'You cannot disable or change the role of your own account while you are logged in.';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION
      'You cannot disable or change the role of your own account while you are logged in.';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.profiles_prevent_self_lockout() IS
  'Blocks the authenticated user from disabling their own profile or changing their own role.';

DROP TRIGGER IF EXISTS profiles_prevent_self_lockout ON public.profiles;
CREATE TRIGGER profiles_prevent_self_lockout
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_prevent_self_lockout();
