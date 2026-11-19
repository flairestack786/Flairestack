import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import {
  RESUME_ERROR_MESSAGES,
  RESUME_FETCH_TIMEOUT_MS,
  ResumeAccessError,
  createExclusiveRunner,
  runResumeAction,
} from './resumeClient.js'

const PDF = 'application/pdf'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2, 3])
const DOCX_BYTES = new Uint8Array([0x50, 0x4b, 3, 4])
const SIGNED_HOST = 'project.supabase.co'
const signedUrl = (n = 1) =>
  `https://${SIGNED_HOST}/storage/v1/object/sign/job-resumes/a/b.pdf?token=t${n}`

const EXPIRED_BODY =
  '{"statusCode":"400","error":"InvalidJWT","message":"\\"exp\\" claim timestamp check failed","code":"InvalidJWT"}'

const expiredResponse = () => new Response(EXPIRED_BODY, { status: 400 })
const okPdf = () => new Response(PDF_BYTES, { status: 200, headers: { 'Content-Type': PDF } })
const abortError = () => new DOMException('The operation was aborted.', 'AbortError')

/** A fake browser + API. `events` records the exact order things happen in. */
function world({ link, fetchImpl, popupBlocked = false, timeoutMs } = {}) {
  const events = []
  const fetched = []
  const tab = {
    navigate: (url) => events.push(['tab.navigate', url]),
    close: () => events.push(['tab.close']),
  }
  const requested = []
  let minted = 0
  const deps = {
    timeoutMs,
    openTab() {
      events.push(['openTab'])
      return popupBlocked ? null : tab
    },
    async requestLink(mode) {
      events.push(['requestLink', mode])
      requested.push(mode)
      minted += 1
      return (
        link ?? {
          url: signedUrl(minted),
          filename: 'Jane Doe CV.pdf',
          mimeType: PDF,
          inline: mode === 'view',
          previewable: true,
        }
      )
    },
    async fetchFile(url, signal) {
      events.push(['fetchFile', url])
      fetched.push({ url, signal })
      return fetchImpl ? fetchImpl(url, signal, fetched.length) : okPdf()
    },
    createObjectUrl(blob) {
      events.push(['createObjectUrl', blob.type, blob.size])
      return 'blob:https://admin.test/1234'
    },
    revokeObjectUrl: (url) => events.push(['revoke', url]),
    saveFile: (href, filename) => events.push(['saveFile', href, filename]),
    schedule: (fn, ms) => events.push(['schedule', ms]),
  }
  const names = () => events.map((e) => e[0])
  return { deps, events, names, requested, fetched }
}

/** The signed URL may only ever appear as the target of the background fetch. */
function assertSignedUrlNeverExposed(w) {
  for (const event of w.events) {
    if (event[0] === 'fetchFile') continue
    assert.ok(
      !JSON.stringify(event).includes(SIGNED_HOST),
      `signed URL leaked into ${event[0]}: ${JSON.stringify(event)}`
    )
  }
}

const rejection = (promise) =>
  promise.then(
    () => assert.fail('expected the action to fail'),
    (err) => err
  )

// ── View ────────────────────────────────────────────────────────────────────

test('View PDF: opens the tab synchronously, then shows the PDF from a typed blob', async () => {
  const w = world()
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: PDF })

  assert.deepEqual(result, { action: 'viewed', previewUnavailable: false })
  assert.equal(w.names()[0], 'openTab')
  assert.ok(w.names().indexOf('openTab') < w.names().indexOf('requestLink'))
  assert.deepEqual(w.requested, ['view'])
  assert.deepEqual(w.events.find((e) => e[0] === 'createObjectUrl'), [
    'createObjectUrl',
    PDF,
    PDF_BYTES.length,
  ])
  assert.deepEqual(w.events.find((e) => e[0] === 'tab.navigate'), [
    'tab.navigate',
    'blob:https://admin.test/1234',
  ])
  assert.ok(!w.names().includes('saveFile'))
  assert.ok(!w.names().includes('tab.close'))
  assertSignedUrlNeverExposed(w)
})

test('View with no known type still opens a tab and lets the server decide', async () => {
  const w = world()
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: null })
  assert.equal(result.action, 'viewed')
  assert.equal(w.names()[0], 'openTab')
})

