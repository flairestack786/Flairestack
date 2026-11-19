/**
 * Regression tests for the "same signed URL on every click" production bug.
 *
 * These run the REAL supabase-js client through the REAL Next.js 14 fetch patch
 * (`patchFetch`) with the real Data Cache key function, configured exactly like the
 * GET-only resume route handler. Only the network (a fake Supabase origin that mints a new
 * token on every call) and the cache storage (an in-memory map) are simulated.
 */
import assert from 'node:assert/strict'
import { AsyncLocalStorage } from 'node:async_hooks'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { test } from 'node:test'
import { createClient } from '@supabase/supabase-js'
import { noStoreFetch } from '../../server/lib/noStoreFetch.mjs'
import { runResumeAction } from './resumeClient.js'

const require = createRequire(import.meta.url)
// patchFetch wraps the origin in a per-render de-duplication layer built on React's
// server-only `cache()`. Outside a render that is a passthrough; provide exactly that so the
// real Next.js module loads under plain Node. The Data Cache logic under test is untouched.
const React = require('react')
if (typeof React.cache !== 'function') React.cache = (fn) => fn
const { patchFetch } = require('next/dist/server/lib/patch-fetch.js')
const { IncrementalCache } = require('next/dist/server/lib/incremental-cache/index.js')

const SUPABASE = 'https://project.supabase.co'
const KEY = 'service-role-key-for-tests'
const PATH = '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.pdf'
const TTL = 300

// ── Fake Supabase origin (the real network is never touched) ────────────────

const origin = {
  now: 1_800_000_000, // seconds; tests move this forward to simulate time passing
  signCalls: 0,
  authCalls: 0,
  profileCalls: 0,
  profileStatus: 'active',
}

/** The fetch Next.js wraps. Every call is a genuinely new signing/auth/profile request. */
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url)
  if (url.pathname.startsWith('/storage/v1/object/sign/')) {
    origin.signCalls += 1
    const body = JSON.parse(init.body)
    const token = `iat${origin.now}.exp${origin.now + body.expiresIn}.n${origin.signCalls}`
    return Response.json({ signedURL: `${url.pathname.slice('/storage/v1'.length)}?token=${token}` })
  }
  if (url.pathname === '/auth/v1/user') {
    origin.authCalls += 1
    return Response.json({ id: 'admin-1', aud: 'authenticated', role: 'authenticated' })
  }
  if (url.pathname === '/rest/v1/profiles') {
    origin.profileCalls += 1
    return Response.json({ id: 'admin-1', role: 'administrator', status: origin.profileStatus })
  }
  return new Response('not found', { status: 404 })
}

// ── Real Next.js fetch patch with an in-memory Data Cache ───────────────────

const staticGenerationAsyncStorage = new AsyncLocalStorage()
patchFetch({
  serverHooks: { DynamicServerError: class DynamicServerError extends Error {} },
  staticGenerationAsyncStorage,
})
assert.equal(globalThis.fetch.__nextPatched, true, 'Next.js fetch patch is active')

const fetchCacheKey = IncrementalCache.prototype.fetchCacheKey
function createDataCache() {
  const entries = new Map()
  return {
    entries,
    fetchCacheKey: (url, init) => fetchCacheKey.call({ fetchCacheKeyPrefix: '' }, url, init),
    lock: async () => async () => {},
    get: async (key) => (entries.has(key) ? { value: entries.get(key), isStale: false } : null),
    set: async (key, value) => {
      entries.set(key, value)
    },
  }
}

/**
 * One request to a GET-only route handler with `dynamic = 'force-dynamic'`, as Next 14.2
 * sets it up (app-route module): `forceDynamic = true`, `revalidate ??= false`, and
 * `fetchCache` taken from the route's export. The Data Cache persists across requests.
 */
function routeRequest(dataCache, { fetchCache } = {}, handler) {
  const store = {
    urlPathname: '/api/admin/careers/applications/x/resume',
    isStaticGeneration: false,
    forceDynamic: true,
    revalidate: false,
    fetchCache,
    incrementalCache: dataCache,
    tags: [],
  }
  return staticGenerationAsyncStorage.run(store, handler)
}

