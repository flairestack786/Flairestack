import assert from 'node:assert/strict'
import { test } from 'node:test'
import { resolveOptionalMedia } from './optionalMedia.js'
import { resolveHardRefreshPublicService } from './serviceUrlFlow.js'

test('null image (typeof null === object) does not throw and yields no src', () => {
  assert.equal(typeof null, 'object')
  assert.deepEqual(resolveOptionalMedia(null, 'Framework item'), { src: '', alt: 'Framework item' })
  assert.deepEqual(resolveOptionalMedia(undefined, 'Framework item'), {
    src: '',
    alt: 'Framework item',
  })
})

test('CMS and string images keep a valid src', () => {
  assert.deepEqual(resolveOptionalMedia({ src: '/images/a.webp', alt: 'A' }, 'Fallback'), {
    src: '/images/a.webp',
    alt: 'A',
  })
  assert.deepEqual(resolveOptionalMedia('/images/b.webp', 'B'), {
    src: '/images/b.webp',
    alt: 'B',
  })
})

test('renamed CMS service with no services.js extras can have null framework images', () => {
  const page = resolveHardRefreshPublicService({
    fetchedRow: { id: 'svc-1', slug: 'testing', status: 'published' },
    urlSlug: 'testing',
  })
  assert.ok(page.render)
  assert.equal(page.staticFallback, null)

  const frameworkItems = [
    { title: 'Discovery', description: 'Scope the work', image: null },
    { title: 'Build', description: 'Ship the product', image: { src: '', alt: '' } },
  ]

  const resolved = frameworkItems.map((item) => resolveOptionalMedia(item.image, item.title))
  assert.deepEqual(resolved, [
    { src: '', alt: 'Discovery' },
    { src: '', alt: 'Build' },
  ])
  assert.equal(
    resolved.every((media) => media.src === '' || media.src.startsWith('/')),
    true
  )
})
