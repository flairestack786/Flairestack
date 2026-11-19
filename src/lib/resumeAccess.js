/**
 * Server-side rules for administrator access to a private resume (pure, unit-tested).
 * Used by the authenticated resume route; nothing here touches the network.
 */

export const RESUME_BUCKET = 'job-resumes'

/**
 * Signed-link lifetime, in SECONDS (what Supabase `createSignedUrl(path, expiresIn)` expects).
 * Five minutes: long enough for a slow connection or a reloaded tab, short enough that a
 * leaked link is useless almost immediately. A fresh link is minted on every click.
 * Supabase Storage computes the absolute expiry on its own clock, so server/browser clock
 * skew and time zones cannot shorten it.
 */
export const RESUME_SIGNED_URL_TTL_SECONDS = 5 * 60

export const PDF_MIME = 'application/pdf'
export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const EXTENSION_MIME = Object.freeze({ pdf: PDF_MIME, docx: DOCX_MIME })

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
/** Objects are always written as `<jobId>/<randomUUID>.<pdf|docx>` by /api/careers/apply. */
const RESUME_PATH_PATTERN = new RegExp(`^${UUID}/${UUID}\\.(pdf|docx)$`, 'i')

/**
 * @param {unknown} value
 * @returns {'view' | 'download' | null} null → invalid; absent defaults to download.
 */
export function parseResumeMode(value) {
  if (value == null || value === '') return 'download'
  if (value === 'view' || value === 'download') return value
  return null
}

/**
 * Only well-formed object paths produced by the application route are ever signed:
 * no traversal, no other bucket prefixes, only .pdf / .docx.
 * @param {unknown} path
 */
export function isValidResumeStoragePath(path) {
  return typeof path === 'string' && RESUME_PATH_PATTERN.test(path)
}

/**
 * The file extension in the (server-generated) storage path is the source of truth for
 * the content type — not the browser-reported value stored on the row.
 * @param {unknown} path
 * @returns {string | null}
 */
export function resumeMimeFromPath(path) {
  if (!isValidResumeStoragePath(path)) return null
  const ext = String(path).slice(String(path).lastIndexOf('.') + 1).toLowerCase()
  return EXTENSION_MIME[ext] ?? null
}

/**
 * Type implied by a filename's extension (used by the UI for display and to decide
 * whether a preview tab is worthwhile; the server decides authoritatively).
 * @param {unknown} filename
 * @returns {string | null}
 */
export function resumeMimeFromFilename(filename) {
  const name = String(filename ?? '').trim().toLowerCase()
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? (EXTENSION_MIME[name.slice(dot + 1)] ?? null) : null
}

/**
 * Original filename made safe for a Content-Disposition value / file save dialog:
 * no path separators, quotes, control characters or leading dots, and always ending in
 * the extension that matches the actual file type.
 * @param {unknown} original
 * @param {string} mimeType
 */
export function safeResumeFilename(original, mimeType) {
  const ext = mimeType === PDF_MIME ? '.pdf' : '.docx'
  const cleaned = String(original ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/[\\/:*?"<>|;]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\s]+/, '')
    .slice(0, 200)
    .trim()

  if (!cleaned) return `resume${ext}`
  return cleaned.toLowerCase().endsWith(ext) ? cleaned : `${cleaned}${ext}`
}

/**
 * Decide how a resume may be served.
 *  - view:     inline (no download filename) — only for formats browsers can render (PDF).
 *              DOCX is not previewable, so the server answers with a download instead and
 *              says so (`previewable: false`) so the UI can explain it.
 *  - download: attachment with the original filename.
 *
 * @param {{ mode: 'view' | 'download', storagePath: unknown, originalFilename: unknown }} input
 * @returns {{ ok: false, status: number, error: string } | {
 *   ok: true,
 *   mode: 'view' | 'download',
 *   mimeType: string,
 *   filename: string,
 *   previewable: boolean,
 *   inline: boolean,
 *   disposition: 'inline' | 'attachment',
 *   signOptions: { download: string } | undefined,
 * }}
 */
export function planResumeAccess(input) {
  const mimeType = resumeMimeFromPath(input.storagePath)
  if (!mimeType) return { ok: false, status: 404, error: 'Resume not found.' }

  const filename = safeResumeFilename(input.originalFilename, mimeType)
  const previewable = mimeType === PDF_MIME
  const inline = input.mode === 'view' && previewable

  return {
    ok: true,
    mode: input.mode,
    mimeType,
    filename,
    previewable,
    inline,
    disposition: inline ? 'inline' : 'attachment',
    signOptions: inline ? undefined : { download: filename },
  }
}
