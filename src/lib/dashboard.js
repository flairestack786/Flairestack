import { supabase } from './supabase'
import { LEAD_STATUS_OPTIONS, listLeads, listRecentLeadTimeline } from './leads'
import { listServices } from './servicePage'
import { listTestimonials } from './testimonials'
import { listFiles } from './media'
import { listPendingInvites, listUsers, summarizeTeam } from './users'

/** Dashboard / CMS product version shown in System Information. */
export const CMS_VERSION = '1.1.0'

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isToday(value) {
  if (!value) return false
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return false

  const now = new Date()
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

/**
 * @param {Record<string, unknown>[]} leads
 */
export function summarizeLeadsByStatus(leads) {
  const total = leads.length || 1

  return LEAD_STATUS_OPTIONS.map((status) => {
    const count = leads.filter((lead) => lead.status === status).length
    return {
      status,
      count,
      percent: Math.round((count / total) * 100),
    }
  }).filter((entry) => entry.count > 0)
}

/**
 * @param {Record<string, unknown>[]} leads
 * @param {number} [months]
 */
export function summarizeLeadsByMonth(leads, months = 6) {
  /** @type {{ key: string, label: string, year: number, count: number, isCurrent?: boolean }[]} */
  const buckets = []
  const now = new Date()
  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    buckets.push({
      key,
      label: date.toLocaleDateString(undefined, { month: 'short' }),
      year: date.getFullYear(),
      count: 0,
      isCurrent: key === currentKey,
    })
  }

  for (const lead of leads) {
    const date = new Date(String(lead.created_at))
    if (Number.isNaN(date.getTime())) continue

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const bucket = buckets.find((entry) => entry.key === key)
    if (bucket) bucket.count += 1
  }

  const max = Math.max(1, ...buckets.map((bucket) => bucket.count))

  return buckets.map((bucket) => ({
    ...bucket,
    percent: Math.round((bucket.count / max) * 100),
  }))
}

/**
 * @param {Record<string, unknown>[]} leads
 * @param {number} [limit]
 */
export function summarizeServicesRequested(leads, limit = 6) {
  /** @type {Map<string, number>} */
  const counts = new Map()

  for (const lead of leads) {
    const raw = String(lead.service_interest ?? '').trim()
    const label = raw || 'Unspecified'
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }

  const sorted = [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)

  const max = Math.max(1, ...sorted.map(([, count]) => count))

  return sorted.map(([fullLabel, count]) => ({
    label: fullLabel.length > 34 ? `${fullLabel.slice(0, 33)}…` : fullLabel,
    fullLabel,
    count,
    percent: Math.round((count / max) * 100),
  }))
}

/**
 * @param {Record<string, unknown>[]} leads
 */
export function buildLeadStats(leads) {
  return {
    totalLeads: leads.length,
    todaysLeads: leads.filter((lead) => isToday(lead.created_at)).length,
    wonProjects: leads.filter((lead) => lead.status === 'won').length,
  }
}

/**
 * @param {Record<string, unknown>[]} leads
 */
export function buildLeadAnalytics(leads) {
  return {
    recentLeads: leads.slice(0, 6),
    leadsByStatus: summarizeLeadsByStatus(leads),
    leadsByMonth: summarizeLeadsByMonth(leads),
    servicesRequested: summarizeServicesRequested(leads),
  }
}

/**
 * Normalize feed items so lead timeline and future CMS modules share one shape.
 * @param {Record<string, unknown>[]} leadEvents
 * @returns {Record<string, unknown>[]}
 */
export function buildActivityFeed(leadEvents = []) {
  return leadEvents.map((event) => {
    /** @type {{ lead_number?: string, full_name?: string } | null} */
    const lead = event.leads && typeof event.leads === 'object' ? event.leads : null

    return {
      id: String(event.id),
      source: 'leads',
      sourceLabel: 'Leads',
      eventType: String(event.event_type ?? 'system'),
      title: String(event.title || event.event_type || 'Activity'),
      body: event,
      createdAt: event.created_at,
      entityId: event.lead_id ? String(event.lead_id) : null,
      meta: lead?.lead_number
        ? `${lead.lead_number}${lead.full_name ? ` · ${lead.full_name}` : ''}`
        : null,
      // Preserve raw payload for drawers / future global CMS event handlers
      payload: event,
    }
  })
}

