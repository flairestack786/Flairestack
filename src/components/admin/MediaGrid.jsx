import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ImageIcon,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'
import ConfirmationModal from './ConfirmationModal'
import RenameImageModal from './RenameImageModal'
import MediaGridCard from './MediaGridCard'
import { useToast } from '../common/ToastProvider'
import {
  buildRenamedStoragePath,
  deleteFile,
  getPathExtension,
  getPublicUrl,
  listFiles,
  renameFile,
} from '../../lib/media'
import { getMediaDisplayFilename } from '../../lib/mediaMetadata'

/**
 * Case-insensitive substring match against the card filename.
 * @param {import('@supabase/storage-js').FileObject} file
 * @param {string} normalizedQuery
 * @returns {boolean}
 */
function matchesSearchQuery(file, normalizedQuery) {
  if (!normalizedQuery) return true
  return getMediaDisplayFilename(file).toLowerCase().includes(normalizedQuery)
}

/**
 * Responsive media gallery grid for the admin media library.
 * @param {{
 *   className?: string,
 *   refreshKey?: number,
 *   searchQuery?: string,
 *   selectable?: boolean,
 *   selectedPath?: string | null,
 *   onItemSelect?: (image: { path: string, publicUrl: string, filename: string }) => void,
 *   emptyHint?: string,
 * }} props
 */
export default function MediaGrid({
  className = '',
  refreshKey = 0,
  searchQuery = '',
  selectable = false,
  selectedPath = null,
  onItemSelect,
  emptyHint,
}) {
  const { success, error } = useToast()
  const [files, setFiles] = useState([])
  const [status, setStatus] = useState('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [renameTarget, setRenameTarget] = useState(null)
  const [isRenaming, setIsRenaming] = useState(false)

  const loadFiles = useCallback(async () => {
    setStatus('loading')
    setErrorMessage('')

    try {
      const data = await listFiles()
      const imageFiles = data.filter(
        (item) => item?.name && item.id != null && !item.name.endsWith('/')
      )
      setFiles(imageFiles)
      setStatus(imageFiles.length ? 'ready' : 'empty')
    } catch (err) {
      setFiles([])
      setStatus('error')
      setErrorMessage(err?.message || 'Unable to load media files.')
    }
  }, [])

  useEffect(() => {
    loadFiles()
  }, [loadFiles, refreshKey])

  const normalizedSearchQuery = useMemo(
    () => searchQuery.trim().toLowerCase(),
    [searchQuery]
  )

  const filteredFiles = useMemo(() => {
    if (!normalizedSearchQuery) return files
    return files.filter((file) => matchesSearchQuery(file, normalizedSearchQuery))
  }, [files, normalizedSearchQuery])

  const hasSearchQuery = normalizedSearchQuery.length > 0

  const handleDeleteRequest = useCallback((path, publicUrl, itemName) => {
    setDeleteTarget({ path, publicUrl, itemName })
  }, [])

  const handleDeleteCancel = useCallback(() => {
    if (isDeleting) return
    setDeleteTarget(null)
  }, [isDeleting])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return

    setIsDeleting(true)

    try {
      await deleteFile(deleteTarget.path)
      setDeleteTarget(null)
      await loadFiles()
      success('Image deleted')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err?.message || 'Unable to delete file.')
      setDeleteTarget(null)
      error(err?.message || 'Failed to delete image')
    } finally {
      setIsDeleting(false)
    }
  }, [deleteTarget, loadFiles, success, error])

  const handleRenameRequest = useCallback((path, publicUrl, itemName) => {
    setRenameTarget({ path, publicUrl, itemName })
  }, [])

  const handleRenameCancel = useCallback(() => {
    if (isRenaming) return
    setRenameTarget(null)
  }, [isRenaming])

  const handleRename = useCallback(
    async (newStem) => {
      if (!renameTarget) return

      const newPath = buildRenamedStoragePath(renameTarget.path, newStem)
      if (newPath === renameTarget.path) return

      const extension = getPathExtension(renameTarget.path)
      const originalFilename = `${newStem.trim()}${extension}`

      setIsRenaming(true)

      try {
        await renameFile(renameTarget.path, newPath, { originalFilename })
        setRenameTarget(null)
        await loadFiles()
        success('Image renamed')
      } catch (err) {
        error(err?.message || 'Rename failed')
      } finally {
        setIsRenaming(false)
      }
    },
    [renameTarget, loadFiles, success, error]
  )

  const rootClassName = ['admin-media-grid', className].filter(Boolean).join(' ')

  let content = null

  if (status === 'loading') {
    content = (
      <div className={`${rootClassName} admin-media-grid--loading`}>
        <div className="admin-media-grid-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-media-grid-spinner" aria-hidden />
          <p>Loading media library…</p>
        </div>
      </div>
    )
  } else if (status === 'error') {
    content = (
      <div className={`${rootClassName} admin-media-grid--error`}>
        <div className="admin-media-grid-state" role="alert">
          <AlertCircle size={24} strokeWidth={1.75} aria-hidden />
          <p>{errorMessage}</p>
          <button type="button" className="admin-media-grid-retry" onClick={loadFiles}>
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Try again
          </button>
        </div>
      </div>
    )
  } else if (status === 'empty') {
    content = (
      <div className={`${rootClassName} admin-media-grid--empty`}>
        <div className="admin-media-grid-state">
          <ImageIcon size={24} strokeWidth={1.75} aria-hidden />
          <p>No images in the library yet.</p>
          <span className="admin-media-grid-state-hint">
            {emptyHint ?? 'Upload a file above to get started.'}
          </span>
        </div>
      </div>
    )
  } else if (files.length > 0 && hasSearchQuery && filteredFiles.length === 0) {
    content = (
      <div className={`${rootClassName} admin-media-grid--no-results`}>
        <div className="admin-media-grid-state">
          <Search size={24} strokeWidth={1.75} aria-hidden />
          <p>No images match your search.</p>
        </div>
      </div>
    )
  } else {
    content = (
      <div className={rootClassName}>
        <ul className="admin-media-grid-cards">
          {filteredFiles.map((file) => {
            const path = file.name
            const displayName = getMediaDisplayFilename(file)
            const publicUrl = getPublicUrl(path)

            return (
              <MediaGridCard
                key={path}
                file={file}
                publicUrl={publicUrl}
                onDeleteRequest={handleDeleteRequest}
                onRenameRequest={handleRenameRequest}
                selectable={selectable}
                isSelected={selectedPath === path}
                onSelect={() =>
                  onItemSelect?.({
                    path,
                    publicUrl,
                    filename: displayName,
                  })
                }
              />
            )
          })}
        </ul>
      </div>
    )
  }

  return (
    <>
      {content}

      {!selectable && (
        <>
          <ConfirmationModal
            isOpen={deleteTarget != null}
            title="Delete image?"
            message="This action cannot be undone."
            itemName={deleteTarget?.itemName}
            thumbnailUrl={deleteTarget?.publicUrl}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            isLoading={isDeleting}
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />

          <RenameImageModal
            isOpen={renameTarget != null}
            currentName={renameTarget?.itemName ?? ''}
            currentPath={renameTarget?.path ?? ''}
            thumbnailUrl={renameTarget?.publicUrl}
            isLoading={isRenaming}
            onRename={handleRename}
            onCancel={handleRenameCancel}
          />
        </>
      )}
    </>
  )
}
