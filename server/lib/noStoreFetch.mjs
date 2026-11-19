/**
 * `fetch` for server-side Supabase clients that must never be cached.
 *
 * Next.js patches the global `fetch` and, in a GET-only route handler, stores responses
 * in its Data Cache by default (even POSTs and requests carrying an Authorization header,
 * and even with `dynamic = 'force-dynamic'`). That replayed the same Storage signed URL
 * (and the same administrator-check results) on every request. Forcing
 * `cache: 'no-store'` makes every Supabase call a real network request.
 *
 * Everything else the caller passes (method, headers, body, signal, ...) is preserved.
 * The global `fetch` is resolved per call so Next.js's patched fetch, when present,
 * still sees the request (and honours `no-store`).
 *
 * @type {typeof fetch}
 */
export const noStoreFetch = (input, init) => globalThis.fetch(input, { ...init, cache: 'no-store' })
