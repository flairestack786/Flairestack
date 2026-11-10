import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getMediaEgressSummary, isMediaEgressDebugEnabled } from './mediaEgressDebug.js'

test('media egress debug helpers are safe in Node (no window)', () => {
  // In Node test runs, debug may be on in development; helpers must not throw.
  assert.equal(typeof isMediaEgressDebugEnabled(), 'boolean')
  const summary = getMediaEgressSummary()
  if (summary) {
    assert.equal(typeof summary.eventCount, 'number')
    assert.match(String(summary.note), /Supabase dashboard/i)
  } else {
    assert.equal(summary, null)
  }
})
