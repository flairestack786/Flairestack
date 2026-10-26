import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Upload,
  Video,
} from 'lucide-react'
import EditorField from './EditorField'
import EditorSection from './EditorSection'
import { useMediaPublicUrl } from '../MediaUrlContext'
import { useToast } from '../../common/ToastProvider'
import ImagePickerModal from '../ImagePickerModal'

/**
 * @param {{
 *   api: {
 *     listHeroSlides: () => Promise<Record<string, unknown>[]>,
 *     createHeroSlide: (input?: Record<string, unknown>) => Promise<Record<string, unknown>>,
 *     updateHeroSlide: (id: string, input: Record<string, unknown>) => Promise<Record<string, unknown>>,
 *     deleteHeroSlide: (id: string) => Promise<void>,
 *     reorderHeroSlides: (ids: string[]) => Promise<Record<string, unknown>[]>,
 *     uploadHeroMedia: (file: File) => Promise<{ path: string, publicUrl: string }>,
 *   },
 *   mediaApi?: Record<string, unknown>,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function HeroSlideshowEditor({ api, mediaApi, panelId, labelledBy }) {
  const { success, error } = useToast()
  const getPublicUrl = useMediaPublicUrl()
  const fileInputRef = useRef(null)

  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [slides, setSlides] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [selectedId, setSelectedId] = useState(/** @type {string | null} */ (null))
  const [draft, setDraft] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [baseline, setBaseline] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerField, setPickerField] = useState(/** @type {'media_path' | 'poster_path'} */ ('media_path'))
  const [deleteConfirmId, setDeleteConfirmId] = useState(/** @type {string | null} */ (null))

  const selected = useMemo(
    () => slides.find((slide) => String(slide.id) === selectedId) ?? null,
    [slides, selectedId]
  )

  const isDirty = useMemo(() => {
    if (!draft || !baseline) return false
    return JSON.stringify(draft) !== JSON.stringify(baseline)
  }, [draft, baseline])

  const mediaPreviewUrl = useMemo(() => {
    const path = typeof draft?.media_path === 'string' ? draft.media_path : ''
    if (!path) return ''
    try {
      return getPublicUrl(path)
    } catch {
      return ''
    }
  }, [draft?.media_path, getPublicUrl])

  const posterPreviewUrl = useMemo(() => {
    const path = typeof draft?.poster_path === 'string' ? draft.poster_path : ''
    if (!path) return ''
    try {
      return getPublicUrl(path)
    } catch {
      return ''
    }
  }, [draft?.poster_path, getPublicUrl])

  const loadSlides = useCallback(async () => {
    setStatus('loading')
    setLoadError('')
    try {
      const rows = await api.listHeroSlides()
      const ordered = [...rows].sort(
        (a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)
      )
      setSlides(ordered)
      const firstId = ordered[0] ? String(ordered[0].id) : null
      setSelectedId((current) => {
        if (current && ordered.some((row) => String(row.id) === current)) return current
        return firstId
      })
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setLoadError(err?.message || 'Failed to load hero slides.')
    }
  }, [api])

  useEffect(() => {
    void loadSlides()
  }, [loadSlides])

  useEffect(() => {
    if (!selectedId) {
      setDraft(null)
      setBaseline(null)
      return
    }
    const row = slides.find((slide) => String(slide.id) === selectedId)
    if (!row) {
      setDraft(null)
      setBaseline(null)
      return
    }
    const next = { ...row }
    setDraft(next)
    setBaseline(next)
    // Only re-sync when the selected slide changes — not on list reorder/refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [selectedId])

  const updateDraft = useCallback((field, value) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current))
  }, [])

  const handleSelect = useCallback(
    (id) => {
      if (isDirty && !window.confirm('Discard unsaved changes to this slide?')) return
      setSelectedId(id)
    },
    [isDirty]
  )

  const handleAdd = useCallback(async () => {
    if (isDirty && !window.confirm('Discard unsaved changes to this slide?')) return
    setIsSaving(true)
    try {
      const created = await api.createHeroSlide()
      success('Slide added')
      await loadSlides()
      setSelectedId(String(created.id))
    } catch (err) {
      error(err?.message || 'Failed to add slide')
    } finally {
      setIsSaving(false)
    }
  }, [api, error, isDirty, loadSlides, success])

  const handleSave = useCallback(async () => {
    if (!draft?.id) return
    setIsSaving(true)
    try {
      const updated = await api.updateHeroSlide(String(draft.id), draft)
      success('Slide saved')
      setSlides((current) =>
        current.map((row) => (String(row.id) === String(updated.id) ? updated : row))
      )
      setDraft(updated)
      setBaseline(updated)
    } catch (err) {
      error(err?.message || 'Failed to save slide')
    } finally {
      setIsSaving(false)
    }
  }, [api, draft, error, success])

  const handleDelete = useCallback(async () => {
    if (!deleteConfirmId) return
    setIsSaving(true)
    try {
      await api.deleteHeroSlide(deleteConfirmId)
      success('Slide deleted')
      setDeleteConfirmId(null)
      if (selectedId === deleteConfirmId) setSelectedId(null)
      await loadSlides()
    } catch (err) {
      error(err?.message || 'Failed to delete slide')
    } finally {
      setIsSaving(false)
    }
  }, [api, deleteConfirmId, error, loadSlides, selectedId, success])

  const moveSlide = useCallback(
    async (id, direction) => {
      const ids = slides.map((row) => String(row.id))
      const index = ids.indexOf(id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= ids.length) return
      const next = [...ids]
      ;[next[index], next[target]] = [next[target], next[index]]
      setIsSaving(true)
      try {
        const updated = await api.reorderHeroSlides(next)
        setSlides(updated)
        success('Slide order updated')
      } catch (err) {
        error(err?.message || 'Failed to reorder slides')
      } finally {
        setIsSaving(false)
      }
    },
    [api, error, slides, success]
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file || !draft?.id) return
      setIsUploading(true)
      try {
        const result = await api.uploadHeroMedia(file)
        const mediaType = result.mediaType || (file.type.startsWith('video/') ? 'video' : 'image')
        // Persist media reference immediately so refresh / public ISR can see it
        // without requiring a separate "Save slide" for the path alone.
        const updated = await api.updateHeroSlide(String(draft.id), {
          media_path: result.path,
          media_type: mediaType,
        })
        setSlides((current) =>
          current.map((row) => (String(row.id) === String(updated.id) ? updated : row))
        )
        setDraft(updated)
        setBaseline(updated)
        success(mediaType === 'video' ? 'Video uploaded and saved' : 'Image uploaded and saved')
      } catch (err) {
        error(err?.message || 'Upload failed')
      } finally {
        setIsUploading(false)
      }
    },
    [api, draft, error, success]
  )

  const pickerSelected = useMemo(() => {
    if (!draft) return null
    const path = typeof draft[pickerField] === 'string' ? draft[pickerField] : ''
    if (!path) return null
    try {
      return { path, publicUrl: getPublicUrl(path), filename: path.split('/').pop() || path }
    } catch {
      return null
    }
  }, [draft, getPublicUrl, pickerField])

  if (status === 'loading') {
    return (
      <EditorSection
        panelId={panelId}
        labelledBy={labelledBy}
        title="Hero Slideshow"
        description="Loading slides…"
      >
        <div className="admin-settings-state" role="status">
          <Loader2 size={20} className="admin-settings-spinner" aria-hidden />
          <span>Loading hero slides…</span>
        </div>
      </EditorSection>
    )
  }

  if (status === 'error') {
    return (
      <EditorSection
        panelId={panelId}
        labelledBy={labelledBy}
        title="Hero Slideshow"
        description="Unable to load slides."
      >
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={20} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={() => void loadSlides()}>
            Retry
          </button>
        </div>
        <p className="admin-field-hint">
          If this table is missing, apply migration{' '}
          <code>20261025140000_home_hero_slides.sql</code>. For video uploads also apply{' '}
          <code>20261025150000_site_media_allow_hero_video.sql</code> so{' '}
          <code>site-media</code> accepts <code>video/mp4</code> and <code>video/webm</code>.
        </p>
      </EditorSection>
    )
  }

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Hero Slideshow"
      description="Manage cinematic homepage slides (video or image). Slide 1 preserves the original hero copy; select a verified Chicago skyline video for its background."
    >
      <div className="hero-slides-layout">
        <div className="hero-slides-list-panel">
          <div className="hero-slides-list-header">
            <h3 className="admin-settings-subtitle">Slides</h3>
            <button
              type="button"
              className="admin-settings-secondary-btn"
              onClick={() => void handleAdd()}
              disabled={isSaving}
            >
              <Plus size={16} strokeWidth={1.75} aria-hidden />
              Add slide
            </button>
          </div>

          <ul className="hero-slides-list" aria-label="Hero slides">
            {slides.map((slide, index) => {
              const id = String(slide.id)
              const isActive = id === selectedId
              const enabled = slide.is_enabled !== false
              return (
                <li key={id} className={`hero-slides-list-item${isActive ? ' is-active' : ''}`}>
                  <button
                    type="button"
                    className="hero-slides-list-select"
                    onClick={() => handleSelect(id)}
                    aria-current={isActive ? 'true' : undefined}
                  >
                    <span className="hero-slides-list-order">{index + 1}</span>
                    <span className="hero-slides-list-meta">
                      <strong>{String(slide.admin_label || slide.title || 'Untitled')}</strong>
                      <span>
                        {slide.media_type === 'video' ? 'Video' : 'Image'}
                        {enabled ? '' : ' · Disabled'}
                      </span>
                    </span>
                  </button>
                  <div className="hero-slides-list-actions">
                    <button
                      type="button"
                      className="hero-slides-icon-btn"
                      aria-label={`Move slide ${index + 1} up`}
                      disabled={index === 0 || isSaving}
                      onClick={() => void moveSlide(id, -1)}
                    >
                      <ChevronUp size={16} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="hero-slides-icon-btn"
                      aria-label={`Move slide ${index + 1} down`}
                      disabled={index === slides.length - 1 || isSaving}
                      onClick={() => void moveSlide(id, 1)}
                    >
                      <ChevronDown size={16} aria-hidden />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="hero-slides-editor-panel">
          {!draft ? (
            <p className="admin-field-hint">Select a slide to edit, or add a new one.</p>
          ) : (
            <>
              {String(draft.admin_label || '').includes('SELECT MEDIA') ? (
                <div className="hero-slides-placeholder-banner" role="status">
                  Chicago skyline video was not verified in the repository. Upload or select the
                  correct skyline MP4 here before publishing this slide’s video background.
                </div>
              ) : null}

              <EditorField id="slide-admin-label" label="Admin label">
                <input
                  id="slide-admin-label"
                  type="text"
                  className="admin-settings-input"
                  value={String(draft.admin_label ?? '')}
                  onChange={(e) => updateDraft('admin_label', e.target.value)}
                />
              </EditorField>

              <EditorField id="slide-media-type" label="Media type">
                <div className="hero-slides-media-type">
                  <label>
                    <input
                      type="radio"
                      name="slide-media-type"
                      checked={draft.media_type !== 'video'}
                      onChange={() => updateDraft('media_type', 'image')}
                    />
                    <ImageIcon size={14} aria-hidden /> Image
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="slide-media-type"
                      checked={draft.media_type === 'video'}
                      onChange={() => updateDraft('media_type', 'video')}
                    />
                    <Video size={14} aria-hidden /> Video
                  </label>
                </div>
              </EditorField>

              <EditorField id="slide-media" label="Background media">
                <div className="hero-slides-media-actions">
                  {draft.media_type === 'video' ? (
                    <button
                      type="button"
                      className="admin-settings-secondary-btn"
                      onClick={handleUploadClick}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 size={16} className="admin-settings-spinner" aria-hidden />
                      ) : (
                        <Upload size={16} aria-hidden />
                      )}
                      Upload video
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="admin-settings-secondary-btn"
                      onClick={() => {
                        setPickerField('media_path')
                        setPickerOpen(true)
                      }}
                    >
                      Choose from library
                    </button>
                  )}
                  {draft.media_path ? (
                    <button
                      type="button"
                      className="admin-settings-secondary-btn"
                      onClick={() => updateDraft('media_path', '')}
                    >
                      Clear media
                    </button>
                  ) : null}
                </div>
                {draft.media_type === 'video' ? (
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="sr-only"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={(e) => void handleFileChange(e)}
                  />
                ) : null}
                {mediaPreviewUrl ? (
                  <div className="hero-slides-preview">
                    {draft.media_type === 'video' ? (
                      <video src={mediaPreviewUrl} className="hero-slides-preview-media" muted controls playsInline />
                    ) : (
                      <img src={mediaPreviewUrl} alt="" className="hero-slides-preview-media" />
                    )}
                    <code className="hero-slides-path">{String(draft.media_path)}</code>
                  </div>
                ) : (
                  <p className="admin-field-hint">No media selected — public hero falls back to the bundled image.</p>
                )}
              </EditorField>

              {draft.media_type === 'video' ? (
                <EditorField id="slide-poster" label="Poster / fallback image">
                  <div className="hero-slides-media-actions">
                    <button
                      type="button"
                      className="admin-settings-secondary-btn"
                      onClick={() => {
                        setPickerField('poster_path')
                        setPickerOpen(true)
                      }}
                    >
                      Choose poster
                    </button>
                    {draft.poster_path ? (
                      <button
                        type="button"
                        className="admin-settings-secondary-btn"
                        onClick={() => updateDraft('poster_path', '')}
                      >
                        Clear poster
                      </button>
                    ) : null}
                  </div>
                  {posterPreviewUrl ? (
                    <div className="hero-slides-preview">
                      <img src={posterPreviewUrl} alt="" className="hero-slides-preview-media" />
                    </div>
                  ) : null}
                </EditorField>
              ) : (
                <EditorField id="slide-alt" label="Image alt text">
                  <input
                    id="slide-alt"
                    type="text"
                    className="admin-settings-input"
                    value={String(draft.media_alt ?? '')}
                    onChange={(e) => updateDraft('media_alt', e.target.value)}
                  />
                </EditorField>
              )}

              <EditorField id="slide-eyebrow" label="Eyebrow (optional)">
                <input
                  id="slide-eyebrow"
                  type="text"
                  className="admin-settings-input"
                  value={String(draft.eyebrow ?? '')}
                  onChange={(e) => updateDraft('eyebrow', e.target.value)}
                />
              </EditorField>

              <EditorField id="slide-title" label="Headline">
                <input
                  id="slide-title"
                  type="text"
                  className="admin-settings-input"
                  value={String(draft.title ?? '')}
                  onChange={(e) => updateDraft('title', e.target.value)}
                />
              </EditorField>

              <EditorField id="slide-title-accent" label="Highlighted headline">
                <input
                  id="slide-title-accent"
                  type="text"
                  className="admin-settings-input"
                  value={String(draft.title_accent ?? '')}
                  onChange={(e) => updateDraft('title_accent', e.target.value)}
                />
              </EditorField>

              <EditorField id="slide-intro" label="Intro line">
                <input
                  id="slide-intro"
                  type="text"
                  className="admin-settings-input"
                  value={String(draft.intro ?? '')}
                  onChange={(e) => updateDraft('intro', e.target.value)}
                />
              </EditorField>

              <EditorField id="slide-body" label="Description">
                <textarea
                  id="slide-body"
                  className="admin-settings-textarea"
                  rows={4}
                  value={String(draft.body ?? '')}
                  onChange={(e) => updateDraft('body', e.target.value)}
                />
              </EditorField>

              <EditorField id="slide-cta-label" label="CTA label">
                <input
                  id="slide-cta-label"
                  type="text"
                  className="admin-settings-input"
                  value={String(draft.cta_primary_label ?? '')}
                  onChange={(e) => updateDraft('cta_primary_label', e.target.value)}
                />
              </EditorField>

              <EditorField id="slide-cta-url" label="CTA URL">
                <input
                  id="slide-cta-url"
                  type="text"
                  className="admin-settings-input"
                  value={String(draft.cta_primary_url ?? '')}
                  onChange={(e) => updateDraft('cta_primary_url', e.target.value)}
                  placeholder="#contact"
                />
              </EditorField>

              <EditorField id="slide-cta2-label" label="Secondary CTA label (optional)">
                <input
                  id="slide-cta2-label"
                  type="text"
                  className="admin-settings-input"
                  value={String(draft.cta_secondary_label ?? '')}
                  onChange={(e) => updateDraft('cta_secondary_label', e.target.value)}
                />
              </EditorField>

              <EditorField id="slide-cta2-url" label="Secondary CTA URL (optional)">
                <input
                  id="slide-cta2-url"
                  type="text"
                  className="admin-settings-input"
                  value={String(draft.cta_secondary_url ?? '')}
                  onChange={(e) => updateDraft('cta_secondary_url', e.target.value)}
                />
              </EditorField>

              <div className="hero-slides-editor-footer">
                <label className="hero-slides-enabled">
                  <input
                    type="checkbox"
                    checked={draft.is_enabled !== false}
                    onChange={(e) => updateDraft('is_enabled', e.target.checked)}
                    disabled={isSaving}
                  />
                  Enabled on public homepage
                </label>
                <div className="hero-slides-editor-actions">
                  <button
                    type="button"
                    className="admin-settings-secondary-btn hero-slides-danger"
                    onClick={() => setDeleteConfirmId(String(draft.id))}
                    disabled={isSaving}
                  >
                    <Trash2 size={16} aria-hidden />
                    Delete
                  </button>
                  <button
                    type="button"
                    className="admin-settings-save-btn"
                    onClick={() => void handleSave()}
                    disabled={!isDirty || isSaving}
                  >
                    {isSaving ? <Loader2 size={16} className="admin-settings-spinner" aria-hidden /> : null}
                    Save slide
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {deleteConfirmId ? (
        <div className="hero-slides-confirm" role="alertdialog" aria-labelledby="hero-slide-delete-title">
          <div className="hero-slides-confirm-card">
            <h4 id="hero-slide-delete-title">Delete this slide?</h4>
            <p>This cannot be undone. Disabled slides are hidden from the public site without deleting.</p>
            <div className="hero-slides-editor-actions">
              <button
                type="button"
                className="admin-settings-secondary-btn"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-settings-save-btn hero-slides-danger"
                onClick={() => void handleDelete()}
                disabled={isSaving}
              >
                Delete slide
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ImagePickerModal
        isOpen={pickerOpen}
        selectedImage={pickerSelected}
        onSelect={(image) => {
          updateDraft(pickerField, image.path)
          setPickerOpen(false)
        }}
        onClose={() => setPickerOpen(false)}
        title={pickerField === 'poster_path' ? 'Select poster image' : 'Select background image'}
        api={mediaApi}
      />
    </EditorSection>
  )
}
