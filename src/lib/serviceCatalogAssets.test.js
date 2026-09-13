import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  bundledServiceImageSrc,
  catalogPageImageSrcs,
  resolveLegacyAssetKey,
  stampLegacyAssetKey,
} from './serviceCatalogAssets.js'
import { publicServicePath } from './serviceSlug.js'
import { resolveHardRefreshPublicService } from './serviceUrlFlow.js'

const webRow = {
  id: 'svc-web',
  slug: 'web-development',
  title: 'Web Development',
}

const aiRow = {
  id: 'svc-ai',
  slug: 'ai-development',
  title: 'Artificial Intelligence Development Services',
}

test('legacy asset key is independent of the editable public slug', () => {
  assert.equal(
    resolveLegacyAssetKey({
      legacy_asset_key: 'web-development',
      slug: 'testing',
      title: 'Renamed Title',
    }),
    'web-development'
  )
  assert.equal(resolveLegacyAssetKey({ slug: 'testing', title: 'Brand New Service' }), null)
})

test('already-renamed catalog rows recover their pack from title', () => {
  assert.equal(
    resolveLegacyAssetKey({ slug: 'testing', title: 'Web Development' }),
    'web-development'
  )
  assert.equal(
    resolveLegacyAssetKey({
      slug: 'ai-renamed',
      title: 'Artificial Intelligence Development Services',
    }),
    'ai-development'
  )
})

test('stamp uses the pre-rename slug so a simultaneous slug edit keeps the pack', () => {
  assert.equal(
    stampLegacyAssetKey(webRow, { slug: 'testing', title: 'Something Else' }),
    'web-development'
  )
})

test('stamp never overwrites a persisted catalog key', () => {
  assert.equal(
    stampLegacyAssetKey(
      { ...webRow, legacy_asset_key: 'web-development', slug: 'testing' },
      { slug: 'another-slug', title: 'New Title' }
    ),
    'web-development'
  )
})

test('renaming two published services keeps each existing image pack', () => {
  const webBefore = catalogPageImageSrcs(webRow)
  const aiBefore = catalogPageImageSrcs(aiRow)

  const webAfter = catalogPageImageSrcs({
    ...webRow,
    slug: 'testing',
    legacy_asset_key: 'web-development',
  })
  const aiAfter = catalogPageImageSrcs({
    ...aiRow,
    slug: 'ai-now',
    legacy_asset_key: 'ai-development',
  })

  assert.ok(webBefore.length >= 8)
  assert.ok(aiBefore.length >= 8)
  assert.deepEqual(webAfter, webBefore)
  assert.deepEqual(aiAfter, aiBefore)
  assert.ok(webAfter.every((src) => src.startsWith('/images/services/web-development/')))
  assert.ok(aiAfter.every((src) => src.startsWith('/images/services/ai-development/')))
  assert.equal(publicServicePath('testing'), '/services/testing')
  assert.equal(publicServicePath('ai-now'), '/services/ai-now')
})

test('title inference restores the same images before the key is stamped', () => {
  const before = catalogPageImageSrcs(webRow)
  const after = catalogPageImageSrcs({ slug: 'testing', title: 'Web Development' })
  assert.deepEqual(after, before)
  assert.ok(after.includes(bundledServiceImageSrc('web-development', 'hero')))
  assert.ok(after.includes(bundledServiceImageSrc('web-development', 'framework1')))
  assert.ok(after.includes(bundledServiceImageSrc('web-development', 'process')))
})

test('brand-new CMS services with no catalog pack have no bundled images', () => {
  assert.deepEqual(
    catalogPageImageSrcs({
      id: 'svc-new',
      slug: 'custom-widgets',
      title: 'Custom Widgets',
    }),
    []
  )
})

test('old public slug is a miss after rename; new slug is the only live URL', () => {
  const oldUrl = resolveHardRefreshPublicService({
    fetchedRow: null,
    urlSlug: 'web-development',
  })
  const newUrl = resolveHardRefreshPublicService({
    fetchedRow: { id: 'svc-web', slug: 'testing', status: 'published' },
    urlSlug: 'testing',
  })

  assert.equal(oldUrl.render, null)
  assert.ok(newUrl.render)
  assert.equal(publicServicePath('testing'), '/services/testing')
  assert.notEqual(publicServicePath('testing'), '/services/web-development')
})
