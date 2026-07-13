import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'

/**
 * @param {{
 *   analysis: {
 *     issues: { id: string, severity: string, message: string }[],
 *     errors: unknown[],
 *     warnings: unknown[],
 *   } | null | undefined,
 * }} props
 */
export default function SeoValidationPanel({ analysis }) {
  const issues = analysis?.issues ?? []
  const actionable = issues.filter((issue) => issue.severity !== 'success')
  const successes = issues.filter((issue) => issue.severity === 'success')

  return (
    <div className="admin-seo-validation">
      <header className="admin-seo-validation-header">
        <h3 className="admin-seo-validation-title">Validation</h3>
        <p className="admin-seo-validation-desc">
          {analysis?.errors?.length
            ? `${analysis.errors.length} error${analysis.errors.length === 1 ? '' : 's'}`
            : 'No blocking errors'}
          {' · '}
          {analysis?.warnings?.length
            ? `${analysis.warnings.length} warning${analysis.warnings.length === 1 ? '' : 's'}`
            : 'No warnings'}
        </p>
      </header>

      <ul className="admin-seo-validation-list">
        {actionable.length === 0 && successes.length === 0 ? (
          <li className="admin-seo-validation-item admin-seo-validation-item--muted">
            Start editing SEO fields to see live checks.
          </li>
        ) : null}

        {actionable.map((issue) => (
          <li
            key={issue.id}
            className={`admin-seo-validation-item admin-seo-validation-item--${issue.severity}`}
          >
            <span className="admin-seo-validation-icon" aria-hidden>
              {issue.severity === 'error' ? (
                <AlertCircle size={15} strokeWidth={1.75} />
              ) : (
                <AlertTriangle size={15} strokeWidth={1.75} />
              )}
            </span>
            <span>{issue.message}</span>
          </li>
        ))}

        {successes.map((issue) => (
          <li
            key={issue.id}
            className="admin-seo-validation-item admin-seo-validation-item--success"
          >
            <span className="admin-seo-validation-icon" aria-hidden>
              <CheckCircle2 size={15} strokeWidth={1.75} />
            </span>
            <span>{issue.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
