import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Loader2, Pencil, X } from 'lucide-react'
import {
  getFilenameStem,
  getPathExtension,
  validateFilenameStem,
} from '../../lib/media'

/**
 * Reusable rename modal for media library images.
 * @param {{
 *   isOpen: boolean,
 *   currentName: string,
 *   currentPath: string,
 *   thumbnailUrl?: string,
 *   isLoading?: boolean,
 *   onRename: (newName: string) => void,
 *   onCancel: () => void,
 *   className?: string,
 * }} props
 */
export default function RenameImageModal({
  isOpen,
  currentName,
  currentPath,
  thumbnailUrl,
  isLoading = false,
  onRename,
  onCancel,
  className = '',
}) {
  const titleId = useId()
  const inputId = useId()
  const errorId = useId()
  const inputRef = useRef(null)
  const initialStem = getFilenameStem(currentName)
  const extension = getPathExtension(currentPath)

  const [nameStem, setNameStem] = useState(initialStem)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setNameStem(getFilenameStem(currentName))
    setError('')
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [isOpen, currentName])

  const trimmedStem = nameStem.trim()
  const validationError = validateFilenameStem(nameStem)
  const hasChanged = trimmedStem !== initialStem.trim()
  const canSubmit = !validationError && hasChanged && !isLoading

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

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextError = validateFilenameStem(nameStem)
    if (nextError) {
      setError(nextError)
      return
    }
    if (!hasChanged) return
    onRename(trimmedStem)
  }

  const handleInputChange = (e) => {
    setNameStem(e.target.value)
    setError('')
  }

  if (!isOpen) return null

  const rootClassName = ['admin-rename-modal', className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName} onClick={handleBackdropClick}>
      <div
        className="admin-rename-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="admin-rename-modal-close"
          onClick={onCancel}
          disabled={isLoading}
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>

        <div className="admin-rename-modal-icon" aria-hidden>
          <Pencil size={22} strokeWidth={1.75} />
        </div>

        <h2 id={titleId} className="admin-rename-modal-title">
          Rename image
        </h2>

        <div className="admin-rename-modal-preview">
          {thumbnailUrl && (
            <img src={thumbnailUrl} alt="" className="admin-rename-modal-thumb" />
          )}
          <div className="admin-rename-modal-current">
            <span className="admin-rename-modal-label">Current filename</span>
            <p className="admin-rename-modal-filename">{currentName}</p>
          </div>
        </div>

        <form className="admin-rename-modal-form" onSubmit={handleSubmit}>
          <label htmlFor={inputId} className="admin-rename-modal-label">
            New filename
          </label>
          <div className="admin-rename-modal-input-wrap">
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              className={`admin-rename-modal-input ${error || validationError ? 'has-error' : ''}`}
              value={nameStem}
              onChange={handleInputChange}
              disabled={isLoading}
              aria-invalid={Boolean(error || validationError)}
              aria-describedby={error || validationError ? errorId : undefined}
              autoComplete="off"
            />
            {extension && <span className="admin-rename-modal-extension">{extension}</span>}
          </div>
          {(error || validationError) && (
            <p id={errorId} className="admin-rename-modal-error" role="alert">
              {error || validationError}
            </p>
          )}

          <div className="admin-rename-modal-actions">
            <button
              type="button"
              className="admin-rename-modal-btn admin-rename-modal-btn--cancel"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-rename-modal-btn admin-rename-modal-btn--submit"
              disabled={!canSubmit}
            >
              {isLoading ? (
                <Loader2 size={16} strokeWidth={1.75} className="admin-rename-modal-spinner" aria-hidden />
              ) : null}
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
