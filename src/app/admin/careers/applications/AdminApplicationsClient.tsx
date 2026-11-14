'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Briefcase, Loader2, RefreshCw, Users } from 'lucide-react'
import { useToast } from '@/components/common/ToastProvider'
import {
  JOB_APPLICATION_STATUSES,
  labelJobApplicationStatus,
} from '@/lib/jobApplicationValidation'
import { listJobApplications, type JobApplicationRow } from '@/lib/next/jobApplicationsBrowser'

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

function jobTitle(row: JobApplicationRow) {
  return row.job_postings?.title || 'Unknown role'
}

export default function AdminApplicationsClient() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [rows, setRows] = useState<JobApplicationRow[]>([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  const [jobFilter, setJobFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    setLoadError('')
    try {
      setRows(await listJobApplications())
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load applications.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const jobOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of rows) {
      const job = row.job_postings
      if (job?.id) map.set(String(job.id), String(job.title || 'Untitled role'))
      else if (row.job_posting_id) map.set(String(row.job_posting_id), jobTitle(row))
    }
    return [...map.entries()]
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
    const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.application_status !== statusFilter) return false
      if (jobFilter !== 'all' && String(row.job_posting_id) !== jobFilter) return false
      if (fromMs != null || toMs != null) {
        const createdMs = row.created_at ? new Date(String(row.created_at)).getTime() : NaN
        if (Number.isNaN(createdMs)) return false
        if (fromMs != null && createdMs < fromMs) return false
        if (toMs != null && createdMs > toMs) return false
      }
      if (!q) return true
      const haystack = [
        row.first_name,
        row.last_name,
        row.email,
        row.phone,
        jobTitle(row),
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ')
      return haystack.includes(q)
    })
  }, [dateFrom, dateTo, jobFilter, query, rows, statusFilter])

  if (status === 'loading') {
    return (
      <div className="admin-settings-state" role="status">
        <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
        <span>Loading applications…</span>
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
    <div className="admin-page admin-services-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Users size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Job Applications</h1>
          <p className="admin-page-desc">
            Confidential applicant submissions. Administrators only.
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

      <div className="admin-services-toolbar">
        <input
          className="admin-settings-input"
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="admin-settings-input"
          value={jobFilter}
          onChange={(e) => setJobFilter(e.target.value)}
        >
          <option value="all">All positions</option>
          {jobOptions.map(([id, title]) => (
            <option key={id} value={id}>
              {title}
            </option>
          ))}
        </select>
        <select
          className="admin-settings-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {JOB_APPLICATION_STATUSES.map((value) => (
            <option key={value} value={value}>
              {labelJobApplicationStatus(value)}
            </option>
          ))}
        </select>
        <label className="admin-settings-field" style={{ margin: 0 }}>
          <span className="sr-only">From date</span>
          <input
            type="date"
            className="admin-settings-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="Filter from date"
          />
        </label>
        <label className="admin-settings-field" style={{ margin: 0 }}>
          <span className="sr-only">To date</span>
          <input
            type="date"
            className="admin-settings-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="Filter to date"
          />
        </label>
      </div>

      <div className="admin-services-table-wrap">
        <table className="admin-services-table">
          <thead>
            <tr>
              <th scope="col">Applicant</th>
              <th scope="col">Position</th>
              <th scope="col">Status</th>
              <th scope="col">Submitted</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="admin-page-placeholder">No applications match these filters.</div>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Link
                      href={`/admin/careers/applications/${row.id}`}
                      className="admin-services-table-link"
                    >
                      {row.first_name} {row.last_name}
                    </Link>
                    <div className="admin-page-desc">{row.email}</div>
                  </td>
                  <td>{jobTitle(row)}</td>
                  <td>{labelJobApplicationStatus(String(row.application_status))}</td>
                  <td>{formatDate(row.created_at)}</td>
                  <td>
                    <Link
                      href={`/admin/careers/applications/${row.id}`}
                      className="admin-services-action-btn"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
