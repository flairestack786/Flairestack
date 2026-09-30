import { NextResponse } from 'next/server'
import {
  authenticateAdministrator,
  authenticateBearerUser,
} from '../../../../../server/middleware/requireAdministrator.mjs'
import {
  handleAcceptInvite,
  handleDisableUser,
  handleEnableUser,
  handleInviteUser,
  handleResendInvite,
  handleResetPassword,
  handleRevokeInvite,
  handleUpdateUserRole,
} from '../../../../../server/lib/adminUsersHandlers.mjs'

export const runtime = 'nodejs'

type HandlerResult = { status: number; body: Record<string, unknown> }

/**
 * Next App Router catch-all for privileged CMS user-management operations.
 * Reuses the same Express/Vercel handlers — service-role never reaches the browser.
 *
 * Mirrors `/api/admin/*` paths used by Vite `adminApi.js`.
 */
export async function POST(
  request: Request,
  context: { params: { path: string[] } }
) {
  const segments = context.params.path ?? []
  const authHeader = request.headers.get('authorization')

  let body: Record<string, unknown> = {}
  try {
    const parsed = await request.json()
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      body = parsed as Record<string, unknown>
    }
  } catch {
    body = {}
  }

  try {
    const result = await dispatchAdminUsers({ segments, body, authHeader })
    return NextResponse.json(result.body, { status: result.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Admin API request failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

type AdminProfile = {
  id: string
  email?: string
  full_name?: string | null
  role?: string
  status?: string
}

function asAdminProfile(profile: Record<string, unknown>): AdminProfile {
  return {
    id: String(profile.id),
    email: profile.email != null ? String(profile.email) : undefined,
    full_name: (profile.full_name as string | null | undefined) ?? null,
    role: profile.role != null ? String(profile.role) : undefined,
    status: profile.status != null ? String(profile.status) : undefined,
  }
}

async function dispatchAdminUsers({
  segments,
  body,
  authHeader,
}: {
  segments: string[]
  body: Record<string, unknown>
  authHeader: string | null
}): Promise<HandlerResult> {
  // POST /api/admin/users/invite
  if (segments[0] === 'users' && segments[1] === 'invite' && segments.length === 2) {
    const auth = await authenticateAdministrator(authHeader)
    if (!auth.ok) return { status: auth.status, body: auth.body }
    return handleInviteUser({
      body,
      adminProfile: asAdminProfile(auth.adminProfile as Record<string, unknown>),
    })
  }

  // POST /api/admin/users/invites/accept
  if (
    segments[0] === 'users' &&
    segments[1] === 'invites' &&
    segments[2] === 'accept' &&
    segments.length === 3
  ) {
    const auth = await authenticateBearerUser(authHeader)
    if (!auth.ok) return { status: auth.status, body: auth.body }
    return handleAcceptInvite({ authUser: auth.authUser })
  }

  // POST /api/admin/users/invites/:inviteId/resend|revoke
  if (
    segments[0] === 'users' &&
    segments[1] === 'invites' &&
    segments.length === 4 &&
    (segments[3] === 'resend' || segments[3] === 'revoke')
  ) {
    const auth = await authenticateAdministrator(authHeader)
    if (!auth.ok) return { status: auth.status, body: auth.body }
    const inviteId = segments[2]
    const adminProfile = asAdminProfile(auth.adminProfile as Record<string, unknown>)
    if (segments[3] === 'resend') {
      return handleResendInvite({
        params: { inviteId },
        adminProfile,
      })
    }
    return handleRevokeInvite({
      params: { inviteId },
      adminProfile,
    })
  }

  // POST /api/admin/users/:userId/disable|enable|role|reset-password
  if (segments[0] === 'users' && segments.length === 3) {
    const auth = await authenticateAdministrator(authHeader)
    if (!auth.ok) return { status: auth.status, body: auth.body }
    const userId = segments[1]
    const action = segments[2]
    const adminProfile = asAdminProfile(auth.adminProfile as Record<string, unknown>)

    if (action === 'disable') {
      return handleDisableUser({
        params: { userId },
        adminProfile,
      })
    }
    if (action === 'enable') {
      return handleEnableUser({
        params: { userId },
        adminProfile,
      })
    }
    if (action === 'role') {
      return handleUpdateUserRole({
        body,
        params: { userId },
        adminProfile,
      })
    }
    if (action === 'reset-password') {
      return handleResetPassword({
        params: { userId },
        adminProfile,
      })
    }
  }

  return { status: 404, body: { error: 'Unknown admin users endpoint.' } }
}
