import React from 'react'

/**
 * @param {{
 *   services: { label: string, fullLabel: string, count: number, percent: number }[],
 * }} props
 */
export default function ServicesRequestedBarChart({ services }) {
  if (services.length === 0) {
    return <p className="admin-dashboard-empty">Service interest will appear as leads come in.</p>
  }

  return (
    <ul className="admin-dashboard-chart admin-dashboard-services-chart">
      {services.map((service) => (
        <li key={service.fullLabel} className="admin-dashboard-chart-row">
          <span className="admin-dashboard-chart-label" title={service.fullLabel}>
            {service.label}
          </span>
          <div className="admin-dashboard-chart-track" aria-hidden>
            <span
              className="admin-dashboard-chart-bar admin-dashboard-chart-bar--service"
              style={{ width: `${service.percent}%` }}
            />
          </div>
          <span className="admin-dashboard-chart-value">{service.count}</span>
        </li>
      ))}
    </ul>
  )
}
