'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AlertCircle, Loader2, Search } from 'lucide-react'
import SeoOverview from '@/components/admin/seo/SeoOverview'
import { fetchSeoDashboard } from '@/lib/next/seoBrowser'
import { useNextAuth } from '@/lib/next/NextAuthProvider'

export default function AdminSeoClient() {
  const { cmsRole } = useNextAuth()
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [entities, setEntities] = useState<Record<string, unknown>[]>([])
  const [health, setHealth] = useState<Record<string, unknown>>({})
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async ({ soft = false }: { soft?: boolean } = {}) => {
    if (soft) setRefreshing(true)
    else {
      setStatus('loading')
      setLoadError('')
    }

    try {
      const snapshot = await fetchSeoDashboard()
      setEntities(snapshot.entities as Record<string, unknown>[])
      setHealth(snapshot.health as Record<string, unknown>)
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load SEO dashboard.')
      setStatus('error')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="admin-page admin-seo-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Search size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">SEO</h1>
          <p className="admin-page-desc">
            Monitor SEO health and manage meta tags, social cards, and structured data.
          </p>
        </div>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading SEO dashboard…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={() => void load()}>
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <SeoOverview
          health={health}
          entities={entities}
          onRefresh={() => void load({ soft: true })}
          isRefreshing={refreshing}
          LinkComponent={({ href, className, children }) => (
            <Link href={href} className={className}>
              {children}
            </Link>
          )}
          cmsRole={cmsRole}
        />
      )}
    </div>
  )
}
