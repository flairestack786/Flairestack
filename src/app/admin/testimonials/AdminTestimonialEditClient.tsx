'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Star,
} from 'lucide-react'
import ImagePickerModal from '@/components/admin/ImagePickerModal'
import EditorField from '@/components/admin/home/EditorField'
import EditorSection from '@/components/admin/home/EditorSection'
import SaveBar from '@/components/admin/settings/SaveBar'
import SettingsImageField from '@/components/admin/settings/SettingsImageField'
import { pathToPickerImage } from '@/components/admin/settings/settingsImage'
import { useMediaPublicUrl } from '@/components/admin/MediaUrlContext'
import { useToast } from '@/components/common/ToastProvider'
import {
  getTestimonial,
  setTestimonialStatus,
  updateTestimonial,
} from '@/lib/next/testimonialsBrowser'
import { nextMediaApi } from '@/lib/next/mediaBrowser'

type ImagePickerTarget = 'photo_path' | 'company_logo_path' | null

type TestimonialForm = {
  name: string
  company: string
  position: string
  testimonial: string
  rating: number
  photo_path: string
  company_logo_path: string
  sort_order: number
  featured: boolean
  stat: string
  stat_label: string
  status: 'draft' | 'published'
  published_at: unknown
}

function emptyForm(): TestimonialForm {
  return {
    name: '',
    company: '',
    position: '',
    testimonial: '',
    rating: 5,
    photo_path: '',
    company_logo_path: '',
    sort_order: 0,
    featured: false,
    stat: '',
    stat_label: '',
    status: 'draft',
    published_at: null,
  }
}

function rowToForm(row: Record<string, unknown>): TestimonialForm {
  return {
    name: String(row.name ?? ''),
    company: String(row.company ?? ''),
    position: String(row.position ?? ''),
    testimonial: String(row.testimonial ?? ''),
    rating: Number(row.rating) || 5,
    photo_path: String(row.photo_path ?? ''),
    company_logo_path: String(row.company_logo_path ?? ''),
    sort_order: Number(row.sort_order) || 0,
    featured: Boolean(row.featured),
    stat: String(row.stat ?? ''),
    stat_label: String(row.stat_label ?? ''),
    status: row.status === 'published' ? 'published' : 'draft',
    published_at: row.published_at ?? null,
  }
}

function formToPayload(form: TestimonialForm): Record<string, unknown> {
  return {
    name: form.name,
    company: form.company,
    position: form.position,
    testimonial: form.testimonial,
    rating: form.rating,
    photo_path: form.photo_path || null,
    company_logo_path: form.company_logo_path || null,
    sort_order: form.sort_order,
    featured: Boolean(form.featured),
    stat: form.stat || null,
    stat_label: form.stat_label || null,
  }
}

function formsAreEqual(a: TestimonialForm, b: TestimonialForm) {
  return JSON.stringify(formToPayload(a)) === JSON.stringify(formToPayload(b))
}

/**
 * Migrated Testimonial editor — mirrors Vite AdminTestimonialEditPage.
 */
