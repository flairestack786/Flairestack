import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  INQUIRY_EMAILJS_SERVICE_ID,
  INQUIRY_FROM_EMAIL,
  buildInquiryEmailJsTemplateParams,
  formatInquiryEmailJsFailure,
  isInquiryEmailJsSuccess,
  planInquiryEmailSends,
  resolveInquiryEmailConfig,
} from './inquiryEmailConfig.js'
import { resolveApplicationEmailConfig } from './applicationConfirmationEmail.js'

test('inquiry config uses NEXT_PUBLIC inquiry service/template, not Careers APPLICATION_*', () => {
  const cfg = resolveInquiryEmailConfig({
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: INQUIRY_EMAILJS_SERVICE_ID,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_5jo1wed',
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'inquiry_pub',
    EMAILJS_APPLICATION_SERVICE_ID: 'service_qbexphi',
    EMAILJS_APPLICATION_TEMPLATE_ID: 'template_careers',
    NEXT_PUBLIC_EMAILJS_CONFIRMATION_TEMPLATE_ID: 'template_should_be_ignored',
  })

  assert.equal(cfg.configured, true)
  assert.equal(cfg.serviceId, INQUIRY_EMAILJS_SERVICE_ID)
  assert.equal(cfg.templateId, 'template_5jo1wed')
  assert.equal(cfg.publicKey, 'inquiry_pub')
  assert.equal(cfg.fromEmail, INQUIRY_FROM_EMAIL)
  assert.equal(cfg.usesExpectedService, true)
  assert.equal(cfg.careersServiceIdIgnored, 'service_qbexphi')
  assert.equal(cfg.confirmationTemplateIdIgnored, 'template_should_be_ignored')
  assert.notEqual(cfg.serviceId, cfg.careersServiceIdIgnored)
  assert.notEqual(cfg.templateId, cfg.confirmationTemplateIdIgnored)
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

test('inquiry and careers resolvers stay on independent service IDs', () => {
  const env = {
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: INQUIRY_EMAILJS_SERVICE_ID,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_5jo1wed',
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

test('customer confirmation uses submitted email and hello@ reply-to; no business notification', () => {
  const params = buildInquiryEmailJsTemplateParams({
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    company: 'Acme',
    phone: '+1 555',
    service: 'Web Development',
    message: 'Need a new platform for our product launch next quarter.',
  })

  // EmailJS template recipient is {{email}}
  assert.equal(params.email, 'jane@example.com')
  assert.equal(params.to_email, 'jane@example.com')
  assert.equal(params.reply_to, INQUIRY_FROM_EMAIL)
  assert.equal(params.from_email, INQUIRY_FROM_EMAIL)
  assert.equal(params.from_name, 'FlaireStack')
  assert.equal(INQUIRY_FROM_EMAIL, 'hello@flairestack.com')
  assert.notEqual(params.email, 'info@flairestack.com')
  assert.notEqual(params.reply_to, 'info@flairestack.com')
})

test('planInquiryEmailSends sends exactly one customer email and no business notification', () => {
  const cfg = resolveInquiryEmailConfig({
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: INQUIRY_EMAILJS_SERVICE_ID,
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_5jo1wed',
    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY: 'pub',
    EMAILJS_APPLICATION_TEMPLATE_ID: 'template_careers',
  })
  const plan = planInquiryEmailSends(cfg, { email: 'visitor@example.com' })
  assert.equal(plan.business, null)
  assert.equal(plan.customer?.toEmail, 'visitor@example.com')
  assert.equal(plan.customer?.templateId, 'template_5jo1wed')
  assert.equal(plan.customer?.fromEmail, 'hello@flairestack.com')
  assert.equal(plan.customer?.replyTo, 'hello@flairestack.com')
  assert.notEqual(plan.customer?.templateId, 'template_careers')
})

test('missing email config is handled safely without planning a send', () => {
  const cfg = resolveInquiryEmailConfig({})
  const plan = planInquiryEmailSends(cfg, { email: 'visitor@example.com' })
  assert.equal(cfg.configured, false)
  assert.equal(plan.customer, null)
  assert.equal(plan.business, null)
  assert.equal(plan.skippedReason, 'email_not_configured')
})

test('email failure classification does not imply lead invalidation', () => {
  // Lead persistence is independent; EmailJS failure is a separate status check.
  assert.equal(isInquiryEmailJsSuccess({ status: 200, text: 'OK' }), true)
  assert.equal(isInquiryEmailJsSuccess({ status: 412, text: 'SMTP fail' }), false)
  const formatted = formatInquiryEmailJsFailure({ status: 412, text: 'SMTP connection failed' })
  assert.equal(formatted.status, 412)
  assert.match(formatted.text, /SMTP/)
})
