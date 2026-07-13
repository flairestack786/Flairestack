import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useToast } from '../common/ToastProvider'

const COPIED_DURATION_MS = 2000

/**
 * Copy-to-clipboard button with per-instance success feedback.
 * @param {{
 *   publicUrl: string,
 *   label: string,
 * }} props
 */
function MediaCopyUrlButton({ publicUrl, label }) {
  const { success, error } = useToast()
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    },
    []
  )

  const handleClick = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      success('URL copied')

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        setCopied(false)
        timeoutRef.current = null
      }, COPIED_DURATION_MS)
    } catch {
      error('Clipboard copy failed')
    }
  }, [publicUrl, success, error])

  return (
    <button
      type="button"
      className={[
        'admin-media-grid-action',
        copied ? 'admin-media-grid-action--copied' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={handleClick}
      aria-label={copied ? 'URL copied' : `Copy URL for ${label}`}
      title={copied ? 'Copied!' : 'Copy URL'}
    >
      <span className="admin-media-copy-icon" key={copied ? 'check' : 'copy'} aria-hidden>
        {copied ? (
          <Check size={16} strokeWidth={1.75} />
        ) : (
          <Copy size={16} strokeWidth={1.75} />
        )}
      </span>
    </button>
  )
}

export default memo(MediaCopyUrlButton)
