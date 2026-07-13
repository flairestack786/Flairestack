import React, { useCallback, useId, useRef, useState } from 'react'
import { CloudUpload, ImageIcon, Loader2 } from 'lucide-react'
import { useToast } from '../common/ToastProvider'
import { uploadFile } from '../../lib/media'

const IMAGE_ACCEPT = 'image/*'

/**
 * @param {File} file
 * @returns {boolean}
 */
function isImageFile(file) {
  return file.type.startsWith('image/')
}

/**
 * Reusable drag-and-drop image uploader for the admin media library.
 * @param {{ onUploadComplete?: (file: File, result: { path: string, publicUrl: string }) => void, className?: string }} props
 */
export default function MediaUploader({ onUploadComplete, className = '' }) {
  const { success, error, warning } = useToast()
  const inputId = useId()
  const inputRef = useRef(null)
  const progressTimerRef = useRef(null)

  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const clearProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
  }, [])

  const startProgressSimulation = useCallback(() => {
    clearProgressTimer()
    setProgress(8)
    progressTimerRef.current = setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current
        return Math.min(current + Math.random() * 12, 92)
      })
    }, 200)
  }, [clearProgressTimer])

  const finishProgress = useCallback(() => {
    clearProgressTimer()
    setProgress(100)
  }, [clearProgressTimer])

  const resetProgress = useCallback(() => {
    setProgress(0)
  }, [])

  const handleUpload = useCallback(
    async (file) => {
      if (!isImageFile(file)) {
        warning('Only image files are allowed (PNG, JPG, GIF, WebP, SVG, etc.).')
        return
      }

      resetProgress()
      setIsUploading(true)
      startProgressSimulation()

      try {
        const result = await uploadFile(file)
        finishProgress()
        success('Image uploaded successfully')
        onUploadComplete?.(file, result)
      } catch (err) {
        clearProgressTimer()
        resetProgress()
        error(err?.message || 'Upload failed')
      } finally {
        setIsUploading(false)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }
    },
    [
      clearProgressTimer,
      error,
      finishProgress,
      onUploadComplete,
      resetProgress,
      startProgressSimulation,
      success,
      warning,
    ]
  )

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList ?? []).filter(Boolean)
      if (!files.length || isUploading) return
      handleUpload(files[0])
    },
    [handleUpload, isUploading]
  )

  const onDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isUploading) return
    setIsDragging(true)
  }, [isUploading])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isUploading) return
    setIsDragging(true)
  }, [isUploading])

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget.contains(e.relatedTarget)) return
    setIsDragging(false)
  }, [])

  const onDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (isUploading) return
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles, isUploading]
  )

  const onInputChange = useCallback(
    (e) => {
      handleFiles(e.target.files)
    },
    [handleFiles]
  )

  const onBrowseClick = useCallback(() => {
    if (!isUploading) {
      inputRef.current?.click()
    }
  }, [isUploading])

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onBrowseClick()
      }
    },
    [onBrowseClick]
  )

  const rootClassName = [
    'admin-media-uploader',
    isDragging ? 'admin-media-uploader--dragging' : '',
    isUploading ? 'admin-media-uploader--uploading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClassName}>
      <div
        className="admin-media-uploader-dropzone"
        role="button"
        tabIndex={isUploading ? -1 : 0}
        aria-disabled={isUploading}
        aria-labelledby={`${inputId}-label`}
        aria-describedby={`${inputId}-hint`}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onBrowseClick}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={IMAGE_ACCEPT}
          className="admin-media-uploader-input"
          onChange={onInputChange}
          disabled={isUploading}
          tabIndex={-1}
        />

        <div className="admin-media-uploader-icon" aria-hidden>
          {isUploading ? (
            <Loader2 size={28} strokeWidth={1.75} className="admin-media-uploader-spinner" />
          ) : (
            <CloudUpload size={28} strokeWidth={1.75} />
          )}
        </div>

        <p id={`${inputId}-label`} className="admin-media-uploader-title">
          {isUploading ? 'Uploading image…' : 'Drag & drop an image here'}
        </p>
        <p id={`${inputId}-hint`} className="admin-media-uploader-hint">
          {isUploading ? 'Please wait while your file is uploaded.' : 'or click to browse — PNG, JPG, WebP, GIF, SVG'}
        </p>

        {!isUploading && (
          <span className="admin-media-uploader-browse">
            <ImageIcon size={16} strokeWidth={1.75} aria-hidden />
            Choose image
          </span>
        )}
      </div>

      {isUploading && (
        <div className="admin-media-uploader-progress" aria-live="polite">
          <div className="admin-media-uploader-progress-track">
            <div
              className="admin-media-uploader-progress-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="admin-media-uploader-progress-label">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  )
}
