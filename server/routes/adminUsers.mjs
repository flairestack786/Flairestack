import { Router } from 'express'
import { ensureAdminClient, getSiteUrl } from '../lib/supabaseAdmin.mjs'
import { isLastAdminGuardError, requireAdministrator } from '../middleware/requireAdministrator.mjs'

const router = Router()

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

router.post('/users/invite', requireAdministrator, async (req, res) => {
  try {
    const admin = ensureAdminClient()
    const email = normalizeEmail(req.body?.email)
    const fullName = String(req.body?.full_name ?? req.body?.fullName ?? '').trim()
    const role = normalizeInviteRole(req.body?.role)

    if (!email) {
      return res.status(400).json({ error: 'Invite email is required.' })
    }

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, status')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile?.status === 'active') {
      return res.status(409).json({ error: 'A user with this email already exists.' })
    }

    const { data: pendingInvite } = await admin
      .from('user_invites')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .maybeSingle()

    if (pendingInvite) {
      return res.status(409).json({ error: 'A pending invite already exists for this email.' })
    }

    const redirectTo = `${getSiteUrl()}/admin/login`

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
      return res.status(400).json({ error: inviteError.message })
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
        invited_by: req.adminProfile.id,
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
      return res.status(500).json({ error: rowError.message })
    }

    return res.status(201).json({
      invite: inviteRow,
      authUserId: inviteData?.user?.id ?? null,
    })
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Failed to send invite.' })
  }
})

router.post('/users/invites/:inviteId/resend', requireAdministrator, async (req, res) => {
  try {
    const admin = ensureAdminClient()
    const inviteId = req.params.inviteId

    const { data: invite, error } = await admin
      .from('user_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    if (!invite) return res.status(404).json({ error: 'Pending invite not found.' })

    const redirectTo = `${getSiteUrl()}/admin/login`
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(invite.email, {
      redirectTo,
      data: {
        full_name: invite.full_name,
        cms_role: invite.role,
      },
    })

    if (inviteError) {
      return res.status(400).json({ error: inviteError.message })
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

    if (updateError) return res.status(500).json({ error: updateError.message })
    return res.json({ invite: updated })
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Failed to resend invite.' })
  }
})

router.post('/users/invites/:inviteId/revoke', requireAdministrator, async (req, res) => {
  try {
    const admin = ensureAdminClient()
    const inviteId = req.params.inviteId

    const { data: invite, error } = await admin
      .from('user_invites')
      .select('*')
      .eq('id', inviteId)
      .eq('status', 'pending')
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    if (!invite) return res.status(404).json({ error: 'Pending invite not found.' })

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

    if (updateError) return res.status(500).json({ error: updateError.message })
    return res.json({ invite: updated })
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Failed to revoke invite.' })
  }
})

router.post('/users/:userId/disable', requireAdministrator, async (req, res) => {
  try {
    const admin = ensureAdminClient()
    const userId = req.params.userId

    if (userId === req.adminProfile.id) {
      return res.status(400).json({
        error: 'You cannot disable your own account while signed in.',
      })
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
      return res.status(status).json({ error: error.message })
    }

    await admin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h',
    })

    return res.json({ user: profile })
  } catch (err) {
    const status = isLastAdminGuardError(err?.message) ? 409 : 500
    return res.status(status).json({ error: err?.message ?? 'Failed to disable user.' })
  }
})

router.post('/users/:userId/enable', requireAdministrator, async (req, res) => {
  try {
    const admin = ensureAdminClient()
    const userId = req.params.userId

    const { data: profile, error } = await admin
      .from('profiles')
      .update({ status: 'active' })
      .eq('id', userId)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })

    await admin.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    })

    return res.json({ user: profile })
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Failed to enable user.' })
  }
})

router.post('/users/:userId/role', requireAdministrator, async (req, res) => {
  try {
    const admin = ensureAdminClient()
    const userId = req.params.userId
    const role = normalizeInviteRole(req.body?.role)

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
      return res.status(status).json({ error: error.message })
    }

    await admin.auth.admin.updateUserById(userId, {
      app_metadata: { cms_role: role },
      user_metadata: { cms_role: role },
    })

    return res.json({ user: profile })
  } catch (err) {
    const status = isLastAdminGuardError(err?.message) ? 409 : 500
    return res.status(status).json({ error: err?.message ?? 'Failed to update role.' })
  }
})

router.post('/users/:userId/reset-password', requireAdministrator, async (req, res) => {
  try {
    const admin = ensureAdminClient()
    const userId = req.params.userId

    const { data: profile, error } = await admin
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle()

    if (error) return res.status(500).json({ error: error.message })
    if (!profile?.email) return res.status(404).json({ error: 'User not found.' })

    const redirectTo = `${getSiteUrl()}/admin/login`
    const { error: resetError } = await admin.auth.resetPasswordForEmail(profile.email, {
      redirectTo,
    })

    if (resetError) {
      return res.status(400).json({ error: resetError.message })
    }

    return res.json({ ok: true, email: profile.email })
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? 'Failed to send password reset.' })
  }
})

export default router
