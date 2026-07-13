import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
  FileText,
  Home,
  Image,
  Inbox,
  Layers,
  LayoutDashboard,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Search,
  Trophy,
  Users,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import StatsCard from '../../components/admin/dashboard/StatsCard'
import ChartCard from '../../components/admin/dashboard/ChartCard'
import ActivityCard from '../../components/admin/dashboard/ActivityCard'
import TableCard from '../../components/admin/dashboard/TableCard'
import QuickActionCard from '../../components/admin/dashboard/QuickActionCard'
import TeamOverviewCard from '../../components/admin/dashboard/TeamOverviewCard'
import SystemInfoCard from '../../components/admin/dashboard/SystemInfoCard'
import LeadStatusDonutChart from '../../components/admin/dashboard/LeadStatusDonutChart'
import LeadsByMonthBarChart from '../../components/admin/dashboard/LeadsByMonthBarChart'
import ServicesRequestedBarChart from '../../components/admin/dashboard/ServicesRequestedBarChart'
import LeadDetailDrawer from '../../components/admin/leads/LeadDetailDrawer'
import { buildLeadAnalytics, buildLeadStats, CMS_VERSION, fetchDashboardSnapshot } from '../../lib/dashboard'
import {
  formatLeadPriority,
  formatLeadStatus,
  formatLeadTimelineSummary,
} from '../../lib/leads'
import { canAccessModule, canManageContent } from '../../lib/cmsPermissions'
import { formatCmsRole, getCurrentProfile } from '../../lib/users'

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
 * @param {unknown} value
 * @returns {string}
 */
function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatRelativeTime(value) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return formatDate(value)
}

/**
 * @param {string} name
 */
function firstName(name) {
  const value = String(name ?? '').trim()
  if (!value) return ''
  return value.split(/\s+/)[0]
}

