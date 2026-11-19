-- =============================================================================
-- FlaireStack — Public inquiries are created only through the server
--
-- Before: `leads_public_insert` let anon (and any authenticated user) insert
-- leads directly via PostgREST with the public anon key, bypassing Turnstile.
--
-- After: the website's POST /api/inquiry/submit verifies Cloudflare Turnstile
-- server-side and inserts with the service role (which bypasses RLS).
-- Anon can no longer insert leads at all.
--
-- Unchanged:
--   - leads_admin_insert / read / update (public.can_manage_leads(): administrator + sales)
--   - leads_admin_delete (public.is_admin())
--   - lead_timeline policies and the SECURITY DEFINER triggers
--     (lead_number allocation, created/status timeline events)
--
-- Apply AFTER the app version that uses /api/inquiry/submit is live,
-- otherwise the old browser form would start failing.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS leads_public_insert ON public.leads;

-- Defence in depth: without the table privilege anon cannot insert even if a
-- permissive policy is re-added later.
REVOKE INSERT ON TABLE public.leads FROM anon;

-- `authenticated` keeps its INSERT privilege; RLS limits it to
-- leads_admin_insert (can_manage_leads()) for manual CRM entry.

COMMIT;

NOTIFY pgrst, 'reload schema';

-- -----------------------------------------------------------------------------
-- Verification (run manually after applying)
-- -----------------------------------------------------------------------------
-- 1) Policies on leads — expect only leads_admin_* rows:
--    SELECT policyname, cmd, roles FROM pg_policies
--    WHERE schemaname = 'public' AND tablename = 'leads' ORDER BY policyname;
--
-- 2) Anon has no INSERT privilege — expect false:
--    SELECT has_table_privilege('anon', 'public.leads', 'INSERT');
--
-- 3) Rollback (only if the server endpoint must be disabled):
--    GRANT INSERT ON TABLE public.leads TO anon;
--    CREATE POLICY leads_public_insert ON public.leads FOR INSERT TO anon, authenticated
--      WITH CHECK (status = 'new'::public.lead_status AND assigned_to IS NULL
--                  AND (admin_notes IS NULL OR btrim(admin_notes) = ''));
