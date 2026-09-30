'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'

/**
 * Next browser client for privileged admin user-management calls.
 * Hits Next Route Handlers under `/api/admin/*` (service-role stays server-side).
 */
async function adminFetch(path: string, options: RequestInit = {}) {
  const supabase = getSupabaseBrowser()
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

  let body: Record<string, unknown> | null = null
  try {
    body = (await response.json()) as Record<string, unknown>
  } catch {
    body = null
  }

  if (!response.ok) {
    throw new Error(
      (body?.error as string | undefined) ?? `Request failed (${response.status}).`
    )
  }

  return body
}

export async function sendUserInvite(input: {
  email: string
  full_name?: string
  role?: string
}) {
  return adminFetch('/users/invite', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function resendUserInvite(inviteId: string) {
  return adminFetch(`/users/invites/${inviteId}/resend`, { method: 'POST' })
}

export async function revokeUserInviteAuth(inviteId: string) {
  return adminFetch(`/users/invites/${inviteId}/revoke`, { method: 'POST' })
}

/**
 * Mark the caller's pending invitation as accepted (after password setup).
 * Safe for password-reset sessions with no invite (server returns skipped).
 * Server: authenticateBearerUser + handleAcceptInvite (service-role stays server-side).
 */
export async function acceptUserInvite() {
  return adminFetch('/users/invites/accept', { method: 'POST' })
}

export async function disableUserAuth(userId: string) {
  return adminFetch(`/users/${userId}/disable`, { method: 'POST' })
}

export async function enableUserAuth(userId: string) {
  return adminFetch(`/users/${userId}/enable`, { method: 'POST' })
}

export async function sendPasswordReset(userId: string) {
  return adminFetch(`/users/${userId}/reset-password`, { method: 'POST' })
}

export async function syncUserRoleAuth(userId: string, role: string) {
  return adminFetch(`/users/${userId}/role`, {
    method: 'POST',
    body: JSON.stringify({ role }),
  })
}
