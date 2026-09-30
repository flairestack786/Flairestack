import { supabase } from './supabase'
import {
  disableUserAuth,
  enableUserAuth,
  revokeUserInviteAuth,
  resendUserInvite,
  sendPasswordReset,
  sendUserInvite,
  syncUserRoleAuth,
} from './adminApi'
import {
  CMS_INVITE_STATUS_HELP,
  CMS_INVITE_STATUS_OPTIONS,
  CMS_ROLE_OPTIONS,
  CMS_USER_MANAGEABLE_STATUS_OPTIONS,
  CMS_USER_STATUS_OPTIONS,
  formatCmsInviteStatus,
  formatCmsRole,
  formatCmsUserStatus,
  getInviteLastEmailSentAt,
  getInviteStatusHelp,
  getUserInitials,
  INVALID_MANAGEABLE_STATUS_MESSAGE,
  resolveCmsUserListStatus,
  SELF_ACCOUNT_LOCKOUT_MESSAGE,
  summarizeTeam,
  userHasPendingInvite,
} from './usersFormat'

export {
  CMS_INVITE_STATUS_HELP,
  CMS_INVITE_STATUS_OPTIONS,
  CMS_ROLE_OPTIONS,
  CMS_USER_MANAGEABLE_STATUS_OPTIONS,
  CMS_USER_STATUS_OPTIONS,
  formatCmsInviteStatus,
  formatCmsRole,
  formatCmsUserStatus,
  getInviteLastEmailSentAt,
  getInviteStatusHelp,
  getUserInitials,
  INVALID_MANAGEABLE_STATUS_MESSAGE,
  resolveCmsUserListStatus,
  SELF_ACCOUNT_LOCKOUT_MESSAGE,
  summarizeTeam,
  userHasPendingInvite,
}

/** @typedef {'administrator' | 'editor' | 'sales'} CmsRole */
/** @typedef {'active' | 'invited' | 'disabled' | 'suspended'} CmsUserStatus */
/** @typedef {'pending' | 'accepted' | 'revoked' | 'expired'} CmsInviteStatus */

const PROFILE_UPDATE_FIELDS = [
  'full_name',
  'avatar_path',
  'role',
  'status',
  'permissions',
  'notes',
]

const ROLES = new Set(CMS_ROLE_OPTIONS)
const STATUSES = new Set(CMS_USER_STATUS_OPTIONS)
const MANAGEABLE_STATUSES = new Set(CMS_USER_MANAGEABLE_STATUS_OPTIONS)

/**
 * @param {unknown} value
 */
function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

/**
 * @param {Record<string, unknown>} fields
 * @param {string[]} allowed
 * @returns {Record<string, unknown>}
 */
function pickFields(fields, allowed) {
  /** @type {Record<string, unknown>} */
  const payload = {}

  for (const key of allowed) {
    if (fields[key] === undefined) continue
    const value = fields[key]

    if (key === 'role') {
      const role = asTrimmedString(value)
      if (!ROLES.has(/** @type {CmsRole} */ (role))) {
        throw new Error(`Invalid role "${role}".`)
      }
      payload[key] = role
      continue
    }

    if (key === 'status') {
      const status = asTrimmedString(value)
      if (!STATUSES.has(/** @type {CmsUserStatus} */ (status))) {
        throw new Error(`Invalid status "${status}".`)
      }
      if (!MANAGEABLE_STATUSES.has(/** @type {'active' | 'disabled'} */ (status))) {
        throw new Error(INVALID_MANAGEABLE_STATUS_MESSAGE)
      }
      payload[key] = status
      continue
    }

    if (key === 'permissions' || key === 'metadata') {
      payload[key] =
        value && typeof value === 'object' && !Array.isArray(value) ? value : {}
      continue
    }

    if (typeof value === 'string') {
      payload[key] = value.trim() === '' ? null : value.trim()
      continue
    }

    payload[key] = value
  }

  return payload
}

/**
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, avatar_path, role, status, permissions, invited_at, invited_by, last_sign_in_at, notes, created_at, updated_at'
    )
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * @param {string} id
 * @returns {Promise<Record<string, unknown>>}
 */
export async function getUser(id) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} fields
 * @returns {Promise<Record<string, unknown>>}
 */
