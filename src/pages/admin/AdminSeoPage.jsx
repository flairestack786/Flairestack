import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2, Search } from 'lucide-react'
import SeoOverview from '../../components/admin/seo/SeoOverview'
import { fetchSeoDashboard } from '../../lib/seo'

export default function AdminSeoPage() {
  const [status, setStatus] = useState(/** @type {'loading' | 'ready' | 'error'} */ ('loading'))
  const [loadError, setLoadError] = useState('')
  const [entities, setEntities] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [health, setHealth] = useState(/** @type {Record<string, unknown>} */ ({}))
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async ({ soft = false } = {}) => {
    if (soft) setRefreshing(true)
    else {
      setStatus('loading')
      setLoadError('')
    }

    try {
      const snapshot = await fetchSeoDashboard()
      setEntities(snapshot.entities)
      setHealth(snapshot.health)
      setStatus('ready')
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load SEO dashboard.')
      setStatus('error')
    } finally {
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
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
          <button type="button" className="admin-settings-retry" onClick={() => load()}>
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <SeoOverview
          health={health}
          entities={entities}
          onRefresh={() => load({ soft: true })}
          isRefreshing={refreshing}
        />
      )}
    </div>
  )
}