/**
 * @returns {Promise<number>}
 */
async function countPages() {
  const { count, error } = await supabase.from('pages').select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

/**
 * @returns {Promise<{
 *   status: 'connected' | 'error',
 *   latencyMs: number | null,
 *   message: string,
 * }>}
 */
async function checkSupabaseConnection() {
  const started = Date.now()
  try {
    const { error } = await supabase.from('pages').select('id', { count: 'exact', head: true })
    const latencyMs = Date.now() - started
    if (error) {
      return { status: 'error', latencyMs, message: error.message }
    }
    return { status: 'connected', latencyMs, message: 'Connected' }
  } catch (err) {
    return {
      status: 'error',
      latencyMs: Date.now() - started,
      message: err?.message ?? 'Unable to reach Supabase',
    }
  }
}

/**
 * Soft-load team metrics (profiles may not exist until users migration is applied).
 */
async function loadTeamOverview() {
  try {
    const [users, pendingInvites] = await Promise.all([listUsers(), listPendingInvites()])
    return summarizeTeam(users, pendingInvites)
  } catch {
    return {
      totalUsers: 0,
      activeUsers: 0,
      pendingInvites: 0,
      administrators: 0,
      editors: 0,
      sales: 0,
      disabledUsers: 0,
    }
  }
}

/**
 * @param {{ includeLeads?: boolean, includeTeam?: boolean, includeContent?: boolean }} [options]
 */
export async function fetchDashboardSnapshot(options = {}) {
  const includeLeads = options.includeLeads !== false
  const includeTeam = options.includeTeam !== false
  const includeContent = options.includeContent !== false

  const leadsPromise = includeLeads
    ? listLeads()
    : Promise.resolve(/** @type {Record<string, unknown>[]} */ ([]))
  const leadTimelinePromise = includeLeads
    ? listRecentLeadTimeline(12)
    : Promise.resolve(/** @type {Record<string, unknown>[]} */ ([]))
  const teamPromise = includeTeam ? loadTeamOverview() : Promise.resolve({
    totalUsers: 0,
    activeUsers: 0,
    pendingInvites: 0,
    administrators: 0,
    editors: 0,
    sales: 0,
    disabledUsers: 0,
  })
  const servicesPromise = includeContent
    ? listServices()
    : Promise.resolve(/** @type {Record<string, unknown>[]} */ ([]))
  const testimonialsPromise = includeContent
    ? listTestimonials()
    : Promise.resolve(/** @type {Record<string, unknown>[]} */ ([]))
  const mediaPromise = includeContent
    ? listFiles()
    : Promise.resolve(/** @type {Record<string, unknown>[]} */ ([]))
  const pagesPromise = includeContent ? countPages() : Promise.resolve(0)

  const [leads, services, testimonials, mediaRaw, pages, leadTimeline, team, supabaseStatus] =
    await Promise.all([
      leadsPromise,
      servicesPromise,
      testimonialsPromise,
      mediaPromise,
      pagesPromise,
      leadTimelinePromise,
      teamPromise,
      checkSupabaseConnection(),
    ])

  const mediaFiles = (mediaRaw ?? []).filter(
    (item) => item?.name && item.id != null && !item.name.endsWith('/')
  )

  const leadStats = buildLeadStats(leads)
  const leadAnalytics = buildLeadAnalytics(leads)

  return {
    stats: {
      ...leadStats,
      pages,
      services: services.length,
      mediaFiles: mediaFiles.length,
      testimonials: testimonials.length,
      activeUsers: team.activeUsers,
    },
    team,
    system: {
      cmsVersion: CMS_VERSION,
      supabase: supabaseStatus,
      lastBackup: null,
    },
    leads,
    ...leadAnalytics,
    recentActivity: buildActivityFeed(leadTimeline),
  }
}
