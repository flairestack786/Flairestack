import React from 'react'

/**
 * Metric summary card for the admin dashboard.
 * @param {{
 *   label: string,
 *   value: string | number,
 *   hint?: string,
 *   icon?: React.ReactNode,
 *   variant?: string,
 *   className?: string,
 * }} props
 */
export default function StatsCard({
  label,
  value,
  hint,
  icon,
  variant = 'default',
  className = '',
}) {
  return (
    <article className={`admin-dashboard-stats-card admin-dashboard-stats-card--${variant} ${className}`.trim()}>
      {icon && (
        <span className={`admin-dashboard-stats-icon admin-dashboard-stats-icon--${variant}`} aria-hidden>
          {icon}
        </span>
      )}
      <div className="admin-dashboard-stats-body">
        <p className="admin-dashboard-stats-label">{label}</p>
        <p className="admin-dashboard-stats-value">{value}</p>
        {hint && <p className="admin-dashboard-stats-hint">{hint}</p>}
      </div>
    </article>
  )
}
