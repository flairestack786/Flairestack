import React, { memo, useCallback, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import MediaCopyUrlButton from './MediaCopyUrlButton'
import {
  cacheImageDimensions,
  formatImageDimensions,
  formatMediaFileSize,
  formatMediaUploadDate,
  getCachedImageDimensions,
  getMediaDisplayFilename,
  getMediaImageType,
  resolveStorageFileSize,
} from '../../lib/mediaMetadata'

/**
 * @param {{ label: string, value: string | null, loading?: boolean }} props
 */
function MetaRow({ label, value, loading = false }) {
  return (
    <div className="admin-media-grid-meta-row">
      <dt>{label}</dt>
      <dd className={loading ? 'admin-media-grid-meta-value--loading' : undefined}>
        {value ?? '—'}
      </dd>
    </div>
  )
}

/**
 * @param {{
 *   file: import('@supabase/storage-js').FileObject,
 *   publicUrl: string,
 *   onDeleteRequest: (path: string, publicUrl: string, itemName: string) => void,
 *   onRenameRequest: (path: string, publicUrl: string, itemName: string) => void,
 *   selectable?: boolean,
 *   isSelected?: boolean,
 *   onSelect?: () => void,
 * }} props
 */
function MediaGridCard({
  file,
  publicUrl,
  onDeleteRequest,
  onRenameRequest,
  selectable = false,
  isSelected = false,
  onSelect,
}) {
  const path = file.name
  const displayName = getMediaDisplayFilename(file)
  const cacheKey = path

  const [dimensions, setDimensions] = useState(() => getCachedImageDimensions(cacheKey))
  const [dimensionsFailed, setDimensionsFailed] = useState(false)

  const applyDimensions = useCallback(
    (width, height) => {
      if (!width || !height) {
        setDimensionsFailed(true)
        return
      }
      cacheImageDimensions(cacheKey, width, height)
      setDimensions({ width, height })
      setDimensionsFailed(false)
    },
    [cacheKey]
  )

  const handleImageLoad = useCallback(
    (event) => {
      const { naturalWidth, naturalHeight } = event.currentTarget
      applyDimensions(naturalWidth, naturalHeight)
    },
    [applyDimensions]
  )

  const setImageRef = useCallback(
    (node) => {
      if (node?.complete && node.naturalWidth > 0) {
        applyDimensions(node.naturalWidth, node.naturalHeight)
      }
    },
    [applyDimensions]
  )

  const handleImageError = useCallback(() => {
    setDimensionsFailed(true)
  }, [])

  const fileSize = resolveStorageFileSize(file)
  const uploadDate = formatMediaUploadDate(file.created_at ?? file.updated_at)
  const imageType = getMediaImageType(path)
  const dimensionsLabel = dimensionsFailed
    ? null
    : formatImageDimensions(dimensions?.width, dimensions?.height)
  const dimensionsLoading = !dimensions && !dimensionsFailed

  const cardClassName = [
    'admin-media-grid-card',
    selectable ? 'admin-media-grid-card--selectable' : '',
    isSelected ? 'admin-media-grid-card--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const preview = (
    <div className="admin-media-grid-preview">
      <img
        ref={setImageRef}
        src={publicUrl}
        alt={displayName}
        className="admin-media-grid-image"
        loading="lazy"
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {selectable && isSelected && (
        <span className="admin-media-grid-selected-badge" aria-hidden>
          Selected
        </span>
      )}
    </div>
  )

  const filename = (
    <h3 className="admin-media-grid-filename" title={displayName}>
      {displayName}
    </h3>
  )

  if (selectable) {
    return (
      <li role="presentation">
        <button
          type="button"
          className={cardClassName}
          onClick={onSelect}
          aria-pressed={isSelected}
          aria-label={`Select ${displayName}`}
        >
          {preview}
          <div className="admin-media-grid-body admin-media-grid-body--compact">{filename}</div>
        </button>
      </li>
    )
  }

  return (
    <li className={cardClassName}>
      {preview}

      <div className="admin-media-grid-body">
        {filename}

        <dl className="admin-media-grid-meta">
          <MetaRow label="Filename" value={displayName} />
          <MetaRow
            label="Size"
            value={fileSize != null ? formatMediaFileSize(fileSize) : null}
          />
          <MetaRow
            label="Dimensions"
            value={dimensionsLabel}
            loading={dimensionsLoading}
          />
          <MetaRow label="Type" value={imageType} />
          <MetaRow label="Uploaded" value={uploadDate} />
        </dl>

        <div className="admin-media-grid-actions">
          <MediaCopyUrlButton publicUrl={publicUrl} label={displayName} />

          <button
            type="button"
            className="admin-media-grid-action"
            onClick={() => onDeleteRequest(path, publicUrl, displayName)}
            aria-label={`Delete ${displayName}`}
            title="Delete"
          >
            <Trash2 size={16} strokeWidth={1.75} aria-hidden />
          </button>

          <button
            type="button"
            className="admin-media-grid-action"
            onClick={() => onRenameRequest(path, publicUrl, displayName)}
            aria-label={`Rename ${displayName}`}
            title="Rename"
          >
            <Pencil size={16} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>
    </li>
  )
}

export default memo(MediaGridCard)
