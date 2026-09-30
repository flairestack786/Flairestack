'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'
import {
  LEAD_PRIORITY_OPTIONS,
  LEAD_STATUS_OPTIONS,
} from '@/lib/leadsFormat'

const LEAD_STATUSES = new Set(LEAD_STATUS_OPTIONS)
const LEAD_PRIORITIES = new Set(LEAD_PRIORITY_OPTIONS)

const LEAD_LIST_SELECT =
  'id, lead_number, full_name, email, phone, company, service_interest, service_id, message, status, priority, source, admin_notes, assigned_to, contacted_at, closed_at, created_at, updated_at'

const ADMIN_UPDATE_FIELDS = [
  'full_name',
  'email',
  'phone',
  'company',
  'service_interest',
  'service_id',
  'message',
  'status',
  'priority',
  'source',
  'admin_notes',
  'assigned_to',
  'metadata',
  'contacted_at',
  'closed_at',
] as const

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

function pickFields(fields: Record<string, unknown>, allowed: readonly string[]) {
  const payload: Record<string, unknown> = {}

  for (const key of allowed) {
    if (fields[key] === undefined) continue
    const value = fields[key]

    if (key === 'status') {
      const status = asTrimmedString(value)
      if (!LEAD_STATUSES.has(status as (typeof LEAD_STATUS_OPTIONS)[number])) {
        throw new Error(`Invalid lead status "${status}".`)
      }
      payload[key] = status
      continue
    }

    if (key === 'priority') {
      const priority = asTrimmedString(value)
      if (!LEAD_PRIORITIES.has(priority as (typeof LEAD_PRIORITY_OPTIONS)[number])) {
        throw new Error(`Invalid lead priority "${priority}".`)
      }
      payload[key] = priority
      continue
    }

    if (key === 'service_id' || key === 'assigned_to') {
      const id = asTrimmedString(value)
      payload[key] = id === '' ? null : id
      continue
    }

    if (key === 'metadata') {
      payload[key] =
        value && typeof value === 'object' && !Array.isArray(value) ? value : {}
      continue
    }

    if (key === 'contacted_at' || key === 'closed_at') {
      payload[key] = value || null
      continue
    }

    if (typeof value === 'string') {
      payload[key] = value.trim()
      continue
    }

    payload[key] = value
  }

  return payload
}

/**
 * List all leads for the CMS Leads module (newest first).
 * Same select/order as Vite `listLeads`.
 */
export async function listLeads() {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('leads')
    .select(LEAD_LIST_SELECT)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}

export async function updateLead(id: string, fields: Record<string, unknown>) {
  const supabase = getSupabaseBrowser()
  const payload = pickFields(fields, ADMIN_UPDATE_FIELDS)

  const { data, error } = await supabase
    .from('leads')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) {
    throw new Error('Lead update affected 0 rows (check RLS policies).')
  }
  return data as Record<string, unknown>
}

export async function setLeadStatus(id: string, status: string) {
  if (!LEAD_STATUSES.has(status as (typeof LEAD_STATUS_OPTIONS)[number])) {
    throw new Error(`Invalid lead status "${status}".`)
  }

  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) {
    throw new Error('Status update affected 0 rows (check RLS policies).')
  }
  return data as Record<string, unknown>
}

export async function setLeadPriority(id: string, priority: string) {
  if (!LEAD_PRIORITIES.has(priority as (typeof LEAD_PRIORITY_OPTIONS)[number])) {
    throw new Error(`Invalid lead priority "${priority}".`)
  }

  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('leads')
    .update({ priority })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  if (!data) {
    throw new Error('Priority update affected 0 rows (check RLS policies).')
  }
  return data as Record<string, unknown>
}

export async function listLeadTimeline(leadId: string) {
  const supabase = getSupabaseBrowser()
  const { data, error } = await supabase
    .from('lead_timeline')
    .select(
      'id, lead_id, event_type, title, body, old_value, new_value, metadata, created_by, created_at'
    )
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Record<string, unknown>[]
}

export async function addLeadTimelineNote(
  leadId: string,
  input: {
    event_type?: string
    title?: string
    body?: string
    metadata?: Record<string, unknown>
  } = {}
) {
  const body = asTrimmedString(input.body)
  if (!body) {
    throw new Error('Timeline note body is required.')
  }

  const supabase = getSupabaseBrowser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('lead_timeline')
    .insert({
      lead_id: leadId,
      event_type: input.event_type ?? 'note',
      title: asTrimmedString(input.title) || 'Note',
      body,
      metadata: input.metadata ?? {},
      created_by: user?.id ?? null,
    })
    .select()
    .single()

  if (error) throw error
  return data as Record<string, unknown>
}

/** API object for shared LeadDetailDrawer (Dashboard + Leads). */
export const nextLeadDrawerApi = {
  listLeadTimeline,
  updateLead,
  setLeadStatus,
  setLeadPriority,
  addLeadTimelineNote,
}
