-- Restrict manual profile status updates to Active / Disabled only.
-- Keeps invited/suspended in the cms_user_status enum for legacy rows and lifecycle use.
-- Does not affect invitation acceptance (auth trigger sets status = active on INSERT/UPSERT).

CREATE OR REPLACE FUNCTION public.profiles_restrict_manageable_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
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
  'Rejects manual transitions to invited/suspended; Active and Disabled remain allowed.';

DROP TRIGGER IF EXISTS profiles_restrict_manageable_status ON public.profiles;
CREATE TRIGGER profiles_restrict_manageable_status
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_restrict_manageable_status();
