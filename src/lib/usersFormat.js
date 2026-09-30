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

/**
 * Statuses an admin may assign to an existing CMS user via Users management.
 * @type {readonly ('active' | 'disabled')[]}
 */
export const CMS_USER_MANAGEABLE_STATUS_OPTIONS = Object.freeze(['active', 'disabled'])

export const INVALID_MANAGEABLE_STATUS_MESSAGE =
  'Invalid user status. Existing CMS users can only be Active or Disabled.'

/** @type {readonly CmsInviteStatus[]} */
export const CMS_INVITE_STATUS_OPTIONS = Object.freeze([
  'pending',
  'accepted',
  'revoked',
  'expired',
])

export const CMS_INVITE_STATUS_HELP = Object.freeze({
  pending: 'Invitation sent and awaiting acceptance.',
  accepted: 'Invite accepted — user is being activated.',
  revoked: 'Invitation was revoked and can no longer be used.',
  expired: 'Invitation expired and must be resent.',
})

export const SELF_ACCOUNT_LOCKOUT_MESSAGE =
  'You cannot disable or change the role of your own account while you are logged in.'

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
 * @param {unknown} value
 * @returns {string}
 */
function asTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

/**
 * @param {Record<string, unknown> | null | undefined} user
 * @param {Record<string, unknown>[]} invites
 * @returns {boolean}
 */
export function userHasPendingInvite(user, invites = []) {
  const email = String(user?.email ?? '')
    .trim()
    .toLowerCase()
  if (email) {
    const pendingByEmail = invites.some(
      (invite) =>
        String(invite?.status ?? '') === 'pending' &&
        String(invite?.email ?? '')
          .trim()
          .toLowerCase() === email
    )
    if (pendingByEmail) return true
  }

  const authUserId = user?.id != null ? String(user.id) : ''
  if (!authUserId) return false

  return invites.some((invite) => {
    if (String(invite?.status ?? '') !== 'pending') return false
    const meta =
      invite?.metadata && typeof invite.metadata === 'object' && !Array.isArray(invite.metadata)
        ? /** @type {Record<string, unknown>} */ (invite.metadata)
        : {}
    return meta.auth_user_id != null && String(meta.auth_user_id) === authUserId
  })
}

/**
 * @param {Record<string, unknown> | null | undefined} user
 * @param {Record<string, unknown>[]} invites
 * @returns {string}
 */
export function resolveCmsUserListStatus(user, invites = []) {
  if (userHasPendingInvite(user, invites)) return 'invited'
  return String(user?.status ?? '')
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
 * @param {Record<string, unknown>[]} users
 * @param {Record<string, unknown>[]} invites
 */
export function summarizeTeam(users, invites = []) {
  const pendingCount = invites.filter((invite) => invite.status === 'pending').length

  return {
    totalUsers: users.length,
    activeUsers: users.filter(
      (user) => user.status === 'active' && !userHasPendingInvite(user, invites)
    ).length,
    pendingInvites: pendingCount,
    administrators: users.filter(
      (user) =>
        user.role === 'administrator' &&
        user.status === 'active' &&
        !userHasPendingInvite(user, invites)
    ).length,
    editors: users.filter(
      (user) =>
        user.role === 'editor' && user.status === 'active' && !userHasPendingInvite(user, invites)
    ).length,
    sales: users.filter(
      (user) =>
        user.role === 'sales' && user.status === 'active' && !userHasPendingInvite(user, invites)
    ).length,
    disabledUsers: users.filter((user) => user.status === 'disabled').length,
  }
}