export async function updateUser(id, fields) {
  const payload = pickFields(fields, PROFILE_UPDATE_FIELDS)
  const { role, ...rest } = payload

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id && String(id) === String(user.id)) {
    if (rest.status === 'disabled') {
      throw new Error(SELF_ACCOUNT_LOCKOUT_MESSAGE)
    }
    if (role !== undefined) {
      throw new Error(SELF_ACCOUNT_LOCKOUT_MESSAGE)
    }
  }

  if (user?.id) {
    rest.updated_by = user.id
  }

  /** @type {Record<string, unknown> | null} */
  let updated = null

  if (role !== undefined) {
    const result = await syncUserRoleAuth(id, /** @type {CmsRole} */ (role))
    updated = result.user
  }

  if (Object.keys(rest).length > 0) {
    const { data, error } = await supabase
      .from('profiles')
      .update(rest)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!data) {
      throw new Error('User update affected 0 rows (check RLS policies).')
    }
    updated = data
  }

  if (!updated) {
    return getUser(id)
  }

  return updated
}

/**
 * @param {string} id
 * @param {CmsUserStatus} status
 * @returns {Promise<Record<string, unknown>>}
 */
export async function setUserStatus(id, status) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (status === 'disabled' && user?.id && String(id) === String(user.id)) {
    throw new Error(SELF_ACCOUNT_LOCKOUT_MESSAGE)
  }

  if (status !== 'active' && status !== 'disabled') {
    throw new Error(INVALID_MANAGEABLE_STATUS_MESSAGE)
  }

  if (status === 'disabled') {
    const result = await disableUserAuth(id)
    return result.user
  }

  const result = await enableUserAuth(id)
  return result.user
}

/**
 * @param {string} id
 * @param {CmsRole} role
 * @returns {Promise<Record<string, unknown>>}
 */
export async function setUserRole(id, role) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user?.id && String(id) === String(user.id)) {
    throw new Error(SELF_ACCOUNT_LOCKOUT_MESSAGE)
  }

  return updateUser(id, { role })
}

/**
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listUserInvites() {
  const { data, error } = await supabase
    .from('user_invites')
    .select(
      'id, email, full_name, role, permissions, status, invited_by, invited_at, expires_at, accepted_at, accepted_user_id, metadata, created_at, updated_at'
    )
    .order('invited_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Invitations shown in the Users inbox: pending only (history via invite status filters).
 * @param {number} [_recentMs] Unused; kept for call-site compatibility.
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listInvitationInbox(_recentMs = 15 * 60 * 1000) {
  return listPendingInvites()
}

/**
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listPendingInvites() {
  const { data, error } = await supabase
    .from('user_invites')
    .select(
      'id, email, full_name, role, permissions, status, invited_by, invited_at, expires_at, accepted_at, accepted_user_id, metadata, created_at, updated_at'
    )
    .eq('status', 'pending')
    .order('invited_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

/**
 * Send Supabase Auth invite email + create pending invite record.
 * @param {Partial<Record<string, unknown>>} input
 */
export async function createUserInvite(input = {}) {
  const email = asTrimmedString(input.email)
  const full_name = asTrimmedString(input.full_name ?? input.fullName)
  const role =
    input.role === 'editor' ? 'editor' : input.role === 'sales' ? 'sales' : 'administrator'

  if (!email) {
    throw new Error('Invite email is required.')
  }

  const result = await sendUserInvite({
    email,
    full_name: full_name || undefined,
    role,
  })

  return result.invite
}

/**
 * @param {string} id
 */
export async function revokeUserInvite(id) {
  const result = await revokeUserInviteAuth(id)
  return result.invite
}

/**
 * @param {string} id
 */
export async function resendInvite(id) {
  const result = await resendUserInvite(id)
  return result.invite
}

/**
 * @param {string} userId
 */
export async function requestPasswordReset(userId) {
  return sendPasswordReset(userId)
}

/**
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getCurrentProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.id) return null

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, avatar_path, role, status, permissions, invited_at, last_sign_in_at, notes, created_at, updated_at'
    )
    .eq('id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}

/**
 * @returns {Promise<{
 *   users: Record<string, unknown>[],
 *   invites: Record<string, unknown>[],
 *   pendingInvites: Record<string, unknown>[],
 *   summary: ReturnType<typeof summarizeTeam>,
 * }>}
 */
export async function fetchUsersSnapshot() {
  const [users, invites] = await Promise.all([listUsers(), listUserInvites()])
  const pendingInvites = invites.filter((invite) => invite.status === 'pending')

  return {
    users,
    invites,
    pendingInvites,
    summary: summarizeTeam(users, invites),
  }
}
