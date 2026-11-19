import { NextResponse } from 'next/server'
import { authenticateAdministrator } from '../../../../../../../../server/middleware/requireAdministrator.mjs'
import { isUuid } from '@/lib/hiringNotificationEmail'
import { getSupabaseServiceRole } from '@/lib/next/supabaseServiceRole'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RESUME_BUCKET = 'job-resumes'
const SIGNED_URL_TTL_SECONDS = 60

type RouteContext = {
  params: Promise<{ applicationId: string }> | { applicationId: string }
}

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

/**
 * Administrator-only short-lived signed URL for a private resume object.
 *
 * GET ?disposition=attachment (default) → forces a download with the original filename.
 * GET ?disposition=inline → lets the browser display PDFs; DOCX can't render inline,
 * so it is still returned as a download (`inline: false`).
 *
 * Authentication + administrator authorization run before any database access.
 */
export async function GET(request: Request, context: RouteContext) {
  const auth = await authenticateAdministrator(request.headers.get('authorization'))
  if (!auth.ok) {
    return json(auth.body, auth.status)
  }

  const params = await Promise.resolve(context.params)
  const applicationId = String(params.applicationId ?? '').trim()
  if (!isUuid(applicationId)) {
    return json({ error: 'A valid application id is required.' }, 400)
  }

  const dispositionParam = new URL(request.url).searchParams.get('disposition') ?? 'attachment'
  if (dispositionParam !== 'attachment' && dispositionParam !== 'inline') {
    return json({ error: 'Invalid disposition.' }, 400)
  }

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, resume_storage_path, resume_original_filename, resume_mime_type')
    .eq('id', applicationId)
    .maybeSingle()

  if (error) {
    console.error('[admin/resume] lookup failed')
    return json({ error: 'Unable to load the resume.' }, 500)
  }
  if (!data?.resume_storage_path) {
    return json({ error: 'Resume not found.' }, 404)
  }

  const filename = String(data.resume_original_filename || 'resume.pdf')
  const canInline = dispositionParam === 'inline' && data.resume_mime_type === 'application/pdf'

  const { data: signed, error: signError } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(
      String(data.resume_storage_path),
      SIGNED_URL_TTL_SECONDS,
      canInline ? undefined : { download: filename }
    )

  if (signError || !signed?.signedUrl) {
    console.error('[admin/resume] signing failed')
    return json({ error: 'Unable to create download link.' }, 500)
  }

  return json(
    {
      ok: true,
      url: signed.signedUrl,
      filename,
      mimeType: data.resume_mime_type ?? null,
      inline: canInline,
      expiresInSeconds: SIGNED_URL_TTL_SECONDS,
    },
    200
  )
}
