import React from 'react'
import { getUserInitials } from '../../../lib/users'
import { getPublicUrl } from '../../../lib/media'

/**
 * Compact user avatar with initials fallback.
 * @param {{
 *   fullName?: string | null,
 *   email?: string | null,
 *   avatarPath?: string | null,
 *   size?: 'sm' | 'md',
 * }} props
 */
export default function UserAvatar({ fullName, email, avatarPath, size = 'sm' }) {
  const initials = getUserInitials(fullName, email)
  let imageUrl = ''

  if (avatarPath) {
    try {
      imageUrl = getPublicUrl(String(avatarPath))
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
