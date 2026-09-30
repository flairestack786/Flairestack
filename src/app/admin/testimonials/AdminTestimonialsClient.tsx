'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Loader2,
  MessageSquareQuote,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/components/common/ToastProvider'
import { useMediaPublicUrl } from '@/components/admin/MediaUrlContext'
import {
  createTestimonial,
  deleteTestimonial,
  listTestimonials,
  setTestimonialStatus,
} from '@/lib/next/testimonialsBrowser'

function initialsFromName(name: string) {
  const parts = String(name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function RatingStars({ rating }: { rating: number }) {
  const value = Math.min(5, Math.max(1, Number(rating) || 5))
  return (
    <span className="admin-testimonials-rating" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={14}
          strokeWidth={0}
          fill="currentColor"
          className={index < value ? 'admin-testimonials-star--on' : 'admin-testimonials-star--off'}
          aria-hidden
        />
      ))}
    </span>
  )
}

/**
 * Migrated Testimonials list — mirrors Vite AdminTestimonialsPage.
 */
export default function AdminTestimonialsClient() {
  const router = useRouter()
  const toast = useToast() as {
    success: (message: string) => void
    error: (message: string) => void
  }
  const { success, error } = toast
  const getPublicUrl = useMediaPublicUrl()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [testimonials, setTestimonials] = useState<Record<string, unknown>[]>([])
  const [busyId, setBusyId] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const loadTestimonials = useCallback(async () => {
    setStatus('loading')
    setLoadError('')

    try {
      const rows = await listTestimonials()
      setTestimonials(rows)
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load testimonials.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void loadTestimonials()
  }, [loadTestimonials])

  const handleCreate = useCallback(async () => {
    if (isCreating) return
    setIsCreating(true)
    try {
      const nextOrder =
        testimonials.reduce((max, row) => Math.max(max, Number(row.sort_order) || 0), -1) + 1
      const row = await createTestimonial({
        name: 'New Testimonial',
        company: '',
        position: '',
        testimonial: '',
        rating: 5,
        sort_order: nextOrder,
      })
      success('Testimonial created')
      router.push(`/admin/testimonials/${String(row.id)}`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to create testimonial')
    } finally {
      setIsCreating(false)
    }
  }, [error, isCreating, router, success, testimonials])

  const handleDelete = useCallback(
    async (row: Record<string, unknown>) => {
      const name = String(row.name ?? 'this testimonial')
      if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) {
        return
      }

      setBusyId(String(row.id))
      try {
        await deleteTestimonial(String(row.id))
        setTestimonials((current) => current.filter((item) => item.id !== row.id))
        success('Testimonial deleted')
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to delete testimonial')
      } finally {
        setBusyId('')
      }
    },
    [success, error]
  )

  const handleToggleStatus = useCallback(
    async (row: Record<string, unknown>) => {
      if (busyId) return

      const currentStatus = row.status === 'published' ? 'published' : 'draft'
      const nextStatus = currentStatus === 'published' ? 'draft' : 'published'

      setBusyId(String(row.id))
      setTestimonials((current) =>
        current.map((item) =>
          item.id === row.id
            ? {
                ...item,
                status: nextStatus,
                published_at: nextStatus === 'published' ? new Date().toISOString() : null,
              }
            : item
        )
      )

      try {
        const updated = await setTestimonialStatus(String(row.id), nextStatus)
        if (!updated?.status) {
          throw new Error('Status update returned no testimonial row.')
        }
        const rows = await listTestimonials()
        setTestimonials(rows)
        success(nextStatus === 'published' ? 'Testimonial published' : 'Testimonial moved to draft')
      } catch (err) {
        try {
          const rows = await listTestimonials()
          setTestimonials(rows)
        } catch {
          setTestimonials((current) =>
            current.map((item) => (item.id === row.id ? { ...item, ...row } : item))
          )
        }
        error(err instanceof Error ? err.message : 'Failed to update status')
      } finally {
        setBusyId('')
      }
    },
    [busyId, success, error]
  )

  return (
    <div className="admin-page admin-services-page admin-testimonials-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <MessageSquareQuote size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Testimonials</h1>
          <p className="admin-page-desc">
            Manage client testimonials shown on the home page and service pages.
          </p>
        </div>
        <button
          type="button"
          className="admin-services-create-btn"
          onClick={() => void handleCreate()}
          disabled={isCreating}
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          {isCreating ? 'Creating…' : 'Create Testimonial'}
        </button>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading testimonials…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button
            type="button"
            className="admin-settings-retry"
            onClick={() => void loadTestimonials()}
          >
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="admin-services-table-wrap">
          {testimonials.length === 0 ? (
            <div className="admin-page-placeholder">
              <p>No testimonials yet. Create your first testimonial to get started.</p>
            </div>
          ) : (
            <table className="admin-services-table">
              <thead>
                <tr>
                  <th scope="col">Photo</th>
                  <th scope="col">Name</th>
                  <th scope="col">Company</th>
                  <th scope="col">Position</th>
                  <th scope="col">Rating</th>
                  <th scope="col">Status</th>
                  <th scope="col">Sort Order</th>
                  <th scope="col" className="admin-services-table-actions-col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map((row) => {
                  const isPublished = row.status === 'published'
                  const isBusy = busyId === row.id
                  const photoPath = typeof row.photo_path === 'string' ? row.photo_path.trim() : ''
                  const photoUrl = photoPath ? getPublicUrl(photoPath) : null
                  const name = String(row.name ?? '')
                  const id = String(row.id)

                  return (
                    <tr key={id}>
                      <td>
                        <div className="admin-testimonials-photo" aria-hidden>
                          {photoUrl ? (
                            <img src={photoUrl} alt="" className="admin-testimonials-photo-img" />
                          ) : (
                            <span className="admin-testimonials-photo-fallback">
                              {initialsFromName(name)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <Link
                          href={`/admin/testimonials/${id}`}
                          className="admin-services-table-link"
                        >
                          {name || 'Untitled'}
                        </Link>
                      </td>
                      <td>{String(row.company ?? '') || '—'}</td>
                      <td>{String(row.position ?? '') || '—'}</td>
                      <td>
                        <RatingStars rating={Number(row.rating) || 5} />
                      </td>
                      <td>
                        <span
                          className={`admin-services-status${isPublished ? ' admin-services-status--published' : ' admin-services-status--draft'}`}
                        >
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{String(row.sort_order ?? '')}</td>
                      <td className="admin-services-table-actions">
                        <Link
                          href={`/admin/testimonials/${id}`}
                          className="admin-services-action-btn"
                          aria-label={`Edit ${name}`}
                        >
                          <Pencil size={15} strokeWidth={1.75} aria-hidden />
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-services-action-btn"
                          onClick={() => void handleToggleStatus(row)}
                          disabled={isBusy}
                        >
                          {isBusy ? '…' : isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          className="admin-services-action-btn admin-services-action-btn--danger"
                          onClick={() => void handleDelete(row)}
                          disabled={isBusy}
                          aria-label={`Delete ${name}`}
                        >
                          <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
