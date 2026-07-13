import React, { useCallback, useEffect, useId, useRef } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

/**
 * Generic confirmation modal for destructive CMS actions.
 * @param {{
 *   isOpen: boolean,
 *   title: string,
 *   message: string,
 *   itemName?: string,
 *   thumbnailUrl?: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   isLoading?: boolean,
 *   onConfirm: () => void,
 *   onCancel: () => void,
 *   className?: string,
 * }} props
 */
export default function ConfirmationModal({
  isOpen,
  title,
  message,
  itemName,
  thumbnailUrl,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isLoading = false,
  onConfirm,
  onCancel,
  className = '',
}) {
  const titleId = useId()
  const descriptionId = useId()
  const cancelRef = useRef(null)

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget && !isLoading) {
        onCancel()
      }
    },
    [isLoading, onCancel]
  )

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, isLoading, onCancel])

  if (!isOpen) return null

  const rootClassName = ['admin-confirm-dialog', className].filter(Boolean).join(' ')
  const showItemPreview = Boolean(thumbnailUrl || itemName)

  return (
    <div className={rootClassName} onClick={handleBackdropClick}>
      <div
        className="admin-confirm-dialog-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="admin-confirm-dialog-close"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>

        <div className="admin-confirm-dialog-icon" aria-hidden>
          <AlertTriangle size={22} strokeWidth={1.75} />
        </div>

        <h2 id={titleId} className="admin-confirm-dialog-title">
          {title}
        </h2>

        {showItemPreview && (
          <div className="admin-confirm-dialog-content">
            <div className="admin-confirm-dialog-media">
              {thumbnailUrl && (
                <img
                  src={thumbnailUrl}
                  alt=""
                  className="admin-confirm-dialog-media-thumb"
                />
              )}
              {itemName && <p className="admin-confirm-dialog-media-name">{itemName}</p>}
            </div>
          </div>
        )}

        <p id={descriptionId} className="admin-confirm-dialog-message">
          {message}
        </p>

        <div className="admin-confirm-dialog-actions">
          <button
            ref={cancelRef}
            type="button"
            className="admin-confirm-dialog-btn admin-confirm-dialog-btn--cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="admin-confirm-dialog-btn admin-confirm-dialog-btn--confirm"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={16} strokeWidth={1.75} className="admin-confirm-dialog-spinner" aria-hidden />
            ) : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
