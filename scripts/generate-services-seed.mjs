import { writeFileSync } from 'node:fs'
import { createServer } from 'vite'

const vite = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { services } = await vite.ssrLoadModule('/src/data/services.js')
  const { buildDefaultSectionsForSlug, SERVICE_SECTION_KEYS } = await vite.ssrLoadModule(
    '/src/lib/serviceDefaults.js'
  )

  function sqlString(value) {
    if (value == null || value === '') return 'NULL'
    return `'${String(value).replace(/'/g, "''")}'`
  }

  function sqlJson(value) {
    return `${sqlString(JSON.stringify(value ?? {}))}::jsonb`
  }

  const lines = []
  lines.push('-- =============================================================================')
  lines.push('-- FlaireStack CMS — seed all services from src/data/services.js')
  lines.push('-- Idempotent: ON CONFLICT / NOT EXISTS guards. Safe to re-run.')
  lines.push('-- Seeds: services (published), service_sections, seo_metadata.')
  lines.push('-- service_media is skipped: bundled WebP assets are not media_assets rows yet;')
  lines.push('-- public pages continue using bundled fallbacks until Media Library images are assigned.')
  lines.push('-- =============================================================================')
  lines.push('')
  lines.push('BEGIN;')
  lines.push('')

  services.forEach((service, index) => {
    lines.push('-- ---------------------------------------------------------------------------')
    lines.push(`-- ${service.slug}`)
    lines.push('-- ---------------------------------------------------------------------------')
    lines.push('')
    lines.push('INSERT INTO public.services (')
    lines.push('  slug,')
    lines.push('  title,')
    lines.push('  short_description,')
    lines.push('  description,')
    lines.push('  icon_name,')
    lines.push('  sort_order,')
    lines.push('  status,')
    lines.push('  published_at')
    lines.push(')')
    lines.push('VALUES (')
    lines.push(`  ${sqlString(service.slug)},`)
    lines.push(`  ${sqlString(service.title)},`)
    lines.push(`  ${sqlString(service.shortDescription)},`)
    lines.push(`  ${sqlString(service.description)},`)
    lines.push(`  ${sqlString(service.icon)},`)
    lines.push(`  ${index},`)
    lines.push(`  'published'::public.content_status,`)
    lines.push('  now()')
    lines.push(')')
    lines.push('ON CONFLICT (slug) DO NOTHING;')
    lines.push('')

    const sections = buildDefaultSectionsForSlug(service.slug)

    for (const key of SERVICE_SECTION_KEYS) {
      const section = sections[key]
      const config = section.config ?? {}

      lines.push('INSERT INTO public.service_sections (')
      lines.push('  service_id,')
      lines.push('  section_key,')
      lines.push('  eyebrow,')
      lines.push('  title,')
      lines.push('  intro,')
      lines.push('  body,')
      lines.push('  cta_label,')
      lines.push('  cta_url,')
      lines.push('  secondary_cta_label,')
      lines.push('  secondary_cta_url,')
      lines.push('  use_global_template,')
      lines.push('  global_template_key,')
      lines.push('  config,')
      lines.push('  is_enabled')
      lines.push(')')
      lines.push('SELECT')
      lines.push('  s.id,')
      lines.push(`  ${sqlString(key)},`)
      lines.push(`  ${sqlString(section.eyebrow || null)},`)
      lines.push(`  ${sqlString(section.title || null)},`)
      lines.push(`  ${sqlString(section.intro || null)},`)
      lines.push(`  ${sqlString(section.body || null)},`)
      lines.push(`  ${sqlString(section.cta_label || null)},`)
      lines.push(`  ${sqlString(section.cta_url || null)},`)
      lines.push(`  ${sqlString(section.secondary_cta_label || null)},`)
      lines.push(`  ${sqlString(section.secondary_cta_url || null)},`)
      lines.push('  false,')
      lines.push('  NULL,')
      lines.push(`  ${sqlJson(config)},`)
      lines.push('  true')
      lines.push('FROM public.services s')
      lines.push(`WHERE s.slug = ${sqlString(service.slug)}`)
      lines.push('  AND NOT EXISTS (')
      lines.push('    SELECT 1')
      lines.push('    FROM public.service_sections ss')
      lines.push('    WHERE ss.service_id = s.id')
      lines.push(`      AND ss.section_key = ${sqlString(key)}`)
      lines.push('  );')
      lines.push('')
    }

    lines.push('INSERT INTO public.seo_metadata (')
    lines.push('  entity_type,')
    lines.push('  service_id,')
    lines.push('  meta_title,')
    lines.push('  meta_description,')
    lines.push('  robots,')
    lines.push('  og_type,')
    lines.push('  twitter_card,')
    lines.push('  status,')
    lines.push('  published_at')
    lines.push(')')
    lines.push('SELECT')
    lines.push(`  'service'::public.entity_type,`)
    lines.push('  s.id,')
    lines.push(`  ${sqlString(service.seoTitle)},`)
    lines.push(`  ${sqlString(service.seoDescription)},`)
    lines.push(`  'index,follow',`)
    lines.push(`  'website',`)
    lines.push(`  'summary_large_image',`)
    lines.push(`  'published'::public.content_status,`)
    lines.push('  now()')
    lines.push('FROM public.services s')
    lines.push(`WHERE s.slug = ${sqlString(service.slug)}`)
    lines.push('  AND NOT EXISTS (')
    lines.push('    SELECT 1')
    lines.push('    FROM public.seo_metadata sm')
    lines.push('    WHERE sm.service_id = s.id')
    lines.push('  );')
    lines.push('')
  })

  lines.push('COMMIT;')
  lines.push('')

  const outPath = new URL(
    '../supabase/migrations/20260709150000_seed_services_from_static.sql',
    import.meta.url
  )
  writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.log(`Wrote ${services.length} services (${SERVICE_SECTION_KEYS.length} sections each)`)
} finally {
  await vite.close()
}
