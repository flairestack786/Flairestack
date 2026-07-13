import '../loadEnv.mjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    '[admin-api] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for user management endpoints.'
  )
}

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
export const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null

export function getSiteUrl() {
  return (
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    'http://localhost:5173'
  )
}

export function ensureAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Admin API is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.')
  }
  return supabaseAdmin
}
