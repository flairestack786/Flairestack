import { createClient } from '@supabase/supabase-js'

const isNodeTest = typeof process !== 'undefined' && Boolean(process.env.NODE_TEST_CONTEXT)

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  (isNodeTest ? 'http://127.0.0.1:54321' : '')
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  (isNodeTest ? 'test-anon-key' : '')

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.'
  )
}

/**
 * Shared Supabase client for the browser bundle.
 * Import this wherever you need database, auth, or storage access.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})
