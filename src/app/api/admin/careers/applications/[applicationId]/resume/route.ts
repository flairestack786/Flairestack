import { NextResponse } from 'next/server'
import { authenticateAdministrator } from '../../../../../../../../server/middleware/requireAdministrator.mjs'
import { isUuid } from '@/lib/hiringNotificationEmail'
import {
  RESUME_BUCKET,
  RESUME_SIGNED_URL_TTL_SECONDS,
  parseResumeMode,
  planResumeAccess,
} from '@/lib/resumeAccess'
import { getSupabaseServiceRole } from '@/lib/next/supabaseServiceRole'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ applicationId: string }> | { applicationId: string }
}

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

/**
 * Administrator-only short-lived signed URL for a private resume object.
 *
 *   GET ?mode=view      → inline link for formats a browser can render (PDF). DOCX can't be
 *                         previewed, so the link is a download and `previewable` is false.
 *   GET ?mode=download  → attachment link carrying the original filename (default).
 *
 * Order matters: authenticate + authorize → validate ids/mode → read the row → validate the
 * stored object path → sign. Errors are generic; nothing from the database or storage
 * is echoed back.
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

  const mode = parseResumeMode(new URL(request.url).searchParams.get('mode'))
  if (!mode) {
    return json({ error: 'Invalid mode. Use "view" or "download".' }, 400)
  }

  const supabase = getSupabaseServiceRole()
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, resume_storage_path, resume_original_filename')
    .eq('id', applicationId)
    .maybeSingle()

  if (error) {
    console.error('[admin/resume] lookup failed')
    return json({ error: 'Unable to load the resume.' }, 500)
  }
  if (!data?.resume_storage_path) {
    return json({ error: 'Resume not found.' }, 404)
  }

  const plan = planResumeAccess({
    mode,
    storagePath: data.resume_storage_path,
    originalFilename: data.resume_original_filename,
  })
  if (!plan.ok) {
    console.error('[admin/resume] rejected malformed storage path')
    return json({ error: plan.error }, plan.status)
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(RESUME_BUCKET)
    .createSignedUrl(
      String(data.resume_storage_path),
      RESUME_SIGNED_URL_TTL_SECONDS,
      plan.signOptions
    )

  if (signError || !signed?.signedUrl) {
    console.error('[admin/resume] signing failed')
    return json({ error: 'The resume file is unavailable.' }, 404)
  }

  return json(
    {
      ok: true,
      url: signed.signedUrl,
      mode: plan.mode,
      filename: plan.filename,
      mimeType: plan.mimeType,
      disposition: plan.disposition,
      inline: plan.inline,
      previewable: plan.previewable,
      expiresInSeconds: RESUME_SIGNED_URL_TTL_SECONDS,
    },
    200
  )
}
