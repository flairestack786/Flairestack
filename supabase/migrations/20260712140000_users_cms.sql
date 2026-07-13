-- =============================================================================
-- FlaireStack CMS — Users Management module
-- profiles (auth.users mirror) + user_invites (invite-based onboarding prep)
--
-- Design goals:
--   - Single role today: administrator
--   - Extensible without table rewrites: permissions jsonb + role enum ADD VALUE
--   - Invite records can exist before auth.users are created (service-role invite later)
--
-- Prerequisites:
--   - public.set_updated_at()
--   - public.is_admin()
--   - auth.users
-- =============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.set_updated_at()') IS NULL THEN
    RAISE EXCEPTION
      'Missing public.set_updated_at(). Apply phase1 core migrations before users.';
  END IF;

  IF to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION
      'Missing public.is_admin(). Apply phase1 core migrations before users.';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Enums (extend later with ALTER TYPE ... ADD VALUE — no table rewrite)
-- -----------------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'cms_role'
  ) THEN
    CREATE TYPE public.cms_role AS ENUM (
      'administrator'
      -- Future: 'editor', 'viewer', 'contributor', ...
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
      AND t.typname = 'cms_user_status'
  ) THEN
    CREATE TYPE public.cms_user_status AS ENUM (
      'active',
      'invited',
      'disabled',
      'suspended'
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
      AND t.typname = 'cms_invite_status'
  ) THEN
    CREATE TYPE public.cms_invite_status AS ENUM (
      'pending',
      'accepted',
      'revoked',
      'expired'
    );
  END IF;
END $$;

GRANT USAGE ON TYPE public.cms_role TO authenticated;
GRANT USAGE ON TYPE public.cms_user_status TO authenticated;
GRANT USAGE ON TYPE public.cms_invite_status TO authenticated;

-- -----------------------------------------------------------------------------
-- profiles — CMS user identity synced from auth.users
-- permissions jsonb holds future fine-grained grants without schema changes
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email           text NOT NULL,
  full_name       text,
  avatar_path     text,
  role            public.cms_role NOT NULL DEFAULT 'administrator'::public.cms_role,
  status          public.cms_user_status NOT NULL DEFAULT 'active'::public.cms_user_status,
  permissions     jsonb NOT NULL DEFAULT '{}'::jsonb,
  invited_at      timestamptz,
  invited_by      uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  last_sign_in_at timestamptz,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid REFERENCES auth.users (id) ON DELETE SET NULL,

  CONSTRAINT profiles_email_format
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  CONSTRAINT profiles_permissions_object
    CHECK (jsonb_typeof(permissions) = 'object')
);

COMMENT ON TABLE public.profiles IS
  'CMS user profiles mirrored from auth.users. Role + permissions jsonb support future RBAC without schema changes.';

COMMENT ON COLUMN public.profiles.permissions IS
  'Extensible permission map (e.g. {"leads":["read","write"]}). Empty object = role defaults.';

COMMENT ON COLUMN public.profiles.role IS
  'CMS role. Currently only administrator; add enum values later without altering this table.';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_lower_idx
  ON public.profiles (lower(email));

CREATE INDEX IF NOT EXISTS profiles_role_idx
  ON public.profiles (role);

CREATE INDEX IF NOT EXISTS profiles_status_idx
  ON public.profiles (status);

CREATE INDEX IF NOT EXISTS profiles_created_at_idx
  ON public.profiles (created_at DESC);

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_invites — pending invites before (or until) auth user exists
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_invites (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email            text NOT NULL,
  full_name        text,
  role             public.cms_role NOT NULL DEFAULT 'administrator'::public.cms_role,
  permissions      jsonb NOT NULL DEFAULT '{}'::jsonb,
  status           public.cms_invite_status NOT NULL DEFAULT 'pending'::public.cms_invite_status,
  invited_by       uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  invited_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz,
  accepted_at      timestamptz,
  accepted_user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  metadata         jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT user_invites_email_format
    CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),

  CONSTRAINT user_invites_permissions_object
    CHECK (jsonb_typeof(permissions) = 'object'),

  CONSTRAINT user_invites_metadata_object
    CHECK (jsonb_typeof(metadata) = 'object')
);

COMMENT ON TABLE public.user_invites IS
  'Invite-based onboarding queue. Create pending invites here; accept via auth.admin.inviteUserByEmail later.';

CREATE UNIQUE INDEX IF NOT EXISTS user_invites_pending_email_lower_idx
  ON public.user_invites (lower(email))
  WHERE status = 'pending'::public.cms_invite_status;

CREATE INDEX IF NOT EXISTS user_invites_status_idx
  ON public.user_invites (status);

CREATE INDEX IF NOT EXISTS user_invites_invited_at_idx
  ON public.user_invites (invited_at DESC);

DROP TRIGGER IF EXISTS user_invites_set_updated_at ON public.user_invites;
CREATE TRIGGER user_invites_set_updated_at
  BEFORE UPDATE ON public.user_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Sync helpers — keep profiles in step with auth.users
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  jwt_role text;
  profile_role public.cms_role;
  display_name text;