test('View DOCX: no tab; the original file is downloaded and the UI is told why', async () => {
  const w = world({
    link: {
      url: signedUrl(),
      filename: 'Resume.docx',
      mimeType: DOCX,
      inline: false,
      previewable: false,
    },
    fetchImpl: () => new Response(DOCX_BYTES, { status: 200 }),
  })
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: DOCX })

  assert.deepEqual(result, { action: 'downloaded', previewUnavailable: true })
  assert.ok(!w.names().includes('openTab'), 'no blank tab for a DOCX')
  assert.deepEqual(w.requested, ['download'])
  assert.deepEqual(w.events.find((e) => e[0] === 'saveFile'), [
    'saveFile',
    'blob:https://admin.test/1234',
    'Resume.docx',
  ])
  assert.deepEqual(w.events.find((e) => e[0] === 'createObjectUrl'), [
    'createObjectUrl',
    DOCX,
    DOCX_BYTES.length,
  ])
  assertSignedUrlNeverExposed(w)
})

test('View of a type the server reports as DOCX closes the spare tab and downloads', async () => {
  const w = world({
    link: {
      url: signedUrl(),
      filename: 'Resume.docx',
      mimeType: DOCX,
      inline: false,
      previewable: false,
    },
    fetchImpl: () => new Response(DOCX_BYTES, { status: 200 }),
  })
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: null })
  assert.deepEqual(result, { action: 'downloaded', previewUnavailable: true })
  assert.ok(w.names().includes('tab.close'))
  assert.ok(!w.names().includes('tab.navigate'))
  assertSignedUrlNeverExposed(w)
})

test('View blocked by a popup blocker: clear, retryable error and no request', async () => {
  const w = world({ popupBlocked: true })
  const err = await rejection(runResumeAction(w.deps, { mode: 'view', mimeType: PDF }))
  assert.ok(err instanceof ResumeAccessError)
  assert.equal(err.kind, 'popup_blocked')
  assert.equal(err.retryable, true)
  assert.match(err.message, /pop-ups/i)
  assert.ok(!w.names().includes('requestLink'))
})

// ── Download ────────────────────────────────────────────────────────────────

test('Download PDF: saved under the original filename, no tab, not displayed inline', async () => {
  const w = world()
  const result = await runResumeAction(w.deps, { mode: 'download', mimeType: PDF })

  assert.deepEqual(result, { action: 'downloaded', previewUnavailable: false })
  assert.deepEqual(w.requested, ['download'])
  assert.ok(!w.names().includes('openTab'))
  assert.ok(!w.names().includes('tab.navigate'))
  assert.deepEqual(w.events.find((e) => e[0] === 'saveFile'), [
    'saveFile',
    'blob:https://admin.test/1234',
    'Jane Doe CV.pdf',
  ])
  assertSignedUrlNeverExposed(w)
})

test('Download DOCX: saved under the original filename and extension', async () => {
  const w = world({
    link: {
      url: signedUrl(),
      filename: 'Résumé — J. Doe.docx',
      mimeType: DOCX,
      inline: false,
      previewable: false,
    },
    fetchImpl: () => new Response(DOCX_BYTES, { status: 200 }),
  })
  const result = await runResumeAction(w.deps, { mode: 'download', mimeType: DOCX })
  assert.deepEqual(result, { action: 'downloaded', previewUnavailable: false })
  assert.equal(w.events.find((e) => e[0] === 'saveFile')[2], 'Résumé — J. Doe.docx')
  assert.ok(!w.names().includes('openTab'))
  assertSignedUrlNeverExposed(w)
})

test('blob URLs are revoked later, so nothing lingers', async () => {
  const w = world()
  await runResumeAction(w.deps, { mode: 'download', mimeType: PDF })
  const scheduled = w.events.find((e) => e[0] === 'schedule')
  assert.ok(scheduled && scheduled[1] > 0 && scheduled[1] <= 10 * 60 * 1000)
})

// ── No direct signed-URL fallback: it is impossible ─────────────────────────

test('network failure: View shows the connection error, closes the tab, never navigates to the URL', async () => {
  const w = world({
    fetchImpl: () => {
      throw new TypeError('Failed to fetch')
    },
  })
  const err = await rejection(runResumeAction(w.deps, { mode: 'view', mimeType: PDF }))

  assert.ok(err instanceof ResumeAccessError)
  assert.equal(err.kind, 'network')
  assert.equal(err.message, 'Couldn’t load the resume. Check your connection and try again.')
  assert.equal(err.retryable, true)
  assert.ok(w.names().includes('tab.close'))
  assert.ok(!w.names().includes('tab.navigate'))
  assert.ok(!w.names().includes('saveFile'))
  assert.equal(w.fetched.length, 1, 'a network failure is not retried as an expiry')
  assert.equal(w.requested.length, 1, 'no refresh for a network failure')
  assertSignedUrlNeverExposed(w)
})