export default function DashboardPage() {
  const { user, canAccess } = useAuth()
  const [status, setStatus] = useState(/** @type {'loading' | 'ready' | 'error'} */ ('loading'))
  const [loadError, setLoadError] = useState('')
  const [snapshot, setSnapshot] = useState(
    /** @type {Awaited<ReturnType<typeof fetchDashboardSnapshot>> | null} */ (null)
  )
  const [profile, setProfile] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [selectedLead, setSelectedLead] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [drawerOpen, setDrawerOpen] = useState(false)

  const loadDashboard = useCallback(async () => {
    setStatus('loading')
    setLoadError('')

    try {
      const currentProfile = await getCurrentProfile().catch(() => null)
      const role = String(currentProfile?.role ?? 'administrator')
      const includeLeads = canAccessModule(role, 'leads')
      const includeTeam = canAccessModule(role, 'users')
      const includeContent = canManageContent(role)

      const data = await fetchDashboardSnapshot({ includeLeads, includeTeam, includeContent })
      setSnapshot(data)
      setProfile(currentProfile)
      setStatus('ready')
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load dashboard.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const handleOpenLead = useCallback(
    (leadId) => {
      const lead = snapshot?.leads.find((row) => String(row.id) === String(leadId))
      if (!lead) return
      setSelectedLead(lead)
      setDrawerOpen(true)
    },
    [snapshot?.leads]
  )

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false)
  }, [])

  const handleLeadUpdated = useCallback((updated) => {
    setSnapshot((current) => {
      if (!current) return current

      const leads = current.leads.map((row) =>
        row.id === updated.id ? { ...row, ...updated } : row
      )

      const leadAnalytics = buildLeadAnalytics(leads)

      return {
        ...current,
        leads,
        ...leadAnalytics,
        stats: {
          ...current.stats,
          ...buildLeadStats(leads),
        },
      }
    })

    setSelectedLead((current) =>
      current && current.id === updated.id ? { ...current, ...updated } : current
    )
  }, [])

  const activityItems = useMemo(() => {
    if (!snapshot) return []

    return snapshot.recentActivity.map((event) => {
      const payload =
        event.payload && typeof event.payload === 'object' ? event.payload : event.body
      const entityId = event.entityId ? String(event.entityId) : ''

      return {
        id: String(event.id),
        title: String(event.title || 'Activity'),
        body:
          event.source === 'leads' && payload && typeof payload === 'object'
            ? formatLeadTimelineSummary(/** @type {Record<string, unknown>} */ (payload))
            : String(event.body ?? ''),
        time: formatRelativeTime(event.createdAt ?? event.created_at),
        dateTime: String(event.createdAt ?? event.created_at ?? ''),
        meta: event.meta ? String(event.meta) : undefined,
        source: String(event.source ?? 'system'),
        sourceLabel: String(event.sourceLabel ?? event.source ?? 'CMS'),
        onClick:
          event.source === 'leads' && entityId
            ? () => handleOpenLead(entityId)
            : undefined,
      }
    })
  }, [snapshot, handleOpenLead])

  const stats = snapshot?.stats

  const displayName =
    String(profile?.full_name ?? '').trim() ||
    String(user?.user_metadata?.full_name ?? '').trim() ||
    String(user?.email ?? 'there')

  const roleLabel = profile?.role
    ? formatCmsRole(String(profile.role))
    : 'Administrator'

  const lastLogin = profile?.last_sign_in_at ?? user?.last_sign_in_at ?? null

  const canViewLeads = canAccess('leads')
  const canViewTeam = canAccess('users')
  const canViewSeo = canAccess('seo')
  const canViewContent = canAccess('home') || canAccess('services') || canAccess('media')
  const isSalesDashboard = canViewLeads && !canViewContent && !canViewTeam

  return (
    <div className="admin-page admin-dashboard-page">
      <header className="admin-page-header admin-dashboard-welcome">
        <span className="admin-page-icon" aria-hidden>
          <LayoutDashboard size={22} strokeWidth={1.75} />
        </span>
        <div className="admin-dashboard-welcome-copy">
          <p className="admin-dashboard-welcome-kicker">
            {isSalesDashboard ? 'Sales dashboard' : `Dashboard v${CMS_VERSION}`}
          </p>
          <h1 className="admin-page-title">
            Welcome back, {firstName(displayName) || 'there'}
          </h1>
          <p className="admin-page-desc admin-dashboard-welcome-meta">
            <span className="admin-dashboard-welcome-chip">{roleLabel}</span>
            <span className="admin-dashboard-welcome-sep" aria-hidden>
              ·
            </span>
            <span>
              {isSalesDashboard
                ? 'Lead pipeline overview'
                : `Last login ${formatDateTime(lastLogin)}`}
            </span>
          </p>
        </div>
        <button
          type="button"
          className="admin-services-create-btn"
          onClick={loadDashboard}
          disabled={status === 'loading'}
        >
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
          Refresh
        </button>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading dashboard…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={loadDashboard}>
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && stats && snapshot && (
        <>
          <div className="admin-dashboard-metrics" aria-label="Dashboard metrics">
            {canViewLeads && (
              <>
                <StatsCard
                  label="Total Leads"
                  value={stats.totalLeads}
                  hint="All inquiries in pipeline"
                  icon={<Inbox size={18} strokeWidth={1.75} />}
                  variant="leads"
                />
                <StatsCard
                  label="Today's Leads"
                  value={stats.todaysLeads}
                  hint="Received since midnight"
                  icon={<CalendarDays size={18} strokeWidth={1.75} />}
                  variant="today"
                />
                <StatsCard
                  label="Won Projects"
                  value={stats.wonProjects}
                  hint="Closed-won deals"
                  icon={<Trophy size={18} strokeWidth={1.75} />}
                  variant="won"
                />
              </>
            )}
            {canViewTeam && (
              <StatsCard
                label="Active Users"
                value={stats.activeUsers}
                hint="Profiles currently active"
                icon={<Users size={18} strokeWidth={1.75} />}
                variant="users"
              />
            )}
            {canViewContent && (
              <>
                <StatsCard
                  label="Services"
                  value={stats.services}
                  hint="CMS service offerings"
                  icon={<Layers size={18} strokeWidth={1.75} />}
                  variant="services"
                />
                <StatsCard
                  label="Pages"
                  value={stats.pages}
                  hint="CMS-managed pages"
                  icon={<FileText size={18} strokeWidth={1.75} />}
                  variant="pages"
                />
                <StatsCard
                  label="Media Files"
                  value={stats.mediaFiles}
                  hint="Assets in library"
                  icon={<Image size={18} strokeWidth={1.75} />}
                  variant="media"
                />
                <StatsCard
                  label="Testimonials"
                  value={stats.testimonials}
                  hint="Client quotes in CMS"
                  icon={<MessageSquareQuote size={18} strokeWidth={1.75} />}
                  variant="testimonials"
                />
              </>
            )}
          </div>

          {canViewLeads && (
            <div className="admin-dashboard-charts" aria-label="Analytics charts">
              <ChartCard
                title="Lead Status"
                description="Donut view of pipeline mix across all leads."
                action={
                  <Link to="/admin/leads" className="admin-dashboard-card-link">
                    Manage leads
                  </Link>
                }
              >
                <LeadStatusDonutChart
                  segments={snapshot.leadsByStatus}
                  total={stats.totalLeads}
                />
              </ChartCard>

              <ChartCard
                title="Leads This Month"
                description="Monthly inquiry volume with this month highlighted."
              >
                <LeadsByMonthBarChart months={snapshot.leadsByMonth} />
              </ChartCard>

              <ChartCard
                title="Top Requested Services"
                description="Horizontal ranking of service interest from leads."
                action={
                  canViewContent ? (
                    <Link to="/admin/services" className="admin-dashboard-card-link">
                      View services
                    </Link>
                  ) : (
                    <Link to="/admin/leads" className="admin-dashboard-card-link">
                      View leads
                    </Link>
                  )
                }
              >
                <ServicesRequestedBarChart services={snapshot.servicesRequested} />
              </ChartCard>
            </div>
          )}

          {canViewLeads && (
            <TableCard
              title="Recent Leads"
              description="Latest inquiries — click a row to open the lead drawer."
              viewAllHref="/admin/leads"
              viewAllLabel="All leads"
            >
              {snapshot.recentLeads.length === 0 ? (
                <div className="admin-page-placeholder admin-dashboard-empty-panel">
                  <Inbox size={28} strokeWidth={1.5} aria-hidden />
                  <p>No leads yet.</p>
                  <p className="admin-leads-empty-hint">
                    Inquiries will appear here once the contact form is connected.
                  </p>
                </div>
              ) : (
                <div className="admin-services-table-wrap admin-dashboard-table-wrap">
                  <table className="admin-services-table admin-leads-table">
                    <thead>
                      <tr>
                        <th scope="col">Lead ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">Status</th>
                        <th scope="col">Priority</th>
                        <th scope="col">Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshot.recentLeads.map((lead) => (
                        <tr
                          key={String(lead.id)}
                          className="admin-leads-row"
                          tabIndex={0}
                          onClick={() => handleOpenLead(String(lead.id))}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              handleOpenLead(String(lead.id))
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
                </div>
              )}
            </TableCard>
          )}

          <section className="admin-dashboard-quick-section" aria-label="Quick actions">
            <header className="admin-dashboard-quick-header">
              <h2 className="admin-dashboard-card-title">Quick Actions</h2>
              <p className="admin-dashboard-card-desc">
                {isSalesDashboard
                  ? 'Jump to lead management tasks.'
                  : 'Jump to common admin tasks.'}
              </p>
            </header>
            <div className="admin-dashboard-quick-grid">
              {canViewLeads && (
                <QuickActionCard
                  title="Leads"
                  description="Review and manage inquiries"
                  icon={<Inbox size={18} strokeWidth={1.75} />}
                  to="/admin/leads"
                />
              )}
              {canViewContent && (
                <>
                  <QuickActionCard
                    title="Media Library"
                    description="Upload and organize assets"
                    icon={<Image size={18} strokeWidth={1.75} />}
                    to="/admin/media"
                  />
                  <QuickActionCard
                    title="Home Editor"
                    description="Edit homepage sections"
                    icon={<Home size={18} strokeWidth={1.75} />}
                    to="/admin/home"
                  />
                </>
              )}
              {canViewSeo && (
                <QuickActionCard
                  title="SEO"
                  description="Meta titles and search settings"
                  icon={<Search size={18} strokeWidth={1.75} />}
                  to="/admin/seo"
                />
              )}
              {!isSalesDashboard && (
                <QuickActionCard
                  title="View Website"
                  description="Open the public site"
                  icon={<ExternalLink size={18} strokeWidth={1.75} />}
                  to="/"
                  external
                />
              )}
            </div>
          </section>

          {canViewTeam && (
            <div className="admin-dashboard-secondary-grid">
              <TeamOverviewCard team={snapshot.team} />
              <SystemInfoCard system={snapshot.system} />
            </div>
          )}

          {canViewLeads && (
            <ActivityCard
              title="Recent Activity"
              description="CMS activity feed — leads today, ready for global events later."
              action={
                <Link to="/admin/leads" className="admin-dashboard-card-link">
                  View leads
                </Link>
              }
              emptyMessage="Activity will appear here as leads and future CMS events are recorded."
              items={activityItems}
            />
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
