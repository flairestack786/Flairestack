import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  INQUIRY_EMAILJS_SERVICE_ID,
  INQUIRY_TO_EMAIL,
  buildInquiryEmailJsTemplateParams,
  formatInquiryEmailJsFailure,
  isInquiryEmailJsSuccess,
  resolveInquiryEmailConfig,
} from './inquiryEmailConfig.js'
import { resolveApplicationEmailConfig } from './applicationConfirmationEmail.js'

test('inquiry config uses NEXT_PUBLIC inquiry service/template, not Careers APPLICATION_*', () => {
  const cfg = resolveInquiryEmailConfig({
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: INQUIRY_EMAILJS_SERVICE_ID,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_5jo1wed',
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'inquiry_pub',
    NEXT_PUBLIC_EMAILJS_TO_EMAIL: INQUIRY_TO_EMAIL,
    EMAILJS_APPLICATION_SERVICE_ID: 'service_qbexphi',
    EMAILJS_APPLICATION_TEMPLATE_ID: 'template_careers',
  })

  assert.equal(cfg.configured, true)
  assert.equal(cfg.serviceId, INQUIRY_EMAILJS_SERVICE_ID)
  assert.equal(cfg.templateId, 'template_5jo1wed')
  assert.equal(cfg.publicKey, 'inquiry_pub')
  assert.equal(cfg.toEmail, INQUIRY_TO_EMAIL)
  assert.equal(cfg.usesExpectedService, true)
  assert.equal(cfg.usesCanonicalInbox, true)
  // Careers IDs are visible for diagnostics but must not be selected.
  assert.equal(cfg.careersServiceIdIgnored, 'service_qbexphi')
  assert.notEqual(cfg.serviceId, cfg.careersServiceIdIgnored)
})

test('inquiry config never falls back to Careers service when inquiry service missing', () => {
  const cfg = resolveInquiryEmailConfig({
    EMAILJS_APPLICATION_SERVICE_ID: 'service_qbexphi',
    EMAILJS_APPLICATION_TEMPLATE_ID: 'template_careers',
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_inquiry',
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'pub',
  })
  assert.equal(cfg.configured, false)
  assert.ok(cfg.missing.includes('NEXT_PUBLIC_EMAILJS_SERVICE_ID'))
  assert.equal(cfg.serviceId, '')
})

test('inquiry defaults recipient to info@flairestack.com', () => {
  const cfg = resolveInquiryEmailConfig({
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: INQUIRY_EMAILJS_SERVICE_ID,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_inquiry',
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'pub',
  })
  assert.equal(cfg.toEmail, INQUIRY_TO_EMAIL)
})

test('inquiry forces info@ even when env still points at legacy hello@ mailbox', () => {
  const cfg = resolveInquiryEmailConfig({
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: INQUIRY_EMAILJS_SERVICE_ID,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_inquiry',
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'pub',
    NEXT_PUBLIC_EMAILJS_TO_EMAIL: 'hello@flairestack.com',
  })
  assert.equal(cfg.toEmail, INQUIRY_TO_EMAIL)
  assert.equal(cfg.configuredToEmail, 'hello@flairestack.com')
  assert.equal(cfg.envInboxMismatch, true)
})

test('inquiry and careers resolvers stay on independent service IDs', () => {
  const env = {
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: INQUIRY_EMAILJS_SERVICE_ID,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_inquiry',
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'shared_or_inquiry_pub',
    EMAILJS_APPLICATION_SERVICE_ID: 'service_qbexphi',
    EMAILJS_APPLICATION_TEMPLATE_ID: 'template_careers',
    EMAILJS_PUBLIC_KEY: 'careers_pub',
  }
  const inquiry = resolveInquiryEmailConfig(env)
  const careers = resolveApplicationEmailConfig(env)
  assert.equal(inquiry.serviceId, INQUIRY_EMAILJS_SERVICE_ID)
  assert.equal(careers.serviceId, 'service_qbexphi')
  assert.notEqual(inquiry.serviceId, careers.serviceId)
  assert.notEqual(inquiry.templateId, careers.templateId)
})

test('buildInquiryEmailJsTemplateParams maps recipient and reply-to', () => {
  const params = buildInquiryEmailJsTemplateParams({
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    company: 'Acme',
    phone: '+1 555',
    service: 'Web Development',
    message: 'Need a new platform for our product launch next quarter.',
    toEmail: INQUIRY_TO_EMAIL,
    turnstileToken: 'token',
  })
  assert.equal(params.to_email, INQUIRY_TO_EMAIL)
  assert.equal(params.reply_to, 'jane@example.com')
  assert.equal(params.name, 'Jane Smith')
  assert.equal(params.service, 'Web Development')
})

test('isInquiryEmailJsSuccess and formatInquiryEmailJsFailure', () => {
  assert.equal(isInquiryEmailJsSuccess({ status: 200, text: 'OK' }), true)
  assert.equal(isInquiryEmailJsSuccess({ status: 412, text: 'SMTP fail' }), false)
  const formatted = formatInquiryEmailJsFailure({ status: 412, text: 'Gmail_API: Invalid grant' })
  assert.equal(formatted.status, 412)
  assert.match(formatted.text, /Invalid grant/)
})