test('network failure: Download shows the connection error and saves nothing', async () => {
  const w = world({
    fetchImpl: () => {
      throw new TypeError('Failed to fetch')
    },
  })
  const err = await rejection(runResumeAction(w.deps, { mode: 'download', mimeType: PDF }))
  assert.equal(err.kind, 'network')
  assert.ok(!w.names().includes('saveFile'))
  assert.ok(!w.names().includes('createObjectUrl'))
  assertSignedUrlNeverExposed(w)
})

test('a body that fails mid-download is a network error, not an expiry', async () => {
  const w = world({
    fetchImpl: () => ({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.reject(new TypeError('network error')),
    }),
  })
  const err = await rejection(runResumeAction(w.deps, { mode: 'download', mimeType: PDF }))
  assert.equal(err.kind, 'network')
  assert.equal(w.requested.length, 1)
})

test('the browser is only ever handed a blob: URL — anything else is refused', async () => {
  for (const mode of ['view', 'download']) {
    const w = world()
    w.deps.createObjectUrl = () => signedUrl() // a broken adapter must not leak the signed URL
    const err = await rejection(runResumeAction(w.deps, { mode, mimeType: PDF }))
    assert.ok(err instanceof ResumeAccessError, mode)
    assert.ok(!w.names().includes('tab.navigate'), mode)
    assert.ok(!w.names().includes('saveFile'), mode)
    assertSignedUrlNeverExposed(w)
  }
})

// ── Expired links (400 InvalidJWT only) ─────────────────────────────────────

/** First link is rejected as expired; the freshly minted one works. */
function expiringWorld(extra = {}) {
  return world({
    ...extra,
    fetchImpl: (url, signal, n) => (n === 1 ? expiredResponse() : (extra.fetchImpl?.() ?? okPdf())),
  })
}

test('View: an InvalidJWT 400 triggers exactly one fresh link and the PDF opens', async () => {
  const w = expiringWorld()
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: PDF })

  assert.deepEqual(result, { action: 'viewed', previewUnavailable: false })
  assert.deepEqual(w.requested, ['view', 'view'], 'one refresh, same (inline) mode')
  assert.equal(w.fetched.length, 2)
  assert.notEqual(w.fetched[0].url, w.fetched[1].url, 'the expired URL is never reused')
  assert.equal(w.fetched[1].url, signedUrl(2))
  assert.ok(!w.names().includes('tab.close'))
  assertSignedUrlNeverExposed(w)
})

test('Download PDF and DOCX recover from an expired link the same way', async () => {
  const pdf = expiringWorld()
  assert.equal(
    (await runResumeAction(pdf.deps, { mode: 'download', mimeType: PDF })).action,
    'downloaded'
  )
  assert.deepEqual(pdf.requested, ['download', 'download'])
  assert.equal(pdf.events.find((e) => e[0] === 'saveFile')[2], 'Jane Doe CV.pdf')

  const docx = expiringWorld({
    link: {
      url: signedUrl(),
      filename: 'Resume.docx',
      mimeType: DOCX,
      inline: false,
      previewable: false,
    },
    fetchImpl: () => new Response(DOCX_BYTES, { status: 200 }),
  })
  const result = await runResumeAction(docx.deps, { mode: 'view', mimeType: DOCX })
  assert.deepEqual(result, { action: 'downloaded', previewUnavailable: true })
  assert.equal(docx.fetched.length, 2)
  assert.equal(docx.events.find((e) => e[0] === 'saveFile')[2], 'Resume.docx')
})

