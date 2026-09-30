'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import ServiceCreateModal from '@/components/admin/services/ServiceCreateModal'
import { buildDefaultServiceFields } from '@/lib/serviceDefaults'
import { useToast } from '@/components/common/ToastProvider'
import {
  createService,
  deleteService,
  listServices,
  setServiceStatus,
} from '@/lib/next/servicesBrowser'

/**
 * Migrated Services list — mirrors Vite AdminServicesPage.
 */
export default function AdminServicesClient() {
  const router = useRouter()
  const toast = useToast() as {
    success: (message: string) => void
    error: (message: string) => void
  }
  const { success, error } = toast
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [services, setServices] = useState<Record<string, unknown>[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [busyId, setBusyId] = useState('')

  const loadServices = useCallback(async () => {
    setStatus('loading')
    setLoadError('')

    try {
      const rows = await listServices()
      setServices(rows)
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load services.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  const handleCreate = useCallback(
    async (input: {
      title: string
      slug: string
      short_description: string
      description: string
    }) => {
      const defaults = buildDefaultServiceFields(input.title, input.slug)
      const service = await createService({
        slug: input.slug || defaults.slug,
        title: input.title || defaults.title,
        short_description: input.short_description || defaults.short_description,
        description: input.description || defaults.description,
        icon_name: defaults.icon_name,
      })
      success('Service created')
      router.push(`/admin/services/${String(service.id)}`)
    },
    [router, success]
  )

  const handleDelete = useCallback(
    async (service: Record<string, unknown>) => {
      const title = String(service.title ?? 'this service')
      if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
        return
      }

      setBusyId(String(service.id))
      try {
        await deleteService(String(service.id))
        setServices((current) => current.filter((row) => row.id !== service.id))
        success('Service deleted')
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to delete service')
      } finally {
        setBusyId('')
      }
    },
    [success, error]
  )

  const handleToggleStatus = useCallback(
    async (service: Record<string, unknown>) => {
      if (busyId) return

      const currentStatus = service.status === 'published' ? 'published' : 'draft'
      const nextStatus = currentStatus === 'published' ? 'draft' : 'published'

      setBusyId(String(service.id))

      setServices((current) =>
        current.map((row) =>
          row.id === service.id
            ? {
                ...row,
                status: nextStatus,
                published_at: nextStatus === 'published' ? new Date().toISOString() : null,
              }
            : row
        )
      )

      try {
        const updated = await setServiceStatus(String(service.id), nextStatus)

        if (!updated?.status) {
          throw new Error('Status update returned no service row.')
        }

        const rows = await listServices()
        setServices(rows)
        success(nextStatus === 'published' ? 'Service published' : 'Service moved to draft')
      } catch (err) {
        try {
          const rows = await listServices()
          setServices(rows)
        } catch {
          setServices((current) =>
            current.map((row) => (row.id === service.id ? { ...row, ...service } : row))
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
    <div className="admin-page admin-services-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Layers size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Services</h1>
          <p className="admin-page-desc">
            Manage service pages, section content, imagery, and SEO metadata.
          </p>
        </div>
        <button
          type="button"
          className="admin-services-create-btn"
          onClick={() => setCreateOpen(true)}
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          New service
        </button>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading services…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button
            type="button"
            className="admin-settings-retry"
            onClick={() => void loadServices()}
          >
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="admin-services-table-wrap">
          {services.length === 0 ? (
            <div className="admin-page-placeholder">
              <p>No services yet. Create your first service to get started.</p>
            </div>
          ) : (
            <table className="admin-services-table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Slug</th>
                  <th scope="col">Status</th>
                  <th scope="col">Order</th>
                  <th scope="col" className="admin-services-table-actions-col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => {
                  const isPublished = service.status === 'published'
                  const isBusy = busyId === service.id
                  const serviceId = String(service.id)
                  const title = String(service.title ?? '')

                  return (
                    <tr key={serviceId}>
                      <td>
                        <Link
                          href={`/admin/services/${serviceId}`}
                          className="admin-services-table-link"
                        >
                          {title}
                        </Link>
                      </td>
                      <td>
                        <code className="admin-services-slug">/services/{String(service.slug)}</code>
                      </td>
                      <td>
                        <span
                          className={`admin-services-status${isPublished ? ' admin-services-status--published' : ' admin-services-status--draft'}`}
                        >
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{String(service.sort_order ?? '')}</td>
                      <td className="admin-services-table-actions">
                        <Link
                          href={`/admin/services/${serviceId}`}
                          className="admin-services-action-btn"
                          aria-label={`Edit ${title}`}
                        >
                          <Pencil size={15} strokeWidth={1.75} aria-hidden />
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-services-action-btn"
                          onClick={() => void handleToggleStatus(service)}
                          disabled={isBusy}
                        >
                          {isBusy ? '…' : isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          className="admin-services-action-btn admin-services-action-btn--danger"
                          onClick={() => void handleDelete(service)}
                          disabled={isBusy}
                          aria-label={`Delete ${title}`}
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

      <ServiceCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
