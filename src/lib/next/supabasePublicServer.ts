import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let serverClient: SupabaseClient | null = null

/**
 * Anon Supabase client for public server reads (RLS-scoped).
 * Never uses the service-role key.
 */
export function getSupabasePublicServer(): SupabaseClient {
  if (serverClient) return serverClient

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase public env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    )
  }

  serverClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return serverClient
}
