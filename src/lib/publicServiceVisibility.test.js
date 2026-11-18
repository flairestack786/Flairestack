import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  filterPublicServiceRows,
  filterVisibleShowcaseItems,
  isPublicServiceRow,
  PUBLIC_SERVICE_STATUS,
  serviceRevalidationPaths,
} from './publicServiceVisibility.js'
import { buildPublishedServiceLookup, buildPublishedServicesList } from './serviceUrlFlow.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

/** Simulates the `services` table; `query()` mirrors `.eq('status','published')`. */
function servicesTable(rows) {
  const table = rows.map((row) => ({ ...row }))
  return {
    setStatus(slug, status) {
      const row = table.find((r) => r.slug === slug)
      row.status = status
    },
    remove(slug) {
      table.splice(table.findIndex((r) => r.slug === slug), 1)
    },
    query() {
      return filterPublicServiceRows(table.filter((r) => r.status === PUBLIC_SERVICE_STATUS))
    },
  }
}

/** `/services` listing: published rows -> list items (same as getPublishedServicesList). */
function servicesPageSlugs(rows) {
  return buildPublishedServicesList(rows).map((r) => r.slug)
}

/** Homepage: CMS showcase items when configured, else the published catalog. */
function homepageSlugs(rows, showcaseItems) {
  const published = rows.map((r) => r.slug)
  if (!showcaseItems) return published
  return filterVisibleShowcaseItems(showcaseItems, published).map(
    (item) => item.service_slug || `custom:${item.id}`
  )
}

const BASE_ROWS = [
  { id: '1', slug: 'web-development', title: 'Web', status: 'published', sort_order: 1 },
  { id: '2', slug: 'mobile-apps', title: 'Mobile', status: 'published', sort_order: 2 },
  { id: '3', slug: 'ai-solutions', title: 'AI', status: 'draft', sort_order: 3 },
]

const SHOWCASE = [
  { id: 'a', enabled: true, service_slug: 'mobile-apps' },
  { id: 'b', enabled: true, service_slug: 'ai-solutions' },
  { id: 'c', enabled: true, service_slug: 'web-development' },
  { id: 'd', enabled: false, service_slug: 'web-development' },
  { id: 'e', enabled: true, service_slug: '' },
]

test('publishing a service makes it eligible on both the homepage and /services', () => {
  const db = servicesTable(BASE_ROWS)
  assert.ok(!servicesPageSlugs(db.query()).includes('ai-solutions'))
  assert.ok(!homepageSlugs(db.query(), SHOWCASE).includes('ai-solutions'))
  assert.ok(!homepageSlugs(db.query(), null).includes('ai-solutions'))

  db.setStatus('ai-solutions', 'published')

  assert.ok(servicesPageSlugs(db.query()).includes('ai-solutions'))
  assert.ok(homepageSlugs(db.query(), SHOWCASE).includes('ai-solutions'))
  assert.ok(homepageSlugs(db.query(), null).includes('ai-solutions'))
})

test('unpublishing a service removes it from both the homepage and /services', () => {
  const db = servicesTable(BASE_ROWS)
  assert.ok(homepageSlugs(db.query(), SHOWCASE).includes('mobile-apps'))

  db.setStatus('mobile-apps', 'draft')

  assert.ok(!servicesPageSlugs(db.query()).includes('mobile-apps'))
  assert.ok(!homepageSlugs(db.query(), SHOWCASE).includes('mobile-apps'))
  assert.ok(!homepageSlugs(db.query(), null).includes('mobile-apps'))
})

test('deleted services never appear on either page', () => {
  const db = servicesTable(BASE_ROWS)
  db.remove('web-development')
  assert.ok(!servicesPageSlugs(db.query()).includes('web-development'))
  assert.ok(!homepageSlugs(db.query(), SHOWCASE).includes('web-development'))
})

test('drafts never appear publicly, even if the query forgets the status filter', () => {
  assert.equal(isPublicServiceRow({ slug: 'x', status: 'draft' }), false)
  assert.equal(isPublicServiceRow({ slug: 'x', status: 'archived' }), false)
  assert.equal(isPublicServiceRow({ slug: '', status: 'published' }), false)
  assert.equal(isPublicServiceRow(null), false)
  assert.deepEqual(
    filterPublicServiceRows(BASE_ROWS).map((r) => r.slug),
    ['web-development', 'mobile-apps']
  )
})

test('ordering rules: catalog by sort_order, showcase keeps CMS order', () => {
  const rows = [
    { slug: 'c', status: 'published', sort_order: 3 },
    { slug: 'a', status: 'published', sort_order: 1 },
    { slug: 'b1', status: 'published', sort_order: 2 },
    { slug: 'b2', status: 'published', sort_order: 2 },
  ]
  assert.deepEqual(filterPublicServiceRows(rows).map((r) => r.slug), ['a', 'b1', 'b2', 'c'])

  const db = servicesTable(BASE_ROWS)
  db.setStatus('ai-solutions', 'published')
  assert.deepEqual(homepageSlugs(db.query(), SHOWCASE), [
    'mobile-apps',
    'ai-solutions',
    'web-development',
    'custom:e',
  ])
})

