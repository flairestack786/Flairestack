'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  Briefcase,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/components/common/ToastProvider'
import { publicCareerPath } from '@/lib/contentSlug'
import {
  createJobPosting,
  deleteJobPosting,
  listJobPostings,
  setJobPostingStatus,
  type JobPostingStatus,
} from '@/lib/next/careersBrowser'

const EMPLOYMENT_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
}

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusClass(status: string) {
  if (status === 'published') return 'admin-services-status admin-services-status--published'
  if (status === 'closed') return 'admin-services-status admin-services-status--closed'
  return 'admin-services-status admin-services-status--draft'
}

export default function AdminCareersClient() {
  const router = useRouter()
  const toast = useToast() as { success: (m: string) => void; error: (m: string) => void }
  const { success, error } = toast
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [busyId, setBusyId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | JobPostingStatus>('all')

  const load = useCallback(async () => {
    setStatus('loading')
    setLoadError('')
    try {
      setRows(await listJobPostings())
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load job postings.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      const rowStatus = String(row.status ?? 'draft')
      if (statusFilter !== 'all' && rowStatus !== statusFilter) return false
      if (!q) return true
      const haystack = [row.title, row.department, row.location, row.slug, row.short_description]
        .map((part) => String(part ?? '').toLowerCase())
        .join(' ')
      return haystack.includes(q)
    })
  }, [query, rows, statusFilter])

  const handleCreate = useCallback(async () => {
    if (isCreating) return
    setIsCreating(true)
    try {
      const row = await createJobPosting({ title: 'New role' })
      success('Job posting created')
      router.push(`/admin/careers/${String(row.id)}`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to create job posting')
    } finally {
      setIsCreating(false)
    }
  }, [error, isCreating, router, success])

  const handleDelete = useCallback(
    async (row: Record<string, unknown>) => {
      const title = String(row.title ?? 'this job')
      if (!window.confirm(`Delete "${title}" permanently? This cannot be undone.`)) return
      setBusyId(String(row.id))
      try {
        await deleteJobPosting(String(row.id))
        setRows((current) => current.filter((item) => item.id !== row.id))
        success('Job posting deleted')
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to delete job posting')
      } finally {
        setBusyId('')
      }
    },
    [error, success]
  )

  const handleSetStatus = useCallback(
    async (row: Record<string, unknown>, next: JobPostingStatus) => {
      if (busyId) return
      setBusyId(String(row.id))
      try {
        await setJobPostingStatus(String(row.id), next)
        setRows(await listJobPostings())
        success(
          next === 'published'
            ? 'Job published'
            : next === 'closed'
              ? 'Job closed'
              : 'Job moved to draft'
        )
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to update status')
      } finally {
        setBusyId('')
      }
    },
    [busyId, error, success]
  )

  return (
    <div className="admin-page admin-services-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Briefcase size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Careers</h1>
          <p className="admin-page-desc">
            Administrator-only management of FlaireStack open roles.
          </p>
        </div>
        <div className="admin-page-header-actions">
          <Link href="/admin/careers/applications" className="admin-services-action-btn">
            Applications
          </Link>
          <button
            type="button"
            className="admin-services-create-btn"
            onClick={() => void handleCreate()}
            disabled={isCreating}
          >
            <Plus size={16} strokeWidth={1.75} aria-hidden />
            {isCreating ? 'Creating…' : 'Create Job'}
          </button>
        </div>
      </header>

      {status === 'ready' && (
        <div className="admin-content-filters">
          <label className="admin-content-filter">
            <span className="sr-only">Search jobs</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, department, location…"
              className="admin-settings-input"
            />
          </label>
          <label className="admin-content-filter admin-content-filter--status">
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | JobPostingStatus)
              }
              className="admin-settings-input"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </label>
        </div>
      )}

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading job postings…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={() => void load()}>
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="admin-services-table-wrap">
          {filtered.length === 0 ? (
            <div className="admin-page-placeholder">
              <p>
                {rows.length === 0
                  ? 'No job postings yet. Create your first role to get started.'
                  : 'No jobs match your search or filter.'}
              </p>
            </div>
          ) : (
            <table className="admin-services-table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Department</th>
                  <th scope="col">Type</th>
                  <th scope="col">Location</th>
                  <th scope="col">Status</th>
                  <th scope="col">Published</th>
                  <th scope="col">Updated</th>
                  <th scope="col" className="admin-services-table-actions-col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const id = String(row.id)
                  const title = String(row.title ?? 'Untitled')
                  const rowStatus = String(row.status ?? 'draft')
                  const isBusy = busyId === id
                  const path = publicCareerPath(row.slug)

                  return (
                    <tr key={id}>
                      <td>
                        <Link href={`/admin/careers/${id}`} className="admin-services-table-link">
                          {title}
                        </Link>
                      </td>
                      <td>{String(row.department ?? '') || '—'}</td>
                      <td>
                        {EMPLOYMENT_LABELS[String(row.employment_type)] ??
                          String(row.employment_type ?? '—')}
                      </td>
                      <td>{String(row.location ?? '') || '—'}</td>
                      <td>
                        <span className={statusClass(rowStatus)}>
                          {rowStatus === 'published'
                            ? 'Published'
                            : rowStatus === 'closed'
                              ? 'Closed'
                              : 'Draft'}
                        </span>
                      </td>
                      <td>{formatDate(row.published_at)}</td>
                      <td>{formatDate(row.updated_at)}</td>
                      <td className="admin-services-table-actions">
                        <Link
                          href={`/admin/careers/${id}`}
                          className="admin-services-action-btn"
                          aria-label={`Edit ${title}`}
                        >
                          <Pencil size={15} strokeWidth={1.75} aria-hidden />
                          Edit
                        </Link>
                        {rowStatus === 'published' && path ? (
                          <Link
                            href={path}
                            className="admin-services-action-btn"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={15} strokeWidth={1.75} aria-hidden />
                            View
                          </Link>
                        ) : null}
                        {rowStatus !== 'published' ? (
                          <button
                            type="button"
                            className="admin-services-action-btn"
                            disabled={isBusy}
                            onClick={() => void handleSetStatus(row, 'published')}
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-services-action-btn"
                            disabled={isBusy}
                            onClick={() => void handleSetStatus(row, 'draft')}
                          >
                            Unpublish
                          </button>
                        )}
                        {rowStatus !== 'closed' ? (
                          <button
                            type="button"
                            className="admin-services-action-btn"
                            disabled={isBusy}
                            onClick={() => void handleSetStatus(row, 'closed')}
                          >
                            Close
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="admin-services-action-btn admin-services-action-btn--danger"
                          disabled={isBusy}
                          onClick={() => void handleDelete(row)}
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
