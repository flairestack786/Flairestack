import React from 'react'
import { getFieldCounter } from '../../../lib/seoCounters'

/**
 * @param {{ value: string, field: keyof import('../../../lib/seoCounters').FIELD_LIMITS | string }} props
 */
export default function SeoCharCounter({ value, field }) {
  const counter = getFieldCounter(value, /** @type {any} */ (field))
  return (
    <p className={`admin-seo-counter admin-seo-counter--${counter.band}`}>
      <span>{counter.label}</span>
      <span className="admin-seo-counter-band">
        {counter.band === 'excellent'
          ? 'Excellent'
          : counter.band === 'needs-improvement'
            ? 'Needs improvement'
            : counter.band === 'poor'
              ? 'Too short / too long'
              : 'Empty'}
      </span>
    </p>
  )
}
