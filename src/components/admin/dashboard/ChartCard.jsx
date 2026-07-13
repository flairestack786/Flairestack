import React from 'react'

/**
 * Wrapper for dashboard charts and visualizations.
 * @param {{
 *   title: string,
 *   description?: string,
 *   action?: React.ReactNode,
 *   children: React.ReactNode,
 *   className?: string,
 * }} props
 */
export default function ChartCard({ title, description, action, children, className = '' }) {
  return (
    <section className={`admin-dashboard-card admin-dashboard-chart-card ${className}`.trim()}>
      <header className="admin-dashboard-card-header">
        <div>
          <h2 className="admin-dashboard-card-title">{title}</h2>
          {description && <p className="admin-dashboard-card-desc">{description}</p>}
        </div>
        {action}
      </header>
      <div className="admin-dashboard-card-body">{children}</div>
    </section>
  )
}
