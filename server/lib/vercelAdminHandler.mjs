import {
  authenticateAdministrator,
  authenticateBearerUser,
} from '../middleware/requireAdministrator.mjs'

/**
 * Build a Vercel serverless handler that:
 * - accepts POST only
 * - requires an active administrator Bearer token
 * - calls a shared adminUsersHandlers function
 *
 * @param {(ctx: {
 *   body: Record<string, unknown>,
 *   params: Record<string, string>,
 *   adminProfile: Record<string, unknown>,
 * }) => Promise<{ status: number, body: Record<string, unknown> }>} operation
 * @param {(query: Record<string, string | string[] | undefined>) => Record<string, string>} [mapParams]
 */
export function createAdminPostHandler(operation, mapParams = () => ({})) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed.' })
    }

    const auth = await authenticateAdministrator(req.headers.authorization || req.headers.Authorization)
    if (!auth.ok) {
      return res.status(auth.status).json(auth.body)
    }

    const query = /** @type {Record<string, string | string[] | undefined>} */ (req.query || {})
    const params = mapParams(query)
    const body =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? /** @type {Record<string, unknown>} */ (req.body)
        : {}

    const result = await operation({
      body,
      params,
      adminProfile: auth.adminProfile,
    })

    return res.status(result.status).json(result.body)
  }
}

/**
 * POST handler for authenticated (non-admin) callers — e.g. invite acceptance.
 *
 * @param {(ctx: {
 *   body: Record<string, unknown>,
 *   params: Record<string, string>,
 *   authUser: import('@supabase/supabase-js').User,
 * }) => Promise<{ status: number, body: Record<string, unknown> }>} operation
 * @param {(query: Record<string, string | string[] | undefined>) => Record<string, string>} [mapParams]
 */
export function createAuthenticatedPostHandler(operation, mapParams = () => ({})) {
  return async function handler(req, res) {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Method not allowed.' })
    }

    const auth = await authenticateBearerUser(req.headers.authorization || req.headers.Authorization)
    if (!auth.ok) {
      return res.status(auth.status).json(auth.body)
    }

    const query = /** @type {Record<string, string | string[] | undefined>} */ (req.query || {})
    const params = mapParams(query)
    const body =
      req.body && typeof req.body === 'object' && !Array.isArray(req.body)
        ? /** @type {Record<string, unknown>} */ (req.body)
        : {}

    const result = await operation({
      body,
      params,
      authUser: auth.authUser,
    })

    return res.status(result.status).json(result.body)
  }
}

/**
 * @param {Record<string, string | string[] | undefined>} query
 * @param {string} key
 */
export function readQueryParam(query, key) {
  const value = query[key]
  if (Array.isArray(value)) return String(value[0] ?? '')
  return value == null ? '' : String(value)
}
