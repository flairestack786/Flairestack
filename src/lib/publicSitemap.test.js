import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  INDEXABLE_CMS_PAGE_PATHS,
  SITEMAP_SITE_ORIGIN,
  SITEMAP_STATIC_ROUTES,
  buildPublicSitemapEntries,
  buildSitemapAbsoluteUrl,
  isRobotsIndexable,
  normalizeSitemapPath,
  resolveSitemapLastModified,
} from './publicSitemap.js'

test('sitemap origin is non-www production canonical', () => {
  assert.equal(SITEMAP_SITE_ORIGIN, 'https://flairestack.com')
  assert.equal(buildSitemapAbsoluteUrl(SITEMAP_SITE_ORIGIN, '/'), 'https://flairestack.com/')
  assert.equal(buildSitemapAbsoluteUrl(SITEMAP_SITE_ORIGIN, '/about'), 'https://flairestack.com/about')
  assert.equal(
    buildSitemapAbsoluteUrl(SITEMAP_SITE_ORIGIN, '/services/web-development'),
    'https://flairestack.com/services/web-development'
  )
})

test('static public routes include home, about, and services listing', () => {
  const paths = SITEMAP_STATIC_ROUTES.map((route) => route.path)
  assert.deepEqual(paths, ['/', '/about', '/services'])
  assert.equal(SITEMAP_STATIC_ROUTES[0].priority, 1)
  assert.ok(INDEXABLE_CMS_PAGE_PATHS.has('/'))
  assert.ok(INDEXABLE_CMS_PAGE_PATHS.has('/about'))
})

test('buildPublicSitemapEntries merges CMS lastModified and published services', () => {
  const entries = buildPublicSitemapEntries({
    origin: SITEMAP_SITE_ORIGIN,
    cmsPages: [
      {
        route_path: '/',
        updated_at: '2026-01-15T12:00:00.000Z',
        robots: 'index,follow',
      },
      {
        route_path: '/about',
        updated_at: '2026-02-01T08:00:00.000Z',
        robots: 'index,follow',
      },
      {
        // Not a Next public route — ignored
        route_path: '/legacy-marketing',
        updated_at: '2026-03-01T00:00:00.000Z',
        robots: 'index,follow',
      },
    ],
    services: [
      {
        slug: 'web-development',
        updated_at: '2026-03-10T10:00:00.000Z',
        robots: 'index,follow',
      },
      {
        slug: 'ai-development',
        published_at: '2026-03-11T10:00:00.000Z',
        robots: 'index,follow',
      },
      {
        slug: 'secret-draft-like',
        updated_at: '2026-03-12T10:00:00.000Z',
        robots: 'noindex,nofollow',
      },
    ],
  })

  const urls = entries.map((entry) => entry.url)
  assert.deepEqual(urls, [
    'https://flairestack.com/',
    'https://flairestack.com/about',
    'https://flairestack.com/services',
    'https://flairestack.com/services/ai-development',
    'https://flairestack.com/services/web-development',
  ])

  assert.equal(entries[0].lastModified?.toISOString(), '2026-01-15T12:00:00.000Z')
  assert.equal(entries[1].lastModified?.toISOString(), '2026-02-01T08:00:00.000Z')
  assert.equal(entries[2].lastModified, undefined)
  assert.ok(entries.every((entry) => entry.url.startsWith('https://flairestack.com')))
  assert.ok(entries.every((entry) => !entry.url.includes('www.')))
  assert.ok(!urls.some((url) => url.includes('/admin')))
  assert.ok(!urls.some((url) => url.includes('/api')))
  assert.ok(!urls.some((url) => url.includes('secret-draft-like')))
})

test('noindex CMS pages are removed from the sitemap', () => {
  const entries = buildPublicSitemapEntries({
    cmsPages: [{ route_path: '/about', robots: 'noindex,follow', updated_at: '2026-01-01T00:00:00.000Z' }],
    services: [],
  })
  const urls = entries.map((entry) => entry.url)
  assert.ok(urls.includes('https://flairestack.com/'))
  assert.ok(urls.includes('https://flairestack.com/services'))
  assert.ok(!urls.includes('https://flairestack.com/about'))
})

test('robots and path helpers reject private or invented values carefully', () => {
  assert.equal(isRobotsIndexable('index,follow'), true)
  assert.equal(isRobotsIndexable('noindex,nofollow'), false)
  assert.equal(normalizeSitemapPath('/about/'), '/about')
  assert.equal(normalizeSitemapPath('/'), '/')
  assert.equal(resolveSitemapLastModified({ updated_at: 'not-a-date' }), undefined)
  assert.equal(
    resolveSitemapLastModified({ published_at: '2026-04-01T00:00:00.000Z' })?.toISOString(),
    '2026-04-01T00:00:00.000Z'
  )
})
