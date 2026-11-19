'use client'

import { useCallback, useRef, useState } from 'react'
import { useToast } from '@/components/common/ToastProvider'
import { openResume } from '@/lib/next/jobApplicationsBrowser'
import { ResumeAccessError, createExclusiveRunner } from '@/lib/resumeClient'

export type ResumeMode = 'view' | 'download'

export type ResumeRequest = {
  applicationId: string
  mode: ResumeMode
  mimeType?: string | null
  /** Human label for the failure notice, e.g. the applicant's name. */
  label?: string
}

export type ResumeFailure = ResumeRequest & { message: string; retryable: boolean }

/**
 * Shared View/Download behaviour for both Applicants pages.
 *
 *  - `run` / `retry` MUST be called straight from a click handler: the View tab is opened
 *    synchronously, before any await, so popup blockers allow it.
 *  - Only one resume action runs at a time, so repeated clicks never duplicate requests.
 *  - `retry` goes through exactly the same path as a first click, so it always requests a
 *    completely fresh signed link; nothing from a previous attempt is kept.
 *  - Nothing about the link is stored here; only the failure message and what to retry.
 */
export function useResumeActions() {
  const toast = useToast() as { info: (message: string) => void }
  const runner = useRef(createExclusiveRunner())
  const [busy, setBusy] = useState('')
  const [failure, setFailure] = useState<ResumeFailure | null>(null)

  const run = useCallback(
    (request: ResumeRequest): void => {
      void runner.current.run(async () => {
        setBusy(`${request.applicationId}:${request.mode}`)
        try {
          const result = await openResume(request.applicationId, request.mode, {
            mimeType: request.mimeType,
          })
          setFailure(null)
          if (result.previewUnavailable) {
            toast.info(
              'Word documents can’t be previewed in the browser, so the original file was downloaded.'
            )
          }
        } catch (err) {
          const known = err instanceof ResumeAccessError ? err : null
          setFailure({
            ...request,
            message: known?.message || 'Unable to open the resume. Please try again.',
            retryable: known ? known.retryable : true,
          })
        } finally {
          setBusy('')
        }
      })
    },
    [toast]
  )

  const retry = useCallback((): void => {
    if (failure?.retryable) run(failure)
  }, [failure, run])

  const dismiss = useCallback((): void => setFailure(null), [])

  return { busy, failure, run, retry, dismiss }
}
