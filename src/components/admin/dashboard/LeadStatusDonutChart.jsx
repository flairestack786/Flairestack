import React, { useMemo } from 'react'
import { formatLeadStatus } from '../../../lib/leads'
import { getLeadStatusChartColor } from './chartColors'

/**
 * @param {{
 *   segments: { status: string, count: number, percent: number }[],
 *   total: number,
 * }} props
 */
export default function LeadStatusDonutChart({ segments, total }) {
  const rings = useMemo(() => {
    const radius = 54
    const circumference = 2 * Math.PI * radius
    let cumulative = 0

    return segments.map((segment) => {
      const share = total > 0 ? segment.count / total : 0
      const dash = share * circumference
      const ring = {
        ...segment,
        color: getLeadStatusChartColor(segment.status),
        dasharray: `${dash} ${circumference - dash}`,
        dashoffset: -cumulative * circumference,
      }
      cumulative += share
      return ring
    })
  }, [segments, total])

  if (total === 0) {
    return <p className="admin-dashboard-empty">No lead data to chart yet.</p>
  }

  return (
    <div className="admin-dashboard-donut-wrap">
      <div className="admin-dashboard-donut-visual" aria-hidden>
        <svg viewBox="0 0 140 140" className="admin-dashboard-donut" role="img">
          <title>Lead status distribution</title>
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            stroke="rgba(255, 255, 255, 0.06)"
            strokeWidth="16"
          />
          {rings.map((ring) => (
            <circle
              key={ring.status}
              cx="70"
              cy="70"
              r="54"
              fill="none"
              stroke={ring.color}
              strokeWidth="16"
              strokeLinecap="butt"
              strokeDasharray={ring.dasharray}
              strokeDashoffset={ring.dashoffset}
              transform="rotate(-90 70 70)"
            />
          ))}
        </svg>
        <div className="admin-dashboard-donut-center">
          <span className="admin-dashboard-donut-total">{total}</span>
          <span className="admin-dashboard-donut-label">Leads</span>
        </div>
      </div>

      <ul className="admin-dashboard-donut-legend">
        {segments.map((segment) => (
          <li key={segment.status} className="admin-dashboard-donut-legend-item">
            <span
              className="admin-dashboard-donut-swatch"
              style={{ background: getLeadStatusChartColor(segment.status) }}
              aria-hidden
            />
            <span className="admin-dashboard-donut-legend-label">
              {formatLeadStatus(segment.status)}
            </span>
            <span className="admin-dashboard-donut-legend-value">
              {segment.count}
              <span className="admin-dashboard-donut-legend-pct"> ({segment.percent}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
