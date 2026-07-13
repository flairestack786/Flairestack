import { supabase } from './supabase'

/**
 * @param {string} path
 * @param {RequestInit} [options]
 */
async function adminFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const token = session?.access_token
  if (!token) {
    throw new Error('You must be signed in to perform this action.')
  }

  const response = await fetch(`/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  })

  let body = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (!response.ok) {
    throw new Error(body?.error ?? `Request failed (${response.status}).`)
  }

  return body
}

/**
 * @param {{ email: string, full_name?: string, role?: string }} input
 */
export async function sendUserInvite(input) {
  return adminFetch('/users/invite', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/**
 * @param {string} inviteId
 */
export async function resendUserInvite(inviteId) {
  return adminFetch(`/users/invites/${inviteId}/resend`, { method: 'POST' })
}

/**
 * @param {string} inviteId
 */
export async function revokeUserInviteAuth(inviteId) {
  return adminFetch(`/users/invites/${inviteId}/revoke`, { method: 'POST' })
}

/**
 * @param {string} userId
 */
export async function disableUserAuth(userId) {
  return adminFetch(`/users/${userId}/disable`, { method: 'POST' })
}

/**
 * @param {string} userId
 */
export async function enableUserAuth(userId) {
  return adminFetch(`/users/${userId}/enable`, { method: 'POST' })
}

/**
 * @param {string} userId
 */
export async function sendPasswordReset(userId) {
  return adminFetch(`/users/${userId}/reset-password`, { method: 'POST' })
}

/**
 * @param {string} userId
 * @param {'administrator' | 'editor' | 'sales'} role
 */
export async function syncUserRoleAuth(userId, role) {
  return adminFetch(`/users/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}
