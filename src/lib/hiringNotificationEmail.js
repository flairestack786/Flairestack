/**
 * Hiring-team notification for a new job application (pure helpers, Node-test safe).
 *
 * Delivery choice: the resume is NOT attached. EmailJS attachments need a paid plan
 * with a Variable Attachment configured on the template and are capped at
 * 500 KB / 2 MB / 30 MB depending on plan, below our 5 MB upload limit. Instead the
 * email links to the authenticated admin application page; the file itself is only
 * ever served through the administrator-only signed-URL endpoint (60 s expiry).
 * No public Storage URL is created.
 */

import {
  CAREERS_EMAIL_FROM,
  CAREERS_NOTIFICATION_EMAIL,
} from './applicationConfirmationEmail.js'
import { JOB_PROFILE_LINK_LABELS, isValidHttpsUrl } from './jobApplicationValidation.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const RESUME_TYPE_LABELS = Object.freeze({
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
})

/** @param {unknown} value */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Header-safe single line (no CR/LF or control characters). */
function headerSafe(value, max = 160) {
  // eslint-disable-next-line no-control-regex
  return String(value ?? '').replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** @param {unknown} value */
export function isUuid(value) {
  return typeof value === 'string' && UUID_PATTERN.test(value)
}

/**
 * Authenticated admin page for one application. Empty string for an invalid id.
 * @param {string} origin e.g. https://flairestack.com
 * @param {unknown} applicationId
 */
export function buildAdminApplicationUrl(origin, applicationId) {
  if (!isUuid(applicationId)) return ''
  const base = String(origin || '').replace(/\/+$/, '')
  return `${base}/admin/careers/applications/${String(applicationId).toLowerCase()}`
}

/** @param {unknown} bytes */
export function formatResumeSize(bytes) {
  const n = Number(bytes)
  if (!Number.isFinite(n) || n <= 0) return 'unknown size'
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

/** @param {unknown} mime */
export function labelResumeType(mime) {
  return RESUME_TYPE_LABELS[String(mime ?? '')] || 'Document'
}

/**
 * @typedef {{
 *   id: string,
 *   firstName: string,
 *   lastName: string,
 *   email: string,
 *   phone: string,
 *   currentJobTitle?: string,
 *   currentCompany?: string,
 *   location?: string,
 *   yearsExperience?: string,
 *   noticePeriod?: string,
 *   profileLinks?: { platform?: string, url?: string, label?: string }[],
 *   resumeFilename: string,
 *   resumeMime: string,
 *   resumeSize: number,
 * }} HiringNotificationApplication
 */

/**
 * @param {{ application: HiringNotificationApplication, jobTitle: string, adminUrl: string }} input
 */
export function buildHiringNotificationHtml(input) {
  const { application: a, jobTitle, adminUrl } = input
  const fullName = `${a.firstName} ${a.lastName}`.trim()
  const row = (label, value) =>
    value
      ? `<tr><td style="padding:6px 14px 6px 0;color:rgba(255,255,255,0.55);font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:6px 0;color:#ffffff;font-size:14px;">${value}</td></tr>`
      : ''

  const links = (Array.isArray(a.profileLinks) ? a.profileLinks : [])
    .filter((link) => link && isValidHttpsUrl(link.url))
    .map((link) => {
      const platform = String(link.platform || 'other')
      const label =
        platform === 'other' && link.label
          ? link.label
          : JOB_PROFILE_LINK_LABELS[platform] || 'Link'
      const href = escapeHtml(link.url)
      return `${escapeHtml(label)}: <a href="${href}" style="color:#ff7a00;text-decoration:none;">${href}</a>`
    })
    .join('<br/>')

  const resumeLine = `${escapeHtml(a.resumeFilename)} · ${escapeHtml(labelResumeType(a.resumeMime))} · ${escapeHtml(formatResumeSize(a.resumeSize))}`
  const button = adminUrl
    ? `<tr><td style="padding-top:22px;"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#ff7a00;color:#0a0a0a;font-weight:700;font-size:14px;text-decoration:none;padding:11px 20px;border-radius:10px;">Review application &amp; resume</a></td></tr>
            <tr><td style="padding-top:12px;font-size:12px;line-height:1.6;color:rgba(255,255,255,0.5);">Sign in to the FlaireStack admin portal to view or download the resume. The file is not attached and is not publicly accessible.</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#0a0a0a;color:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:600px;background:#121212;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;">
            <tr><td style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;color:#ff7a00;font-weight:700;">FlaireStack Careers</td></tr>
            <tr><td style="padding-top:16px;font-size:21px;font-weight:700;color:#ffffff;">New application: ${escapeHtml(jobTitle)}</td></tr>
            <tr><td style="padding-top:6px;font-size:15px;color:rgba(255,255,255,0.78);">${escapeHtml(fullName)} has applied for this position.</td></tr>
            <tr><td style="padding-top:18px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                ${row('Name', escapeHtml(fullName))}
                ${row('Email', `<a href="mailto:${escapeHtml(a.email)}" style="color:#ff7a00;text-decoration:none;">${escapeHtml(a.email)}</a>`)}
                ${row('Phone', escapeHtml(a.phone))}
                ${row('Current role', escapeHtml(a.currentJobTitle))}
                ${row('Company', escapeHtml(a.currentCompany))}
                ${row('Location', escapeHtml(a.location))}
                ${row('Experience', escapeHtml(a.yearsExperience))}
                ${row('Notice period', escapeHtml(a.noticePeriod))}
                ${row('Profiles', links)}
                ${row('Resume', resumeLine)}
              </table>
            </td></tr>
            ${button}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/**
 * EmailJS REST payload for the single hiring-team notification.
 * Reuses the existing Careers service/template (its subject / To / body come from
 * template params, exactly like the applicant confirmation).
 *
 * @param {{
 *   serviceId: string,
 *   templateId: string,
 *   publicKey: string,
 *   privateKey?: string,
 *   siteOrigin: string,
 *   jobTitle: string,
 *   application: HiringNotificationApplication,
 * }} input
 */
export function buildHiringNotificationEmailJsPayload(input) {
  const { application: a } = input
  const jobTitle = headerSafe(input.jobTitle, 160) || 'Open Role'
  const fullName = headerSafe(`${a.firstName} ${a.lastName}`, 120)
  const adminUrl = buildAdminApplicationUrl(input.siteOrigin, a.id)
  const subject = `New application — ${jobTitle}: ${fullName}`

  /** @type {Record<string, unknown>} */
  const payload = {
    service_id: input.serviceId,
    template_id: input.templateId,
    user_id: input.publicKey,
    template_params: {
      to_email: CAREERS_NOTIFICATION_EMAIL,
      email: CAREERS_NOTIFICATION_EMAIL,
      first_name: 'Hiring Team',
      job_title: jobTitle,
      subject,
      message_html: buildHiringNotificationHtml({
        application: a,
        jobTitle,
        adminUrl,
      }),
      application_url: adminUrl,
      resume_filename: headerSafe(a.resumeFilename, 240),
      // Reply goes straight to the candidate.
      reply_to: headerSafe(a.email, 254),
      from_email: CAREERS_EMAIL_FROM,
      from_name: 'FlaireStack Hiring Team',
    },
  }
  if (input.privateKey) payload.accessToken = input.privateKey
  return payload
}