const plainClient = () => createClient(SUPABASE, KEY, { auth: { persistSession: false } })
const fixedClient = () =>
  createClient(SUPABASE, KEY, { auth: { persistSession: false }, global: { fetch: noStoreFetch } })

async function sign(client, options) {
  const { data, error } = await client.storage.from('job-resumes').createSignedUrl(PATH, TTL, options)
  assert.equal(error, null)
  return data.signedUrl
}

const tokenOf = (url) => new URL(url).searchParams.get('token')
const issuedAt = (url) => Number(tokenOf(url).match(/^iat(\d+)/)[1])

function reset() {
  origin.signCalls = 0
  origin.authCalls = 0
  origin.profileCalls = 0
  origin.profileStatus = 'active'
}

// ── The bug, reproduced with the real libraries ─────────────────────────────

test('ROOT CAUSE: createSignedUrl is a POST, and Next caches it in a GET-only force-dynamic route', async () => {
  reset()
  const cache = createDataCache()
  const client = plainClient()

  const first = await routeRequest(cache, {}, () => sign(client))
  origin.now += 6 // the second click, six seconds later (as in the diagnostic logs)
  const second = await routeRequest(cache, {}, () => sign(client))

  assert.equal(origin.signCalls, 1, 'the second signing request never reached Supabase')
  assert.equal(second, first, 'the same signed URL (same token) is replayed')
  assert.equal(issuedAt(second), issuedAt(first), 'with the first click’s issue time')
  const [entry] = cache.entries.values()
  assert.equal(entry.kind, 'FETCH')
  assert.match(Buffer.from(entry.data.body, 'base64').toString('utf8'), /"signedURL":"\/object\/sign\//)
  assert.equal(entry.revalidate, 31_536_000, 'cached for one year')

  // Five minutes later the replayed token has expired → Storage answers InvalidJWT, and
  // the automatic refresh gets the very same URL again: "expired before it could be opened".
  origin.now += TTL
  const later = await routeRequest(cache, {}, () => sign(client))
  assert.equal(later, first)
  assert.ok(origin.now > issuedAt(later) + TTL, 'the replayed token is already expired')
})

// ── The fix ─────────────────────────────────────────────────────────────────

test('FIX (client): with noStoreFetch every request is signed independently by Supabase', async () => {
  reset()
  const cache = createDataCache()
  const client = fixedClient()

  const first = await routeRequest(cache, {}, () => sign(client))
  origin.now += 6
  const second = await routeRequest(cache, {}, () => sign(client))

  assert.equal(origin.signCalls, 2, 'each request executed its own signing POST')
  assert.notEqual(second, first)
  assert.equal(issuedAt(second) - issuedAt(first), 6, 'the second token was issued six seconds later')
  assert.equal(cache.entries.size, 0, 'nothing was written to the Data Cache')
})

test('FIX (route): fetchCache = "force-no-store" alone also prevents the replay', async () => {
  reset()
  const cache = createDataCache()
  const client = plainClient()
  await routeRequest(cache, { fetchCache: 'force-no-store' }, () => sign(client))
  await routeRequest(cache, { fetchCache: 'force-no-store' }, () => sign(client))
  assert.equal(origin.signCalls, 2)
  assert.equal(cache.entries.size, 0)
})

test('both safeguards together (the deployed configuration) sign every time', async () => {
  reset()
  const cache = createDataCache()
  const client = fixedClient()
  const urls = []
  for (let i = 0; i < 3; i += 1) {
    urls.push(await routeRequest(cache, { fetchCache: 'force-no-store' }, () => sign(client)))
    origin.now += 1
  }
  assert.equal(origin.signCalls, 3)
  assert.equal(new Set(urls).size, 3)
})

test('a request made after five minutes receives a freshly issued, unexpired URL', async () => {
  reset()
  const cache = createDataCache()
  const client = fixedClient()
  const first = await routeRequest(cache, { fetchCache: 'force-no-store' }, () => sign(client))
  origin.now += TTL + 1
  const later = await routeRequest(cache, { fetchCache: 'force-no-store' }, () => sign(client))

  assert.equal(origin.signCalls, 2)
  assert.equal(issuedAt(later), origin.now, 'issued at the time of the new request')
  assert.ok(issuedAt(later) + TTL > origin.now, 'and valid for the next five minutes')
  assert.notEqual(tokenOf(later), tokenOf(first))
})

test('download links are signed independently too (filename preserved)', async () => {
  reset()
  const cache = createDataCache()
  const client = fixedClient()
  const opts = { download: 'Jane Doe CV.pdf' }
  const a = await routeRequest(cache, { fetchCache: 'force-no-store' }, () => sign(client, opts))
  const b = await routeRequest(cache, { fetchCache: 'force-no-store' }, () => sign(client, opts))
  assert.equal(origin.signCalls, 2)
  assert.notEqual(a, b)
  for (const url of [a, b]) {
    assert.equal(new URL(url).searchParams.get('download'), 'Jane Doe CV.pdf')
  }
})

// ── Expired link → retry gets a genuinely new link (end to end) ─────────────

/** Browser deps where Storage rejects any token issued before `rejectBefore`. */
function browserDeps(requestLink, storageNow) {
  const fetched = []
  return {
    fetched,
    deps: {
      openTab: () => ({ navigate() {}, close() {} }),
      requestLink,
      async fetchFile(url) {
        fetched.push(url)
        const token = tokenOf(url)
        const exp = Number(token.match(/exp(\d+)/)[1])
        return storageNow() >= exp
          ? new Response(
              '{"statusCode":"400","error":"InvalidJWT","message":"\\"exp\\" claim timestamp check failed"}',
              { status: 400 }
            )
          : new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), { status: 200 })
      },
      createObjectUrl: () => 'blob:https://admin.test/1',
      revokeObjectUrl() {},
      saveFile() {},
      schedule() {},
    },
  }
}

