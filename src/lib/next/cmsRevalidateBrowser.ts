'use client'

import { getSupabaseBrowser } from '@/lib/next/supabaseBrowser'

/**
 * Ask `/api/cms/revalidate` to refresh specific public routes after a CMS save.
 * Non-fatal: pages still converge through ISR (`revalidate = 60`) if this fails.
 */
export async function requestPublicRevalidation(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  try {
    const supabase = getSupabaseBrowser()
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return

    await fetch('/api/cms/revalidate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paths }),
    })
  } catch {
    // Non-fatal
  }
}
