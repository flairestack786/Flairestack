import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'

const PUBLIC_INSERT_FIELDS = [
  'full_name',
  'email',
  'phone',
  'company',
  'service_interest',
  'service_id',
  'message',
  'source',
  'metadata',
  'status',
  'priority',
] as const

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

/**
 * Public contact-form lead insert via anon client + RLS (`leads_public_insert`).
 * Mirrors Vite `createPublicLead` in `src/lib/leads.js` — does not return the row.
 * Never uses the service-role key.
 */
export async function createPublicLead(
  input: Partial<Record<string, unknown>> = {}
): Promise<void> {
  const payload: Record<string, unknown> = {
    full_name: asTrimmedString(input.full_name ?? input.fullName ?? ''),
    email: asTrimmedString(input.email ?? ''),
    phone: asTrimmedString(input.phone ?? ''),
    company: asTrimmedString(input.company ?? ''),
    service_interest: asTrimmedString(input.service_interest ?? input.service ?? ''),
    service_id: input.service_id ?? null,
    message: asTrimmedString(input.message ?? ''),
    source: asTrimmedString(input.source ?? 'contact_form') || 'contact_form',
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    status: 'new',
    priority: 'medium',
  }

  // Keep only allowlisted keys (parity with Vite pickFields).
  const filtered = Object.fromEntries(
    Object.entries(payload).filter(([key]) =>
      (PUBLIC_INSERT_FIELDS as readonly string[]).includes(key)
    )
  )

  if (!asTrimmedString(filtered.full_name)) {
    throw new Error('Full name is required.')
  }
  if (!asTrimmedString(filtered.email)) {
    throw new Error('Email is required.')
  }

  const supabase = getSupabaseBrowser()
  const { error } = await supabase.from('leads').insert(filtered)
  if (error) throw error
}
