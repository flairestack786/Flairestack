import { NextResponse } from 'next/server'
import { authenticateAdministrator } from '../../../../../../../../server/middleware/requireAdministrator.mjs'
import { getSupabaseServiceRole } from '@/lib/next/supabaseServiceRole'

export const runtime = 'nodejs'

const RESUME_BUCKET = 'job-resumes'

type RouteContext = {
  params: Promise<{ applicationId: string }> | { applicationId: string }
}

/**
 * Administrator-only short-lived signed URL for a private resume object.
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateAdministrator(request.headers.get('authorization'))
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status })
  }

  const params = await Promise.resolve(context.params)
  const applicationId = String(params.applicationId ?? '').trim()
  if (!applicationId) {
    return NextResponse.json({ error: 'Application id is required.' }, { status: 400 })
  }

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, resume_storage_path, resume_original_filename')
    .eq('id', applicationId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data?.resume_storage_path) {
    return NextResponse.json({ error: 'Resume not found.' }, { status: 404 })
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(String(data.resume_storage_path), 60, {
      download: String(data.resume_original_filename || 'resume.pdf'),
    })

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Unable to create download link.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    url: signed.signedUrl,
    filename: data.resume_original_filename,
  })
}
