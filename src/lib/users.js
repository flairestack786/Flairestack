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

/** @typedef {'administrator' | 'editor' | 'sales'} CmsRole */
/** @typedef {'active' | 'invited' | 'disabled' | 'suspended'} CmsUserStatus */
/** @typedef {'pending' | 'accepted' | 'revoked' | 'expired'} CmsInviteStatus */

/** @type {readonly CmsRole[]} */
export const CMS_ROLE_OPTIONS = Object.freeze(['administrator', 'editor', 'sales'])

/** @type {readonly CmsUserStatus[]} */
export const CMS_USER_STATUS_OPTIONS = Object.freeze([
  'active',
  'invited',
  'disabled',
  'suspended',
])

/** @type {readonly CmsInviteStatus[]} */
export const CMS_INVITE_STATUS_OPTIONS = Object.freeze([
  'pending',
  'accepted',
  'revoked',
  'expired',
])

/** Human-readable invite status helper copy. */
export const CMS_INVITE_STATUS_HELP = Object.freeze({
  pending: 'Invitation sent and awaiting acceptance.',
  accepted: 'Invite accepted — user is being activated.',
  revoked: 'Invitation was revoked and can no longer be used.',
  expired: 'Invitation expired and must be resent.',
})

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

/**
 * @param {string} role
 * @returns {string}
 */
export function formatCmsRole(role) {
  return String(role ?? '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * @param {string} status
 * @returns {string}
 */
export function formatCmsUserStatus(status) {
  return formatCmsRole(status)
}

/**
 * @param {string} status
 * @returns {string}
 */
export function formatCmsInviteStatus(status) {
  return formatCmsRole(status)
}

/**
 * @param {string | null | undefined} status
 * @returns {string}
 */
export function getInviteStatusHelp(status) {
  const key = String(status ?? 'pending')
  return CMS_INVITE_STATUS_HELP[/** @type {CmsInviteStatus} */ (key)] ?? CMS_INVITE_STATUS_HELP.pending
}

/**
 * @param {Record<string, unknown>} invite
 * @returns {string | null}
 */
export function getInviteLastEmailSentAt(invite) {
  const metadata =
    invite?.metadata && typeof invite.metadata === 'object' && !Array.isArray(invite.metadata)
      ? /** @type {Record<string, unknown>} */ (invite.metadata)
      : {}
  const fromMeta = metadata.last_email_sent_at
  if (fromMeta) return String(fromMeta)
  if (invite?.invited_at) return String(invite.invited_at)
  return null
}

/**
 * Initials for avatar fallback.
 * @param {string | null | undefined} fullName
 * @param {string | null | undefined} email
 */
export function getUserInitials(fullName, email) {
  const name = asTrimmedString(fullName)
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  const mail = asTrimmedString(email)
  return mail ? mail.slice(0, 2).toUpperCase() : '?'
}

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
  if (status === 'disabled') {
    const result = await disableUserAuth(id)
    return result.user
  }
  if (status === 'active') {
    const result = await enableUserAuth(id)
    return result.user
  }
  return updateUser(id, { status })
}

/**
 * @param {string} id
 * @param {CmsRole} role
 * @returns {Promise<Record<string, unknown>>}
 */
export async function setUserRole(id, role) {
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
 * Invitations shown in the Users inbox: all pending, plus recently accepted/revoked/expired.
 * @param {number} [recentMs]
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listInvitationInbox(recentMs = 15 * 60 * 1000) {
  const { data, error } = await supabase
    .from('user_invites')
    .select(
      'id, email, full_name, role, permissions, status, invited_by, invited_at, expires_at, accepted_at, accepted_user_id, metadata, created_at, updated_at'
    )
    .order('invited_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const cutoff = Date.now() - recentMs
  return (data ?? []).filter((invite) => {
    if (invite.status === 'pending') return true
    if (invite.status === 'accepted') {
      const stamp = invite.accepted_at || invite.updated_at
      return stamp ? new Date(String(stamp)).getTime() >= cutoff : false
    }
    if (invite.status === 'revoked' || invite.status === 'expired') {
      const stamp = invite.updated_at || invite.invited_at
      return stamp ? new Date(String(stamp)).getTime() >= cutoff : false
    }
    return false
  })
}

/**
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listPendingInvites() {
  const { data, error } = await supabase
    .from('user_invites')
    .select(
      'id, email, full_name, role, permissions, status, invited_by, invited_at, expires_at, metadata, created_at, updated_at'
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
 * @param {Record<string, unknown>[]} users
 * @param {Record<string, unknown>[]} invites
 */
export function summarizeTeam(users, invites = []) {
  const pendingCount = invites.filter((invite) => invite.status === 'pending').length

  return {
    totalUsers: users.length,
    activeUsers: users.filter((user) => user.status === 'active').length,
    pendingInvites: pendingCount,
    administrators: users.filter(
      (user) => user.role === 'administrator' && user.status === 'active'
    ).length,
    editors: users.filter((user) => user.role === 'editor' && user.status === 'active').length,
    sales: users.filter((user) => user.role === 'sales' && user.status === 'active').length,
    disabledUsers: users.filter((user) => user.status === 'disabled').length,
  }
}

/**
 * @returns {Promise<{
 *   users: Record<string, unknown>[],
 *   pendingInvites: Record<string, unknown>[],
 *   summary: ReturnType<typeof summarizeTeam>,
 * }>}
 */
export async function fetchUsersSnapshot() {
  const [users, pendingInvites] = await Promise.all([listUsers(), listInvitationInbox()])

  return {
    users,
    pendingInvites,
    summary: summarizeTeam(users, pendingInvites),
  }
}
