import React from 'react'
import { getSeoScoreBand } from '../../../lib/seoAnalysis'

/**
 * @param {{ score: number, size?: 'sm' | 'md' | 'lg', showLabel?: boolean }} props
 */
export default function SeoScoreBadge({ score, size = 'md', showLabel = true }) {
  const value = Math.max(0, Math.min(100, Math.round(Number(score) || 0)))
  const band = getSeoScoreBand(value)

  return (
    <span className={`admin-seo-score admin-seo-score--${band} admin-seo-score--${size}`}>
      <span className="admin-seo-score-value">{value}</span>
      {showLabel && <span className="admin-seo-score-label">/ 100</span>}
    </span>
  )
}
