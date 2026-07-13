import React from 'react'
import { formatCmsInviteStatus, getInviteStatusHelp } from '../../../lib/users'

/**
 * Color-coded invitation status badge with helper tooltip.
 * @param {{ status?: string | null }} props
 */
export default function InviteStatusBadge({ status }) {
  const value = String(status || 'pending')
  const label = formatCmsInviteStatus(value)
  const help = getInviteStatusHelp(value)

  return (
    <span
      className={`admin-users-badge admin-users-badge--invite-${value}`}
      title={help}
      aria-label={`${label}: ${help}`}
    >
      <span className="admin-users-badge-dot" aria-hidden />
      {label}
    </span>
  )
}
