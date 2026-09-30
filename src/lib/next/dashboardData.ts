'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import {
  LEAD_STATUS_OPTIONS,
  formatLeadTimelineSummary,
} from '@/lib/leadsFormat'
import { canAccessModule, canManageContent } from '@/lib/cmsPermissions'

/** Dashboard / CMS product version shown in System Information. */
export const CMS_VERSION = '1.1.0'

const MEDIA_BUCKET = 'site-media'

const LEAD_SELECT =
  'id, lead_number, full_name, email, phone, company, service_interest, service_id, message, status, priority, source, admin_notes, assigned_to, contacted_at, closed_at, created_at, updated_at'

function isToday(value: unknown): boolean {
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

function userHasPendingInvite(
  user: Record<string, unknown> | null | undefined,
  invites: Record<string, unknown>[] = []
): boolean {
  const email = String(user?.email ?? '')
    .trim()
    .toLowerCase()
  if (email) {
    const pendingByEmail = invites.some(
      (invite) =>
        String(invite?.status ?? '') === 'pending' &&
        String(invite?.email ?? '')
          .trim()
          .toLowerCase() === email
    )
    if (pendingByEmail) return true
  }

  const authUserId = user?.id != null ? String(user.id) : ''
  if (!authUserId) return false

  return invites.some((invite) => {
    if (String(invite?.status ?? '') !== 'pending') return false
    const meta =
      invite?.metadata && typeof invite.metadata === 'object' && !Array.isArray(invite.metadata)
        ? (invite.metadata as Record<string, unknown>)
        : {}
    return meta.auth_user_id != null && String(meta.auth_user_id) === authUserId
  })
}

export function summarizeLeadsByStatus(leads: Record<string, unknown>[]) {
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

export function summarizeLeadsByMonth(leads: Record<string, unknown>[], months = 6) {
  const buckets: {
    key: string
    label: string
    year: number
    count: number
    isCurrent?: boolean
  }[] = []
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

export function summarizeServicesRequested(leads: Record<string, unknown>[], limit = 6) {
  const counts = new Map<string, number>()

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

export function buildLeadStats(leads: Record<string, unknown>[]) {
  return {
    totalLeads: leads.length,
    todaysLeads: leads.filter((lead) => isToday(lead.created_at)).length,
    wonProjects: leads.filter((lead) => lead.status === 'won').length,
  }
}

export function buildLeadAnalytics(leads: Record<string, unknown>[]) {
  return {
    recentLeads: leads.slice(0, 6),
    leadsByStatus: summarizeLeadsByStatus(leads),
    leadsByMonth: summarizeLeadsByMonth(leads),
    servicesRequested: summarizeServicesRequested(leads),
  }
}

export function buildActivityFeed(leadEvents: Record<string, unknown>[] = []) {
  return leadEvents.map((event) => {
    const lead =
      event.leads && typeof event.leads === 'object'
        ? (event.leads as { lead_number?: string; full_name?: string })
        : null

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
      payload: event,
    }
  })
}

function summarizeTeam(users: Record<string, unknown>[], invites: Record<string, unknown>[] = []) {
  const pendingCount = invites.filter((invite) => invite.status === 'pending').length

  return {
    totalUsers: users.length,
    activeUsers: users.filter(
      (user) => user.status === 'active' && !userHasPendingInvite(user, invites)
    ).length,
    pendingInvites: pendingCount,
    administrators: users.filter(
      (user) =>
        user.role === 'administrator' &&
        user.status === 'active' &&
        !userHasPendingInvite(user, invites)
    ).length,
    editors: users.filter(
      (user) =>
        user.role === 'editor' && user.status === 'active' && !userHasPendingInvite(user, invites)
    ).length,
    sales: users.filter(
      (user) =>
        user.role === 'sales' && user.status === 'active' && !userHasPendingInvite(user, invites)
    ).length,
    disabledUsers: users.filter((user) => user.status === 'disabled').length,
  }
}

async function listLeads() {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('leads')
    .select(LEAD_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}

async function listRecentLeadTimeline(limit = 12) {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('lead_timeline')
    .select(
      'id, lead_id, event_type, title, body, old_value, new_value, created_at, leads ( lead_number, full_name )'
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}

async function listServices() {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('services')
    .select('id, slug, title, short_description, status, sort_order, published_at, updated_at')
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })

  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}

async function listTestimonials() {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('testimonials')
    .select(
      'id, name, company, position, testimonial, rating, photo_path, company_logo_path, sort_order, status, featured, stat, stat_label, published_at, updated_at'
    )
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}

async function listMediaFiles() {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase.storage.from(MEDIA_BUCKET).list('', {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'created_at', order: 'desc' },
  })

  if (error) throw error
  return data ?? []
}

async function countPages() {
  const supabase = getSupabaseBrowser()
  const { count, error } = await supabase.from('pages').select('id', { count: 'exact', head: true })
  if (error) throw error
  return count ?? 0
}

async function checkSupabaseConnection() {
  const supabase = getSupabaseBrowser()
  const started = Date.now()
  try {
    const { error } = await supabase.from('pages').select('id', { count: 'exact', head: true })
    const latencyMs = Date.now() - started
    if (error) {
      return { status: 'error' as const, latencyMs, message: error.message }
    }
    return { status: 'connected' as const, latencyMs, message: 'Connected' }
  } catch (err) {
    return {
      status: 'error' as const,
      latencyMs: Date.now() - started,
      message: err instanceof Error ? err.message : 'Unable to reach Supabase',
    }
  }
}

async function loadTeamOverview() {
  const supabase = getSupabaseBrowser()
  try {
    const [usersResult, invitesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, email, full_name, avatar_path, role, status, permissions, invited_at, invited_by, last_sign_in_at, notes, created_at, updated_at'
        )
        .order('created_at', { ascending: false }),
      supabase
        .from('user_invites')
        .select(
          'id, email, full_name, role, permissions, status, invited_by, invited_at, expires_at, accepted_at, accepted_user_id, metadata, created_at, updated_at'
        )
        .eq('status', 'pending')
        .order('invited_at', { ascending: false }),
    ])

    if (usersResult.error) throw usersResult.error
    if (invitesResult.error) throw invitesResult.error

    return summarizeTeam(
      (usersResult.data ?? []) as Record<string, unknown>[],
      (invitesResult.data ?? []) as Record<string, unknown>[]
    )
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

export type DashboardSnapshot = Awaited<ReturnType<typeof fetchDashboardSnapshot>>

/**
 * Next.js dashboard snapshot — same tables/metrics as Vite `fetchDashboardSnapshot`,
 * using the Next browser Supabase client only.
 */
export async function fetchDashboardSnapshot(options: {
  includeLeads?: boolean
  includeTeam?: boolean
  includeContent?: boolean
} = {}) {
  const includeLeads = options.includeLeads !== false
  const includeTeam = options.includeTeam !== false
  const includeContent = options.includeContent !== false

  const emptyTeam = {
    totalUsers: 0,
    activeUsers: 0,
    pendingInvites: 0,
    administrators: 0,
    editors: 0,
    sales: 0,
    disabledUsers: 0,
  }

  const [leads, services, testimonials, mediaRaw, pages, leadTimeline, team, supabaseStatus] =
    await Promise.all([
      includeLeads ? listLeads() : Promise.resolve([] as Record<string, unknown>[]),
      includeContent ? listServices() : Promise.resolve([] as Record<string, unknown>[]),
      includeContent ? listTestimonials() : Promise.resolve([] as Record<string, unknown>[]),
      includeContent ? listMediaFiles() : Promise.resolve([] as { name?: string; id?: string }[]),
      includeContent ? countPages() : Promise.resolve(0),
      includeLeads ? listRecentLeadTimeline(12) : Promise.resolve([] as Record<string, unknown>[]),
      includeTeam ? loadTeamOverview() : Promise.resolve(emptyTeam),
      checkSupabaseConnection(),
    ])

  const mediaFiles = (mediaRaw ?? []).filter(
    (item) => item?.name && item.id != null && !String(item.name).endsWith('/')
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
      lastBackup: null as string | null,
    },
    leads,
    ...leadAnalytics,
    recentActivity: buildActivityFeed(leadTimeline),
  }
}

/**
 * Resolve which dashboard data slices the signed-in role should load.
 */
export function getDashboardLoadOptions(role: string | null | undefined) {
  return {
    includeLeads: canAccessModule(role, 'leads'),
    includeTeam: canAccessModule(role, 'users'),
    includeContent: canManageContent(role),
  }
}

export { formatLeadTimelineSummary }
