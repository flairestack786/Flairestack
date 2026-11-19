import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { ResumeAccessError, runResumeAction } from './resumeClient.js'

const PDF = 'application/pdf'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 1, 2, 3])
const SIGNED = 'https://project.supabase.co/storage/v1/object/sign/job-resumes/a/b.pdf?token=t'

/** A fake browser + API. `events` records the exact order things happen in. */
function world({ link, fetchImpl, popupBlocked = false } = {}) {
  const events = []
  const tab = {
    navigate: (url) => events.push(['tab.navigate', url]),
    close: () => events.push(['tab.close']),
  }
  const requested = []
  const deps = {
    openTab() {
      events.push(['openTab'])
      return popupBlocked ? null : tab
    },
    async requestLink(mode) {
      events.push(['requestLink', mode])
      requested.push(mode)
      return (
        link ?? {
          url: SIGNED,
          filename: 'Jane Doe CV.pdf',
          mimeType: PDF,
          inline: mode === 'view',
          previewable: true,
        }
      )
    },
    async fetchFile(url) {
      events.push(['fetchFile', url])
      if (fetchImpl) return fetchImpl(url)
      return new Response(PDF_BYTES, { status: 200, headers: { 'Content-Type': PDF } })
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
  return { deps, events, names, requested }
}

// ── View ────────────────────────────────────────────────────────────────────

test('View PDF: opens the tab synchronously, then shows the PDF as a typed blob', async () => {
  const w = world()
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: PDF })

  assert.deepEqual(result, { action: 'viewed', previewUnavailable: false })
  // The tab opens BEFORE any request is made — still inside the user's click.
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
  // Never downloads, never closes the tab it just filled.
  assert.ok(!w.names().includes('saveFile'))
  assert.ok(!w.names().includes('tab.close'))
})

test('View PDF with no known type still opens a tab and lets the server decide', async () => {
  const w = world()
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: null })
  assert.equal(result.action, 'viewed')
  assert.equal(w.names()[0], 'openTab')
})

test('View falls back to the inline signed link when the file cannot be fetched (CORS/network)', async () => {
  const w = world({
    fetchImpl: () => {
      throw new TypeError('Failed to fetch')
    },
  })
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: PDF })
  assert.equal(result.action, 'viewed')
  assert.deepEqual(w.events.find((e) => e[0] === 'tab.navigate'), ['tab.navigate', SIGNED])
  assert.ok(!w.names().includes('saveFile'))
})

test('View DOCX: no tab is opened; the original file is downloaded and the UI is told why', async () => {
  const w = world({
    link: {
      url: SIGNED.replace('.pdf', '.docx'),
      filename: 'Resume.docx',
      mimeType: DOCX,
      inline: false,
      previewable: false,
    },
    fetchImpl: () => new Response(new Uint8Array([0x50, 0x4b, 3, 4]), { status: 200 }),
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
  // Bytes and declared type are untouched (no conversion).
  assert.deepEqual(w.events.find((e) => e[0] === 'createObjectUrl'), [
    'createObjectUrl',
    DOCX,
    4,
  ])
})

test('View with an unknown type that the server reports as DOCX closes the spare tab and downloads', async () => {
  const w = world({
    link: {
      url: SIGNED,
      filename: 'Resume.docx',
      mimeType: DOCX,
      inline: false,
      previewable: false,
    },
    fetchImpl: () => new Response(new Uint8Array([0x50, 0x4b, 3, 4]), { status: 200 }),
  })
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: null })
  assert.deepEqual(result, { action: 'downloaded', previewUnavailable: true })
  assert.ok(w.names().includes('openTab'))
  assert.ok(w.names().includes('tab.close'))
  assert.ok(!w.names().includes('tab.navigate'))
})

test('View blocked by a popup blocker fails with a clear message and makes no request', async () => {
  const w = world({ popupBlocked: true })
  await assert.rejects(
    runResumeAction(w.deps, { mode: 'view', mimeType: PDF }),
    (err) => err instanceof ResumeAccessError && /pop-ups/i.test(err.message)
  )
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
})

