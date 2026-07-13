import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  MessageSquare,
  PhoneCall,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react'
import LeadDetailDrawer from '../../components/admin/leads/LeadDetailDrawer'
import AdminSelect from '../../components/admin/AdminSelect'
import {
  formatLeadPriority,
  formatLeadStatus,
  LEAD_PRIORITY_OPTIONS,
  LEAD_STATUS_OPTIONS,
  listLeads,
} from '../../lib/leads'

/**
 * @param {Record<string, unknown>[]} leads
 */
function summarizeLeads(leads) {
  return {
    total: leads.length,
    new: leads.filter((lead) => lead.status === 'new').length,
    contacted: leads.filter((lead) => lead.status === 'contacted').length,
    won: leads.filter((lead) => lead.status === 'won').length,
  }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * @param {string} text
 * @param {number} max
 */
function truncate(text, max = 72) {
  const value = String(text ?? '').trim()
  if (value.length <= max) return value || '—'
  return `${value.slice(0, max - 1)}…`
}

export default function AdminLeadsPage() {
  const [status, setStatus] = useState(/** @type {'loading' | 'ready' | 'error'} */ ('loading'))
  const [loadError, setLoadError] = useState('')
  const [leads, setLeads] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedLead, setSelectedLead] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadLeads = useCallback(async () => {
    setStatus('loading')
    setLoadError('')

    try {
      const rows = await listLeads()
      setLeads(rows)
      setStatus('ready')
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load leads.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const summary = useMemo(() => summarizeLeads(leads), [leads])

  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false

      if (!query) return true

      const haystack = [
        lead.lead_number,
        lead.full_name,
        lead.email,
        lead.phone,
        lead.company,
        lead.service_interest,
        lead.message,
        lead.source,
      ]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ')

      return haystack.includes(query)
    })
  }, [leads, searchQuery, statusFilter, priorityFilter])

  const handleOpenLead = useCallback((lead) => {
    setSelectedLead(lead)
    setDrawerOpen(true)
  }, [])

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const handleLeadUpdated = useCallback((updated) => {
    setLeads((current) =>
      current.map((row) => (row.id === updated.id ? { ...row, ...updated } : row))
    )
    setSelectedLead((current) =>
      current && current.id === updated.id ? { ...current, ...updated } : current
    )
  }, [])

  const hasActiveFilters =
    searchQuery.trim() !== '' || statusFilter !== 'all' || priorityFilter !== 'all'

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: 'All statuses' },
      ...LEAD_STATUS_OPTIONS.map((value) => ({
        value,
        label: formatLeadStatus(value),
      })),
    ],
    []
  )

  const priorityOptions = useMemo(
    () => [
      { value: 'all', label: 'All priorities' },
      ...LEAD_PRIORITY_OPTIONS.map((value) => ({
        value,
        label: formatLeadPriority(value),
      })),
    ],
    []
  )

  return (
    <div className="admin-page admin-services-page admin-leads-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Inbox size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Leads</h1>
          <p className="admin-page-desc">
            Review inquiries and manage lead status, priority, and follow-up.
          </p>
        </div>
        <button
          type="button"
          className="admin-services-create-btn"
          onClick={loadLeads}
          disabled={status === 'loading'}
        >
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
          Refresh
        </button>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading leads…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={loadLeads}>
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <div className="admin-leads-summary" aria-label="Lead summary">
            <article className="admin-leads-summary-card">
              <span className="admin-leads-summary-icon admin-leads-summary-icon--total" aria-hidden>
                <Users size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="admin-leads-summary-label">Total</p>
                <p className="admin-leads-summary-value">{summary.total}</p>
              </div>
            </article>
            <article className="admin-leads-summary-card">
              <span className="admin-leads-summary-icon admin-leads-summary-icon--new" aria-hidden>
                <MessageSquare size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="admin-leads-summary-label">New</p>
                <p className="admin-leads-summary-value">{summary.new}</p>
              </div>
            </article>
            <article className="admin-leads-summary-card">
              <span
                className="admin-leads-summary-icon admin-leads-summary-icon--contacted"
                aria-hidden
              >
                <PhoneCall size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="admin-leads-summary-label">Contacted</p>
                <p className="admin-leads-summary-value">{summary.contacted}</p>
              </div>
            </article>
            <article className="admin-leads-summary-card">
              <span className="admin-leads-summary-icon admin-leads-summary-icon--won" aria-hidden>
                <CheckCircle2 size={18} strokeWidth={1.75} />
              </span>
              <div>
                <p className="admin-leads-summary-label">Won</p>
                <p className="admin-leads-summary-value">{summary.won}</p>
              </div>
            </article>
          </div>

          <div className="admin-leads-toolbar">
            <label className="admin-leads-search">
              <Search size={16} strokeWidth={1.75} aria-hidden />
              <span className="sr-only">Search leads</span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search name, email, company, Lead ID…"
                className="admin-settings-input"
              />
            </label>

            <div className="admin-leads-filter">
              <AdminSelect
                id="leads-status-filter"
                aria-label="Filter by status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={statusOptions}
                placeholder="All statuses"
              />
            </div>

            <div className="admin-leads-filter">
              <AdminSelect
                id="leads-priority-filter"
                aria-label="Filter by priority"
                value={priorityFilter}
                onChange={setPriorityFilter}
                options={priorityOptions}
                placeholder="All priorities"
              />
            </div>
          </div>

          <div className="admin-services-table-wrap">
            {leads.length === 0 ? (
              <div className="admin-page-placeholder admin-leads-empty">
                <Inbox size={28} strokeWidth={1.5} aria-hidden />
                <p>No leads yet.</p>
                <p className="admin-leads-empty-hint">
                  Inquiries will appear here once the contact form is connected.
                </p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="admin-page-placeholder admin-leads-empty">
                <Search size={28} strokeWidth={1.5} aria-hidden />
                <p>No leads match your filters.</p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="admin-settings-retry"
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('all')
                      setPriorityFilter('all')
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
                    <th scope="col">Lead ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Company</th>
                    <th scope="col">Service</th>
                    <th scope="col">Status</th>
                    <th scope="col">Priority</th>
                    <th scope="col">Received</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={String(lead.id)}
                      className="admin-leads-row"
                      tabIndex={0}
                      onClick={() => handleOpenLead(lead)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          handleOpenLead(lead)
                        }
                      }}
                    >
                      <td>
                        <span className="admin-leads-id">{String(lead.lead_number ?? '—')}</span>
                      </td>
                      <td>
                        <div className="admin-leads-person">
                          <span className="admin-leads-person-name">
                            {String(lead.full_name ?? '—')}
                          </span>
                          <span className="admin-leads-person-email">
                            {String(lead.email ?? '')}
                          </span>
                        </div>
                      </td>
                      <td>{String(lead.company || '—')}</td>
                      <td title={String(lead.service_interest ?? '')}>
                        {truncate(String(lead.service_interest ?? ''), 36)}
                      </td>
                      <td>
                        <span
                          className={`admin-leads-badge admin-leads-badge--status-${lead.status}`}
                        >
                          {formatLeadStatus(String(lead.status ?? ''))}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-leads-badge admin-leads-badge--priority-${lead.priority}`}
                        >
                          {formatLeadPriority(String(lead.priority ?? ''))}
                        </span>
                      </td>
                      <td>{formatDate(lead.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {filteredLeads.length > 0 && (
            <p className="admin-leads-count" aria-live="polite">
              Showing {filteredLeads.length} of {leads.length} lead
              {leads.length === 1 ? '' : 's'}
            </p>
          )}
        </>
      )}

      <LeadDetailDrawer
        lead={selectedLead}
        isOpen={drawerOpen}
        onClose={handleCloseDrawer}
        onLeadUpdated={handleLeadUpdated}
      />
    </div>
  )
}
