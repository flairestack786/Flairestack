/**
 * Regression checks for SEO save payload normalization.
 * Run: node scripts/verify-seo-payload.mjs
 */
import {
  assertSeoPayloadConstraints,
  normalizeRequiredSeoText,
  sanitizeSeoPayload,
  SEO_REQUIRED_TEXT_DEFAULTS,
} from '../src/lib/seoPayload.js'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(
  normalizeRequiredSeoText('', 'website', 'update') === undefined,
  'update with empty og_type should omit (preserve DB)'
)
assert(
  normalizeRequiredSeoText('', 'website', 'insert') === 'website',
  'insert with empty og_type should default to website'
)
assert(
  normalizeRequiredSeoText('  article  ', 'website', 'update') === 'article',
  'trimmed non-empty values must be kept'
)
assert(
  normalizeRequiredSeoText(null, 'website', 'insert') === 'website',
  'null on insert defaults to website'
)

const updatePayload = sanitizeSeoPayload(
  {
    meta_title: 'Hello',
    og_type: '',
    robots: null,
    twitter_card: undefined,
    status: 'draft',
  },
  { isUpdate: true }
)

assert(!('og_type' in updatePayload), 'update payload must not include empty og_type')
assert(!('robots' in updatePayload), 'update payload must not include null robots')
assert(!('twitter_card' in updatePayload), 'undefined twitter_card must be omitted')
assert(updatePayload.status === 'draft', 'status must remain draft')

const insertPayload = sanitizeSeoPayload(
  {
    meta_title: 'New page',
    og_type: '',
    robots: '',
    twitter_card: null,
  },
  { isUpdate: false }
)

assert(insertPayload.og_type === 'website', 'insert og_type defaults to website')
assert(insertPayload.robots === 'index,follow', 'insert robots default')
assert(insertPayload.twitter_card === 'summary_large_image', 'insert twitter_card default')

let threw = false
try {
  assertSeoPayloadConstraints({ og_type: null }, 'update')
} catch {
  threw = true
}
assert(threw, 'assertSeoPayloadConstraints must reject null og_type')

assert(
  SEO_REQUIRED_TEXT_DEFAULTS.og_type === 'website',
  'canonical default for og_type is website'
)

console.log('verify-seo-payload: all checks passed')