test('Download DOCX: saved under the original filename and extension', async () => {
  const w = world({
    link: {
      url: SIGNED,
      filename: 'Résumé — J. Doe.docx',
      mimeType: DOCX,
      inline: false,
      previewable: false,
    },
    fetchImpl: () => new Response(new Uint8Array([0x50, 0x4b, 3, 4]), { status: 200 }),
  })
  const result = await runResumeAction(w.deps, { mode: 'download', mimeType: DOCX })
  assert.deepEqual(result, { action: 'downloaded', previewUnavailable: false })
  assert.equal(w.events.find((e) => e[0] === 'saveFile')[2], 'Résumé — J. Doe.docx')
  assert.ok(!w.names().includes('openTab'))
})

test('Download falls back to the attachment signed link when the file cannot be fetched', async () => {
  const w = world({
    fetchImpl: () => {
      throw new TypeError('Failed to fetch')
    },
  })
  await runResumeAction(w.deps, { mode: 'download', mimeType: PDF })
  assert.deepEqual(w.events.find((e) => e[0] === 'saveFile'), [
    'saveFile',
    SIGNED,
    'Jane Doe CV.pdf',
  ])
})

test('blob URLs are revoked later, so nothing lingers', async () => {
  const w = world()
  await runResumeAction(w.deps, { mode: 'download', mimeType: PDF })
  const scheduled = w.events.find((e) => e[0] === 'schedule')
  assert.ok(scheduled && scheduled[1] > 0 && scheduled[1] <= 10 * 60 * 1000)
})

// ── Failure handling ────────────────────────────────────────────────────────

test('expired link (storage 400) becomes a readable message; the spare tab is closed', async () => {
  const w = world({ fetchImpl: () => new Response('{"error":"InvalidJWT"}', { status: 400 }) })
  await assert.rejects(
    runResumeAction(w.deps, { mode: 'view', mimeType: PDF }),
    (err) => err instanceof ResumeAccessError && /expired/i.test(err.message)
  )
  assert.ok(w.names().includes('tab.close'))
  assert.ok(!w.names().includes('tab.navigate'))
})

test('missing file (storage 404) is reported for both actions', async () => {
  for (const mode of ['view', 'download']) {
    const w = world({ fetchImpl: () => new Response('{}', { status: 404 }) })
    await assert.rejects(
      runResumeAction(w.deps, { mode, mimeType: PDF }),
      (err) => err instanceof ResumeAccessError && /could not be found/i.test(err.message),
      mode
    )
    assert.ok(!w.names().includes('saveFile'))
  }
})

test('unauthorized / failed link request closes the tab and surfaces the error', async () => {
  const w = world()
  w.deps.requestLink = async () => {
    throw new Error('You are not authorized to access applicant resumes.')
  }
  await assert.rejects(
    runResumeAction(w.deps, { mode: 'view', mimeType: PDF }),
    /not authorized/
  )
  assert.ok(w.names().includes('tab.close'))
  assert.ok(!w.names().includes('fetchFile'))

  const d = world()
  d.deps.requestLink = async () => {
    throw new Error('Unable to create a resume link. Please try again.')
  }
  await assert.rejects(runResumeAction(d.deps, { mode: 'download', mimeType: PDF }), /Unable to create/)
  assert.ok(!d.names().includes('saveFile'))
})

// ── Wiring and security of the real browser glue ────────────────────────────

const browser = readFileSync(new URL('./next/jobApplicationsBrowser.ts', import.meta.url), 'utf8')

test('the browser glue opens the tab as the first step and never stores or logs a URL', () => {
  assert.match(browser, /window\.open\('', '_blank'\)/)
  assert.match(browser, /tab\.opener = null/)
  assert.match(browser, /credentials: 'omit'/)
  assert.match(browser, /referrerPolicy: 'no-referrer'/)
  assert.doesNotMatch(browser, /localStorage|sessionStorage|console\.(log|info|warn|error)/)
  assert.doesNotMatch(browser, /getPublicUrl/)
})