export default function AdminTestimonialEditClient() {
  const params = useParams()
  const testimonialId =
    typeof params?.testimonialId === 'string' ? params.testimonialId : ''
  const router = useRouter()
  const toast = useToast() as {
    success: (message: string) => void
    error: (message: string) => void
  }
  const { success, error } = toast
  const getPublicUrl = useMediaPublicUrl()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [baseline, setBaseline] = useState<TestimonialForm>(emptyForm)
  const [form, setForm] = useState<TestimonialForm>(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('draft')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<ImagePickerTarget>(null)

  const isDirty = useMemo(() => !formsAreEqual(form, baseline), [form, baseline])

  const pickerSelectedImage = useMemo(() => {
    if (!pickerTarget) return null
    const path = typeof form[pickerTarget] === 'string' ? form[pickerTarget] : ''
    return pathToPickerImage(path, getPublicUrl)
  }, [pickerTarget, form, getPublicUrl])

  const loadTestimonial = useCallback(async () => {
    if (!testimonialId) return

    setStatus('loading')
    setLoadError('')

    try {
      const row = await getTestimonial(testimonialId)
      const nextForm = rowToForm(row)
      setBaseline(structuredClone(nextForm))
      setForm(structuredClone(nextForm))
      setPublishStatus(nextForm.status === 'published' ? 'published' : 'draft')
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load testimonial.')
      setStatus('error')
    }
  }, [testimonialId])

  useEffect(() => {
    void loadTestimonial()
  }, [loadTestimonial])

  const handleFieldChange = useCallback((field: string, value: unknown) => {
    setForm((current) => ({ ...current, [field]: value }))
  }, [])

  const handleChooseImage = useCallback((field: string) => {
    setPickerTarget(field as 'photo_path' | 'company_logo_path')
    setPickerOpen(true)
  }, [])

  const handleRemoveImage = useCallback((field: string) => {
    setForm((current) => ({ ...current, [field]: '' }))
  }, [])

  const handleImageSelect = useCallback(
    (image: { path: string }) => {
      if (!pickerTarget) return
      setForm((current) => ({ ...current, [pickerTarget]: image.path }))
      setPickerOpen(false)
      setPickerTarget(null)
    },
    [pickerTarget]
  )

  const handleSave = useCallback(async () => {
    if (!testimonialId || isSaving || !isDirty) return

    setIsSaving(true)
    try {
      await updateTestimonial(testimonialId, formToPayload(form))
      const reloaded = await getTestimonial(testimonialId)
      const nextForm = rowToForm(reloaded)
      nextForm.status = publishStatus
      nextForm.published_at =
        publishStatus === 'published'
          ? nextForm.published_at ?? new Date().toISOString()
          : null

      setBaseline(structuredClone(nextForm))
      setForm(structuredClone(nextForm))
      setPublishStatus(nextForm.status === 'published' ? 'published' : 'draft')
      success('Testimonial saved successfully')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to save testimonial')
    } finally {
      setIsSaving(false)
    }
  }, [form, isDirty, isSaving, publishStatus, testimonialId, success, error])

  const handleToggleStatus = useCallback(async () => {
    if (!testimonialId || isTogglingStatus) return

    const currentStatus = publishStatus === 'published' ? 'published' : 'draft'
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published'

    setIsTogglingStatus(true)
    setPublishStatus(nextStatus)

    try {
      const updated = await setTestimonialStatus(testimonialId, nextStatus)
      if (!updated?.status) {
        throw new Error('Status update returned no testimonial row.')
      }

      const confirmedStatus = updated.status === 'published' ? 'published' : 'draft'
      setPublishStatus(confirmedStatus)

      setForm((current) => ({
        ...current,
        status: confirmedStatus,
        published_at: updated.published_at ?? null,
      }))
      setBaseline((current) => ({
        ...current,
        status: confirmedStatus,
        published_at: updated.published_at ?? null,
      }))
      success(nextStatus === 'published' ? 'Testimonial published' : 'Testimonial moved to draft')
    } catch (err) {
      setPublishStatus(currentStatus)
      error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setIsTogglingStatus(false)
    }
  }, [isTogglingStatus, publishStatus, testimonialId, success, error])

  const isPublished = publishStatus === 'published'
  const rating = Math.min(5, Math.max(1, Number(form.rating) || 5))

  return (
    <div className="admin-page admin-settings-page admin-testimonial-edit-page">
      <header className="admin-page-header admin-service-edit-header">
        <Link href="/admin/testimonials" className="admin-service-back-link">
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          All testimonials
        </Link>

        <div className="admin-service-edit-title-row">
          <span className="admin-page-icon" aria-hidden>
            <MessageSquareQuote size={22} strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="admin-page-title">{form.name || 'Edit testimonial'}</h1>
            <p className="admin-page-desc">
              Client quote and attribution
              {isPublished ? (
                <span className="admin-services-status admin-services-status--published">
                  Published
                </span>
              ) : (
                <span className="admin-services-status admin-services-status--draft">Draft</span>
              )}
            </p>
          </div>

          <div className="admin-service-edit-actions">
            <button
              type="button"
              className={`admin-services-status-btn${isPublished ? ' admin-services-status-btn--draft' : ' admin-services-status-btn--publish'}`}
              onClick={() => void handleToggleStatus()}
              disabled={isTogglingStatus}
            >
              {isTogglingStatus ? 'Updating…' : isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading testimonial…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button
            type="button"
            className="admin-settings-retry"
            onClick={() => void loadTestimonial()}
          >
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
          <button
            type="button"
            className="admin-settings-retry"
            onClick={() => router.push('/admin/testimonials')}
          >
            Back to list
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="admin-settings-panel">
            <EditorSection
              panelId="testimonial-person"
              labelledBy="testimonial-person-heading"
              title="Person"
              description="Attribution shown with the quote on the public site."
            >
              <EditorField id="testimonial-name" label="Name">
                <input
                  id="testimonial-name"
                  type="text"
                  className="admin-settings-input"
                  value={String(form.name ?? '')}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </EditorField>

              <EditorField id="testimonial-position" label="Position">
                <input
                  id="testimonial-position"
                  type="text"
                  className="admin-settings-input"
                  value={String(form.position ?? '')}
                  onChange={(e) => handleFieldChange('position', e.target.value)}
                />
              </EditorField>

              <EditorField id="testimonial-company" label="Company">
                <input
                  id="testimonial-company"
                  type="text"
                  className="admin-settings-input"
                  value={String(form.company ?? '')}
                  onChange={(e) => handleFieldChange('company', e.target.value)}
                />
              </EditorField>
            </EditorSection>

            <EditorSection
              panelId="testimonial-quote"
              labelledBy="testimonial-quote-heading"
              title="Testimonial"
              description="Long-form client quote and star rating."
            >
              <EditorField id="testimonial-body" label="Testimonial">
                <textarea
                  id="testimonial-body"
                  className="admin-settings-textarea"
                  rows={6}
                  value={String(form.testimonial ?? '')}
                  onChange={(e) => handleFieldChange('testimonial', e.target.value)}
                />
              </EditorField>

              <EditorField id="testimonial-rating" label="Rating" hint="Click a star to set 1–5.">
                <div className="admin-testimonials-rating-editor" role="group" aria-label="Rating">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1
                    const active = value <= rating
                    return (
                      <button
                        key={value}
                        type="button"
                        className={`admin-testimonials-rating-btn${active ? ' admin-testimonials-rating-btn--active' : ''}`}
                        onClick={() => handleFieldChange('rating', value)}
                        aria-label={`${value} star${value === 1 ? '' : 's'}`}
                        aria-pressed={active}
                      >
                        <Star size={22} strokeWidth={0} fill="currentColor" aria-hidden />
                      </button>
                    )
                  })}
                </div>
              </EditorField>
            </EditorSection>

            <EditorSection
              panelId="testimonial-images"
              labelledBy="testimonial-images-heading"
              title="Images"
              description="Optional customer photo and company logo from the Media Library."
            >
              <SettingsImageField
                label="Customer photo"
                field="photo_path"
                path={String(form.photo_path ?? '')}
                emptyLabel="No photo selected — initials will be used"
                onChoose={handleChooseImage}
                onRemove={handleRemoveImage}
              />

              <SettingsImageField
                label="Company logo (optional)"
                field="company_logo_path"
                path={String(form.company_logo_path ?? '')}
                emptyLabel="No company logo selected"
                onChoose={handleChooseImage}
                onRemove={handleRemoveImage}
              />
            </EditorSection>

            <EditorSection
              panelId="testimonial-display"
              labelledBy="testimonial-display-heading"
              title="Display"
              description="Ordering and optional service-card impact stats."
            >
              <EditorField id="testimonial-sort-order" label="Sort order">
                <input
                  id="testimonial-sort-order"
                  type="number"
                  min={0}
                  className="admin-settings-input"
                  value={Number(form.sort_order) || 0}
                  onChange={(e) =>
                    handleFieldChange('sort_order', Math.max(0, Number(e.target.value) || 0))
                  }
                />
              </EditorField>

              <EditorField id="testimonial-featured" label="Featured">
                <label className="admin-settings-checkbox" htmlFor="testimonial-featured">
                  <input
                    id="testimonial-featured"
                    type="checkbox"
                    checked={Boolean(form.featured)}
                    onChange={(e) => handleFieldChange('featured', e.target.checked)}
                  />
                  Highlight as a featured testimonial
                </label>
              </EditorField>

              <EditorField
                id="testimonial-stat"
                label="Stat value"
                hint="Shown on service page testimonial cards (e.g. 98%)."
              >
                <input
                  id="testimonial-stat"
                  type="text"
                  className="admin-settings-input"
                  value={String(form.stat ?? '')}
                  onChange={(e) => handleFieldChange('stat', e.target.value)}
                />
              </EditorField>

              <EditorField id="testimonial-stat-label" label="Stat label">
                <input
                  id="testimonial-stat-label"
                  type="text"
                  className="admin-settings-input"
                  value={String(form.stat_label ?? '')}
                  onChange={(e) => handleFieldChange('stat_label', e.target.value)}
                />
              </EditorField>
            </EditorSection>
          </div>

          <SaveBar isDirty={isDirty} isSaving={isSaving} onSave={() => void handleSave()} />
        </>
      )}

      <ImagePickerModal
        isOpen={pickerOpen}
        selectedImage={pickerSelectedImage}
        onSelect={handleImageSelect}
        onClose={() => {
          setPickerOpen(false)
          setPickerTarget(null)
        }}
        title={
          pickerTarget === 'company_logo_path' ? 'Select company logo' : 'Select customer photo'
        }
        api={nextMediaApi}
      />
    </div>
  )
}
