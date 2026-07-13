import React, { useCallback, useState } from 'react'
import { X } from 'lucide-react'
import EditorField from '../home/EditorField'

/**
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onCreate: (input: { slug: string, title: string, short_description: string, description: string }) => Promise<void>,
 * }} props
 */
export default function ServiceCreateModal({ isOpen, onClose, onCreate }) {
  const [slug, setSlug] = useState('')
  const [title, setTitle] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleTitleChange = useCallback((value) => {
    setTitle(value)
    if (!slug.trim()) {
      setSlug(
        value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      )
    }
  }, [slug])

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      setIsSubmitting(true)
      setError('')

      try {
        await onCreate({
          slug: slug.trim().toLowerCase(),
          title: title.trim(),
          short_description: shortDescription.trim(),
          description: description.trim(),
        })
        setSlug('')
        setTitle('')
        setShortDescription('')
        setDescription('')
        onClose()
      } catch (err) {
        setError(err?.message ?? 'Failed to create service.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [slug, title, shortDescription, description, onCreate, onClose]
  )

  if (!isOpen) return null

  return (
    <div className="admin-rename-modal" onClick={onClose} role="presentation">
      <div
        className="admin-rename-modal-panel admin-services-create-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-service-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="admin-rename-modal-close" onClick={onClose} aria-label="Close">
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>

        <h2 id="create-service-title" className="admin-rename-modal-title">
          Create service
        </h2>

        <form className="admin-rename-modal-form" onSubmit={handleSubmit}>
          {error && (
            <p className="admin-settings-hint admin-services-create-error" role="alert">
              {error}
            </p>
          )}

          <EditorField id="create-service-title-input" label="Title">
            <input
              id="create-service-title-input"
              type="text"
              className="admin-settings-input"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
          </EditorField>

          <EditorField
            id="create-service-slug"
            label="Slug"
            hint="Lowercase URL segment, e.g. web-development"
          >
            <input
              id="create-service-slug"
              type="text"
              className="admin-settings-input"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
            />
          </EditorField>

          <EditorField id="create-service-short-description" label="Short description">
            <textarea
              id="create-service-short-description"
              className="admin-settings-textarea"
              rows={2}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              required
            />
          </EditorField>

          <EditorField id="create-service-description" label="Description">
            <textarea
              id="create-service-description"
              className="admin-settings-textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </EditorField>

          <div className="admin-rename-modal-actions">
            <button type="button" className="admin-rename-modal-btn admin-rename-modal-btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-rename-modal-btn admin-rename-modal-btn--submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