test('the browser requests links through the authenticated endpoint with a bearer token', () => {
  assert.match(browser, /\/api\/admin\/careers\/applications\/\$\{encodeURIComponent\(applicationId\)\}\/resume\?mode=\$\{mode\}/)
  assert.match(browser, /Authorization: `Bearer \$\{token\}`/)
  assert.match(browser, /isUuid\(applicationId\)/)
})

test('both UIs call openResume straight from the click handler and explain DOCX gracefully', () => {
  for (const file of [
    '../app/admin/careers/applications/jobs/[jobId]/AdminJobApplicantsClient.tsx',
    '../app/admin/careers/applications/[applicationId]/AdminApplicationDetailClient.tsx',
  ]) {
    const text = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.match(text, /previewUnavailable/, file)
    assert.match(text, /can’t be previewed in the browser/, file)
    // The click handler is the first await-bearing step: no awaited work precedes openResume.
    const handler = text.slice(text.indexOf('const handleResume'))
    const before = handler.slice(0, handler.indexOf('openResume('))
    assert.doesNotMatch(before.replace(/const result = await $/, ''), /await /, file)
  }
})

// ── Expired links: refreshed once, never reused ─────────────────────────────

/** Storage rejects the first signed URL as expired, then accepts the fresh one. */
function expiringWorld(extra = {}) {
  const calls = { fetched: [], links: 0 }
  const w = world({
    ...extra,
    fetchImpl: (url) => {
      calls.fetched.push(url)
      if (url.includes('token=stale')) {
        return new Response(
          '{"statusCode":"400","error":"InvalidJWT","message":"\\"exp\\" claim timestamp check failed"}',
          { status: 400 }
        )
      }
      return new Response(PDF_BYTES, { status: 200 })
    },
  })
  const original = w.deps.requestLink
  w.deps.requestLink = async (mode) => {
    calls.links += 1
    const link = await original(mode)
    return { ...link, url: SIGNED.replace('token=t', calls.links === 1 ? 'token=stale' : 'token=fresh') }
  }
  return { w, calls }
}

test('View: an expired link is replaced by one fresh link and the PDF still opens', async () => {
  const { w, calls } = expiringWorld()
  const result = await runResumeAction(w.deps, { mode: 'view', mimeType: PDF })

  assert.deepEqual(result, { action: 'viewed', previewUnavailable: false })
  assert.equal(calls.links, 2, 'exactly one refresh')
  assert.equal(calls.fetched.length, 2)
  assert.ok(calls.fetched[0].includes('token=stale'))
  assert.ok(calls.fetched[1].includes('token=fresh'), 'the expired URL is never reused')
  assert.ok(w.names().includes('tab.navigate'))
  assert.ok(!w.names().includes('tab.close'))
  assert.deepEqual(w.requested, ['view', 'view'], 'refresh keeps the inline (view) mode')
})

test('Download: an expired link is replaced by one fresh attachment link', async () => {
  const { w, calls } = expiringWorld()
  const result = await runResumeAction(w.deps, { mode: 'download', mimeType: PDF })
  assert.deepEqual(result, { action: 'downloaded', previewUnavailable: false })
  assert.equal(calls.links, 2)
  assert.deepEqual(w.requested, ['download', 'download'])
  assert.equal(w.events.find((e) => e[0] === 'saveFile')[2], 'Jane Doe CV.pdf')
})