test('a link still expired after the one refresh gives a friendly retryable error (no loop)', async () => {
  const w = world({ fetchImpl: () => expiredResponse() })
  const err = await rejection(runResumeAction(w.deps, { mode: 'view', mimeType: PDF }))
  assert.equal(err.kind, 'expired')
  assert.equal(err.retryable, true)
  assert.equal(err.message, RESUME_ERROR_MESSAGES.expired)
  assert.doesNotMatch(err.message, /InvalidJWT|exp"/)
  assert.equal(w.fetched.length, 2, 'original attempt + exactly one refreshed attempt')
  assert.equal(w.requested.length, 2)
  assert.ok(w.names().includes('tab.close'))
})

test('only a 400 that explicitly says InvalidJWT counts as expired', async () => {
  const notExpired = [
    new Response('{"error":"Bad request"}', { status: 400 }),
    new Response('', { status: 400 }),
    new Response('<html>nope</html>', { status: 400 }),
    new Response('{"message":"jwt"}', { status: 400 }),
  ]
  for (const response of notExpired) {
    const w = world({ fetchImpl: () => response })
    const err = await rejection(runResumeAction(w.deps, { mode: 'download', mimeType: PDF }))
    assert.equal(err.kind, 'failed')
    assert.equal(w.requested.length, 1, 'no refresh for a generic 400')
    assert.equal(w.fetched.length, 1)
  }
  // The same body with a different status is not an expiry either.
  for (const status of [401, 403, 404, 500]) {
    const w = world({ fetchImpl: () => new Response(EXPIRED_BODY, { status }) })
    const err = await rejection(runResumeAction(w.deps, { mode: 'download', mimeType: PDF }))
    assert.notEqual(err.kind, 'expired', String(status))
    assert.equal(w.requested.length, 1, String(status))
  }
})

// ── Authorization, missing file, server errors ──────────────────────────────

test('401 and 403 are authorization errors: never retried, no refresh, not offered Retry', async () => {
  for (const status of [401, 403]) {
    for (const mode of ['view', 'download']) {
      const w = world({ fetchImpl: () => new Response('{"error":"Unauthorized"}', { status }) })
      const err = await rejection(runResumeAction(w.deps, { mode, mimeType: PDF }))
      assert.equal(err.kind, 'unauthorized', `${status} ${mode}`)
      assert.equal(err.retryable, false)
      assert.equal(err.message, RESUME_ERROR_MESSAGES.unauthorized)
      assert.equal(w.fetched.length, 1)
      assert.equal(w.requested.length, 1, 'no new link for an authorization error')
      assert.ok(!w.names().includes('saveFile'))
      assert.ok(!w.names().includes('tab.navigate'))
    }
  }
})

test('404 is "not found" (not retryable); other statuses are a retryable failure', async () => {
  const missing = world({ fetchImpl: () => new Response('{}', { status: 404 }) })
  const e404 = await rejection(runResumeAction(missing.deps, { mode: 'download', mimeType: PDF }))
  assert.equal(e404.kind, 'not_found')
  assert.equal(e404.retryable, false)
  assert.equal(missing.requested.length, 1)

  const broken = world({ fetchImpl: () => new Response('oops', { status: 503 }) })
  const e503 = await rejection(runResumeAction(broken.deps, { mode: 'view', mimeType: PDF }))
  assert.equal(e503.kind, 'failed')
  assert.equal(e503.retryable, true)
  assert.equal(broken.requested.length, 1)
})

test('a failed link request (unauthorized / server) closes the tab and surfaces its own error', async () => {
  const w = world()
  w.deps.requestLink = async () => {
    throw new ResumeAccessError(RESUME_ERROR_MESSAGES.unauthorized, { kind: 'unauthorized' })
  }
  const err = await rejection(runResumeAction(w.deps, { mode: 'view', mimeType: PDF }))
  assert.equal(err.kind, 'unauthorized')
  assert.ok(w.names().includes('tab.close'))
  assert.ok(!w.names().includes('fetchFile'))
})

// ── Timeout ─────────────────────────────────────────────────────────────────

test('the file fetch has a 20-second limit', () => {
  assert.equal(RESUME_FETCH_TIMEOUT_MS, 20_000)
})

test('a request that never answers is aborted and reported as a timeout, not an expiry', async () => {
  const w = world({
    timeoutMs: 25,
    fetchImpl: (url, signal) =>
      new Promise((_, reject) => signal.addEventListener('abort', () => reject(abortError()))),
  })
  const err = await rejection(runResumeAction(w.deps, { mode: 'view', mimeType: PDF }))

  assert.equal(err.kind, 'timeout')
  assert.equal(err.message, RESUME_ERROR_MESSAGES.timeout)
  assert.equal(err.retryable, true)
  assert.equal(w.fetched.length, 1, 'a timeout is not retried automatically')
  assert.equal(w.requested.length, 1, 'and does not request a refreshed link')
  assert.ok(w.fetched[0].signal instanceof AbortSignal)
  assert.equal(w.fetched[0].signal.aborted, true)
  assert.ok(w.names().includes('tab.close'))
  assertSignedUrlNeverExposed(w)
})

test('a body that stalls mid-download also times out', async () => {
  const w = world({
    timeoutMs: 25,
    fetchImpl: (url, signal) => ({
      ok: true,
      status: 200,
      arrayBuffer: () =>
        new Promise((_, reject) => signal.addEventListener('abort', () => reject(abortError()))),
    }),
  })
  const err = await rejection(runResumeAction(w.deps, { mode: 'download', mimeType: PDF }))
  assert.equal(err.kind, 'timeout')
  assert.ok(!w.names().includes('saveFile'))
})

test('a fast response is not aborted and its timer is cleared', async () => {
  const w = world({ timeoutMs: 25 })
  await runResumeAction(w.deps, { mode: 'download', mimeType: PDF })
  await new Promise((resolve) => setTimeout(resolve, 60))
  assert.equal(w.fetched[0].signal.aborted, false)
})

// ── Retry and duplicate clicks ──────────────────────────────────────────────

test('Retry mints a completely new link every time (nothing is cached or reused)', async () => {
  const w = world({
    fetchImpl: (url, signal, n) => {
      if (n === 1) throw new TypeError('Failed to fetch')
      return okPdf()
    },
  })
  await rejection(runResumeAction(w.deps, { mode: 'download', mimeType: PDF }))
  await runResumeAction(w.deps, { mode: 'download', mimeType: PDF }) // the Retry

  assert.equal(w.requested.length, 2)
  assert.deepEqual(
    w.fetched.map((f) => f.url),
    [signedUrl(1), signedUrl(2)]
  )
})

test('repeated clicks run once: a second request while one is running is ignored', async () => {
  const runner = createExclusiveRunner()
  let started = 0
  let release
  const gate = new Promise((resolve) => (release = resolve))

  const first = runner.run(async () => {
    started += 1
    await gate
    return 'done'
  })
  assert.equal(started, 1, 'the task starts synchronously (the View tab needs the click)')
  assert.equal(runner.busy, true)
  assert.equal(runner.run(async () => (started += 1)), undefined)
  assert.equal(runner.run(async () => (started += 1)), undefined)
  assert.equal(started, 1)

  release()
  assert.equal(await first, 'done')
  assert.equal(runner.busy, false)
  assert.equal(await runner.run(async () => 'again'), 'again', 'free again after it finishes')
})

test('the exclusive runner frees itself after a failure or a synchronous throw', async () => {
  const runner = createExclusiveRunner()
  await rejection(runner.run(async () => Promise.reject(new Error('boom'))))
  assert.equal(runner.busy, false)
  await rejection(
    runner.run(() => {
      throw new Error('sync boom')
    })
  )
  assert.equal(runner.busy, false)
  assert.equal(await runner.run(async () => 1), 1)
})

// ── Source-level guarantees ─────────────────────────────────────────────────

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const stripComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const clientSource = stripComments(read('./resumeClient.js'))
const browser = read('./next/jobApplicationsBrowser.ts')

test('resumeClient.js can only use the signed URL for the background fetch', () => {
  const uses = clientSource.match(/\.url\b/g) ?? []
  assert.equal(uses.length, 1, 'the signed URL is read in exactly one place')
  assert.match(clientSource, /fetchSignedFile\(deps, current\.url\)/)
  // Tab navigation and saving are given the blob URL only.
  assert.deepEqual(clientSource.match(/\.navigate\([^)]*\)/g), ['.navigate(objectUrl)'])
  assert.deepEqual(clientSource.match(/\.saveFile\([^)]*\)/g), ['.saveFile(objectUrl, used.filename)'])
  assert.match(clientSource, /assertBlobUrl\(objectUrl\)/)
  // The old fallbacks are gone.
  assert.doesNotMatch(clientSource, /readSignedFile[^\n]*null|blob:\s*null|if \(!blob\)/)
  assert.doesNotMatch(clientSource, /saveFile\((used|link|current)\.url/)
  assert.doesNotMatch(clientSource, /navigate\((used|link|current)\.url/)
  assert.doesNotMatch(clientSource, /\b(window|document)\.|\blocation\./)
})

test('the browser glue never navigates, links or stores the signed URL', () => {
  assert.match(browser, /window\.open\('', '_blank'\)/)
  assert.doesNotMatch(browser, /window\.open\([^'\s)]/, 'window.open is only ever given a blank target')
  assert.match(browser, /tab\.opener = null/)
  assert.doesNotMatch(browser, /location\.href|location\.assign|window\.location/)
  assert.match(browser, /tab\.location\.replace\(url\)/)
  assert.match(browser, /if \(!href\.startsWith\('blob:'\)\) throw/)
  assert.match(browser, /credentials: 'omit'/)
  assert.match(browser, /referrerPolicy: 'no-referrer'/)
  assert.match(browser, /signal,\s*\}\)/, 'the abort signal is passed to the file fetch')
  assert.doesNotMatch(browser, /localStorage|sessionStorage|console\.(log|info|warn|error)/)
  assert.doesNotMatch(browser, /getPublicUrl|saveFile\(link|anchor\.href = (link|payload)/)
})

test('the link request is authenticated, uncached, time-limited and classifies failures', () => {
  assert.match(browser, /\/api\/admin\/careers\/applications\/\$\{encodeURIComponent\(applicationId\)\}\/resume\?mode=\$\{mode\}/)
  assert.match(browser, /Authorization: `Bearer \$\{token\}`/)
  assert.match(browser, /isUuid\(applicationId\)/)
  assert.match(browser, /cache: 'no-store'/)
  assert.match(browser, /RESUME_FETCH_TIMEOUT_MS/)
  assert.match(browser, /controller\.abort\(\)/)
  assert.match(browser, /response\.status === 401 \|\| response\.status === 403\) throw resumeError\('unauthorized'\)/)
  assert.match(browser, /resumeError\(timedOut \? 'timeout' : 'network'\)/)
})

test('the placeholder tab gives clear feedback while loading', () => {
  assert.match(browser, /function renderResumePlaceholder/)
  assert.match(browser, /Opening resume…/)
  assert.match(browser, /role', 'status'/)
  assert.match(browser, /prefers-reduced-motion/)
  assert.match(browser, /renderResumePlaceholder\(tab\)/)
})

// ── Both Applicants pages ───────────────────────────────────────────────────

const PAGES = [
  '../app/admin/careers/applications/jobs/[jobId]/AdminJobApplicantsClient.tsx',
  '../app/admin/careers/applications/[applicationId]/AdminApplicationDetailClient.tsx',
]

test('both pages use the shared hook and show a persistent error with Retry', () => {
  for (const file of PAGES) {
    const text = read(file)
    assert.match(text, /useResumeActions\(\)/, file)
    assert.match(text, /import ResumeFailureNotice from/, file)
    assert.match(text, /<ResumeFailureNotice[\s\S]*?onRetry=\{retryResume\}[\s\S]*?onDismiss=\{dismissResume\}/, file)
    // No private copy of the flow, no signed-URL handling, no toast-only error.
    assert.doesNotMatch(text, /openResume|requestResumeLink|createSignedUrl|signedUrl|\/resume\?/, file)
    assert.doesNotMatch(text, /toast\.error\(.*resume/i, file)
    // The click handler starts the action synchronously (popup-blocker safe).
    const handler = text.slice(text.indexOf('const handleResume'))
    const body = handler.slice(0, handler.indexOf('runResume('))
    assert.doesNotMatch(body, /await |async |setTimeout/, file)
    // Both buttons stay disabled while an action is running.
    assert.ok((text.match(/disabled=\{Boolean\(busyResume\)\}/g) ?? []).length >= 2, file)
  }
})

test('the hook allows one action at a time, retries through the same path and keeps no URL', () => {
  const hook = read('../components/admin/useResumeActions.ts')
  assert.match(hook, /createExclusiveRunner\(\)/)
  assert.match(hook, /runner\.current\.run\(async \(\) => \{/)
  // openResume is the first awaited thing; nothing async happens before it.
  const task = hook.slice(hook.indexOf('runner.current.run('))
  const beforeOpen = task.slice(0, task.indexOf('openResume(')).replace(/const result = await $/, '')
  assert.doesNotMatch(beforeOpen, /await /)
  assert.match(hook, /if \(failure\?\.retryable\) run\(failure\)/)
  assert.match(hook, /retryable: known \? known\.retryable : true/)
  assert.doesNotMatch(hook, /\burl\b|localStorage|sessionStorage/i)
})

test('the error notice is accessible, themed and only offers Retry when it can help', () => {
  const notice = read('../components/admin/ResumeFailureNotice.tsx')
  assert.match(notice, /role="alert"/)
  assert.match(notice, /failure\.retryable \? \(/)
  assert.match(notice, /onClick=\{onRetry\}/)
  assert.match(notice, /disabled=\{busy\}/)
  assert.match(notice, /className="admin-settings-retry"/)
  const css = read('../admin-dashboard.css')
  for (const cls of [
    '.admin-applicants-resume-error',
    '.admin-applicants-resume-error-text',
    '.admin-applicants-resume-error-actions',
  ]) {
    assert.ok(css.includes(cls), cls)
  }
})
