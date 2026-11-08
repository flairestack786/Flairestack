import React, { memo, useCallback, useState } from 'react'
import { Calendar, FileType2, HardDrive, Pencil, Trash2 } from 'lucide-react'
import MediaCopyUrlButton from './MediaCopyUrlButton'
import {
  formatMediaFileSize,
  formatMediaUploadDate,
  getMediaDisplayFilename,
  getMediaFileFormat,
  resolveStorageCreatedAt,
  resolveStorageFileSize,
  resolveStorageMimeType,
} from '../../lib/mediaMetadata'

/**
 * @param {{
 *   icon?: import('lucide-react').LucideIcon,
 *   label: string,
 *   value: string | null,
 * }} props
 */
function MetaRow({ icon: Icon, label, value }) {
  return (
    <div className="admin-media-grid-meta-row">
      <dt>
        {Icon ? <Icon size={12} strokeWidth={1.75} aria-hidden className="admin-media-grid-meta-icon" /> : null}
        <span>{label}</span>
      </dt>
      <dd>{value ?? '—'}</dd>
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
  const mimeType = resolveStorageMimeType(file)
  const fileSize = resolveStorageFileSize(file)
  const uploadDate = formatMediaUploadDate(resolveStorageCreatedAt(file))
  const fileFormat = getMediaFileFormat(path, mimeType)

  const [previewFailed, setPreviewFailed] = useState(false)

  const handleImageError = useCallback(() => {
    setPreviewFailed(true)
  }, [])

  const cardClassName = [
    'admin-media-grid-card',
    selectable ? 'admin-media-grid-card--selectable' : '',
    isSelected ? 'admin-media-grid-card--selected' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const preview = (
    <div className="admin-media-grid-preview">
      {!previewFailed ? (
        <img
          src={publicUrl}
          alt={displayName}
          className="admin-media-grid-image"
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />
      ) : (
        <div className="admin-media-grid-preview-fallback" aria-hidden>
          <FileType2 size={28} strokeWidth={1.5} />
          <span>{fileFormat ?? 'FILE'}</span>
        </div>
      )}
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

  const meta = (
    <dl className="admin-media-grid-meta" aria-label={`File details for ${displayName}`}>
      <MetaRow icon={FileType2} label="Format" value={fileFormat} />
      <MetaRow
        icon={HardDrive}
        label="File size"
        value={fileSize != null ? formatMediaFileSize(fileSize) : null}
      />
      <MetaRow icon={Calendar} label="Uploaded" value={uploadDate} />
    </dl>
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
        {meta}

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
