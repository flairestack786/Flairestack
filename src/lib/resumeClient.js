/**
 * Browser-side flow for the Applicants "View" and "Download" resume buttons.
 *
 * The browser never receives a permanent or public URL: it asks the authenticated
 * admin API for a fresh, short-lived signed link on every click, uses it immediately,
 * and forgets it (links are never stored, cached or reused). If storage reports a link as
 * expired, one new link is requested automatically before any error is shown.
 *
 * View     → a tab is opened synchronously inside the click (popup blockers allow
 *            that), then shown the PDF in the browser's own viewer. DOCX cannot be
 *            rendered by browsers, so no tab is opened: the original file is downloaded
 *            unchanged and the caller is told so (`previewUnavailable`).
 * Download → saved straight to the device under the original filename. No tab.
 *
 * The file is fetched with the signed link and handed to the browser as a typed Blob so
 * that the PDF viewer and the saved filename don't depend on storage response headers,
 * and so an expired link becomes a readable message instead of a JSON page. If that
 * fetch can't run (network/CORS), the signed link itself is used as a fallback.
 */

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** Blob URLs are revoked later so a tab reload or the viewer's own re-read still works. */
const VIEW_BLOB_LIFETIME_MS = 10 * 60 * 1000
const DOWNLOAD_BLOB_LIFETIME_MS = 60 * 1000

export class ResumeAccessError extends Error {
  /**
   * @param {string} message
   * @param {{ expired?: boolean }} [details]
   */
  constructor(message, details = {}) {
    super(message)
    this.name = 'ResumeAccessError'
    /** True when storage rejected the signed link (expired/invalid token). */
    this.expired = Boolean(details.expired)
  }
}

/** @param {number} status */
function messageForStorageStatus(status) {
  if (status === 400 || status === 401 || status === 403) {
    return 'This resume link has expired. Please try again.'
  }
  if (status === 404) return 'The resume file could not be found.'
  return 'Unable to retrieve the resume. Please try again.'
}

/**
 * @typedef {{
 *   url: string,
 *   filename: string,
 *   mimeType: string,
 *   inline: boolean,
 *   previewable: boolean,
 * }} ResumeLink
 *
 * @typedef {{ navigate: (url: string) => void, close: () => void }} ResumeTab
 *
 * @typedef {{
 *   openTab: () => ResumeTab | null,
 *   requestLink: (mode: 'view' | 'download') => Promise<ResumeLink>,
 *   fetchFile: (url: string) => Promise<Response>,
 *   createObjectUrl: (blob: Blob) => string,
 *   revokeObjectUrl: (url: string) => void,
 *   saveFile: (href: string, filename: string) => void,
 *   schedule: (fn: () => void, ms: number) => void,
 * }} ResumeDeps
 */

/**
 * Fetch the signed file. Resolves to a typed Blob (plus the link that actually worked), or a
 * `null` blob when the request could not be made at all (network/CORS) so the caller can
 * fall back to the signed link.
 *
 * If storage says the link is expired/invalid (400/401/403), ONE fresh link is requested
 * through the authenticated API and the fetch is retried; an expired link is never reused.
 * Throws ResumeAccessError for a definite answer (still expired, missing, ...).
 *
 * @param {ResumeDeps} deps
 * @param {ResumeLink} link
 * @param {'view' | 'download'} linkMode  mode to use if a fresh link is needed
 * @returns {Promise<{ blob: Blob | null, link: ResumeLink }>}
 */
async function readSignedFile(deps, link, linkMode) {
  let current = link
  for (let attempt = 0; ; attempt += 1) {
    let response
    try {
      response = await deps.fetchFile(current.url)
    } catch {
      return { blob: null, link: current }
    }
    if (response.ok) {
      const bytes = await response.arrayBuffer()
      return { blob: new Blob([bytes], { type: current.mimeType }), link: current }
    }
    const expired = response.status === 400 || response.status === 401 || response.status === 403
    if (expired && attempt === 0) {
      current = await deps.requestLink(linkMode)
      continue
    }
    throw new ResumeAccessError(messageForStorageStatus(response.status), { expired })
  }
}

/**
 * @param {ResumeDeps} deps
 * @param {ResumeLink} link
 */
async function downloadLink(deps, link) {
  const { blob, link: used } = await readSignedFile(deps, link, 'download')
  if (!blob) {
    // The signed link already carries `Content-Disposition: attachment; filename=…`.
    deps.saveFile(used.url, used.filename)
    return
  }
  const objectUrl = deps.createObjectUrl(blob)
  deps.saveFile(objectUrl, used.filename)
  deps.schedule(() => deps.revokeObjectUrl(objectUrl), DOWNLOAD_BLOB_LIFETIME_MS)
}

/**
 * @param {ResumeDeps} deps
 * @param {{ mode: 'view' | 'download', mimeType?: string | null }} options
 *   `mimeType` is the type already known from the applicant row; it only lets a DOCX
 *   skip opening a tab. The server decides authoritatively.
 * @returns {Promise<{ action: 'viewed' | 'downloaded', previewUnavailable: boolean }>}
 */
export async function runResumeAction(deps, options) {
  // Only a file known to be a Word document skips the tab; anything else (including an
  // unknown or legacy generic type) lets the server decide, with the tab already open.
  const expectPreview = options.mode === 'view' && options.mimeType !== DOCX_MIME

  /** @type {ResumeTab | null} */
  let tab = null
  if (expectPreview) {
    // Must happen synchronously inside the click handler — before any await.
    tab = deps.openTab()
    if (!tab) {
      throw new ResumeAccessError(
        'Your browser blocked the new tab. Allow pop-ups for this site and try again.'
      )
    }
  }

  try {
    const link = await deps.requestLink(expectPreview ? 'view' : 'download')

    if (options.mode === 'view' && (!expectPreview || !link.inline)) {
      // Not previewable (e.g. DOCX): deliver the original file as a download instead.
      tab?.close()
      tab = null
      await downloadLink(deps, link)
      return { action: 'downloaded', previewUnavailable: true }
    }

    if (options.mode === 'view' && tab) {
      const { blob, link: used } = await readSignedFile(deps, link, 'view')
      if (blob) {
        const objectUrl = deps.createObjectUrl(blob)
        tab.navigate(objectUrl)
        deps.schedule(() => deps.revokeObjectUrl(objectUrl), VIEW_BLOB_LIFETIME_MS)
      } else {
        tab.navigate(used.url) // inline signed link; the browser renders the PDF
      }
      return { action: 'viewed', previewUnavailable: false }
    }

    await downloadLink(deps, link)
    return { action: 'downloaded', previewUnavailable: false }
  } catch (err) {
    tab?.close()
    throw err
  }
}
