import React from 'react'

/**
 * @param {{
 *   months: { key: string, label: string, year: number, count: number, percent: number }[],
 * }} props
 */
export default function LeadsByMonthBarChart({ months }) {
  const hasData = months.some((month) => month.count > 0)

  if (!hasData) {
    return <p className="admin-dashboard-empty">No leads recorded in the last six months.</p>
  }

  return (
    <div className="admin-dashboard-month-chart">
      <ul className="admin-dashboard-month-bars">
        {months.map((month) => (
          <li
            key={month.key}
            className={`admin-dashboard-month-bar-item${month.isCurrent ? ' admin-dashboard-month-bar-item--current' : ''}`}
          >
            <div className="admin-dashboard-month-bar-col">
              <span className="admin-dashboard-month-bar-value">{month.count}</span>
              <div className="admin-dashboard-month-bar-track" aria-hidden>
                <span
                  className="admin-dashboard-month-bar-fill"
                  style={{ height: `${month.percent}%` }}
                />
              </div>
            </div>
            <span className="admin-dashboard-month-bar-label">{month.label}</span>
            <span className="admin-dashboard-month-bar-year">{month.year}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
