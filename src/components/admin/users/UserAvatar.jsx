import React from 'react'
import { getUserInitials } from '../../../lib/usersFormat'

/**
 * Compact user avatar with initials fallback.
 * Pass `resolveAvatarUrl` when avatar images should resolve (Vite: getPublicUrl).
 * @param {{
 *   fullName?: string | null,
 *   email?: string | null,
 *   avatarPath?: string | null,
 *   size?: 'sm' | 'md',
 *   resolveAvatarUrl?: (path: string) => string,
 * }} props
 */
export default function UserAvatar({
  fullName,
  email,
  avatarPath,
  size = 'sm',
  resolveAvatarUrl,
}) {
  const initials = getUserInitials(fullName, email)
  let imageUrl = ''

  if (avatarPath && typeof resolveAvatarUrl === 'function') {
    try {
      imageUrl = resolveAvatarUrl(String(avatarPath))
    } catch {
      imageUrl = ''
    }
  }

  return (
    <span
      className={`admin-users-avatar admin-users-avatar--${size}`}
      aria-hidden={imageUrl ? undefined : true}
      title={String(fullName || email || '')}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="admin-users-avatar-img" />
      ) : (
        <span className="admin-users-avatar-initials">{initials}</span>
      )}
    </span>
  )
}
