import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import ServiceCreateModal from '../../components/admin/services/ServiceCreateModal'
import { buildDefaultServiceFields } from '../../lib/serviceDefaults'
import { useToast } from '../../components/common/ToastProvider'
import { clearPublicServiceCache } from '../../hooks/useServicePage'
import { clearPublishedServicesCache } from '../../hooks/usePublishedServices'
import {
  createService,
  deleteService,
  listServices,
  setServiceStatus,
} from '../../lib/servicePage'

export default function AdminServicesPage() {
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [services, setServices] = useState(/** @type {Record<string, unknown>[]} */ ([]))
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
      setLoadError(err?.message ?? 'Failed to load services.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  const handleCreate = useCallback(
    async (input) => {
      const defaults = buildDefaultServiceFields(input.title, input.slug)
      const service = await createService({
        slug: input.slug || defaults.slug,
        title: input.title || defaults.title,
        short_description: input.short_description || defaults.short_description,
        description: input.description || defaults.description,
        icon_name: defaults.icon_name,
      })
      success('Service created')
      clearPublishedServicesCache()
      navigate(`/admin/services/${service.id}`)
    },
    [navigate, success]
  )

  const handleDelete = useCallback(
    async (service) => {
      const title = service.title ?? 'this service'
      if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) {
        return
      }

      setBusyId(service.id)
      try {
        await deleteService(service.id)
        setServices((current) => current.filter((row) => row.id !== service.id))
        clearPublicServiceCache(service.slug)
        clearPublishedServicesCache()
        success('Service deleted')
      } catch (err) {
        error(err?.message ?? 'Failed to delete service')
      } finally {
        setBusyId('')
      }
    },
    [success, error]
  )

  const handleToggleStatus = useCallback(
    async (service) => {
      if (busyId) return

      const currentStatus = service.status === 'published' ? 'published' : 'draft'
      const nextStatus = currentStatus === 'published' ? 'draft' : 'published'

      console.log('[AdminServicesPage] toggle status', {
        serviceId: service.id,
        currentStatus,
        nextStatus,
      })

      setBusyId(service.id)

      // Optimistic UI update so the badge/button flip immediately.
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
        const updated = await setServiceStatus(service.id, nextStatus)

        if (!updated?.status) {
          throw new Error('Status update returned no service row.')
        }

        console.log('[AdminServicesPage] toggle success', {
          returnedStatus: updated.status,
          returnedPublishedAt: updated.published_at,
        })

        const rows = await listServices()
        setServices(rows)
        clearPublicServiceCache(service.slug)
        clearPublishedServicesCache()
        success(nextStatus === 'published' ? 'Service published' : 'Service moved to draft')
      } catch (err) {
        console.error('[AdminServicesPage] toggle failed', err)
        // Revert optimistic update from the database.
        try {
          const rows = await listServices()
          setServices(rows)
        } catch {
          setServices((current) =>
            current.map((row) => (row.id === service.id ? { ...row, ...service } : row))
          )
        }
        error(err?.message ?? 'Failed to update status')
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
        <button type="button" className="admin-services-create-btn" onClick={() => setCreateOpen(true)}>
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
          <button type="button" className="admin-settings-retry" onClick={loadServices}>
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

                  return (
                    <tr key={service.id}>
                      <td>
                        <Link to={`/admin/services/${service.id}`} className="admin-services-table-link">
                          {service.title}
                        </Link>
                      </td>
                      <td>
                        <code className="admin-services-slug">/services/{service.slug}</code>
                      </td>
                      <td>
                        <span
                          className={`admin-services-status${isPublished ? ' admin-services-status--published' : ' admin-services-status--draft'}`}
                        >
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{service.sort_order}</td>
                      <td className="admin-services-table-actions">
                        <Link
                          to={`/admin/services/${service.id}`}
                          className="admin-services-action-btn"
                          aria-label={`Edit ${service.title}`}
                        >
                          <Pencil size={15} strokeWidth={1.75} aria-hidden />
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="admin-services-action-btn"
                          onClick={() => handleToggleStatus(service)}
                          disabled={isBusy}
                        >
                          {isBusy ? '…' : isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          className="admin-services-action-btn admin-services-action-btn--danger"
                          onClick={() => handleDelete(service)}
                          disabled={isBusy}
                          aria-label={`Delete ${service.title}`}
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
