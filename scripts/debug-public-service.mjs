import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: join(root, '.env.local') })

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(url, anonKey)

const slug = process.argv[2] || 'test'

console.log('Project:', url)
console.log('Testing public fetch for slug:', slug)

const all = await supabase
  .from('services')
  .select('id, slug, title, status, published_at')
  .order('sort_order')

console.log('\n1) list all services visible to anon:', {
  error: all.error,
  count: all.data?.length,
  slugs: all.data?.map((s) => `${s.slug}:${s.status}`),
})

const bySlug = await supabase.from('services').select('*').eq('slug', slug).maybeSingle()

console.log('\n2) by slug only (anon):', {
  error: bySlug.error,
  found: !!bySlug.data,
  status: bySlug.data?.status,
  id: bySlug.data?.id,
})

const published = await supabase
  .from('services')
  .select('*')
  .eq('slug', slug)
  .eq('status', 'published')
  .maybeSingle()

console.log('\n3) by slug + published (anon):', {
  error: published.error,
  found: !!published.data,
  status: published.data?.status,
  id: published.data?.id,
})

if (published.data?.id) {
  const sections = await supabase
    .from('service_sections')
    .select('id, section_key, is_enabled, title')
    .eq('service_id', published.data.id)

  console.log('\n4) sections (anon):', {
    error: sections.error,
    count: sections.data?.length,
    keys: sections.data?.map((s) => s.section_key),
  })
} else {
  console.log(`\n4) skipped — anon cannot see slug "${slug}".`)
  console.log('   SQL Editor bypasses RLS, so the row can exist while anon still gets null.')
  console.log('   Run this in Supabase SQL Editor:')
  console.log(`   select id, slug, status, published_at from services where slug = '${slug}';`)
  console.log('   If status is not exactly published, public pages will not load it.')
  console.log('   Force publish:')
  console.log(
    `   update services set status = 'published', published_at = now() where slug = '${slug}';`
  )
}

console.log('\nDone.')
