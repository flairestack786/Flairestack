-- =============================================================================
-- FlaireStack CMS — Users RBAC v1.0
-- Roles: administrator (full) | editor (content only)
-- Adds content access helpers, last-admin safety, editor enum value
-- =============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'cms_role'
      AND e.enumlabel = 'editor'
  ) THEN
    ALTER TYPE public.cms_role ADD VALUE 'editor';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- RBAC helpers
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.active_cms_role()
RETURNS public.cms_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.role
  FROM public.profiles p
  WHERE p.id = auth.uid()
    AND p.status = 'active'::public.cms_user_status
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_cms_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.active_cms_role() IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_content()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.active_cms_role() IN (
    'administrator'::public.cms_role,
    'editor'::public.cms_role
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.active_cms_role() = 'administrator'::public.cms_role;
$$;

COMMENT ON FUNCTION public.is_admin() IS
  'True for active administrator profiles only.';

GRANT EXECUTE ON FUNCTION public.active_cms_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_cms_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_content() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- Last active administrator safety
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.count_active_administrators(exclude_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COUNT(*)::integer
  FROM public.profiles p
  WHERE p.role = 'administrator'::public.cms_role
    AND p.status = 'active'::public.cms_user_status
    AND (exclude_id IS NULL OR p.id <> exclude_id);
$$;

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
       OR NEW.role = 'editor'::public.cms_role
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

DROP TRIGGER IF EXISTS profiles_guard_last_administrator ON public.profiles;
CREATE TRIGGER profiles_guard_last_administrator
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_last_administrator();

-- -----------------------------------------------------------------------------
-- Auth sync — honor invite role + cms_role metadata
-- -----------------------------------------------------------------------------

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
-- Content tables — editors may manage content; admins retain full access
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  tbl text;
  pol record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['pages', 'page_sections'] LOOP
    FOR pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = tbl
        AND policyname LIKE '%admin%'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_manage_content())',
      tbl || '_cms_insert', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content())',
      tbl || '_cms_update', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_manage_content())',
      tbl || '_cms_delete', tbl
    );
  END LOOP;
END $$;

-- services + child tables
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'services',
    'service_sections',
    'service_items',
    'service_faqs',
    'service_process_steps',
    'service_technologies',
    'service_testimonials',
    'service_media',
    'service_seo_metadata'
  ] LOOP
    IF to_regclass(format('public.%I', tbl)) IS NULL THEN
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_admin_read', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_admin_insert', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_admin_update', tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tbl || '_admin_delete', tbl);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_manage_content())',
      tbl || '_cms_read', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_manage_content())',
      tbl || '_cms_insert', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_manage_content()) WITH CHECK (public.can_manage_content())',
      tbl || '_cms_update', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_manage_content())',
      tbl || '_cms_delete', tbl
    );
  END LOOP;
END $$;

-- testimonials
DO $$
BEGIN
  IF to_regclass('public.testimonials') IS NOT NULL THEN
    DROP POLICY IF EXISTS testimonials_admin_read ON public.testimonials;
    DROP POLICY IF EXISTS testimonials_admin_insert ON public.testimonials;
    DROP POLICY IF EXISTS testimonials_admin_update ON public.testimonials;
    DROP POLICY IF EXISTS testimonials_admin_delete ON public.testimonials;

    CREATE POLICY testimonials_cms_read
      ON public.testimonials FOR SELECT TO authenticated
      USING (public.can_manage_content());

    CREATE POLICY testimonials_cms_insert
      ON public.testimonials FOR INSERT TO authenticated
      WITH CHECK (public.can_manage_content());

    CREATE POLICY testimonials_cms_update
      ON public.testimonials FOR UPDATE TO authenticated
      USING (public.can_manage_content())
      WITH CHECK (public.can_manage_content());

    CREATE POLICY testimonials_cms_delete
      ON public.testimonials FOR DELETE TO authenticated
      USING (public.can_manage_content());
  END IF;
END $$;

-- media_assets registry
DO $$
BEGIN
  IF to_regclass('public.media_assets') IS NOT NULL THEN
    DROP POLICY IF EXISTS media_assets_admin_read ON public.media_assets;
    DROP POLICY IF EXISTS media_assets_admin_insert ON public.media_assets;
    DROP POLICY IF EXISTS media_assets_admin_update ON public.media_assets;

    CREATE POLICY media_assets_cms_read
      ON public.media_assets FOR SELECT TO authenticated
      USING (public.can_manage_content());

    CREATE POLICY media_assets_cms_insert
      ON public.media_assets FOR INSERT TO authenticated
      WITH CHECK (public.can_manage_content());

    CREATE POLICY media_assets_cms_update
      ON public.media_assets FOR UPDATE TO authenticated
      USING (public.can_manage_content())
      WITH CHECK (public.can_manage_content());
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
