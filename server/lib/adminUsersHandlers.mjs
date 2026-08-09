import { ensureAdminClient, getSiteUrl } from './supabaseAdmin.mjs'
import { isLastAdminGuardError } from '../middleware/requireAdministrator.mjs'

/**
 * @param {string} email
 */
function normalizeEmail(email) {
  return String(email ?? '').trim().toLowerCase()
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} admin
 * @param {string | null | undefined} userId
 */
async function assertNotLastAdministrator(admin, userId) {
  if (!userId) return

  const { data: target, error } = await admin
    .from('profiles')
    .select('id, role, status')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  if (!target || target.role !== 'administrator' || target.status !== 'active') {
    return
  }

  const { count, error: countError } = await admin
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'administrator')
    .eq('status', 'active')
    .neq('id', userId)

  if (countError) throw countError
  if ((count ?? 0) === 0) {
    throw new Error(
      'Cannot remove the last active Administrator. Assign another Administrator first.'
    )
  }
}

/**
 * @param {string} role
 * @returns {'administrator' | 'editor' | 'sales'}
 */
function normalizeInviteRole(role) {
  if (role === 'editor') return 'editor'
  if (role === 'sales') return 'sales'
  return 'administrator'
}

/**
 * @typedef {{ id: string, email?: string, full_name?: string | null, role?: string, status?: string }} AdminProfile
 * @typedef {{ status: number, body: Record<string, unknown> }} HandlerResult
 */

/**
 * @param {{ body?: Record<string, unknown>, adminProfile: AdminProfile }} ctx
 * @returns {Promise<HandlerResult>}
 */
export async function handleInviteUser(ctx) {
  try {
    const admin = ensureAdminClient()
    const email = normalizeEmail(ctx.body?.email)
    const fullName = String(ctx.body?.full_name ?? ctx.body?.fullName ?? '').trim()
    const role = normalizeInviteRole(/** @type {string} */ (ctx.body?.role))

    if (!email) {
      return { status: 400, body: { error: 'Invite email is required.' } }
    }

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile?.status === 'active') {
      return { status: 409, body: { error: 'A user with this email already exists.' } }
    }

    const { data: pendingInvite } = await admin
      .from('user_invites')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (pendingInvite) {
      return { status: 409, body: { error: 'A pending invite already exists for this email.' } }
    }

    const redirectTo = `${getSiteUrl()}/admin/set-password`

    const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo,
        data: {
          full_name: fullName || null,
          cms_role: role,
        },
      }
    )

    if (inviteError) {
      return { status: 400, body: { error: inviteError.message } }
    }

    if (inviteData?.user?.id) {
      await admin.auth.admin.updateUserById(inviteData.user.id, {
        app_metadata: { cms_role: role },
        user_metadata: {
          full_name: fullName || null,
          cms_role: role,
        },
      })
    }

    const nowIso = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: inviteRow, error: rowError } = await admin
      .from('user_invites')
      .insert({
        email,
        full_name: fullName || null,
        role,
        status: 'pending',
        invited_by: ctx.adminProfile.id,
        invited_at: nowIso,
        expires_at: expiresAt,
        metadata: {
          auth_user_id: inviteData?.user?.id ?? null,
          last_email_sent_at: nowIso,
        },
      })
      .select()
      .single()

    if (rowError) {
      return { status: 500, body: { error: rowError.message } }
    }

    return {
      status: 201,
      body: {
        invite: inviteRow,
        authUserId: inviteData?.user?.id ?? null,
      },
    }
  } catch (err) {
    return { status: 500, body: { error: err?.message ?? 'Failed to send invite.' } }
  }
}

/**
 * @param {{ params: { inviteId: string }, adminProfile: AdminProfile }} ctx
 * @returns {Promise<HandlerResult>}
 */
