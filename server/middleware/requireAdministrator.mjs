import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '../lib/supabaseAdmin.mjs'

/**
 * Verify bearer JWT and ensure caller is an active administrator.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function requireAdministrator(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      return res.status(401).json({ error: 'Missing authorization token.' })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey || !supabaseAdmin) {
      return res.status(500).json({ error: 'Admin API is not configured on the server.' })
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token)

    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, status')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return res.status(500).json({ error: profileError.message })
    }

    if (!profile || profile.role !== 'administrator' || profile.status !== 'active') {
      return res.status(403).json({ error: 'Administrator access required.' })
    }

    req.authUser = user
    req.adminProfile = profile
    return next()
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Authorization failed.' })
  }
}

/**
 * @param {string | null | undefined} message
 */
export function isLastAdminGuardError(message) {
  return String(message ?? '').includes('last active Administrator')
}