test('Download DOCX / View DOCX recover from an expired link the same way', async () => {
  for (const mode of ['download', 'view']) {
    const calls = { fetched: [] }
    const w = world({
      link: {
        url: SIGNED.replace('token=t', 'token=stale'),
        filename: 'Resume.docx',
        mimeType: DOCX,
        inline: false,
        previewable: false,
      },
      fetchImpl: (url) => {
        calls.fetched.push(url)
        return url.includes('stale')
          ? new Response('{}', { status: 400 })
          : new Response(new Uint8Array([0x50, 0x4b, 3, 4]), { status: 200 })
      },
    })
    // First link is stale; the refreshed one is fresh.
    let n = 0
    const base = w.deps.requestLink
    w.deps.requestLink = async (m) => {
      const link = await base(m)
      n += 1
      return n === 1 ? link : { ...link, url: SIGNED }
    }
    const result = await runResumeAction(w.deps, { mode, mimeType: DOCX })
    assert.equal(result.action, 'downloaded', mode)
    assert.equal(result.previewUnavailable, mode === 'view', mode)
    assert.equal(calls.fetched.length, 2, mode)
    assert.equal(w.events.find((e) => e[0] === 'saveFile')[2], 'Resume.docx', mode)
  }
})

test('a link that is still rejected after one refresh stops with a friendly message (no loop)', async () => {
  let fetches = 0
  const w = world({
    fetchImpl: () => {
      fetches += 1
      return new Response('{"error":"InvalidJWT"}', { status: 400 })
    },
  })
  await assert.rejects(
    runResumeAction(w.deps, { mode: 'view', mimeType: PDF }),
    (err) =>
      err instanceof ResumeAccessError &&
      err.expired === true &&
      /expired/i.test(err.message) &&
      !/InvalidJWT|exp"/.test(err.message)
  )
  assert.equal(fetches, 2, 'one original attempt + one refreshed attempt, then give up')
  assert.equal(w.requested.length, 2)
  assert.ok(w.names().includes('tab.close'))
})

test('a missing file is not mistaken for an expiry (no refresh)', async () => {
  const w = world({ fetchImpl: () => new Response('{}', { status: 404 }) })
  await assert.rejects(runResumeAction(w.deps, { mode: 'download', mimeType: PDF }), /could not be found/)
  assert.equal(w.requested.length, 1)
})

test('every click mints its own link: nothing is carried over between actions', async () => {
  const w = world()
  await runResumeAction(w.deps, { mode: 'download', mimeType: PDF })
  await runResumeAction(w.deps, { mode: 'download', mimeType: PDF })
  assert.equal(w.requested.length, 2)
})

// ── No pre-generation, caching or persistence ───────────────────────────────

test('signed links are requested only inside the click flow, never on page load or stored', () => {
  const pages = [
    '../app/admin/careers/applications/jobs/[jobId]/AdminJobApplicantsClient.tsx',
    '../app/admin/careers/applications/[applicationId]/AdminApplicationDetailClient.tsx',
  ].map((f) => readFileSync(new URL(f, import.meta.url), 'utf8'))

  for (const text of pages) {
    assert.doesNotMatch(text, /requestResumeLink|createSignedUrl|signedUrl|\/resume\?/)
    // Only openResume (click handler) touches resumes; it is never called from an effect/load.
    assert.equal((text.match(/openResume\(/g) ?? []).length, 1)
    const handler = text.indexOf('const handleResume')
    assert.ok(text.indexOf('openResume(') > handler)
    assert.doesNotMatch(text.slice(0, handler), /useEffect\([^)]*openResume/s)
  }
  assert.doesNotMatch(browser, /useState|useRef|localStorage|sessionStorage|caches\./)
  assert.match(browser, /cache: 'no-store'/)
  assert.equal((browser.match(/requestResumeLink\(/g) ?? []).length, 2) // definition + the one call in openResume
})

test('the resume endpoint is never cacheable, so a stale link cannot be replayed from cache', () => {
  const route = readFileSync(
    new URL('../app/api/admin/careers/applications/[applicationId]/resume/route.ts', import.meta.url),
    'utf8'
  )
  assert.match(route, /export const dynamic = 'force-dynamic'/)
  assert.match(route, /'Cache-Control': 'private, no-store'/)
  assert.doesNotMatch(route, /console\.(log|info|warn|error)\([^)]*(signed|url|filename|email)/i)
})
