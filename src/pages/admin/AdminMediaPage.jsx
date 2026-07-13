import React, { useCallback, useState } from 'react'
import { Image, Search, X } from 'lucide-react'
import MediaGrid from '../../components/admin/MediaGrid'
import MediaUploader from '../../components/admin/MediaUploader'

export default function AdminMediaPage() {
  const [gridRefreshKey, setGridRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const handleUploadComplete = useCallback(() => {
    setGridRefreshKey((key) => key + 1)
  }, [])

  const handleSearchChange = useCallback((e) => {
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

      <MediaUploader onUploadComplete={handleUploadComplete} />

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
        {searchQuery && (
          <button
            type="button"
            className="admin-media-search-clear"
            onClick={handleSearchClear}
            aria-label="Clear search"
          >
            <X size={16} strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>

      <MediaGrid refreshKey={gridRefreshKey} searchQuery={searchQuery} />
    </div>
  )
}
