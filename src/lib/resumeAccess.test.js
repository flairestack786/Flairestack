import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  DOCX_MIME,
  PDF_MIME,
  RESUME_BUCKET,
  RESUME_SIGNED_URL_TTL_SECONDS,
  isValidResumeStoragePath,
  parseResumeMode,
  planResumeAccess,
  resumeMimeFromFilename,
  resumeMimeFromPath,
  safeResumeFilename,
} from './resumeAccess.js'
import { validateResumeIdentity } from './jobApplicationValidation.js'

const JOB = '11111111-1111-4111-8111-111111111111'
const FILE = '22222222-2222-4222-8222-222222222222'
const PDF_PATH = `${JOB}/${FILE}.pdf`
const DOCX_PATH = `${JOB}/${FILE}.docx`

test('mode: view and download are accepted, absent defaults to download, anything else is invalid', () => {
  assert.equal(parseResumeMode('view'), 'view')
  assert.equal(parseResumeMode('download'), 'download')
  assert.equal(parseResumeMode(null), 'download')
  assert.equal(parseResumeMode(''), 'download')
  for (const bad of ['inline', 'attachment', 'VIEW', 'view ', 'view,download', '../x', 'true']) {
    assert.equal(parseResumeMode(bad), null, bad)
  }
})

test('only well-formed server-generated object paths are ever signed', () => {
  assert.equal(isValidResumeStoragePath(PDF_PATH), true)
  assert.equal(isValidResumeStoragePath(DOCX_PATH), true)
  for (const bad of [
    '',
    null,
    undefined,
    42,
    `../${FILE}.pdf`,
    `${JOB}/../${FILE}.pdf`,
    `${JOB}/${FILE}.exe`,
    `${JOB}/${FILE}.pdf/extra`,
    `/${JOB}/${FILE}.pdf`,
    `${JOB}//${FILE}.pdf`,
    `other-bucket/${JOB}/${FILE}.pdf`,
    `${JOB}/${FILE}.pdf\n`,
    `${JOB}/${FILE}.PDF.exe`,
    'resume.pdf',
    `${JOB}\\${FILE}.pdf`,
  ]) {
    assert.equal(isValidResumeStoragePath(bad), false, String(bad))
  }
})

test('content type comes from the stored object path, not the browser-reported value', () => {
  assert.equal(resumeMimeFromPath(PDF_PATH), PDF_MIME)
  assert.equal(resumeMimeFromPath(DOCX_PATH), DOCX_MIME)
  assert.equal(resumeMimeFromPath(`${JOB}/${FILE}.PDF`), PDF_MIME)
  assert.equal(resumeMimeFromPath('nope.pdf'), null)
  assert.equal(resumeMimeFromFilename('Jane CV.PDF'), PDF_MIME)
  assert.equal(resumeMimeFromFilename('cv.docx'), DOCX_MIME)
  assert.equal(resumeMimeFromFilename('cv'), null)
  assert.equal(resumeMimeFromFilename(null), null)
})

test('VIEW a PDF: inline disposition, no download filename forced, correct type', () => {
  const plan = planResumeAccess({
    mode: 'view',
    storagePath: PDF_PATH,
    originalFilename: 'Jane Doe CV.pdf',
  })
  assert.equal(plan.ok, true)
  assert.equal(plan.inline, true)
  assert.equal(plan.disposition, 'inline')
  assert.equal(plan.previewable, true)
  assert.equal(plan.mimeType, PDF_MIME)
  // No `download` option → the signed URL does not force Content-Disposition: attachment.
  assert.equal(plan.signOptions, undefined)
})

test('DOWNLOAD a PDF: attachment disposition with the original filename', () => {
  const plan = planResumeAccess({
    mode: 'download',
    storagePath: PDF_PATH,
    originalFilename: 'Jane Doe CV.pdf',
  })
  assert.equal(plan.ok, true)
  assert.equal(plan.inline, false)
  assert.equal(plan.disposition, 'attachment')
  assert.equal(plan.filename, 'Jane Doe CV.pdf')
  assert.deepEqual(plan.signOptions, { download: 'Jane Doe CV.pdf' })
})

test('VIEW a DOCX is not previewable: served as an unchanged download and flagged', () => {
  const plan = planResumeAccess({
    mode: 'view',
    storagePath: DOCX_PATH,
    originalFilename: 'Resume.docx',
  })
  assert.equal(plan.ok, true)
  assert.equal(plan.previewable, false)
  assert.equal(plan.inline, false)
  assert.equal(plan.disposition, 'attachment')
  assert.equal(plan.mimeType, DOCX_MIME)
  assert.deepEqual(plan.signOptions, { download: 'Resume.docx' })
})

test('DOWNLOAD a DOCX: attachment, original filename and extension', () => {
  const plan = planResumeAccess({
    mode: 'download',
    storagePath: DOCX_PATH,
    originalFilename: 'Résumé — J. Doe.docx',
  })
  assert.equal(plan.ok, true)
  assert.equal(plan.filename, 'Résumé — J. Doe.docx')
  assert.equal(plan.disposition, 'attachment')
})

