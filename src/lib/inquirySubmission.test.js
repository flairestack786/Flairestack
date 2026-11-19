import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  INQUIRY_DUPLICATE_WINDOW_MS,
  INQUIRY_FIELD_LIMITS,
  INQUIRY_RATE_LIMIT,
  processInquirySubmission,
  validateInquiryPayload,
} from './inquirySubmission.js'
import { INQUIRY_SUBMIT_ENDPOINT, submitInquiry } from './inquiryClientFlow.js'

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const exists = (path) => existsSync(new URL(path, import.meta.url))

const VALID = {
  fullName: 'Jane Smith',
  email: 'Jane@Example.com',
  phone: '+1 555 000 0000',
  company: 'Acme',
  service: 'Web Development',
  message: 'We need a new marketing site with a CMS and integrations.',
  turnstileToken: 'XXXX.DUMMY.TOKEN',
}

/** In-memory leads table + call log; nothing here talks to the network. */
function harness({ verify = { success: true }, rows = [], insertError = null, secret = 'ts-secret' } = {}) {
  const calls = []
  const leads = [...rows]
  const deps = {
    turnstileSecret: secret,
    now: () => new Date('2026-11-18T12:00:00.000Z'),
    async verifyTurnstile(token, key, ip) {
      calls.push(['verify', token, key, ip])
      if (verify instanceof Error) throw verify
      return verify
    },
    async countRecentByIpHash(ipHash, since) {
      calls.push(['count', ipHash])
      return leads.filter((r) => r.metadata?.ip_hash === ipHash && r.created_at >= since).length
    },
    async findRecentDuplicate(email, message, since) {
      calls.push(['duplicate', email])
      return leads.some((r) => r.email === email && r.message === message && r.created_at >= since)
    },
    async insertLead(row) {
      calls.push(['insert', row])
      if (insertError) throw insertError
      leads.push({ ...row, created_at: deps.now().toISOString() })
    },
  }
  return { deps, calls, leads }
}

const submit = (h, body = VALID, ip = '203.0.113.7', ipHash = 'hash-a') =>
  processInquirySubmission({ body, ip, ipHash }, h.deps)

// 1
test('missing Turnstile token is rejected before Cloudflare or the database', async () => {
  const h = harness()
  const res = await submit(h, { ...VALID, turnstileToken: '' })
  assert.equal(res.status, 400)
  assert.equal(res.body.code, 'turnstile_missing')
  assert.deepEqual(h.calls, [])
})

test('missing server secret fails closed (no verification skip)', async () => {
  const h = harness({ secret: '' })
  const res = await submit(h)
  assert.equal(res.status, 503)
  assert.equal(h.calls.length, 0)
})

// 2
test('invalid Turnstile token is rejected', async () => {
  const h = harness({ verify: { success: false, 'error-codes': ['invalid-input-response'] } })
  const res = await submit(h)
  assert.equal(res.status, 403)
  assert.equal(res.body.code, 'turnstile_failed')
})

test('expired or reused Turnstile token is rejected with a retry message', async () => {
  const h = harness({ verify: { success: false, 'error-codes': ['timeout-or-duplicate'] } })
  const res = await submit(h)
  assert.equal(res.status, 403)
  assert.equal(res.body.code, 'turnstile_expired')
})

test('a browser-supplied success flag is ignored', async () => {
  const h = harness({ verify: { success: false } })
  const res = await submit(h, { ...VALID, turnstileVerified: true, success: true, skipTurnstile: true })
  assert.equal(res.status, 403)
  assert.ok(!h.calls.some(([kind]) => kind === 'insert'))
})

// 3
test('failed or unreachable Cloudflare verification prevents any database access', async () => {
  for (const verify of [{ success: false }, { 'error-codes': [] }, null, new Error('network')]) {
    const h = harness({ verify })
    const res = await submit(h)
    assert.ok(res.status === 403 || res.status === 503)
    assert.deepEqual(
      h.calls.map(([kind]) => kind),
      ['verify'],
      'only Siteverify is called'
    )
    assert.equal(h.leads.length, 0)
  }
})

// 4
test('successful verification inserts exactly one lead with the existing lead model', async () => {
  const h = harness()
  const res = await submit(h)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { ok: true, duplicate: false })
  assert.equal(h.leads.length, 1)
  const [lead] = h.leads
  assert.equal(lead.email, 'jane@example.com')
  assert.equal(lead.full_name, 'Jane Smith')
  assert.equal(lead.service_interest, 'Web Development')
  assert.equal(lead.source, 'contact_form')
  assert.equal(lead.status, 'new')
  assert.equal(lead.priority, 'medium')
  assert.equal(lead.metadata.ip_hash, 'hash-a')
  assert.equal(lead.metadata.turnstile_verified, true)
  assert.equal('turnstileToken' in lead || 'turnstile_token' in lead, false)
  assert.equal('assigned_to' in lead || 'admin_notes' in lead, false)
  const kinds = h.calls.map(([kind]) => kind)
  assert.ok(kinds.indexOf('verify') < kinds.indexOf('insert'))
  assert.deepEqual(h.calls[0].slice(1), [VALID.turnstileToken, 'ts-secret', '203.0.113.7'])
})

