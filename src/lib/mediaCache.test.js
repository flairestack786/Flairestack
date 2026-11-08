import assert from 'node:assert/strict'
import test from 'node:test'
import { MEDIA_CACHE_CONTROL } from './mediaFormat.js'

test('new media uploads request a public one-year immutable cache', () => {
  assert.equal(MEDIA_CACHE_CONTROL, 'public, max-age=31536000, immutable')
  assert.match(MEDIA_CACHE_CONTROL, /max-age=31536000/)
  assert.match(MEDIA_CACHE_CONTROL, /\bpublic\b/)
  assert.match(MEDIA_CACHE_CONTROL, /\bimmutable\b/)
})
