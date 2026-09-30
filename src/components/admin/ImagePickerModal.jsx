import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Check, ImageIcon, Search, X } from 'lucide-react'
import MediaGrid from './MediaGrid'
import { buildRenamedStoragePath, getPathExtension } from '../../lib/mediaFormat'

/**
 * @typedef {{ path: string, publicUrl: string, filename: string }} PickerImage
 */

/**
 * Lazy Vite media client — avoids pulling `lib/supabase` into the Next SSR graph.
 * @returns {Promise<Record<string, unknown>>}
 */
function loadViteMediaApi() {
  return import('../../lib/media').then((media) => ({
    listFiles: media.listFiles,
    deleteFile: media.deleteFile,
    renameFile: media.renameFile,
    getPublicUrl: media.getPublicUrl,
    buildRenamedStoragePath: media.buildRenamedStoragePath,
    getPathExtension: media.getPathExtension,
  }))
}

/**
 * Reusable image picker modal for CMS editors.
 * Defaults to the Vite media client (lazy); Next callers should pass `api={nextMediaApi}`.
 * @param {{
 *   isOpen: boolean,
 *   selectedImage?: PickerImage | null,
 *   onSelect: (image: PickerImage) => void,
 *   onClose: () => void,
 *   title?: string,
 *   className?: string,
 *   api?: Record<string, unknown>,
 * }} props
 */
export default function ImagePickerModal({
  isOpen,
  selectedImage = null,
  onSelect,
  onClose,
  title = 'Select image',
  className = '',
  api: apiProp,
}) {
  const titleId = useId()
  const descriptionId = useId()
  const closeRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pendingSelection, setPendingSelection] = useState(/** @type {PickerImage | null} */ (null))
  const [viteApi, setViteApi] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [viteApiError, setViteApiError] = useState('')

  useEffect(() => {
    if (apiProp || viteApi || viteApiError) return undefined
    let cancelled = false

    loadViteMediaApi()
      .then((api) => {
        if (!cancelled) setViteApi(api)
      })
      .catch((err) => {
        if (!cancelled) {
          setViteApiError(err?.message ?? 'Failed to load media library.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [apiProp, viteApi, viteApiError])

  const api = useMemo(
    () =>
      apiProp ??
      viteApi ?? {
        listFiles: async () => [],
        deleteFile: async () => {},
        renameFile: async () => {},
        getPublicUrl: (path) => path,
        buildRenamedStoragePath,
        getPathExtension,
      },
    [apiProp, viteApi]
  )

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
  const apiReady = Boolean(apiProp || viteApi)

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
          {viteApiError && !apiProp ? (
            <p className="admin-settings-state admin-settings-state--error" role="alert">
              {viteApiError}
            </p>
          ) : apiReady ? (
            <MediaGrid
              className="admin-media-grid--picker"
              searchQuery={searchQuery}
              selectable
              selectedPath={pendingSelection?.path ?? null}
              onItemSelect={handleItemSelect}
              emptyHint="Upload images in the Media Library first."
              api={api}
            />
          ) : (
            <p className="admin-settings-state" role="status">
              Loading media library…
            </p>
          )}
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
