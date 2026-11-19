'use client'

import { AlertCircle, RefreshCw } from 'lucide-react'
import type { ResumeFailure } from './useResumeActions'

type Props = {
  failure: ResumeFailure
  /** True while a resume action (including this retry) is running. */
  busy: boolean
  onRetry: () => void
  onDismiss: () => void
}

/**
 * Persistent, accessible error for a failed resume View/Download, with a Retry that
 * always requests a brand-new signed link. (Toasts auto-dismiss and can't carry actions.)
 */
export default function ResumeFailureNotice({ failure, busy, onRetry, onDismiss }: Props) {
  const action = failure.mode === 'view' ? 'view' : 'download'
  return (
    <div className="admin-applicants-resume-error" role="alert">
      <AlertCircle size={18} strokeWidth={1.75} aria-hidden />
      <p className="admin-applicants-resume-error-text">
        {failure.label ? <strong>{failure.label}: </strong> : null}
        {failure.message}
      </p>
      <div className="admin-applicants-resume-error-actions">
        {failure.retryable ? (
          <button
            type="button"
            className="admin-settings-retry"
            onClick={onRetry}
            disabled={busy}
            aria-label={`Retry: ${action} resume${failure.label ? ` for ${failure.label}` : ''}`}
          >
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            {busy ? 'Retrying…' : 'Retry'}
          </button>
        ) : null}
        <button type="button" className="admin-settings-retry" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  )
}
