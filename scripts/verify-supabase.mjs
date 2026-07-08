/**
 * One-off connectivity check — loads .env.local and calls auth.getSession().
 * Run: npm run verify:supabase
 * Does not start the dev server or modify the React app.
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(root, '.env.local') })

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('FAIL: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env.local')
  process.exit(1)
}

const supabase = createClient(url, anonKey)

const { data, error } = await supabase.auth.getSession()

if (error) {
  console.error('FAIL: getSession() returned an error:', error.message)
  process.exit(1)
}

console.log('OK: Supabase connection verified.')
console.log('  URL:', url)
console.log('  Session:', data.session ? `active (user ${data.session.user.id})` : 'none (anonymous — expected for a fresh client)')