export async function handleResendInvite(ctx) {
  try {
    const admin = ensureAdminClient()
    const inviteId = ctx.params.inviteId

    const { data: invite, error } = await admin
      .from('user_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .maybeSingle()

    if (error) return { status: 500, body: { error: error.message } }
    if (!invite) return { status: 404, body: { error: 'Pending invite not found.' } }

    const redirectTo = `${getSiteUrl()}/admin/set-password`
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(invite.email, {
      redirectTo,
      data: {
        full_name: invite.full_name,
        cms_role: invite.role,
      },
    })

    if (inviteError) {
      return { status: 400, body: { error: inviteError.message } }
    }

    const nowIso = new Date().toISOString()
    const metadata =
      invite.metadata && typeof invite.metadata === 'object' && !Array.isArray(invite.metadata)
        ? { ...invite.metadata }
        : {}
    metadata.last_email_sent_at = nowIso

    const { data: updated, error: updateError } = await admin
      .from('user_invites')
      .update({ metadata })
      .eq('id', inviteId)
      .select()
      .single()

    if (updateError) return { status: 500, body: { error: updateError.message } }
    return { status: 200, body: { invite: updated } }
  } catch (err) {
    return { status: 500, body: { error: err?.message ?? 'Failed to resend invite.' } }
  }
}

/**
 * @param {{ params: { inviteId: string }, adminProfile: AdminProfile }} ctx
 * @returns {Promise<HandlerResult>}
 */
export async function handleRevokeInvite(ctx) {
  try {
    const admin = ensureAdminClient()
    const inviteId = ctx.params.inviteId

    const { data: invite, error } = await admin
      .from('user_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .maybeSingle()

    if (error) return { status: 500, body: { error: error.message } }
    if (!invite) return { status: 404, body: { error: 'Pending invite not found.' } }

    const authUserId = invite.metadata?.auth_user_id
    if (authUserId) {
      await admin.auth.admin.deleteUser(String(authUserId))
    }

    const { data: updated, error: updateError } = await admin
      .from('user_invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId)
      .select()
      .single()

    if (updateError) return { status: 500, body: { error: updateError.message } }
    return { status: 200, body: { invite: updated } }
  } catch (err) {
    return { status: 500, body: { error: err?.message ?? 'Failed to revoke invite.' } }
  }
}

/**
 * @param {{ params: { userId: string }, adminProfile: AdminProfile }} ctx
 * @returns {Promise<HandlerResult>}
 */
export async function handleDisableUser(ctx) {
  try {
    const admin = ensureAdminClient()
    const userId = ctx.params.userId

    if (userId === ctx.adminProfile.id) {
      return {
        status: 400,
        body: { error: 'You cannot disable your own account while signed in.' },
      }
    }

    await assertNotLastAdministrator(admin, userId)

    const { data: profile, error } = await admin
      .from('profiles')
      .update({ status: 'disabled' })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      const status = isLastAdminGuardError(error.message) ? 409 : 500
      return { status, body: { error: error.message } }
    }

    await admin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h',
    })

    return { status: 200, body: { user: profile } }
  } catch (err) {
    const status = isLastAdminGuardError(err?.message) ? 409 : 500
    return { status, body: { error: err?.message ?? 'Failed to disable user.' } }
  }
}

/**
 * @param {{ params: { userId: string }, adminProfile: AdminProfile }} ctx
 * @returns {Promise<HandlerResult>}
 */
export async function handleEnableUser(ctx) {
  try {
    const admin = ensureAdminClient()
    const userId = ctx.params.userId

    const { data: profile, error } = await admin
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', userId)
      .select()
      .single()

    if (error) return { status: 500, body: { error: error.message } }

    await admin.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    })

    return { status: 200, body: { user: profile } }
  } catch (err) {
    return { status: 500, body: { error: err?.message ?? 'Failed to enable user.' } }
  }
}

/**
 * @param {{ body?: Record<string, unknown>, params: { userId: string }, adminProfile: AdminProfile }} ctx
 * @returns {Promise<HandlerResult>}
 */
export async function handleUpdateUserRole(ctx) {
  try {
    const admin = ensureAdminClient()
    const userId = ctx.params.userId
    const role = normalizeInviteRole(/** @type {string} */ (ctx.body?.role))

    if (role !== 'administrator') {
      await assertNotLastAdministrator(admin, userId)
    }

    const { data: profile, error } = await admin
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      const status = isLastAdminGuardError(error.message) ? 409 : 500
      return { status, body: { error: error.message } }
    }

    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { cms_role: role },
      user_metadata: { cms_role: role },
    })

    return { status: 200, body: { user: profile } }
  } catch (err) {
    const status = isLastAdminGuardError(err?.message) ? 409 : 500
    return { status, body: { error: err?.message ?? 'Failed to update role.' } }
  }
}

/**
 * @param {{ params: { userId: string }, adminProfile: AdminProfile }} ctx
 * @returns {Promise<HandlerResult>}
 */
