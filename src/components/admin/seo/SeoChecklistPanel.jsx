import React from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import SeoScoreBadge from './SeoScoreBadge'

/**
 * @param {{
 *   checklist: {
 *     items: { id: string, label: string, done: boolean, inherited?: boolean }[],
 *     percent: number,
 *     missing: { label: string }[],
 *   },
 *   score: number,
 * }} props
 */
export default function SeoChecklistPanel({ checklist, score }) {
  return (
    <div className="admin-seo-checklist">
      <header className="admin-seo-checklist-header">
        <div>
          <h3 className="admin-seo-validation-title">SEO checklist</h3>
          <p className="admin-seo-validation-desc">
            {checklist.percent}% complete · {checklist.missing.length} missing
          </p>
        </div>
        <SeoScoreBadge score={score} size="sm" />
      </header>

      <div className="admin-seo-checklist-meter" aria-hidden>
        <span style={{ width: `${checklist.percent}%` }} />
      </div>

      <ul className="admin-seo-checklist-list">
        {checklist.items.map((item) => (
          <li
            key={item.id}
            className={`admin-seo-checklist-item${item.done ? ' is-done' : ''}`}
          >
            <span aria-hidden>
              {item.done ? (
                <CheckCircle2 size={15} strokeWidth={1.75} />
              ) : (
                <Circle size={15} strokeWidth={1.75} />
              )}
            </span>
            <span>
              {item.label}
              {item.inherited ? <em className="admin-seo-inherited-pill"> inherited</em> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
