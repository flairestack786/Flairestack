import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

/**
 * @param {{
 *   toast: { id: string, message: string, variant: 'success' | 'error' | 'warning' | 'info', exiting?: boolean },
 *   onDismiss: () => void,
 * }} props
 */
export default function Toast({ toast, onDismiss }) {
  const Icon = ICONS[toast.variant] ?? Info

  return (
    <div
      className={[
        'toast',
        `toast--${toast.variant}`,
        toast.exiting ? 'toast--exiting' : 'toast--entering',
      ]
        .filter(Boolean)
        .join(' ')}
      role={toast.variant === 'error' ? 'alert' : 'status'}
    >
      <Icon size={18} strokeWidth={1.75} className="toast-icon" aria-hidden />
      <p className="toast-message">{toast.message}</p>
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  )
}
