import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  FileSearch,
  Globe,
  ImageOff,
  KeyRound,
  Link2Off,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'
import StatsCard from '../dashboard/StatsCard'
import ChartCard from '../dashboard/ChartCard'
import SeoScoreBadge from './SeoScoreBadge'
import { getSeoScoreBand } from '../../../lib/seoAnalysis'
import { canManageGlobalSeo } from '../../../lib/cmsPermissions'
import { useAuth } from '../../../context/AuthContext'

/**
 * SEO health dashboard + page manager list.
 * @param {{
 *   health: Record<string, unknown>,
 *   entities: Record<string, unknown>[],
 *   onRefresh: () => void,
 *   isRefreshing?: boolean,
 * }} props
 */
export default function SeoOverview({ health, entities, onRefresh, isRefreshing = false }) {
  const { cmsRole } = useAuth()
  const showGlobal = canManageGlobalSeo(cmsRole)
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const distribution = health?.distribution ?? {
    excellent: 0,
    good: 0,
    needsWork: 0,
    poor: 0,
  }

  const maxDist = Math.max(
    1,
    Number(distribution.excellent) || 0,
    Number(distribution.good) || 0,
    Number(distribution.needsWork) || 0,
    Number(distribution.poor) || 0
  )

  const issueRows = useMemo(() => {
    const rows = [
      { label: 'Missing titles', value: health?.missingTitle ?? 0, tone: 'error' },
      { label: 'Missing descriptions', value: health?.missingDescription ?? 0, tone: 'error' },
      { label: 'Missing metadata', value: health?.missingMetadata ?? 0, tone: 'error' },
      { label: 'Missing canonical', value: health?.missingCanonical ?? 0, tone: 'warning' },
      { label: 'Missing OG images', value: health?.missingOgImage ?? 0, tone: 'warning' },
      { label: 'Missing Twitter images', value: health?.missingTwitterImage ?? 0, tone: 'warning' },
      { label: 'Missing focus keywords', value: health?.missingFocusKeyword ?? 0, tone: 'warning' },
      { label: 'Invalid JSON-LD', value: health?.invalidJsonLd ?? 0, tone: 'error' },
      { label: 'Duplicate titles', value: health?.duplicateTitles ?? 0, tone: 'error' },
      { label: 'Duplicate descriptions', value: health?.duplicateDescriptions ?? 0, tone: 'error' },
    ]
    return rows.filter((row) => Number(row.value) > 0)
  }, [health])

  const statusRows = useMemo(
    () => [
      { label: 'Excellent', value: distribution.excellent, tone: 'excellent' },
      { label: 'Good', value: distribution.good, tone: 'good' },
      { label: 'Needs work', value: distribution.needsWork, tone: 'needs-work' },
      { label: 'Poor', value: distribution.poor, tone: 'poor' },
    ],
    [distribution]
  )

  const progress = Number(health?.progressPercent ?? 0)

  const filteredEntities = useMemo(() => {
    const q = query.trim().toLowerCase()
    return entities.filter((entity) => {
      const band = entity.analysis?.band ?? getSeoScoreBand(Number(entity.analysis?.score ?? 0))
      if (filter === 'pages' && entity.entity_type !== 'page') return false
      if (filter === 'services' && entity.entity_type !== 'service') return false
      if (filter === 'attention' && (band === 'excellent' || band === 'good')) return false
      if (!q) return true
      const haystack = [entity.label, entity.slug, entity.route_path, entity.form?.meta_title]
        .map((value) => String(value ?? '').toLowerCase())
        .join(' ')
      return haystack.includes(q)
    })
  }, [entities, filter, query])

  return (
    <div className="admin-seo-overview">
      <div className="admin-seo-overview-toolbar">
        {showGlobal && (
          <Link to="/admin/seo/global" className="admin-settings-retry">
            <Globe size={16} strokeWidth={1.75} />
            Global SEO Settings
          </Link>
        )}
        <button
          type="button"
          className="admin-settings-retry"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 size={16} strokeWidth={1.75} className="admin-settings-spinner" />
          ) : (
            <RefreshCw size={16} strokeWidth={1.75} />
          )}
          Refresh
        </button>
      </div>

      <div className="admin-dashboard-metrics admin-seo-metrics" aria-label="SEO health metrics">
        <StatsCard
          label="SEO Health Score"
          value={health?.averageScore ?? 0}
          hint={`${health?.band ?? 'poor'} overall`}
          icon={<Search size={18} strokeWidth={1.75} />}
          variant="services"
        />
        <StatsCard
          label="Optimized Pages"
          value={health?.optimizedPages ?? health?.healthyCount ?? 0}
          hint="Score 70+"
          icon={<Search size={18} strokeWidth={1.75} />}
          variant="won"
        />
        <StatsCard
          label="Needs Attention"
          value={health?.attentionCount ?? 0}
          hint="Score below 70"
          icon={<AlertTriangle size={18} strokeWidth={1.75} />}
          variant="today"
        />
        <StatsCard
          label="Missing Metadata"
          value={health?.missingMetadata ?? 0}
          hint="Title or description"
          icon={<FileSearch size={18} strokeWidth={1.75} />}
          variant="pages"
        />
        <StatsCard
          label="Duplicate Titles"
          value={health?.duplicateTitles ?? 0}
          hint="Across CMS pages"
          icon={<AlertCircle size={18} strokeWidth={1.75} />}
          variant="leads"
        />
        <StatsCard
          label="Duplicate Descriptions"
          value={health?.duplicateDescriptions ?? 0}
          hint="Across CMS pages"
          icon={<AlertCircle size={18} strokeWidth={1.75} />}
          variant="testimonials"
        />
        <StatsCard
          label="Missing OG Images"
          value={health?.missingOgImage ?? 0}
          hint="Open Graph"
          icon={<ImageOff size={18} strokeWidth={1.75} />}
          variant="services"
        />
        <StatsCard
          label="Missing Twitter Images"
          value={health?.missingTwitterImage ?? 0}
          hint="X cards"
          icon={<ImageOff size={18} strokeWidth={1.75} />}
          variant="pages"
        />
        <StatsCard
          label="Missing Canonicals"
          value={health?.missingCanonical ?? 0}
          hint="URL signals"
          icon={<Link2Off size={18} strokeWidth={1.75} />}
          variant="today"
        />
        <StatsCard
          label="Missing Focus Keywords"
          value={health?.missingFocusKeyword ?? 0}
          hint="Primary keyword"
          icon={<KeyRound size={18} strokeWidth={1.75} />}
          variant="leads"
        />
      </div>

      <div className="admin-seo-dashboard-grid admin-seo-dashboard-grid--4">
        <ChartCard title="SEO score distribution" description="How pages and services score today.">
          <ul className="admin-seo-dist-bars">
            {statusRows.map((row) => (
              <li key={row.label} className="admin-seo-dist-row">
                <div className="admin-seo-dist-meta">
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </div>
                <div className="admin-seo-dist-track">
                  <span
                    className={`admin-seo-dist-fill admin-seo-dist-fill--${row.tone}`}
                    style={{ width: `${(Number(row.value) / maxDist) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard title="SEO issue distribution" description="Highest-priority problems across the site.">
          {issueRows.length === 0 ? (
            <div className="admin-page-placeholder admin-seo-empty-panel">
              <CheckIcon />
              <p>No critical SEO issues detected.</p>
            </div>
          ) : (
            <ul className="admin-seo-issue-summary">
              {issueRows.map((row) => (
                <li key={row.label} className={`admin-seo-issue-row admin-seo-issue-row--${row.tone}`}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </li>
              ))}
            </ul>
          )}
        </ChartCard>

        <ChartCard title="Optimization progress" description="Share of pages scoring Good or Excellent.">
          <div className="admin-seo-progress">
            <div className="admin-seo-progress-ring" style={{ '--progress': `${progress}%` }}>
              <strong>{progress}%</strong>
              <span>optimized</span>
            </div>
            <p className="admin-seo-progress-hint">
              {health?.optimizedPages ?? 0} of {health?.total ?? 0} pages meet the healthy threshold.
            </p>
          </div>
        </ChartCard>

        <ChartCard title="Pages by SEO status" description="Counts by score band.">
          <ul className="admin-seo-status-pills">
            {statusRows.map((row) => (
              <li key={row.label} className={`admin-seo-status-pill admin-seo-status-pill--${row.tone}`}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </li>
            ))}
          </ul>
        </ChartCard>
      </div>

      <section className="admin-seo-manager" aria-label="Page SEO manager">
        <header className="admin-seo-manager-header">
          <div>
            <h2 className="admin-dashboard-card-title">Page SEO Manager</h2>
            <p className="admin-dashboard-card-desc">
              Edit meta tags, social cards, JSON-LD, keywords, and page excerpts per CMS entry.
            </p>
          </div>
        </header>

        <div className="admin-seo-manager-toolbar">
          <label className="admin-leads-search admin-seo-search">
            <Search size={16} strokeWidth={1.75} aria-hidden />
            <span className="sr-only">Search pages</span>
            <input
              type="search"
              className="admin-settings-input"
              placeholder="Search pages or services…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="admin-users-filter-chips" role="group" aria-label="SEO filters">
            {[
              { id: 'all', label: 'All' },
              { id: 'pages', label: 'Pages' },
              { id: 'services', label: 'Services' },
              { id: 'attention', label: 'Needs attention' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-users-chip${filter === item.id ? ' is-active' : ''}`}
                aria-pressed={filter === item.id}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="admin-services-table-wrap admin-seo-table-wrap">
          {filteredEntities.length === 0 ? (
            <div className="admin-page-placeholder admin-leads-empty">
              <FileSearch size={28} strokeWidth={1.5} aria-hidden />
              <p>No SEO entries match this filter.</p>
              <p className="admin-users-field-hint">
                Publish pages or services in the CMS, then return here to optimize them.
              </p>
            </div>
          ) : (
            <table className="admin-services-table admin-leads-table admin-seo-table">
              <thead>
                <tr>
                  <th scope="col">Page</th>
                  <th scope="col">Type</th>
                  <th scope="col">Meta title</th>
                  <th scope="col">Score</th>
                  <th scope="col">Issues</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntities.map((entity) => {
                  const score = Number(entity.analysis?.score ?? 0)
                  const errors = entity.analysis?.errors?.length ?? 0
                  const warnings = entity.analysis?.warnings?.length ?? 0
                  const title =
                    entity.effectiveForm?.meta_title || entity.form?.meta_title || '—'
                  return (
                    <tr key={String(entity.key)}>
                      <td>
                        <div className="admin-leads-person">
                          <span className="admin-leads-person-name">{String(entity.label)}</span>
                          <span className="admin-leads-person-email">
                            {String(entity.route_path || `/${entity.slug}`)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`admin-users-badge admin-seo-type-badge admin-seo-type-badge--${entity.entity_type}`}
                        >
                          {String(entity.entity_type)}
                        </span>
                      </td>
                      <td className="admin-seo-title-cell">{String(title)}</td>
                      <td>
                        <SeoScoreBadge score={score} size="sm" />
                      </td>
                      <td>
                        <span className="admin-seo-issue-count">
                          {errors} err · {warnings} warn
                        </span>
                      </td>
                      <td>
                        <Link
                          className="admin-users-action-btn"
                          to={`/admin/seo/${entity.entity_type}/${entity.entity_id}`}
                        >
                          Edit SEO
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 6L9 17l-5-5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