const linkFrom = (url) => ({
  url,
  filename: 'cv.pdf',
  mimeType: 'application/pdf',
  inline: false,
  previewable: true,
})

test('expired link → automatic retry receives a genuinely new URL and succeeds', async () => {
  reset()
  const cache = createDataCache()
  const client = fixedClient()
  // An old link (issued > 5 minutes ago) is handed over first, as a stale one would be.
  const stale = await routeRequest(cache, { fetchCache: 'force-no-store' }, () => sign(client))
  origin.now += TTL + 30

  let calls = 0
  const requestLink = async () => {
    calls += 1
    if (calls === 1) return linkFrom(stale)
    return linkFrom(await routeRequest(cache, { fetchCache: 'force-no-store' }, () => sign(client)))
  }
  const world = browserDeps(requestLink, () => origin.now)
  const result = await runResumeAction(world.deps, { mode: 'download', mimeType: 'application/pdf' })

  assert.equal(result.action, 'downloaded')
  assert.equal(world.fetched.length, 2)
  assert.notEqual(world.fetched[1], world.fetched[0], 'the retry used a different URL')
  assert.equal(origin.signCalls, 2, 'the retry executed a new signing request')
})

test('REPRODUCTION of the production message: with the cached client the retry gets the same expired URL', async () => {
  reset()
  const cache = createDataCache()
  const client = plainClient()
  await routeRequest(cache, {}, () => sign(client)) // first ever click fills the Data Cache
  origin.now += TTL + 30 // later clicks happen after the cached token expired

  const requestLink = async () => linkFrom(await routeRequest(cache, {}, () => sign(client)))
  const world = browserDeps(requestLink, () => origin.now)
  await assert.rejects(
    runResumeAction(world.deps, { mode: 'download', mimeType: 'application/pdf' }),
    (err) => err.kind === 'expired' && /expired before it could be opened/.test(err.message)
  )
  assert.equal(world.fetched[0], world.fetched[1], 'the "fresh" link was the same cached URL')
  assert.equal(origin.signCalls, 1)
})

// ── Administrator checks are re-evaluated on every request ──────────────────

