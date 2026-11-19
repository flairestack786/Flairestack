'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
} from 'lucide-react'
import AdminSelect from '@/components/admin/AdminSelect'
import ResumeFailureNotice from '@/components/admin/ResumeFailureNotice'
import { useResumeActions } from '@/components/admin/useResumeActions'
import {
  APPLICANT_SORTS,
  JOB_STATUS_LABELS,
  applicantBadgeClass,
  labelEmploymentType,
  pageCount,
  type JobSummary,
} from '@/lib/applicantsCms'
import { isUuid } from '@/lib/hiringNotificationEmail'
import { resumeMimeFromFilename } from '@/lib/resumeAccess'
import { JOB_APPLICATION_STATUSES, labelJobApplicationStatus } from '@/lib/jobApplicationValidation'
import {
  getJobSummary,
  listJobApplicants,
  type JobApplicantsPage,
} from '@/lib/next/jobApplicationsBrowser'

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  ...JOB_APPLICATION_STATUSES.map((value) => ({ value, label: labelJobApplicationStatus(value) })),
]
const SORT_OPTIONS = APPLICANT_SORTS.map(({ value, label }) => ({ value, label }))

export default function AdminJobApplicantsClient() {
  const params = useParams()
  const jobId = typeof params?.jobId === 'string' ? params.jobId : ''

  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading')
  const [loadError, setLoadError] = useState('')
  const [job, setJob] = useState<JobSummary | null>(null)
  const [result, setResult] = useState<JobApplicantsPage | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const {
    busy: busyResume,
    failure: resumeFailure,
    run: runResume,
    retry: retryResume,
    dismiss: dismissResume,
  } = useResumeActions()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [page, setPage] = useState(1)

  // Debounce typing; any new search restarts at page 1.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const hasLoaded = useRef(false)
  const requestId = useRef(0)

  const load = useCallback(
    async (opts?: { quiet?: boolean }) => {
      if (!isUuid(jobId)) {
        setState('missing')
        return
      }
      const mine = ++requestId.current
      // Only the very first load swaps the whole page for a spinner; later loads
      // (typing, filters, paging) keep the toolbar mounted so focus is not lost.
      if (hasLoaded.current || opts?.quiet) setRefreshing(true)
      else setState('loading')
      setLoadError('')
      try {
        const [summary, applicants] = await Promise.all([
          getJobSummary(jobId),
          listJobApplicants(jobId, { search, status: statusFilter, sort, page }),
        ])
        if (mine !== requestId.current) return // a newer request superseded this one
        if (!summary) {
          setState('missing')
          return
        }
        hasLoaded.current = true
        setJob(summary)
        setResult(applicants)
        if (applicants.page !== page) setPage(applicants.page)
        setState('ready')
      } catch (err) {
        if (mine !== requestId.current) return
        setLoadError(err instanceof Error ? err.message : 'Failed to load applicants.')
        setState('error')
      } finally {
        if (mine === requestId.current) setRefreshing(false)
      }
    },
    [jobId, page, search, sort, statusFilter]
  )

  useEffect(() => {
    void load()
  }, [load])

  // Straight from the click: the View tab must be opened before any await (popup blockers).
  const handleResume = (
    applicationId: string,
    mode: 'view' | 'download',
    mimeType: string | null,
    label: string
  ) => runResume({ applicationId, mode, mimeType, label })

  if (state === 'loading') {
    return (
      <div className="admin-settings-state" role="status">
        <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
        <span>Loading applicants…</span>
      </div>
    )
  }

  if (state === 'missing') {
    return (
      <div className="admin-settings-state admin-settings-state--error" role="alert">
        <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
        <span>This job posting was not found.</span>
        <Link href="/admin/careers/applications" className="admin-settings-retry">
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          Back to Applicants
        </Link>
      </div>
    )
  }

  if (state === 'error' || !job || !result) {
    return (
      <div className="admin-settings-state admin-settings-state--error" role="alert">
        <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
        <span>{loadError || 'Failed to load applicants.'}</span>
        <button type="button" className="admin-settings-retry" onClick={() => void load()}>
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
          Retry
        </button>
      </div>
    )
  }

  const totalPages = pageCount(result.total, result.pageSize)
  const hasActiveFilters = search.trim() !== '' || statusFilter !== 'all'
  const firstShown = result.total === 0 ? 0 : (result.page - 1) * result.pageSize + 1
  const lastShown = Math.min(result.page * result.pageSize, result.total)

  return (
    <div className="admin-page admin-services-page admin-leads-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <UserCheck size={22} strokeWidth={1.75} />
        </span>
        <div>
          <Link href="/admin/careers/applications" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            Back to Applicants
          </Link>
          <h1 className="admin-page-title">{job.title}</h1>
          <p className="admin-page-desc">
            {labelEmploymentType(job.employmentType)}
            {job.location ? ` · ${job.location}` : ''}
            {job.jobStatus
              ? ` · ${JOB_STATUS_LABELS[job.jobStatus as keyof typeof JOB_STATUS_LABELS] ?? job.jobStatus}`
              : ''}
          </p>
        </div>
        <div className="admin-page-header-actions">
          <button
            type="button"
            className="admin-services-action-btn"
            onClick={() => void load({ quiet: true })}
            disabled={refreshing}
          >
            <RefreshCw size={15} strokeWidth={1.75} aria-hidden />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <div className="admin-leads-summary admin-applicants-summary">
        <article className="admin-leads-summary-card">
          <span className="admin-leads-summary-icon admin-leads-summary-icon--contacted" aria-hidden>
            <UserCheck size={18} strokeWidth={1.75} />
          </span>
          <div>
            <p className="admin-leads-summary-label">Total applicants</p>
            <p className="admin-leads-summary-value">{job.totalApplicants}</p>
          </div>
        </article>
        <article className="admin-leads-summary-card">
          <span className="admin-leads-summary-icon admin-leads-summary-icon--new" aria-hidden>
            <Inbox size={18} strokeWidth={1.75} />
          </span>
          <div>
            <p className="admin-leads-summary-label">New applicants</p>
            <p className="admin-leads-summary-value">{job.newApplicants}</p>
          </div>
        </article>
      </div>

      <div className="admin-leads-toolbar admin-applicants-toolbar admin-applicants-toolbar--job">
        <label className="admin-leads-search">
          <Search size={16} strokeWidth={1.75} aria-hidden />
          <span className="sr-only">Search applicants</span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or email…"
            className="admin-settings-input"
          />
        </label>
        <div className="admin-leads-filter">
          <AdminSelect
            id="applicants-status-filter"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value)
              setPage(1)
            }}
            options={STATUS_OPTIONS}
            placeholder="All statuses"
          />
        </div>
        <div className="admin-leads-filter">
          <AdminSelect
            id="applicants-sort"
            aria-label="Sort applicants"
            value={sort}
            onChange={(value) => {
              setSort(value === 'oldest' ? 'oldest' : 'newest')
              setPage(1)
            }}
            options={SORT_OPTIONS}
            placeholder="Sort"
          />
        </div>
      </div>

      {resumeFailure ? (
        <ResumeFailureNotice
          failure={resumeFailure}
          busy={Boolean(busyResume)}
          onRetry={retryResume}
          onDismiss={dismissResume}
        />
      ) : null}

      <div className="admin-services-table-wrap">
        {result.total === 0 ? (
          <div className="admin-page-placeholder admin-leads-empty">
            {hasActiveFilters ? (
              <>
                <Search size={28} strokeWidth={1.5} aria-hidden />
                <p>No applicants match your filters.</p>
                <button
                  type="button"
                  className="admin-settings-retry"
                  onClick={() => {
                    setSearchInput('')
                    setSearch('')
                    setStatusFilter('all')
                    setPage(1)
                  }}
                >
                  Clear filters
                </button>
              </>
            ) : (
              <>
                <Inbox size={28} strokeWidth={1.5} aria-hidden />
                <p>No applications yet.</p>
                <p className="admin-leads-empty-hint">
                  Applications for this role will appear here as soon as candidates apply.
                </p>
              </>
            )}
          </div>
        ) : (
          <table className="admin-services-table admin-leads-table">
            <thead>
              <tr>
                <th scope="col">Applicant</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Applied On</th>
                <th scope="col">Status</th>
                <th scope="col">Resume</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => {
                const name = `${row.first_name} ${row.last_name}`.trim()
                const hasResume = Boolean(row.resume_original_filename)
                return (
                  <tr key={row.id}>
                    <td>
                      <Link
                        href={`/admin/careers/applications/${row.id}`}
                        className="admin-services-table-link"
                      >
                        {name || '—'}
                      </Link>
                    </td>
                    <td>{row.email}</td>
                    <td>{row.phone || '—'}</td>
                    <td>{formatDate(row.created_at)}</td>
                    <td>
                      <span className={applicantBadgeClass(row.application_status)}>
                        {labelJobApplicationStatus(String(row.application_status))}
                      </span>
                    </td>
                    <td>
                      {hasResume ? (
                        <span className="admin-applicants-resume-actions">
                          <button
                            type="button"
                            className="admin-services-action-btn"
                            onClick={() =>
                              handleResume(
                                row.id,
                                'view',
                                resumeMimeFromFilename(row.resume_original_filename),
                                name
                              )
                            }
                            disabled={Boolean(busyResume)}
                            aria-label={`View resume for ${name}`}
                          >
                            <Eye size={14} strokeWidth={1.75} aria-hidden />
                            View
                          </button>
                          <button
                            type="button"
                            className="admin-services-action-btn"
                            onClick={() =>
                              handleResume(
                                row.id,
                                'download',
                                resumeMimeFromFilename(row.resume_original_filename),
                                name
                              )
                            }
                            disabled={Boolean(busyResume)}
                            aria-label={`Download resume for ${name}`}
                          >
                            <Download size={14} strokeWidth={1.75} aria-hidden />
                            Download
                          </button>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/careers/applications/${row.id}`}
                        className="admin-services-action-btn"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {result.total > 0 && (
        <div className="admin-applicants-pagination">
          <p className="admin-leads-count" aria-live="polite">
            Showing {firstShown}–{lastShown} of {result.total} applicant
            {result.total === 1 ? '' : 's'}
          </p>
          {totalPages > 1 && (
            <nav className="admin-applicants-pager" aria-label="Applicants pagination">
              <button
                type="button"
                className="admin-services-action-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={result.page <= 1 || refreshing}
              >
                <ChevronLeft size={14} strokeWidth={1.75} aria-hidden />
                Previous
              </button>
              <span className="admin-leads-count">
                Page {result.page} of {totalPages}
              </span>
              <button
                type="button"
                className="admin-services-action-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={result.page >= totalPages || refreshing}
              >
                Next
                <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  )
}
