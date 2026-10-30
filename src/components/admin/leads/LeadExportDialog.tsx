'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { filterLeadsForExport } from '@/lib/exportLeadFilters'
import {
  formatLeadPriority,
  formatLeadStatus,
  LEAD_PRIORITY_OPTIONS,
  LEAD_STATUS_OPTIONS,
} from '@/lib/leadsFormat'

export type LeadExportFormat = 'csv' | 'pdf'

export type LeadExportFilters = {
  from: string
  to: string
  status: string
  priority: string
  service: string
}

type LeadExportDialogProps = {
  format: LeadExportFormat
  leads: Record<string, unknown>[]
  initialFilters: LeadExportFilters
  onClose: () => void
  onExport: (format: LeadExportFormat, rows: Record<string, unknown>[], summary: string) => void
}

export default function LeadExportDialog({
  format,
  leads,
  initialFilters,
  onClose,
  onExport,
}: LeadExportDialogProps) {
  const titleId = useId()
  const [filters, setFilters] = useState(initialFilters)
  const [error, setError] = useState('')

  const services = useMemo(() => {
    const names = new Set<string>()
    for (const lead of leads) {
      const name = String(lead.service_interest ?? '').trim()
      if (name) names.add(name)
    }
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [leads])

  const matching = useMemo(() => filterLeadsForExport(leads, filters), [leads, filters])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const setField = (key: keyof LeadExportFilters, value: string) => {
    setError('')
    setFilters((current) => ({ ...current, [key]: value }))
  }

  const handleExport = () => {
    if (filters.from && filters.to && filters.from > filters.to) {
      setError('The start date must be on or before the end date.')
      return
    }
    if (matching.length === 0) {
      setError('No leads match these filters.')
      return
    }
    const range =
      filters.from || filters.to
        ? `${filters.from || 'start'} to ${filters.to || 'today'}`
        : 'all dates'
    const summary = `Leads · ${range} · ${matching.length} lead${matching.length === 1 ? '' : 's'}`
    onExport(format, matching, summary)
  }

  return createPortal(
    <div
      className="admin-confirm-dialog admin-leads-export-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="admin-confirm-dialog-panel admin-leads-export-panel">
        <h2 id={titleId} className="admin-confirm-dialog-title">
          Export {format === 'csv' ? 'CSV' : 'PDF'}
        </h2>
        <p className="admin-confirm-dialog-message">
          Choose a received-date range and any extra filters. Only matching leads are included.
        </p>

        <div className="admin-leads-export-fields">
          <label className="admin-settings-field" htmlFor="lead-export-from">
            <span className="admin-settings-label">From</span>
            <input
              id="lead-export-from"
              type="date"
              className="admin-settings-input"
              value={filters.from}
              onChange={(event) => setField('from', event.target.value)}
            />
          </label>
          <label className="admin-settings-field" htmlFor="lead-export-to">
            <span className="admin-settings-label">To</span>
            <input
              id="lead-export-to"
              type="date"
              className="admin-settings-input"
              value={filters.to}
              onChange={(event) => setField('to', event.target.value)}
            />
          </label>
          <label className="admin-settings-field" htmlFor="lead-export-status">
            <span className="admin-settings-label">Status</span>
            <select
              id="lead-export-status"
              className="admin-settings-input"
              value={filters.status}
              onChange={(event) => setField('status', event.target.value)}
            >
              <option value="all">All statuses</option>
              {LEAD_STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {formatLeadStatus(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-settings-field" htmlFor="lead-export-priority">
            <span className="admin-settings-label">Priority</span>
            <select
              id="lead-export-priority"
              className="admin-settings-input"
              value={filters.priority}
              onChange={(event) => setField('priority', event.target.value)}
            >
              <option value="all">All priorities</option>
              {LEAD_PRIORITY_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {formatLeadPriority(value)}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-settings-field admin-leads-export-field--full" htmlFor="lead-export-service">
            <span className="admin-settings-label">Service</span>
            <select
              id="lead-export-service"
              className="admin-settings-input"
              value={filters.service}
              onChange={(event) => setField('service', event.target.value)}
            >
              <option value="all">All services</option>
              {services.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="admin-leads-export-count" role="status">
          {matching.length} lead{matching.length === 1 ? '' : 's'} match
        </p>
        {error ? (
          <p className="admin-settings-hint admin-leads-export-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="admin-confirm-dialog-actions">
          <button type="button" className="admin-confirm-dialog-btn admin-confirm-dialog-btn--cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="admin-confirm-dialog-btn admin-idle-dialog-stay"
            onClick={handleExport}
            disabled={matching.length === 0}
          >
            Download {format === 'csv' ? 'CSV' : 'PDF'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
