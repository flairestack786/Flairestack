import '../loadEnv.mjs'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL
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

/**
 * Canonical public origin for invite / password-reset email links.
 * Prefer explicit SITE_URL in all environments.
 *
 * Dual-runtime local defaults:
 * - Vite CMS primary: SITE_URL=http://localhost:5173 (fallback below)
 * - Next CMS primary: SITE_URL=http://localhost:3000 (or NEXT_PUBLIC_SITE_URL)
 * Production: SITE_URL=https://your-production-domain (required for correct emails)
 *
 * On Vercel, if SITE_URL is unset, fall back to platform-provided production host
 * (never invent a custom domain). Browser self-service forgot-password uses
 * window.location.origin instead.
 */
export function getSiteUrl() {
  const explicit =
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VITE_SITE_URL ||
    process.env.PUBLIC_SITE_URL

  if (explicit) {
    return String(explicit).replace(/\/$/, '')
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProduction) {
    return `https://${String(vercelProduction).replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  }

  const vercelDeployment = process.env.VERCEL_URL
  if (vercelDeployment) {
    return `https://${String(vercelDeployment).replace(/^https?:\/\//, '').replace(/\/$/, '')}`
  }

  return 'http://localhost:5173'
}

export function ensureAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Admin API is not configured. Set SUPABASE_SERVICE_ROLE_KEY on the server.')
  }
  return supabaseAdmin
}
