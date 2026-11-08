'use client'

import { useCallback, useState, type ChangeEvent } from 'react'
import { Image, Search, X } from 'lucide-react'
import MediaGrid from '@/components/admin/MediaGrid'
import MediaUploader from '@/components/admin/MediaUploader'
import { nextMediaApi } from '@/lib/next/mediaBrowser'

type MediaTypeFilter = 'all' | 'image' | 'video' | 'svg' | 'other'

const TYPE_FILTERS: { id: MediaTypeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'image', label: 'Images' },
  { id: 'video', label: 'Videos' },
  { id: 'svg', label: 'SVG' },
  { id: 'other', label: 'Other' },
]

/**
 * Migrated Media Library — mirrors Vite AdminMediaPage.
 * Storage ops use Next `mediaBrowser` (authenticated anon client + existing RLS).
 */
export default function AdminMediaClient() {
  const [gridRefreshKey, setGridRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<MediaTypeFilter>('all')

  const handleUploadComplete = useCallback(() => {
    setGridRefreshKey((key) => key + 1)
  }, [])

  const handleSearchChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }, [])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
  }, [])

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Image size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Media Library</h1>
          <p className="admin-page-desc">
            Upload and manage images for your site. Assets are stored in Supabase Storage.
          </p>
        </div>
      </header>

      <MediaUploader onUploadComplete={handleUploadComplete} api={nextMediaApi} />

      <div className="admin-media-toolbar">
        <div className="admin-media-search">
          <Search size={18} strokeWidth={1.75} className="admin-media-search-icon" aria-hidden />
          <input
            type="search"
            className="admin-media-search-input"
            placeholder="Search by filename…"
            value={searchQuery}
            onChange={handleSearchChange}
            aria-label="Search media by filename"
          />
          {searchQuery ? (
            <button
              type="button"
              className="admin-media-search-clear"
              onClick={handleSearchClear}
              aria-label="Clear search"
            >
              <X size={16} strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="admin-media-type-filters" role="group" aria-label="Filter by file type">
          {TYPE_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`admin-media-type-filter${typeFilter === filter.id ? ' is-active' : ''}`}
              aria-pressed={typeFilter === filter.id}
              onClick={() => setTypeFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <MediaGrid
        refreshKey={gridRefreshKey}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        api={nextMediaApi}
      />
    </div>
  )
}