async function adminCheck() {
  const auth = createClient(SUPABASE, 'anon', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  })
  const { data: userData } = await auth.auth.getUser('user-access-token')
  const admin = fixedClient()
  const { data: profile } = await admin.from('profiles').select('role, status').eq('id', userData.user.id).maybeSingle()
  return Boolean(profile && profile.role === 'administrator' && profile.status === 'active')
}

test('the administrator check is never served from cache: a deactivated admin is refused next request', async () => {
  reset()
  const cache = createDataCache()
  assert.equal(await routeRequest(cache, { fetchCache: 'force-no-store' }, adminCheck), true)
  origin.profileStatus = 'inactive'
  assert.equal(await routeRequest(cache, { fetchCache: 'force-no-store' }, adminCheck), false)
  assert.equal(origin.authCalls, 2)
  assert.equal(origin.profileCalls, 2)
  assert.equal(cache.entries.size, 0)
})

test('the no-store clients protect the admin check even without the route setting', async () => {
  reset()
  const cache = createDataCache()
  assert.equal(await routeRequest(cache, {}, adminCheck), true)
  origin.profileStatus = 'inactive'
  assert.equal(await routeRequest(cache, {}, adminCheck), false)
  assert.equal(cache.entries.size, 0)
})

// ── noStoreFetch itself ─────────────────────────────────────────────────────

test('noStoreFetch preserves every request option and only forces cache: no-store', async () => {
  const seen = []
  const previous = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    seen.push({ input, init })
    return new Response('ok')
  }
  try {
    const headers = new Headers({ Authorization: 'Bearer x', 'Content-Type': 'application/json' })
    const controller = new AbortController()
    const init = {
      method: 'POST',
      headers,
      body: '{"expiresIn":300}',
      signal: controller.signal,
      redirect: 'follow',
      duplex: 'half',
      cache: 'force-cache',
    }
    await noStoreFetch('https://x.test/a', init)
    const [{ input, init: sent }] = seen
    assert.equal(input, 'https://x.test/a')
    assert.equal(sent.method, 'POST')
    assert.equal(sent.headers, headers, 'headers object passed through untouched')
    assert.equal(sent.body, '{"expiresIn":300}')
    assert.equal(sent.signal, controller.signal)
    assert.equal(sent.redirect, 'follow')
    assert.equal(sent.duplex, 'half')
    assert.equal(sent.cache, 'no-store', 'a caller cannot opt back into caching')
    assert.equal(init.cache, 'force-cache', 'the caller’s object is not mutated')

    await noStoreFetch('https://x.test/b')
    assert.deepEqual(seen[1].init, { cache: 'no-store' })
  } finally {
    globalThis.fetch = previous
  }
})

test('noStoreFetch resolves the global fetch per call (so Next’s patched fetch still applies)', async () => {
  const previous = globalThis.fetch
  let used = ''
  globalThis.fetch = async () => {
    used = 'replacement'
    return new Response('ok')
  }
  try {
    await noStoreFetch('https://x.test')
    assert.equal(used, 'replacement')
  } finally {
    globalThis.fetch = previous
  }
})

// ── Wiring ──────────────────────────────────────────────────────────────────

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

test('every server-side Supabase client used by the resume route opts out of caching', () => {
  const serviceRole = read('./next/supabaseServiceRole.ts')
  assert.match(serviceRole, /import \{ noStoreFetch \} from '..\/..\/..\/server\/lib\/noStoreFetch\.mjs'/)
  assert.match(serviceRole, /global: \{ fetch: noStoreFetch \}/)

  const admin = read('../../server/lib/supabaseAdmin.mjs')
  assert.match(admin, /global: \{ fetch: noStoreFetch \}/)

  const middleware = read('../../server/middleware/requireAdministrator.mjs')
  assert.match(middleware, /createClient\(supabaseUrl, anonKey, \{[\s\S]*?global: \{ fetch: noStoreFetch \}/)

  const route = read('../app/api/admin/careers/applications/[applicationId]/resume/route.ts')
  assert.match(route, /export const dynamic = 'force-dynamic'/)
  assert.match(route, /export const fetchCache = 'force-no-store'/)
  // Authorization still happens first, unchanged.
  assert.ok(route.indexOf('authenticateAdministrator(') < route.indexOf('createSignedUrl('))
})