test('validation: required fields, email format, sizes and sanitisation', () => {
  const bad = validateInquiryPayload({ email: 'nope', message: 'short' })
  assert.equal(bad.ok, false)
  assert.ok(bad.fieldErrors.fullName && bad.fieldErrors.email && bad.fieldErrors.service)
  assert.ok(bad.fieldErrors.message)

  const long = validateInquiryPayload({ ...VALID, message: 'x'.repeat(INQUIRY_FIELD_LIMITS.message + 1) })
  assert.equal(long.ok, false)
  assert.ok(long.fieldErrors.message)

  const clean = validateInquiryPayload({
    ...VALID,
    fullName: '  Jane\u0000\n  Smith ',
    message: 'Line one\r\nLine two\u0007 is long enough here.',
  })
  assert.equal(clean.ok, true)
  assert.equal(clean.data.fullName, 'Jane Smith')
  assert.equal(clean.data.message, 'Line one\nLine two is long enough here.')

  assert.equal(validateInquiryPayload(null).ok, false)
  assert.equal(validateInquiryPayload([]).ok, false)
})

test('invalid fields never reach Cloudflare or the database', async () => {
  const h = harness()
  const res = await submit(h, { ...VALID, email: 'not-an-email' })
  assert.equal(res.status, 400)
  assert.equal(res.body.fieldErrors.email, 'Please enter a valid email address.')
  assert.deepEqual(h.calls, [])
})

// 8
test('duplicate submissions are accepted idempotently without a second lead', async () => {
  const h = harness()
  assert.equal((await submit(h)).body.duplicate, false)
  const again = await submit(h)
  assert.equal(again.status, 200)
  assert.deepEqual(again.body, { ok: true, duplicate: true })
  assert.equal(h.leads.length, 1)
})

test('same visitor outside the duplicate window creates a new lead', async () => {
  const old = new Date(Date.parse('2026-11-18T12:00:00.000Z') - INQUIRY_DUPLICATE_WINDOW_MS - 1000)
  const h = harness({
    rows: [{ email: 'jane@example.com', message: VALID.message, created_at: old.toISOString(), metadata: {} }],
  })
  const res = await submit(h)
  assert.equal(res.body.duplicate, false)
  assert.equal(h.leads.length, 2)
})

test('per-IP rate limit is enforced from persisted leads', async () => {
  const recent = new Date('2026-11-18T11:58:00.000Z').toISOString()
  const rows = Array.from({ length: INQUIRY_RATE_LIMIT.max }, (_, i) => ({
    email: `p${i}@example.com`,
    message: `m${i}`,
    created_at: recent,
    metadata: { ip_hash: 'hash-a' },
  }))
  const h = harness({ rows })
  const res = await submit(h)
  assert.equal(res.status, 429)
  assert.equal(h.leads.length, INQUIRY_RATE_LIMIT.max)
  const other = await submit(harness({ rows }), VALID, '198.51.100.1', 'hash-b')
  assert.equal(other.status, 200)
})

test('persistence failure returns a safe error without internal details', async () => {
  const h = harness({ insertError: new Error('duplicate key value violates "secret_internal"') })
  const res = await submit(h)
  assert.equal(res.status, 500)
  assert.equal(res.body.code, 'persist_failed')
  assert.doesNotMatch(JSON.stringify(res.body), /secret_internal|duplicate key/)
})

// --- Browser flow ---------------------------------------------------------------

function fakeFetch(status, payload, calls) {
  return async (url, init) => {
    calls.push(['fetch', url, JSON.parse(init.body)])
    return { ok: status >= 200 && status < 300, status, json: async () => payload }
  }
}

const FORM = {
  fullName: VALID.fullName,
  email: VALID.email,
  company: VALID.company,
  phone: VALID.phone,
  service: VALID.service,
  message: VALID.message,
}

// 6
test('confirmation email is sent once, only after the server confirms persistence', async () => {
  const calls = []
  const result = await submitInquiry({
    values: FORM,
    turnstileToken: 'tok',
    fetchImpl: fakeFetch(200, { ok: true, duplicate: false }, calls),
    sendConfirmation: async () => {
      calls.push(['email'])
      return true
    },
  })
  assert.deepEqual(result, { ok: true, duplicate: false, emailStatus: 'sent' })
  assert.deepEqual(calls.map(([kind]) => kind), ['fetch', 'email'])
  assert.equal(calls[0][1], INQUIRY_SUBMIT_ENDPOINT)
  assert.equal(calls[0][2].turnstileToken, 'tok')
})

test('no confirmation email when the server rejects the submission', async () => {
  for (const [status, payload] of [
    [403, { ok: false, error: 'Security verification failed. Please try again.', code: 'turnstile_failed' }],
    [400, { ok: false, error: 'Please fix the highlighted fields.', fieldErrors: { email: 'bad' } }],
    [500, { ok: false, error: 'Unable to save your inquiry right now.' }],
    [200, { ok: false }],
  ]) {
    let emailed = 0
    const result = await submitInquiry({
      values: FORM,
      turnstileToken: 'tok',
      fetchImpl: fakeFetch(status, payload, []),
      sendConfirmation: async () => {
        emailed += 1
        return true
      },
    })
    assert.equal(result.ok, false)
    assert.equal(emailed, 0)
  }
})

