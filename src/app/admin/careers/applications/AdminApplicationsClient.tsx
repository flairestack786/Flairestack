'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  Briefcase,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from 'lucide-react'
import AdminSelect from '@/components/admin/AdminSelect'
import {
  JOB_OVERVIEW_SORTS,
  JOB_STATUS_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  filterJobSummaries,
  labelEmploymentType,
  sortJobSummaries,
  type JobSummary,
} from '@/lib/applicantsCms'
import { listJobSummaries } from '@/lib/next/jobApplicationsBrowser'

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

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  ...Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
]

const JOB_STATUS_OPTIONS = [
  { value: 'all', label: 'All postings' },
  ...Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

const SORT_OPTIONS = JOB_OVERVIEW_SORTS.map(({ value, label }) => ({ value, label }))

export default function AdminApplicationsClient() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [jobs, setJobs] = useState<JobSummary[]>([])
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [jobStatusFilter, setJobStatusFilter] = useState('all')
  const [sort, setSort] = useState('recent')

  const load = useCallback(async () => {
    setStatus('loading')
    setLoadError('')
    try {
      setJobs(await listJobSummaries())
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load applicants.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const summary = useMemo(
    () => ({
      jobs: jobs.length,
      total: jobs.reduce((n, job) => n + job.totalApplicants, 0),
      fresh: jobs.reduce((n, job) => n + job.newApplicants, 0),
      withApplicants: jobs.filter((job) => job.totalApplicants > 0).length,
    }),
    [jobs]
  )

  const visible = useMemo(
    () =>
      sortJobSummaries(
        filterJobSummaries(jobs, { query, employmentType: typeFilter, jobStatus: jobStatusFilter }),
        sort
      ),
    [jobs, query, typeFilter, jobStatusFilter, sort]
  )

  const hasActiveFilters = query.trim() !== '' || typeFilter !== 'all' || jobStatusFilter !== 'all'

  if (status === 'loading') {
    return (
      <div className="admin-settings-state" role="status">
        <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
        <span>Loading applicants…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="admin-settings-state admin-settings-state--error" role="alert">
        <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
        <span>{loadError}</span>
        <button type="button" className="admin-settings-retry" onClick={() => void load()}>
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="admin-page admin-services-page admin-leads-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <UserCheck size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Applicants</h1>
          <p className="admin-page-desc">
            Applications grouped by job posting. Confidential — administrators only.
          </p>
        </div>
        <div className="admin-page-header-actions">
          <Link href="/admin/careers" className="admin-services-action-btn">
            <Briefcase size={15} strokeWidth={1.75} aria-hidden />
            Job postings
          </Link>
          <button type="button" className="admin-services-action-btn" onClick={() => void load()}>
            <RefreshCw size={15} strokeWidth={1.75} aria-hidden />
            Refresh
          </button>
        </div>
      </header>

      <div className="admin-leads-summary">
        <article className="admin-leads-summary-card">
          <span className="admin-leads-summary-icon admin-leads-summary-icon--total" aria-hidden>
            <Briefcase size={18} strokeWidth={1.75} />
          </span>
          <div>
            <p className="admin-leads-summary-label">Job postings</p>
            <p className="admin-leads-summary-value">{summary.jobs}</p>
          </div>
        </article>
        <article className="admin-leads-summary-card">
          <span className="admin-leads-summary-icon admin-leads-summary-icon--contacted" aria-hidden>
            <Users size={18} strokeWidth={1.75} />
          </span>
          <div>
            <p className="admin-leads-summary-label">Total applicants</p>
            <p className="admin-leads-summary-value">{summary.total}</p>
          </div>
        </article>
        <article className="admin-leads-summary-card">
          <span className="admin-leads-summary-icon admin-leads-summary-icon--new" aria-hidden>
            <Inbox size={18} strokeWidth={1.75} />
          </span>
          <div>
            <p className="admin-leads-summary-label">New applicants</p>
            <p className="admin-leads-summary-value">{summary.fresh}</p>
          </div>
        </article>
        <article className="admin-leads-summary-card">
          <span className="admin-leads-summary-icon admin-leads-summary-icon--won" aria-hidden>
            <UserCheck size={18} strokeWidth={1.75} />
          </span>
          <div>
            <p className="admin-leads-summary-label">Jobs with applicants</p>
            <p className="admin-leads-summary-value">{summary.withApplicants}</p>
          </div>
        </article>
      </div>

      <div className="admin-leads-toolbar admin-applicants-toolbar">
        <label className="admin-leads-search">
          <Search size={16} strokeWidth={1.75} aria-hidden />
          <span className="sr-only">Search job titles</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by job title…"
            className="admin-settings-input"
          />
        </label>
        <div className="admin-leads-filter">
          <AdminSelect
            id="applicants-type-filter"
            aria-label="Filter by employment type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_OPTIONS}
            placeholder="All types"
          />
        </div>
        <div className="admin-leads-filter">
          <AdminSelect
            id="applicants-job-status-filter"
            aria-label="Filter by posting status"
            value={jobStatusFilter}
            onChange={setJobStatusFilter}
            options={JOB_STATUS_OPTIONS}
            placeholder="All postings"
          />
        </div>
        <div className="admin-leads-filter">
          <AdminSelect
            id="applicants-sort"
            aria-label="Sort jobs"
            value={sort}
            onChange={setSort}
            options={SORT_OPTIONS}
            placeholder="Sort"
          />
        </div>
      </div>

      <div className="admin-services-table-wrap">
        {jobs.length === 0 ? (
          <div className="admin-page-placeholder admin-leads-empty">
            <Briefcase size={28} strokeWidth={1.5} aria-hidden />
            <p>No job postings yet.</p>
            <p className="admin-leads-empty-hint">
              Create a posting under Careers; applicants will be grouped under it here.
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="admin-page-placeholder admin-leads-empty">
            <Search size={28} strokeWidth={1.5} aria-hidden />
            <p>No job postings match your filters.</p>
            {hasActiveFilters && (
              <button
                type="button"
                className="admin-settings-retry"
                onClick={() => {
                  setQuery('')
                  setTypeFilter('all')
                  setJobStatusFilter('all')
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <table className="admin-services-table admin-leads-table">
            <thead>
              <tr>
                <th scope="col">Job Title</th>
                <th scope="col">Employment Type</th>
                <th scope="col">Location</th>
                <th scope="col">Total Applicants</th>
                <th scope="col">New Applicants</th>
                <th scope="col">Last Application</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link
                      href={`/admin/careers/applications/jobs/${job.id}`}
                      className="admin-services-table-link"
                    >
                      {job.title}
                    </Link>
                    {job.jobStatus && job.jobStatus !== 'published' ? (
                      <div className="admin-leads-person-email">
                        {JOB_STATUS_LABELS[job.jobStatus as keyof typeof JOB_STATUS_LABELS] ??
                          job.jobStatus}
                      </div>
                    ) : null}
                  </td>
                  <td>{labelEmploymentType(job.employmentType)}</td>
                  <td>{job.location || '—'}</td>
                  <td>{job.totalApplicants}</td>
                  <td>
                    {job.newApplicants > 0 ? (
                      <span className="admin-leads-badge admin-leads-badge--status-new">
                        {job.newApplicants}
                      </span>
                    ) : (
                      0
                    )}
                  </td>
                  <td>{job.lastApplicationAt ? formatDate(job.lastApplicationAt) : '—'}</td>
                  <td>
                    <Link
                      href={`/admin/careers/applications/jobs/${job.id}`}
                      className="admin-services-action-btn"
                      aria-label={`View applicants for ${job.title}`}
                    >
                      View Applicants
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {visible.length > 0 && (
        <p className="admin-leads-count" aria-live="polite">
          Showing {visible.length} of {jobs.length} job posting{jobs.length === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}
