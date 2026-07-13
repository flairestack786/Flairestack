import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import Toast from './Toast'
import './toast.css'

const DISMISS_MS = 3500
const EXIT_MS = 200
const DUPLICATE_WINDOW_MS = 3000

/** @typedef {'success' | 'error' | 'warning' | 'info'} ToastVariant */

/** @typedef {{ id: string, message: string, variant: ToastVariant, exiting?: boolean }} ToastItem */

const ToastContext = createContext(null)

/**
 * @param {ToastVariant} variant
 * @param {string} message
 * @param {ToastItem[]} toasts
 * @returns {boolean}
 */
function isDuplicateToast(variant, message, toasts) {
  return toasts.some((toast) => toast.variant === variant && toast.message === message)
}

/**
 * Global toast provider for the FlaireStack CMS.
 * @param {{ children: React.ReactNode }} props
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState(/** @type {ToastItem[]} */ ([]))
  const timersRef = useRef(new Map())
  const recentRef = useRef(new Map())

  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const removeToast = useCallback(
    (id) => {
      clearTimer(id)

      setToasts((current) =>
        current.map((toast) => (toast.id === id ? { ...toast, exiting: true } : toast))
      )

      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id))
      }, EXIT_MS)
    },
    [clearTimer]
  )

  const showToast = useCallback(
    (message, variant) => {
      const trimmed = message?.trim()
      if (!trimmed) return

      const dedupeKey = `${variant}:${trimmed}`
      const now = Date.now()
      const lastShown = recentRef.current.get(dedupeKey)

      if (lastShown && now - lastShown < DUPLICATE_WINDOW_MS) {
        return
      }

      setToasts((current) => {
        if (isDuplicateToast(variant, trimmed, current)) {
          return current
        }

        const id = crypto.randomUUID()
        recentRef.current.set(dedupeKey, now)

        const timer = window.setTimeout(() => {
          removeToast(id)
        }, DISMISS_MS)

        timersRef.current.set(id, timer)

        return [...current, { id, message: trimmed, variant }]
      })
    },
    [removeToast]
  )

  const success = useCallback((message) => showToast(message, 'success'), [showToast])
  const error = useCallback((message) => showToast(message, 'error'), [showToast])
  const warning = useCallback((message) => showToast(message, 'warning'), [showToast])
  const info = useCallback((message) => showToast(message, 'info'), [showToast])

  const value = useMemo(
    () => ({ success, error, warning, info }),
    [success, error, warning, info]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-relevant="additions text">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider.')
  }
  return context
}
