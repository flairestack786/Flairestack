import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canManageContent, resolveCmsAccess } from '@/lib/cmsPermissions'

export const runtime = 'nodejs'

function getAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
  if (!url || !anonKey) {
    throw new Error('Missing Supabase public env for CMS revalidation.')
  }
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

/**
 * Authenticated CMS revalidation for public content paths after publish.
 * POST { paths: string[] } with Authorization: Bearer <user access token>
 */
export async function POST(request: Request) {
  try {
    const auth = request.headers.get('authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getAnonClient()
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', userData.user.id)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Missing profile, inactive status or unknown role → 403; never a role fallback.
    const access = resolveCmsAccess(profile)
    if (!access.ok || !canManageContent(access.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => null)) as { paths?: unknown } | null
    const paths = Array.isArray(body?.paths)
      ? body.paths
          .map((path) => String(path ?? '').trim())
          .filter((path) => path.startsWith('/') && !path.startsWith('//'))
      : []

    if (paths.length === 0) {
      return NextResponse.json({ error: 'No valid paths' }, { status: 400 })
    }

    for (const path of paths) {
      revalidatePath(path)
    }

    return NextResponse.json({ ok: true, revalidated: paths })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Revalidation failed' },
      { status: 500 }
    )
  }
}
