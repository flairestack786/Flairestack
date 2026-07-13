import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Check, ImageIcon, Search, X } from 'lucide-react'
import MediaGrid from './MediaGrid'

/**
 * @typedef {{ path: string, publicUrl: string, filename: string }} PickerImage
 */

/**
 * Reusable image picker modal for CMS editors.
 * @param {{
 *   isOpen: boolean,
 *   selectedImage?: PickerImage | null,
 *   onSelect: (image: PickerImage) => void,
 *   onClose: () => void,
 *   title?: string,
 *   className?: string,
 * }} props
 */
export default function ImagePickerModal({
  isOpen,
  selectedImage = null,
  onSelect,
  onClose,
  title = 'Select image',
  className = '',
}) {
  const titleId = useId()
  const descriptionId = useId()
  const closeRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingSelection, setPendingSelection] = useState(/** @type {PickerImage | null} */ (null))

  useEffect(() => {
    if (!isOpen) return
    setPendingSelection(selectedImage)
    setSearchQuery('')
  }, [isOpen, selectedImage])

  const handleBackdropClick = useCallback(
    (event) => {
      if (event.target === event.currentTarget) {
        onClose()
      }
    },
    [onClose]
  )

  const handleSearchChange = useCallback((event) => {
    setSearchQuery(event.target.value)
  }, [])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
  }, [])

  const handleItemSelect = useCallback((image) => {
    setPendingSelection(image)
  }, [])

  const handleConfirm = useCallback(() => {
    if (!pendingSelection) return
    onSelect(pendingSelection)
    onClose()
  }, [pendingSelection, onSelect, onClose])

  useEffect(() => {
    if (!isOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const rootClassName = ['admin-image-picker-modal', className].filter(Boolean).join(' ')
  const canConfirm = Boolean(pendingSelection)

  return (
    <div className={rootClassName} onClick={handleBackdropClick}>
      <div
        className="admin-image-picker-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-image-picker-modal-header">
          <div>
            <h2 id={titleId} className="admin-image-picker-modal-title">
              {title}
            </h2>
            <p id={descriptionId} className="admin-image-picker-modal-desc">
              Choose an image from the Media Library.
            </p>
          </div>

          <button
            ref={closeRef}
            type="button"
            className="admin-image-picker-modal-close"
            onClick={onClose}
            aria-label="Close image picker"
          >
            <X size={18} strokeWidth={1.75} aria-hidden />
          </button>
        </header>

        <div className="admin-image-picker-modal-toolbar">
          <div className="admin-image-picker-modal-search">
            <Search size={18} strokeWidth={1.75} className="admin-image-picker-modal-search-icon" aria-hidden />
            <input
              type="search"
              className="admin-image-picker-modal-search-input"
              placeholder="Search by filename…"
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search images by filename"
            />
            {searchQuery && (
              <button
                type="button"
                className="admin-image-picker-modal-search-clear"
                onClick={handleSearchClear}
                aria-label="Clear search"
              >
                <X size={16} strokeWidth={1.75} aria-hidden />
              </button>
            )}
          </div>

          <div className="admin-image-picker-modal-preview" aria-live="polite">
            {pendingSelection ? (
              <>
                <img
                  src={pendingSelection.publicUrl}
                  alt=""
                  className="admin-image-picker-modal-preview-image"
                />
                <div className="admin-image-picker-modal-preview-copy">
                  <span className="admin-image-picker-modal-preview-label">Selected</span>
                  <p className="admin-image-picker-modal-preview-name" title={pendingSelection.filename}>
                    {pendingSelection.filename}
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="admin-image-picker-modal-preview-empty-icon" aria-hidden>
                  <ImageIcon size={20} strokeWidth={1.75} />
                </span>
                <p className="admin-image-picker-modal-preview-empty">No image selected yet.</p>
              </>
            )}
          </div>
        </div>

        <div className="admin-image-picker-modal-body">
          <MediaGrid
            className="admin-media-grid--picker"
            searchQuery={searchQuery}
            selectable
            selectedPath={pendingSelection?.path ?? null}
            onItemSelect={handleItemSelect}
            emptyHint="Upload images in the Media Library first."
          />
        </div>

        <footer className="admin-image-picker-modal-footer">
          <button
            type="button"
            className="admin-image-picker-modal-btn admin-image-picker-modal-btn--cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-image-picker-modal-btn admin-image-picker-modal-btn--confirm"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            <Check size={16} strokeWidth={1.75} aria-hidden />
            Confirm Selection
          </button>
        </footer>
      </div>
    </div>
  )
}