test('a malformed stored path is rejected as not found (never signed)', () => {
  for (const mode of ['view', 'download']) {
    const plan = planResumeAccess({
      mode,
      storagePath: `${JOB}/../../secrets.pdf`,
      originalFilename: 'x.pdf',
    })
    assert.deepEqual(plan, { ok: false, status: 404, error: 'Resume not found.' })
  }
})

test('filenames are safe for headers and save dialogs and keep the right extension', () => {
  assert.equal(safeResumeFilename('My CV.pdf', PDF_MIME), 'My CV.pdf')
  assert.equal(safeResumeFilename('My CV.PDF', PDF_MIME), 'My CV.PDF')
  assert.equal(safeResumeFilename('My CV', PDF_MIME), 'My CV.pdf')
  assert.equal(safeResumeFilename('cv.docx', PDF_MIME), 'cv.docx.pdf')
  assert.equal(safeResumeFilename('', DOCX_MIME), 'resume.docx')
  assert.equal(safeResumeFilename(null, PDF_MIME), 'resume.pdf')
  assert.equal(safeResumeFilename('../../etc/passwd', PDF_MIME), 'etc passwd.pdf')
  assert.equal(safeResumeFilename('C:\\Users\\x\\cv.pdf', PDF_MIME), 'C Users x cv.pdf')
  assert.equal(safeResumeFilename('.hidden.pdf', PDF_MIME), 'hidden.pdf')

  const nasty = safeResumeFilename('a"b\r\nContent-Type: text/html\u0000;x.pdf', PDF_MIME)
  assert.doesNotMatch(nasty, /["\r\n\u0000;]/)
  assert.ok(nasty.endsWith('.pdf'))
  assert.ok(safeResumeFilename('x'.repeat(500), PDF_MIME).length <= 205)
})

test('uploads always store the type implied by the extension (never octet-stream)', () => {
  for (const reported of ['', 'application/pdf', 'application/octet-stream']) {
    const result = validateResumeIdentity('cv.pdf', reported)
    assert.equal(result.ok, true)
    assert.equal(result.mime, PDF_MIME, reported || '(empty)')
  }
  assert.equal(validateResumeIdentity('cv.docx', 'application/octet-stream').mime, DOCX_MIME)
  assert.equal(validateResumeIdentity('cv.exe', 'application/octet-stream').ok, false)
  assert.equal(validateResumeIdentity('cv.pdf', 'text/html').ok, false)
})

// ── Route wiring ────────────────────────────────────────────────────────────

const route = readFileSync(
  new URL('../app/api/admin/careers/applications/[applicationId]/resume/route.ts', import.meta.url),
  'utf8'
)

test('resume route order: authenticate → validate id/mode → read row → validate path → sign', () => {
  const order = [
    route.indexOf('authenticateAdministrator('),
    route.indexOf('isUuid(applicationId)'),
    route.indexOf('parseResumeMode('),
    route.indexOf('getSupabaseServiceRole()'),
    route.indexOf('planResumeAccess('),
    route.indexOf('createSignedUrl('),
  ]
  assert.ok(order.every((n) => n > 0), JSON.stringify(order))
  assert.deepEqual(order, [...order].sort((a, b) => a - b))
  assert.match(route, /if \(!auth\.ok\)\s*\{\s*return json\(auth\.body, auth\.status\)/)
})

test('resume route keeps the bucket private, links short-lived, responses uncached and generic', () => {
  assert.equal(RESUME_BUCKET, 'job-resumes')
  // Supabase's createSignedUrl takes SECONDS: exactly five minutes, a whole number.
  assert.equal(RESUME_SIGNED_URL_TTL_SECONDS, 300)
  assert.ok(Number.isInteger(RESUME_SIGNED_URL_TTL_SECONDS))
  assert.doesNotMatch(route, /\b(60|300)\b\s*(\*|,|\))/, 'no hard-coded duration in the route')
  assert.match(route, /\.createSignedUrl\(\s*String\(data\.resume_storage_path\),\s*RESUME_SIGNED_URL_TTL_SECONDS,/)
  assert.match(route, /createSignedUrl\(/)
  assert.match(route, /RESUME_SIGNED_URL_TTL_SECONDS/)
  assert.doesNotMatch(route, /getPublicUrl|createSignedUrls|public:\s*true/)
  assert.match(route, /private, no-store/)
  assert.doesNotMatch(route, /error: (error|signError)\.message/)
  assert.doesNotMatch(route, /disposition'\)|searchParams\.get\('disposition'/)
})

test('the resume bucket is never made public anywhere in the code base', () => {
  const sql = readFileSync(
    new URL('../../supabase/migrations/20261114010000_job_applications.sql', import.meta.url),
    'utf8'
  )
  assert.match(sql, /'job-resumes',\s*'job-resumes',\s*false/)
  assert.doesNotMatch(sql, /public\s*=\s*true/i)
})
