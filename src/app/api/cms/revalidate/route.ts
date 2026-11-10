import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { canManageContent, normalizeCmsRole } from '@/lib/cmsPermissions'

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

    if (profileError || !profile || profile.status !== 'active') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!canManageContent(normalizeCmsRole(String(profile.role ?? '')))) {
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

    // #region agent log
    fetch('http://127.0.0.1:7579/ingest/4918a319-e90a-4720-9b4a-3cee86de2e01',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e489f1'},body:JSON.stringify({sessionId:'e489f1',runId:'post-fix',hypothesisId:'E',location:'api/cms/revalidate/route.ts',message:'CMS revalidate invoked',data:{paths,userId:userData.user.id},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    return NextResponse.json({ ok: true, revalidated: paths })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Revalidation failed' },
      { status: 500 }
    )
  }
}
