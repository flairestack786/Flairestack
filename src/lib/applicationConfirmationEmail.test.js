import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  CAREERS_EMAIL_FROM,
  buildApplicationEmailJsPayload,
  isEmailJsSuccessResponse,
  resolveApplicationEmailConfig,
  sanitizeEmailJsErrorSnippet,
} from './applicationConfirmationEmail.js'
import {
  JOB_PROFILE_LINK_TYPES,
  sanitizeProfileLinks,
  validateProfileLinksInput,
} from './jobApplicationValidation.js'

test('resolveApplicationEmailConfig requires careers service/template and never uses inquiry IDs', () => {
  const cfg = resolveApplicationEmailConfig({
    EMAILJS_APPLICATION_SERVICE_ID: 'service_qbexphi',
    EMAILJS_APPLICATION_TEMPLATE_ID: 'template_careers',
    EMAILJS_PUBLIC_KEY: 'pub_key',
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: 'service_inquiry_should_not_be_used',
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_inquiry_should_not_be_used',
  })
  assert.equal(cfg.configured, true)
  assert.equal(cfg.serviceId, 'service_qbexphi')
  assert.equal(cfg.templateId, 'template_careers')
  assert.equal(cfg.publicKey, 'pub_key')
})

test('resolveApplicationEmailConfig does not fall back to inquiry service when careers service missing', () => {
  const cfg = resolveApplicationEmailConfig({
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: 'service_inquiry',
    EMAILJS_APPLICATION_TEMPLATE_ID: 'template_careers',
    EMAILJS_PUBLIC_KEY: 'pub_key',
  })
  assert.equal(cfg.configured, false)
  assert.ok(cfg.missing.includes('EMAILJS_APPLICATION_SERVICE_ID'))
  assert.equal(cfg.serviceId, '')
})

test('buildApplicationEmailJsPayload maps recipient and careers reply-to', () => {
  const payload = buildApplicationEmailJsPayload({
    serviceId: 'service_qbexphi',
    templateId: 'template_careers',
    publicKey: 'pub_key',
    privateKey: 'priv_key',
    toEmail: 'applicant@example.com',
    firstName: 'Ada',
    jobTitle: 'Engineer',
  })

  assert.equal(payload.service_id, 'service_qbexphi')
  assert.equal(payload.template_id, 'template_careers')
  assert.equal(payload.user_id, 'pub_key')
  assert.equal(payload.accessToken, 'priv_key')

  const params = /** @type {Record<string, string>} */ (payload.template_params)
  assert.equal(params.to_email, 'applicant@example.com')
  assert.equal(params.first_name, 'Ada')
  assert.equal(params.job_title, 'Engineer')
  assert.equal(params.reply_to, CAREERS_EMAIL_FROM)
  assert.equal(params.from_email, CAREERS_EMAIL_FROM)
  assert.match(params.subject, /Engineer/)
  assert.match(params.message_html, /Ada/)
})

test('isEmailJsSuccessResponse requires real success body', () => {
  assert.equal(isEmailJsSuccessResponse(200, 'OK'), true)
  assert.equal(isEmailJsSuccessResponse(200, ''), false)
  assert.equal(isEmailJsSuccessResponse(422, 'The recipients address is corrupted'), false)
  assert.equal(isEmailJsSuccessResponse(401, 'API calls are disabled for non-browser applications'), false)
})

test('sanitizeEmailJsErrorSnippet redacts credentials', () => {
  const cleaned = sanitizeEmailJsErrorSnippet('failed accessToken:"abc123secret" user_id:"pk"')
  assert.equal(cleaned.includes('abc123secret'), false)
  assert.match(cleaned, /redacted/)
})

test('profile dropdown includes Stack Overflow and Other custom label', () => {
  assert.ok(JOB_PROFILE_LINK_TYPES.includes('stackoverflow'))
  assert.ok(JOB_PROFILE_LINK_TYPES.includes('other'))

  const sanitized = sanitizeProfileLinks([
    { platform: 'stackoverflow', url: 'https://stackoverflow.com/users/1' },
    { platform: 'other', label: 'Personal blog', url: 'https://ada.dev' },
    { platform: 'other', url: 'http://insecure.example' },
  ])
  assert.deepEqual(sanitized, [
    { platform: 'stackoverflow', url: 'https://stackoverflow.com/users/1' },
    { platform: 'other', url: 'https://ada.dev', label: 'Personal blog' },
  ])

  const invalidOther = validateProfileLinksInput([
    { platform: 'other', label: '', url: 'https://ada.dev' },
  ])
  assert.equal(invalidOther.ok, false)

  const badUrl = validateProfileLinksInput([
    { platform: 'github', url: 'github.com/ada' },
  ])
  assert.equal(badUrl.ok, false)
})
