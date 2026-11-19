/**
 * Browser-side flow for the Applicants "View" and "Download" resume buttons.
 *
 * The browser never receives a permanent or public URL: it asks the authenticated
 * admin API for a fresh, short-lived signed link on every click, uses it immediately to
 * fetch the file, and forgets it. The signed URL is only ever the target of a background
 * `fetch()`. It is NEVER placed in a tab, a navigation, history, or a downloadable link:
 * the browser is only ever handed a same-origin `blob:` URL built from the fetched bytes.
 * There is deliberately no "open the signed URL directly" fallback; if the file cannot be
 * fetched the user gets a clear error and a Retry that mints a completely new link.
 *
 * View     → a tab is opened synchronously inside the click (popup blockers allow
 *            that), then shown the PDF in the browser's own viewer. DOCX cannot be
 *            rendered by browsers, so no tab is opened: the original file is downloaded
 *            unchanged and the caller is told so (`previewUnavailable`).
 * Download → saved straight to the device under the original filename. No tab.
 *
 * Failures are classified (`ResumeAccessError.kind`) so the UI can word them properly and
 * decide whether a Retry makes sense:
 *   expired      400 whose body says `InvalidJWT` → ONE automatic refresh, then give up
 *   unauthorized 401 / 403                        → never retried as an expiry
 *   timeout      no complete answer within 20 s   → distinct from an expired link
 *   network      the request could not be made    → "Couldn't load the resume…"
 */

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** How long a single file fetch (request + body) may take before it is aborted. */
export const RESUME_FETCH_TIMEOUT_MS = 20_000

/** Blob URLs are revoked later so a tab reload or the viewer's own re-read still works. */
const VIEW_BLOB_LIFETIME_MS = 10 * 60 * 1000
const DOWNLOAD_BLOB_LIFETIME_MS = 60 * 1000

export const RESUME_ERROR_MESSAGES = Object.freeze({
  network: 'Couldn’t load the resume. Check your connection and try again.',
  timeout: 'Loading the resume took too long. Please try again.',
  expired: 'The resume link expired before it could be opened. Please try again.',
  unauthorized: 'You don’t have permission to open this resume.',
  not_found: 'The resume file could not be found.',
  popup_blocked: 'Your browser blocked the new tab. Allow pop-ups for this site and try again.',
  failed: 'Unable to retrieve the resume. Please try again.',
})

/** Kinds for which pressing Retry cannot help. */
const NOT_RETRYABLE = new Set(['unauthorized', 'not_found'])

/** @typedef {keyof typeof RESUME_ERROR_MESSAGES} ResumeErrorKind */

export class ResumeAccessError extends Error {
  /**
   * @param {string} message
   * @param {{ kind?: ResumeErrorKind }} [details]
   */
  constructor(message, details = {}) {
    super(message)
    this.name = 'ResumeAccessError'
    /** @type {ResumeErrorKind} */
    this.kind = details.kind ?? 'failed'
    /** Whether offering a Retry makes sense for this failure. */
    this.retryable = !NOT_RETRYABLE.has(this.kind)
  }
}

/** @param {ResumeErrorKind} kind */
export function resumeError(kind) {
  return new ResumeAccessError(RESUME_ERROR_MESSAGES[kind], { kind })
}

/**
 * Runs one task at a time; a second call while one is running is ignored (returns
 * `undefined` instead of starting). The task starts synchronously, which the "View" tab
 * needs so it is opened inside the user's click.
 */
export function createExclusiveRunner() {
  let running = false
  return {
    get busy() {
      return running
    },
    /**
     * @template T
     * @param {() => Promise<T>} task
     * @returns {Promise<T> | undefined}
     */
    run(task) {
      if (running) return undefined
      running = true
      let promise
      try {
        promise = Promise.resolve(task())
      } catch (err) {
        running = false
        return Promise.reject(err)
      }
      return promise.finally(() => {
        running = false
      })
    },
  }
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
 *   fetchFile: (url: string, signal: AbortSignal) => Promise<Response>,
 *   createObjectUrl: (blob: Blob) => string,
 *   revokeObjectUrl: (url: string) => void,
 *   saveFile: (blobUrl: string, filename: string) => void,
 *   schedule: (fn: () => void, ms: number) => void,
 *   timeoutMs?: number,
 * }} ResumeDeps
 */

