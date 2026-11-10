import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isPubliclyVisibleBlogPost } from './blogPublicVisibility.js'

const now = new Date('2026-11-10T12:00:00.000Z')

test('published articles with past published_at are public', () => {
  assert.equal(
    isPubliclyVisibleBlogPost(
      { status: 'published', published_at: '2026-11-09T12:00:00.000Z' },
      now
    ),
    true
  )
})

test('draft articles remain hidden', () => {
  assert.equal(
    isPubliclyVisibleBlogPost({ status: 'draft', published_at: null }, now),
    false
  )
  assert.equal(
    isPubliclyVisibleBlogPost(
      { status: 'draft', published_at: '2026-11-09T12:00:00.000Z' },
      now
    ),
    false
  )
})

test('future-dated published articles remain hidden', () => {
  assert.equal(
    isPubliclyVisibleBlogPost(
      { status: 'published', published_at: '2026-11-11T12:00:00.000Z' },
      now
    ),
    false
  )
})

test('published without published_at remains hidden', () => {
  assert.equal(isPubliclyVisibleBlogPost({ status: 'published', published_at: null }, now), false)
})

test('list rows without status field remain hidden (select must include status)', () => {
  assert.equal(
    isPubliclyVisibleBlogPost({ published_at: '2026-11-09T12:00:00.000Z' }, now),
    false
  )
})
