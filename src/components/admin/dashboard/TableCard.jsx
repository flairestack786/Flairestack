import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

/**
 * Table wrapper card for dashboard data lists.
 * @param {{
 *   title: string,
 *   description?: string,
 *   viewAllHref?: string,
 *   viewAllLabel?: string,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function TableCard({
  title,
  description,
  viewAllHref,
  viewAllLabel = 'View all',
  children,
  className = '',
}) {
  return (
    <section className={`admin-dashboard-card admin-dashboard-table-card ${className}`.trim()}>
      <header className="admin-dashboard-card-header">
        <div>
          <h2 className="admin-dashboard-card-title">{title}</h2>
          {description && <p className="admin-dashboard-card-desc">{description}</p>}
        </div>
        {viewAllHref && (
          <Link to={viewAllHref} className="admin-dashboard-card-link">
            {viewAllLabel}
            <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden />
          </Link>
        )}
      </header>
      <div className="admin-dashboard-card-body admin-dashboard-table-card-body">{children}</div>
    </section>
  )
}
