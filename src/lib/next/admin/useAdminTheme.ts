'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  applyAdminThemeToDocument,
  readAdminThemePreference,
  resolveAdminTheme,
  writeAdminThemePreference,
  type AdminResolvedTheme,
  type AdminThemePreference,
} from '@/lib/next/admin/adminTheme'

/**
 * CMS theme preference (system | dark | light).
 * System resolves from the PC's local clock.
 */
export function useAdminTheme() {
  const [preference, setPreferenceState] = useState<AdminThemePreference>('system')
  const [resolved, setResolved] = useState<AdminResolvedTheme>('dark')

  const syncResolved = useCallback((pref: AdminThemePreference) => {
    const next = resolveAdminTheme(pref)
    setResolved(next)
    applyAdminThemeToDocument(pref, next)
  }, [])

  useEffect(() => {
    const pref = readAdminThemePreference()
    setPreferenceState(pref)
    syncResolved(pref)
  }, [syncResolved])

  useEffect(() => {
    if (preference !== 'system') return undefined

    const tick = () => syncResolved('system')
    const intervalId = window.setInterval(tick, 60_000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [preference, syncResolved])

  const setPreference = useCallback(
    (next: AdminThemePreference) => {
      setPreferenceState(next)
      writeAdminThemePreference(next)
      syncResolved(next)
    },
    [syncResolved]
  )

  return { preference, resolved, setPreference }
}