test('disabled showcase items stay hidden and custom (unlinked) cards are kept', () => {
  const visible = filterVisibleShowcaseItems(SHOWCASE, ['web-development', 'mobile-apps'])
  assert.deepEqual(
    visible.map((item) => item.id),
    ['a', 'c', 'e']
  )
})

test('showcase slug matching is normalized', () => {
  const items = [{ id: 'x', enabled: true, service_slug: '  Web-Development ' }]
  assert.equal(filterVisibleShowcaseItems(items, ['web-development']).length, 1)
  assert.equal(filterVisibleShowcaseItems(items, []).length, 0)
})

test('unpublishing one service does not affect other services', () => {
  const db = servicesTable(BASE_ROWS)
  const beforeServices = servicesPageSlugs(db.query())
  const beforeHome = homepageSlugs(db.query(), SHOWCASE)

  db.setStatus('mobile-apps', 'draft')

  assert.deepEqual(
    servicesPageSlugs(db.query()),
    beforeServices.filter((slug) => slug !== 'mobile-apps')
  )
  assert.deepEqual(
    homepageSlugs(db.query(), SHOWCASE),
    beforeHome.filter((slug) => slug !== 'mobile-apps')
  )
})

test('direct service route only looks up published rows', () => {
  const lookup = buildPublishedServiceLookup('AI-Solutions')
  assert.equal(lookup.filters.status, 'published')
  assert.equal(lookup.filters.slug, 'ai-solutions')
  assert.match(
    source('./next/publicServiceServer.ts'),
    /getPublicServicePage[\s\S]*fetchPublishedServiceRaw/
  )
})

test('cache invalidation covers /, /services, sitemap and the affected detail routes', () => {
  assert.deepEqual(serviceRevalidationPaths('ai-solutions'), [
    '/',
    '/services',
    '/sitemap.xml',
    '/services/ai-solutions',
  ])
  assert.deepEqual(serviceRevalidationPaths('old-slug', 'new-slug', 'new-slug').slice(3), [
    '/services/old-slug',
    '/services/new-slug',
  ])
  assert.deepEqual(serviceRevalidationPaths(null, ''), ['/', '/services', '/sitemap.xml'])
})

test('CMS publish, unpublish, edit and delete all trigger targeted revalidation', () => {
  const browser = source('./next/servicesBrowser.ts')
  for (const fn of ['setServiceStatus', 'updateService', 'deleteService']) {
    const start = browser.indexOf(`export async function ${fn}(`)
    assert.ok(start >= 0, `${fn} exists`)
    const next = browser.indexOf('export async function', start + 1)
    const body = browser.slice(start, next === -1 ? undefined : next)
    assert.match(body, /revalidatePublicServicePaths\(/, `${fn} revalidates`)
  }
  assert.doesNotMatch(browser, /revalidatePath\(['"]\/['"],\s*['"]layout['"]\)/)
})

test('service editor revalidates once, after sections and media are saved', () => {
  const editor = source('../app/admin/services/AdminServiceEditClient.tsx')
  const start = editor.indexOf('const handleSave = useCallback')
  const body = editor.slice(start, editor.indexOf('const handleToggleStatus', start))
  assert.match(body, /updateService\(serviceId, servicePayload, \{ revalidate: false \}\)/)
  const sections = body.indexOf('saveServiceSections(')
  const media = body.indexOf('saveServiceMedia(')
  const revalidate = body.indexOf('revalidatePublicServicePaths(previousSlug, updated.slug)')
  assert.ok(sections > 0 && media > sections, 'sections then media are saved')
  assert.ok(revalidate > media, 'revalidation runs after the full save')
})

test('homepage section saves (incl. Services showcase config) revalidate only /', () => {
  const home = source('./next/homeBrowser.ts')
  const start = home.indexOf('export async function saveHomeSections(')
  assert.ok(start >= 0)
  const body = home.slice(start)
  const lastWrite = body.indexOf('return data as Record<string, unknown>')
  const revalidate = body.indexOf("requestPublicRevalidation(['/'])")
  assert.ok(revalidate > lastWrite, 'revalidates / after all section writes succeed')
})

test('homepage, /services and nav/footer share one published-services query', () => {
  for (const file of [
    './next/publicHomeServer.ts',
    './next/publicServiceServer.ts',
    './next/publicSiteSettingsServer.ts',
  ]) {
    const text = source(file)
    assert.match(text, /getPublishedServiceRows\(\)/, `${file} uses the shared helper`)
  }
  assert.match(source('./next/publicHomeServer.ts'), /filterVisibleShowcaseItems\(/)
  assert.doesNotMatch(source('./next/publicHomeServer.ts'), /from\('services'\)/)
  assert.match(source('./next/publishedServicesServer.ts'), /\.eq\('status', PUBLIC_SERVICE_STATUS\)/)
})
