import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assertValidServiceSlug,
  canonicalizeServiceSlug,
  publicServicePath,
} from './serviceSlug.js'
import { buildPublishedServicesList } from './serviceUrlFlow.js'
import {
  STATIC_SERVICE_SLUGS,
  buildCmsServiceUpdate,
  buildPublishedServiceLookup,
  resolveHardRefreshPublicService,
} from './serviceUrlFlow.js'

const SERVICE_ID = 'e4b939fc-0e1f-466c-8afb-4183dffa06f6'

const beforeRow = {
  id: SERVICE_ID,
  slug: 'web-development',
  status: 'published',
  updated_at: '2026-09-13T06:49:43.647008+00:00',
}

const afterRow = {
  id: SERVICE_ID,
  slug: 'new-slug',
  status: 'published',
  updated_at: '2026-09-13T07:00:29.882118+00:00',
}

test('valid kebab rename is unchanged by canonicalize', () => {
  assert.equal(canonicalizeServiceSlug('web-development'), 'web-development')
  assert.equal(canonicalizeServiceSlug('new-slug'), 'new-slug')
  assert.equal(assertValidServiceSlug('new-slug'), 'new-slug')
})

test('CMS update filters by id, not the old slug', () => {
  const request = buildCmsServiceUpdate(SERVICE_ID, { slug: 'new-slug' })
  assert.equal(request.table, 'services')
  assert.deepEqual(request.match, { id: SERVICE_ID })
  assert.equal(request.payload.slug, 'new-slug')
  assert.notEqual(request.match.id, beforeRow.slug)
})

test('public fetch uses the URL slug plus published status', () => {
  assert.deepEqual(buildPublishedServiceLookup('new-slug'), {
    table: 'services',
    select: '*',
    filters: { slug: 'new-slug', status: 'published' },
  })
})

test('hard refresh of /services/new-slug renders after a valid rename', () => {
  const cache = new Map()
  assert.equal(cache.size, 0)

  const result = resolveHardRefreshPublicService({
    fetchedRow: afterRow,
    urlSlug: 'new-slug',
  })

  assert.equal(result.staticFallback, null)
  assert.ok(result.render, 'CMS row must render without a services.js entry')
  assert.equal(result.render.serviceId, SERVICE_ID)
  assert.equal(result.render.slug, 'new-slug')
  assert.equal(result.render.usedStaticFallback, false)
})

test('old catalog URL is a miss after the rename; no alias remains', () => {
  const oldUrl = resolveHardRefreshPublicService({
    fetchedRow: null,
    urlSlug: 'web-development',
  })
  assert.equal(oldUrl.render, null)
  assert.equal(oldUrl.staticFallback, 'web-development')
})

test('static catalog extras are optional and must not supply live public links', () => {
  assert.ok(STATIC_SERVICE_SLUGS.includes('web-development'))
  assert.equal(STATIC_SERVICE_SLUGS.includes('new-slug'), false)
  assert.deepEqual(buildPublishedServicesList(null), [])
  assert.deepEqual(buildPublishedServicesList([]), [])
  assert.deepEqual(
    buildPublishedServicesList([
      {
        id: 'svc-a',
        slug: 'new-slug',
        title: 'Renamed A',
        shortDescription: '',
        description: '',
        icon: 'Layers',
        sortOrder: 0,
      },
      {
        id: 'svc-b',
        slug: 'second-slug',
        title: 'Renamed B',
        shortDescription: '',
        description: '',
        icon: 'Layers',
        sortOrder: 1,
      },
    ]).map((row) => row.slug),
    ['new-slug', 'second-slug']
  )
})

test('two published services can be renamed independently', () => {
  const first = buildCmsServiceUpdate('id-1', { slug: 'first-new' })
  const second = buildCmsServiceUpdate('id-2', { slug: 'second-new' })
  assert.deepEqual(first.match, { id: 'id-1' })
  assert.deepEqual(second.match, { id: 'id-2' })
  assert.equal(publicServicePath(first.payload.slug), '/services/first-new')
  assert.equal(publicServicePath(second.payload.slug), '/services/second-new')

  const firstPage = resolveHardRefreshPublicService({
    fetchedRow: { id: 'id-1', slug: 'first-new', status: 'published' },
    urlSlug: 'first-new',
  })
  const secondPage = resolveHardRefreshPublicService({
    fetchedRow: { id: 'id-2', slug: 'second-new', status: 'published' },
    urlSlug: 'second-new',
  })
  assert.equal(firstPage.render?.serviceId, 'id-1')
  assert.equal(secondPage.render?.serviceId, 'id-2')
})

test('publicServicePath is the only live URL shape', () => {
  assert.equal(publicServicePath('new-slug'), '/services/new-slug')
  assert.equal(publicServicePath('New Slug'), '/services/new-slug')
  assert.equal(publicServicePath('---'), '')
})

test('same-session cache must drop both slugs after a rename', () => {
  const cache = new Map()
  cache.set('web-development', { slug: 'web-development' })
  cache.set('new-slug', { slug: 'new-slug' })
  cache.delete('web-development')
  cache.delete('new-slug')
  assert.equal(cache.size, 0)
})

test('empty slugs throw before write; mixed-case values are canonicalized, not stored raw', () => {
  assert.throws(() => buildCmsServiceUpdate(SERVICE_ID, { slug: '   ' }), /Slug must be lowercase/)
  assert.equal(buildCmsServiceUpdate(SERVICE_ID, { slug: 'New Slug' }).payload.slug, 'new-slug')
})
