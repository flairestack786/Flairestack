import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../lib/supabaseAdmin.mjs'

/**
 * @param {string | null | undefined} message
 */
export function isLastAdminGuardError(message) {
  return String(message ?? '').includes('last active Administrator')
}

/**
 * Verify Bearer JWT only (any authenticated user). Used for invite acceptance.
 * Does not require administrator role.
 * @param {string | null | undefined} authorizationHeader
 * @returns {Promise<
 *   | { ok: true, authUser: import('@supabase/supabase-js').User }
 *   | { ok: false, status: number, body: { error: string } }
 * >}
 */
export async function authenticateBearerUser(authorizationHeader) {
  const header = authorizationHeader || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return { ok: false, status: 401, body: { error: 'Missing authorization token.' } }
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    return { ok: false, status: 500, body: { error: 'Admin API is not configured on the server.' } }
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token)

  if (userError || !user) {
    return { ok: false, status: 401, body: { error: 'Invalid or expired session.' } }
  }

  return { ok: true, authUser: user }
}

/**
 * Core administrator auth check (shared by Express middleware and Vercel handlers).
 * @param {string | null | undefined} authorizationHeader
 * @returns {Promise<
 *   | { ok: true, authUser: import('@supabase/supabase-js').User, adminProfile: Record<string, unknown> }
 *   | { ok: false, status: number, body: { error: string } }
 * >}
 */
export async function authenticateAdministrator(authorizationHeader) {
  const base = await authenticateBearerUser(authorizationHeader)
  if (!base.ok) return base

  if (!supabaseAdmin) {
    return { ok: false, status: 500, body: { error: 'Admin API is not configured on the server.' } }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, full_name, role, status')
    .eq('id', base.authUser.id)
    .maybeSingle()

  if (profileError) {
    return { ok: false, status: 500, body: { error: profileError.message } }
  }

  if (!profile || profile.role !== 'administrator' || profile.status !== 'active') {
    return { ok: false, status: 403, body: { error: 'Administrator access required.' } }
  }

  return { ok: true, authUser: base.authUser, adminProfile: profile }
}

/**
 * Verify bearer JWT only (any authenticated user).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function requireAuthenticatedUser(req, res, next) {
  try {
    const result = await authenticateBearerUser(req.headers.authorization)

    if (!result.ok) {
      return res.status(result.status).json(result.body)
    }

    req.authUser = result.authUser
    return next()
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Authorization failed.' })
  }
}

/**
 * Verify bearer JWT and ensure caller is an active administrator.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function requireAdministrator(req, res, next) {
  try {
    const result = await authenticateAdministrator(req.headers.authorization)

    if (!result.ok) {
      return res.status(result.status).json(result.body)
    }

    req.authUser = result.authUser
    req.adminProfile = result.adminProfile
    return next()
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Authorization failed.' })
  }
}