export async function handleResetPassword(ctx) {
  try {
    const admin = ensureAdminClient()
    const userId = ctx.params.userId

    const { data: profile, error } = await admin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle()

    if (error) return { status: 500, body: { error: error.message } }
    if (!profile?.email) return { status: 404, body: { error: 'User not found.' } }

    const redirectTo = `${getSiteUrl()}/admin/set-password`
    const { error: resetError } = await admin.auth.resetPasswordForEmail(profile.email, {
      redirectTo,
    })

    if (resetError) {
      return { status: 400, body: { error: resetError.message } }
    }

    return { status: 200, body: { ok: true, email: profile.email } }
  } catch (err) {
    return { status: 500, body: { error: err?.message ?? 'Failed to send password reset.' } }
  }
}

/**
 * Mark a pending invitation as accepted after the invitee completes password setup.
 * Caller must be the authenticated invitee (Bearer JWT). Uses service role for the update
 * because user_invites RLS is administrator-only.
 *
 * @param {{ authUser: { id: string, email?: string | null } }} ctx
 * @returns {Promise<HandlerResult>}
 */
export async function handleAcceptInvite(ctx) {
  try {
    const admin = ensureAdminClient()
    const email = normalizeEmail(ctx.authUser?.email)
    const userId = ctx.authUser?.id

    if (!userId || !email) {
      return { status: 400, body: { error: 'Authenticated user email is required.' } }
    }

    const { data: pending, error: pendingError } = await admin
      .from('user_invites')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (pendingError) {
      return { status: 500, body: { error: pendingError.message } }
    }

    if (!pending) {
      const { data: alreadyAccepted, error: acceptedError } = await admin
        .from('user_invites')
        .select('*')
        .eq('email', email)
        .eq('status', 'accepted')
        .order('accepted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (acceptedError) {
        return { status: 500, body: { error: acceptedError.message } }
      }

      if (alreadyAccepted) {
        if (
          alreadyAccepted.accepted_user_id &&
          String(alreadyAccepted.accepted_user_id) !== String(userId)
        ) {
          return { status: 403, body: { error: 'Invitation belongs to a different user.' } }
        }

        if (!alreadyAccepted.accepted_user_id) {
          const { data: backfilled, error: backfillError } = await admin
            .from('user_invites')
            .update({ accepted_user_id: userId })
            .eq('id', alreadyAccepted.id)
            .select()
            .single()

          if (backfillError) {
            return { status: 500, body: { error: backfillError.message } }
          }

          return { status: 200, body: { invite: backfilled, alreadyAccepted: true } }
        }

        return { status: 200, body: { invite: alreadyAccepted, alreadyAccepted: true } }
      }

      // Password-reset / no invite row — succeed without mutating.
      return { status: 200, body: { invite: null, skipped: true } }
    }

    const meta =
      pending.metadata && typeof pending.metadata === 'object' && !Array.isArray(pending.metadata)
        ? /** @type {Record<string, unknown>} */ (pending.metadata)
        : {}
    const expectedAuthUserId = meta.auth_user_id ? String(meta.auth_user_id) : null
    if (expectedAuthUserId && expectedAuthUserId !== String(userId)) {
      return { status: 403, body: { error: 'Invitation does not match this account.' } }
    }

    if (pending.expires_at) {
      const expiresAt = new Date(String(pending.expires_at)).getTime()
      if (!Number.isNaN(expiresAt) && expiresAt < Date.now()) {
        const { data: expiredRow, error: expireError } = await admin
          .from('user_invites')
          .update({ status: 'expired' })
          .eq('id', pending.id)
          .eq('status', 'pending')
          .select()
          .maybeSingle()

        if (expireError) {
          return { status: 500, body: { error: expireError.message } }
        }

        return {
          status: 410,
          body: { error: 'Invitation has expired.', invite: expiredRow },
        }
      }
    }

    const nowIso = new Date().toISOString()
    const { data: updated, error: updateError } = await admin
      .from('user_invites')
      .update({
        status: 'accepted',
        accepted_at: nowIso,
        accepted_user_id: userId,
      })
      .eq('id', pending.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle()

    if (updateError) {
      return { status: 500, body: { error: updateError.message } }
    }

    if (!updated) {
      // Race: revoked/accepted between select and update.
      const { data: current } = await admin
        .from('user_invites')
        .select('*')
        .eq('id', pending.id)
        .maybeSingle()

      if (current?.status === 'accepted') {
        return { status: 200, body: { invite: current, alreadyAccepted: true } }
      }

      return {
        status: 409,
        body: {
          error: `Invitation is ${current?.status ?? 'no longer pending'}.`,
          invite: current,
        },
      }
    }

    return { status: 200, body: { invite: updated } }
  } catch (err) {
    return { status: 500, body: { error: err?.message ?? 'Failed to accept invite.' } }
  }
}