BEGIN
  jwt_role := COALESCE(
    NULLIF(NEW.raw_app_meta_data ->> 'role', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'role', ''),
    'administrator'
  );

  -- Map legacy JWT "admin" → cms_role "administrator"
  IF lower(jwt_role) IN ('admin', 'administrator') THEN
    profile_role := 'administrator'::public.cms_role;
  ELSE
    -- Unknown future roles fall back to administrator until enum values exist
    profile_role := 'administrator'::public.cms_role;
  END IF;

  display_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    status,
    last_sign_in_at,
    invited_at
  )
  VALUES (
    NEW.id,
    lower(NEW.email),
    display_name,
    profile_role,
    'active'::public.cms_user_status,
    NEW.last_sign_in_at,
    CASE
      WHEN NEW.invited_at IS NOT NULL THEN NEW.invited_at
      ELSE NULL
    END
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        last_sign_in_at = COALESCE(EXCLUDED.last_sign_in_at, public.profiles.last_sign_in_at),
        updated_at = now();

  -- Mark matching pending invite accepted when auth user appears
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

COMMENT ON FUNCTION public.handle_auth_user_created() IS
  'Creates/updates public.profiles when an auth.users row is inserted.';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET
    email = lower(NEW.email),
    last_sign_in_at = NEW.last_sign_in_at,
    updated_at = now()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_auth_user_updated() IS
  'Keeps profile email and last_sign_in_at synced from auth.users.';

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email, last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_updated();

-- -----------------------------------------------------------------------------
-- Backfill existing auth users into profiles
-- -----------------------------------------------------------------------------

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  status,
  last_sign_in_at,
  invited_at
)
SELECT
  u.id,
  lower(u.email),
  COALESCE(
    NULLIF(u.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(u.raw_user_meta_data ->> 'name', ''),
    split_part(u.email, '@', 1)
  ),
  'administrator'::public.cms_role,
  'active'::public.cms_user_status,
  u.last_sign_in_at,
  u.invited_at
FROM auth.users u
WHERE u.email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- is_admin() — prefer profiles.role, keep JWT fallback for migration safety
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN false
      WHEN EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'administrator'::public.cms_role
          AND p.status = 'active'::public.cms_user_status
      ) THEN true
      WHEN EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = auth.uid()
      ) THEN false
      ELSE
        -- No profile yet: legacy JWT metadata fallback (defaults to admin)
        COALESCE(
          NULLIF(auth.jwt() -> 'app_metadata' ->> 'role', ''),
          NULLIF(auth.jwt() -> 'user_metadata' ->> 'role', ''),
          'admin'
        ) IN ('admin', 'administrator')
    END;
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'True when the signed-in user has an active administrator profile. Falls back to JWT role when no profile exists.';

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_invites TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
GRANT ALL ON TABLE public.user_invites TO service_role;

-- -----------------------------------------------------------------------------
-- RLS — profiles
-- -----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_self_read ON public.profiles;
CREATE POLICY profiles_self_read
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_admin_insert ON public.profiles;
CREATE POLICY profiles_admin_insert
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
CREATE POLICY profiles_admin_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS profiles_self_update ON public.profiles;
CREATE POLICY profiles_self_update
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Non-admins may only edit their own display fields (role/status locked by trigger)
  );

DROP POLICY IF EXISTS profiles_admin_delete ON public.profiles;
CREATE POLICY profiles_admin_delete
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Prevent non-admins from escalating role/status via self-update
CREATE OR REPLACE FUNCTION public.profiles_guard_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.id = auth.uid()
     AND NOT (
       EXISTS (
         SELECT 1
         FROM public.profiles p
         WHERE p.id = auth.uid()
           AND p.role = 'administrator'::public.cms_role
           AND p.status = 'active'::public.cms_user_status
       )
     )
  THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.permissions IS DISTINCT FROM OLD.permissions
       OR NEW.email IS DISTINCT FROM OLD.email
    THEN
      RAISE EXCEPTION 'Only administrators can change role, status, permissions, or email.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_self_update ON public.profiles;
CREATE TRIGGER profiles_guard_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_guard_self_update();

-- -----------------------------------------------------------------------------
-- RLS — user_invites (admin only)
-- -----------------------------------------------------------------------------

ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_invites_admin_read ON public.user_invites;
CREATE POLICY user_invites_admin_read
  ON public.user_invites
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS user_invites_admin_insert ON public.user_invites;
CREATE POLICY user_invites_admin_insert
  ON public.user_invites
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS user_invites_admin_update ON public.user_invites;
CREATE POLICY user_invites_admin_update
  ON public.user_invites
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS user_invites_admin_delete ON public.user_invites;
CREATE POLICY user_invites_admin_delete
  ON public.user_invites
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

NOTIFY pgrst, 'reload schema';
