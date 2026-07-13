import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

/**
 * Quick navigation card for common admin actions.
 * @param {{
 *   title: string,
 *   description: string,
 *   icon: React.ReactNode,
 *   to: string,
 *   external?: boolean,
 *   className?: string,
 * }} props
 */
export default function QuickActionCard({
  title,
  description,
  icon,
  to,
  external = false,
  className = '',
}) {
  const content = (
    <>
      <span className="admin-dashboard-quick-icon" aria-hidden>
        {icon}
      </span>
      <div className="admin-dashboard-quick-body">
        <span className="admin-dashboard-quick-title">{title}</span>
        <span className="admin-dashboard-quick-desc">{description}</span>
      </div>
      <ArrowUpRight size={16} strokeWidth={1.75} className="admin-dashboard-quick-arrow" aria-hidden />
    </>
  )

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={`admin-dashboard-quick-card ${className}`.trim()}
      >
        {content}
      </a>
    )
  }

  return (
    <Link to={to} className={`admin-dashboard-quick-card ${className}`.trim()}>
      {content}
    </Link>
  )
}