test('duplicate acknowledgement does not send a second confirmation', async () => {
  let emailed = 0
  const result = await submitInquiry({
    values: FORM,
    turnstileToken: 'tok',
    fetchImpl: fakeFetch(200, { ok: true, duplicate: true }, []),
    sendConfirmation: async () => {
      emailed += 1
      return true
    },
  })
  assert.equal(result.ok, true)
  assert.equal(emailed, 0)
})

// 7
test('email failure does not undo the saved lead or report a failed submission', async () => {
  for (const send of [async () => false, async () => Promise.reject(new Error('EmailJS 412'))]) {
    const result = await submitInquiry({
      values: FORM,
      turnstileToken: 'tok',
      fetchImpl: fakeFetch(200, { ok: true, duplicate: false }, []),
      sendConfirmation: send,
    })
    assert.deepEqual(result, { ok: true, duplicate: false, emailStatus: 'failed' })
  }
})

test('network failure reports a safe error and sends no email', async () => {
  let emailed = 0
  const result = await submitInquiry({
    values: FORM,
    turnstileToken: 'tok',
    fetchImpl: async () => {
      throw new TypeError('Failed to fetch')
    },
    sendConfirmation: async () => {
      emailed += 1
      return true
    },
  })
  assert.equal(result.ok, false)
  assert.equal(result.code, 'network_error')
  assert.equal(emailed, 0)
})

// 5
test('the public form no longer inserts into Supabase directly', () => {
  const form = source('../components/next/public/home/HomeInquiryForm.tsx')
  assert.doesNotMatch(form, /getSupabaseBrowser|supabase|createPublicLead|from\('leads'\)/i)
  assert.doesNotMatch(form, /\/api\/turnstile\/verify/)
  assert.match(form, /submitInquiry\(/)
  assert.equal(exists('./next/createPublicLead.ts'), false)
})

test('the API route uses the server-only client, Siteverify and a body limit', () => {
  const route = source('../app/api/inquiry/submit/route.ts')
  assert.match(route, /getSupabaseServiceRole/)
  assert.match(route, /verifyTurnstileToken/)
  assert.match(route, /INQUIRY_MAX_BODY_BYTES/)
  assert.match(route, /application\/json/)
  assert.doesNotMatch(route, /getSupabaseBrowser|NEXT_PUBLIC_SUPABASE_SERVICE/)
  assert.doesNotMatch(route, /console\.(log|error)\([^)]*\b(raw|body|ip|turnstileSecret|row|error)\b/)
  const serviceRole = source('./next/supabaseServiceRole.ts')
  assert.doesNotMatch(serviceRole, /^'use client'/m)
})

test('confirmation email keeps the existing single-template configuration', () => {
  const form = source('../components/next/public/home/HomeInquiryForm.tsx')
  assert.equal((form.match(/emailjs\.send\(/g) || []).length, 1)
  assert.match(form, /INQUIRY_EMAIL\.serviceId,\s*INQUIRY_EMAIL\.templateId/)
  assert.doesNotMatch(form, /APPLICATION|info@flairestack\.com/)
})

// 9
test('migration removes only anon inserts and keeps CMS lead access', () => {
  const sql = source('../../supabase/migrations/20261118120000_leads_server_only_public_insert.sql')
  const statements = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
  assert.match(statements, /DROP POLICY IF EXISTS leads_public_insert ON public\.leads;/)
  assert.match(statements, /REVOKE INSERT ON TABLE public\.leads FROM anon;/)
  assert.doesNotMatch(statements, /leads_admin_|lead_timeline|can_manage_leads|is_admin|authenticated/)
  assert.doesNotMatch(statements, /REVOKE[^;]*(SELECT|UPDATE|DELETE)/)

  const leadsBrowser = source('./next/leadsBrowser.ts')
  assert.match(leadsBrowser, /from\('leads'\)/)
})

// 10
test('careers application workflow is untouched', () => {
  const careers = source('../app/api/careers/apply/route.ts')
  assert.match(careers, /verifyTurnstileToken\(turnstileToken, turnstileSecret\)/)
  assert.match(careers, /sendApplicationConfirmationEmail/)
  assert.doesNotMatch(careers, /inquiry/i)
  const email = source('./inquiryEmailConfig.js')
  assert.doesNotMatch(email, /sendApplicationConfirmationEmail/)
})

// 11
test('no Turnstile bypass or debug switch exists in the inquiry path', () => {
  for (const file of [
    '../app/api/inquiry/submit/route.ts',
    './inquirySubmission.js',
    './inquiryClientFlow.js',
    '../components/next/public/home/HomeInquiryForm.tsx',
  ]) {
    assert.doesNotMatch(source(file), /debugInquiry|bypass|skipTurnstile|NODE_ENV|searchParams/i, file)
  }
})
