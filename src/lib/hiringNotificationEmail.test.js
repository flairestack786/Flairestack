import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  CAREERS_NOTIFICATION_EMAIL,
  resolveApplicationEmailConfig,
} from './applicationConfirmationEmail.js'
import {
  buildAdminApplicationUrl,
  buildHiringNotificationEmailJsPayload,
  buildHiringNotificationHtml,
  formatResumeSize,
  isUuid,
} from './hiringNotificationEmail.js'

const ID = '6f1c1d4e-2b0a-4c53-9a77-0d9b6f0c1a11'

const application = {
  id: ID,
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  phone: '+971 50 000 0000',
  currentJobTitle: 'Senior Engineer',
  currentCompany: 'Acme',
  location: 'Dubai',
  yearsExperience: '6-10',
  noticePeriod: '30 days',
  profileLinks: [
    { platform: 'linkedin', url: 'https://linkedin.com/in/jane' },
    { platform: 'other', label: 'Case study', url: 'https://example.com/case' },
    { platform: 'github', url: 'javascript:alert(1)' },
  ],
  resumeFilename: 'Jane Doe — CV.pdf',
  resumeMime: 'application/pdf',
  resumeSize: 245_760,
}

const input = {
  serviceId: 'service_careers',
  templateId: 'template_careers',
  publicKey: 'pub',
  privateKey: 'priv',
  siteOrigin: 'https://flairestack.com/',
  jobTitle: 'Frontend Engineer',
  application,
}

test('notification is addressed to careers@flairestack.com on the Careers service/template', () => {
  const payload = buildHiringNotificationEmailJsPayload(input)
  assert.equal(CAREERS_NOTIFICATION_EMAIL, 'careers@flairestack.com')
  assert.equal(payload.template_params.to_email, 'careers@flairestack.com')
  assert.equal(payload.service_id, 'service_careers')
  assert.equal(payload.template_id, 'template_careers')
  assert.equal(payload.accessToken, 'priv')
})

test('notification carries a secure admin link to the application, not a public storage URL', () => {
  const payload = buildHiringNotificationEmailJsPayload(input)
  const { application_url: url, message_html: html } = payload.template_params
  assert.equal(url, `https://flairestack.com/admin/careers/applications/${ID}`)
  assert.ok(html.includes(url))
  assert.match(html, /Review application &amp; resume/)
  assert.match(html, /not attached and is not publicly accessible/)

  const serialized = JSON.stringify(payload)
  assert.doesNotMatch(serialized, /supabase\.co/i)
  assert.doesNotMatch(serialized, /storage\/v1/i)
  assert.doesNotMatch(serialized, /job-resumes/i)
  assert.doesNotMatch(serialized, /signedUrl|token=/i)
})

test('resume is described (name, type, size) but never attached', () => {
  const payload = buildHiringNotificationEmailJsPayload(input)
  const params = payload.template_params
  assert.ok(params.message_html.includes('Jane Doe — CV.pdf'))
  assert.match(params.message_html, /PDF/)
  assert.match(params.message_html, /240 KB/)
  assert.equal(params.resume_filename, 'Jane Doe — CV.pdf')
  assert.equal('attachments' in payload, false)
  assert.equal('attachments' in params, false)
  assert.doesNotMatch(JSON.stringify(payload), /data:application|base64/i)
})

test('only https profile links are rendered; javascript: links are dropped', () => {
  const html = buildHiringNotificationEmailJsPayload(input).template_params.message_html
  assert.ok(html.includes('https://linkedin.com/in/jane'))
  assert.ok(html.includes('Case study'))
  assert.doesNotMatch(html, /javascript:/i)
})

test('applicant-controlled values are HTML-escaped', () => {
  const html = buildHiringNotificationHtml({
    jobTitle: '<script>alert(1)</script>',
    adminUrl: buildAdminApplicationUrl('https://flairestack.com', ID),
    application: {
      ...application,
      firstName: '<img src=x onerror=alert(1)>',
      lastName: 'O"Brien',
      currentCompany: '"><script>x</script>',
    },
  })
  assert.doesNotMatch(html, /<script>/i)
  assert.doesNotMatch(html, /<img src=x/i)
  assert.match(html, /&lt;script&gt;/)
  assert.match(html, /O&quot;Brien/)
})

test('CR/LF cannot be smuggled into the subject, reply_to or job title', () => {
  const payload = buildHiringNotificationEmailJsPayload({
    ...input,
    jobTitle: 'Engineer\r\nBcc: evil@example.com',
    application: { ...application, lastName: 'Doe\nBcc: x@example.com', email: 'a@b.co\r\nBcc: z@z.co' },
  })
  const { subject, job_title: jobTitle, reply_to: replyTo } = payload.template_params
  for (const value of [subject, jobTitle, replyTo]) assert.doesNotMatch(value, /[\r\n]/)
})

test('an invalid application id produces no link (no path injection)', () => {
  assert.equal(buildAdminApplicationUrl('https://flairestack.com', '../../etc/passwd'), '')
  assert.equal(buildAdminApplicationUrl('https://flairestack.com', ''), '')
  assert.equal(isUuid(ID), true)
  assert.equal(isUuid(`${ID}/extra`), false)
  const payload = buildHiringNotificationEmailJsPayload({
    ...input,
    application: { ...application, id: 'not-a-uuid' },
  })
  assert.equal(payload.template_params.application_url, '')
  assert.doesNotMatch(payload.template_params.message_html, /Review application/)
})

test('resume size formatting', () => {
  assert.equal(formatResumeSize(512), '1 KB')
  assert.equal(formatResumeSize(5 * 1024 * 1024), '5.0 MB')
  assert.equal(formatResumeSize(0), 'unknown size')
})

test('notification uses Careers env vars only; the inquiry service/template is never read or modified', () => {
  const careers = resolveApplicationEmailConfig({
    EMAILJS_APPLICATION_SERVICE_ID: 'service_careers',
    EMAILJS_APPLICATION_TEMPLATE_ID: 'template_careers',
    EMAILJS_PUBLIC_KEY: 'pub',
    NEXT_PUBLIC_EMAILJS_SERVICE_ID: 'service_inquiry',
    NEXT_PUBLIC_EMAILJS_TEMPLATE_ID: 'template_inquiry',
  })
  assert.equal(careers.serviceId, 'service_careers')
  assert.equal(careers.templateId, 'template_careers')

  for (const file of ['./hiringNotificationEmail.js', './careersApplicationEmails.js']) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.doesNotMatch(text, /inquiry/i, file)
    assert.doesNotMatch(text, /NEXT_PUBLIC_EMAILJS_(SERVICE|TEMPLATE)/, file)
  }
})
