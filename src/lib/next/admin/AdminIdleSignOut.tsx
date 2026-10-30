'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useNextAuth } from '@/lib/next/NextAuthProvider'

const IDLE_MS = 6 * 60 * 1000
const WARN_BEFORE_MS = 60 * 1000
const WARN_AT_MS = IDLE_MS - WARN_BEFORE_MS

/**
 * Signs the CMS session out after 6 minutes without activity.
 * Shows a prompt after 5 minutes so the user can stay signed in.
 */
export default function AdminIdleSignOut() {
  const { session, signOut } = useNextAuth()
  const router = useRouter()
  const lastActivity = useRef(Date.now())
  const warningOpen = useRef(false)
  const signingOut = useRef(false)
  const [warning, setWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(60)
  const stayButtonRef = useRef<HTMLButtonElement | null>(null)

  const staySignedIn = useCallback(() => {
    lastActivity.current = Date.now()
    warningOpen.current = false
    setWarning(false)
  }, [])

  useEffect(() => {
    if (!session) return undefined

    const markActive = () => {
      if (warningOpen.current || signingOut.current) return
      lastActivity.current = Date.now()
    }

    let lastMove = 0
    const markMove = () => {
      if (warningOpen.current || signingOut.current) return
      const now = Date.now()
      if (now - lastMove < 5000) return
      lastMove = now
      lastActivity.current = now
    }

    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel'] as const
    events.forEach((name) =>
      window.addEventListener(name, markActive, { capture: true, passive: true })
    )
    window.addEventListener('mousemove', markMove, { capture: true, passive: true })

    const tick = () => {
      if (signingOut.current) return
      const idle = Date.now() - lastActivity.current
      if (idle >= IDLE_MS) {
        signingOut.current = true
        warningOpen.current = false
        setWarning(false)
        void (async () => {
          try {
            await signOut()
          } catch {
            // Leave the CMS even if the auth request fails.
          }
          router.replace('/admin/login')
        })()
        return
      }

      if (idle >= WARN_AT_MS) {
        warningOpen.current = true
        setWarning(true)
        setSecondsLeft(Math.max(1, Math.ceil((IDLE_MS - idle) / 1000)))
        return
      }

      if (warningOpen.current) {
        warningOpen.current = false
        setWarning(false)
      }
    }

    const intervalId = window.setInterval(tick, 1000)
    return () => {
      events.forEach((name) => window.removeEventListener(name, markActive, { capture: true }))
      window.removeEventListener('mousemove', markMove, { capture: true })
      window.clearInterval(intervalId)
    }
  }, [session, signOut, router])

  useEffect(() => {
    if (!warning) return
    stayButtonRef.current?.focus()
  }, [warning])

  if (!warning) return null

  return (
    <div
      className="admin-confirm-dialog admin-idle-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="admin-idle-title"
      aria-describedby="admin-idle-desc"
    >
      <div className="admin-confirm-dialog-panel">
        <h2 id="admin-idle-title" className="admin-confirm-dialog-title">
          Still there?
        </h2>
        <p id="admin-idle-desc" className="admin-confirm-dialog-message">
          You will be signed out in {secondsLeft} {secondsLeft === 1 ? 'second' : 'seconds'} because
          there has been no activity. Stay signed in to keep this session.
        </p>
        <div className="admin-confirm-dialog-actions">
          <button
            ref={stayButtonRef}
            type="button"
            className="admin-confirm-dialog-btn admin-idle-dialog-stay"
            onClick={staySignedIn}
          >
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  )
}
