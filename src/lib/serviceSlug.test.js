import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  assertValidServiceSlug,
  canonicalizeServiceSlug,
  normalizeServiceSlug,
  publicServicePath,
  SERVICE_SLUG_PATTERN,
} from './serviceSlug.js'

test('normalizeServiceSlug trims and lowercases without rewriting separators', () => {
  assert.equal(normalizeServiceSlug('  Web-Development  '), 'web-development')
  assert.equal(normalizeServiceSlug('new slug'), 'new slug')
})

test('canonicalizeServiceSlug matches create-modal kebab rules and DB CHECK', () => {
  assert.equal(canonicalizeServiceSlug('New Slug'), 'new-slug')
  assert.equal(canonicalizeServiceSlug('New-Slug'), 'new-slug')
  assert.equal(canonicalizeServiceSlug('  new_slug  '), 'new-slug')
  assert.equal(canonicalizeServiceSlug('new-slug'), 'new-slug')
  assert.ok(SERVICE_SLUG_PATTERN.test(canonicalizeServiceSlug('New Slug')))
})

test('assertValidServiceSlug rejects empty and invalid results', () => {
  assert.equal(assertValidServiceSlug('New Slug'), 'new-slug')
  assert.throws(() => assertValidServiceSlug('   '), /Slug must be lowercase/)
  assert.throws(() => assertValidServiceSlug('---'), /Slug must be lowercase/)
})

test('publicServicePath builds /services/:slug from a CMS slug', () => {
  assert.equal(publicServicePath('web-development'), '/services/web-development')
  assert.equal(publicServicePath('new-slug'), '/services/new-slug')
  assert.equal(publicServicePath(''), '')
})