/**
 * Did storage reject the link as expired? Only a 400 whose JSON body explicitly names
 * `InvalidJWT` qualifies; any other 400 is just a failure.
 *
 * @param {Response} response
 * @returns {Promise<boolean>}
 */
async function isExpiredLinkResponse(response) {
  if (response.status !== 400) return false
  try {
    const body = JSON.parse(await response.text())
    return body?.error === 'InvalidJWT' || body?.code === 'InvalidJWT'
  } catch {
    return false
  }
}

/**
 * One fetch of the signed file under a hard time limit (covers the body download too).
 *
 * @param {ResumeDeps} deps
 * @param {string} url
 * @returns {Promise<{ ok: true, bytes: ArrayBuffer } | { ok: false, status: number, expired: boolean }>}
 */
async function fetchSignedFile(deps, url) {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, deps.timeoutMs ?? RESUME_FETCH_TIMEOUT_MS)

  /** @param {unknown} _err */
  const interrupted = (_err) => resumeError(timedOut ? 'timeout' : 'network')

  try {
    let response
    try {
      response = await deps.fetchFile(url, controller.signal)
    } catch (err) {
      throw interrupted(err)
    }
    if (response.ok) {
      try {
        return { ok: true, bytes: await response.arrayBuffer() }
      } catch (err) {
        throw interrupted(err)
      }
    }
    let expired
    try {
      expired = await isExpiredLinkResponse(response)
    } catch (err) {
      throw interrupted(err)
    }
    return { ok: false, status: response.status, expired }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Fetch the file behind a signed link into a typed Blob.
 *
 * If storage says the link is expired (400 InvalidJWT), ONE completely new link is
 * requested through the authenticated API and the fetch is retried; an expired URL is
 * never reused. Anything else that fails is reported, never retried silently.
 *
 * @param {ResumeDeps} deps
 * @param {ResumeLink} link
 * @param {'view' | 'download'} linkMode  mode to use if a fresh link is needed
 * @returns {Promise<{ blob: Blob, link: ResumeLink }>}
 */
async function readSignedFile(deps, link, linkMode) {
  let current = link
  for (let attempt = 0; ; attempt += 1) {
    const result = await fetchSignedFile(deps, current.url)
    if (result.ok) {
      return { blob: new Blob([result.bytes], { type: current.mimeType }), link: current }
    }
    if (result.expired && attempt === 0) {
      current = await deps.requestLink(linkMode)
      continue
    }
    if (result.expired) throw resumeError('expired')
    if (result.status === 401 || result.status === 403) throw resumeError('unauthorized')
    if (result.status === 404) throw resumeError('not_found')
    throw resumeError('failed')
  }
}

/**
 * The browser may only ever be handed a same-origin blob: URL, never the signed URL.
 *
 * @param {string} objectUrl
 */
function assertBlobUrl(objectUrl) {
  if (typeof objectUrl !== 'string' || !objectUrl.startsWith('blob:')) {
    throw resumeError('failed')
  }
}

/**
 * @param {ResumeDeps} deps
 * @param {ResumeLink} link
 */
async function downloadLink(deps, link) {
  const { blob, link: used } = await readSignedFile(deps, link, 'download')
  const objectUrl = deps.createObjectUrl(blob)
  assertBlobUrl(objectUrl)
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
    if (!tab) throw resumeError('popup_blocked')
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
      const { blob } = await readSignedFile(deps, link, 'view')
      const objectUrl = deps.createObjectUrl(blob)
      assertBlobUrl(objectUrl)
      tab.navigate(objectUrl)
      deps.schedule(() => deps.revokeObjectUrl(objectUrl), VIEW_BLOB_LIFETIME_MS)
      return { action: 'viewed', previewUnavailable: false }
    }

    await downloadLink(deps, link)
    return { action: 'downloaded', previewUnavailable: false }
  } catch (err) {
    tab?.close()
    throw err
  }
}
