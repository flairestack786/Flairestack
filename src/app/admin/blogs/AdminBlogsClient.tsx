'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ExternalLink,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/components/common/ToastProvider'
import {
  createBlogPost,
  deleteBlogPost,
  listBlogPosts,
  setBlogPostStatus,
} from '@/lib/next/blogsBrowser'
import { publicBlogPath } from '@/lib/contentSlug'

function formatDate(value: unknown) {
  if (!value) return '—'
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminBlogsClient() {
  const router = useRouter()
  const toast = useToast() as { success: (m: string) => void; error: (m: string) => void }
  const { success, error } = toast
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [busyId, setBusyId] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')

  const load = useCallback(async () => {
    setStatus('loading')
    setLoadError('')
    try {
      setRows(await listBlogPosts())
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load blog posts.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      const rowStatus = row.status === 'published' ? 'published' : 'draft'
      if (statusFilter !== 'all' && rowStatus !== statusFilter) return false
      if (!q) return true
      const haystack = [
        row.title,
        row.author_name,
        row.category,
        row.slug,
        row.excerpt,
      ]
        .map((part) => String(part ?? '').toLowerCase())
        .join(' ')
      return haystack.includes(q)
    })
  }, [query, rows, statusFilter])

  const handleCreate = useCallback(async () => {
    if (isCreating) return
    setIsCreating(true)
    try {
      const row = await createBlogPost({ title: 'Untitled article' })
      success('Blog post created')
      router.push(`/admin/blogs/${String(row.id)}`)
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to create blog post')
    } finally {
      setIsCreating(false)
    }
  }, [error, isCreating, router, success])

  const handleDelete = useCallback(
    async (row: Record<string, unknown>) => {
      const title = String(row.title ?? 'this post')
      if (!window.confirm(`Delete "${title}" permanently? This cannot be undone.`)) return
      setBusyId(String(row.id))
      try {
        await deleteBlogPost(String(row.id))
        setRows((current) => current.filter((item) => item.id !== row.id))
        success('Blog post deleted')
      } catch (err) {
        error(err instanceof Error ? err.message : 'Failed to delete blog post')
      } finally {
        setBusyId('')
      }
    },
    [error, success]
  )

  const handleToggleStatus = useCallback(
    async (row: Record<string, unknown>) => {
      if (busyId) return
      const nextStatus = row.status === 'published' ? 'draft' : 'published'
      setBusyId(String(row.id))
      // #region agent log
      fetch('http://127.0.0.1:7579/ingest/4918a319-e90a-4720-9b4a-3cee86de2e01',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e489f1'},body:JSON.stringify({sessionId:'e489f1',runId:'post-fix',hypothesisId:'A',location:'AdminBlogsClient.tsx:handleToggleStatus',message:'List page publish button clicked',data:{id:String(row.id),fromStatus:row.status,nextStatus},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      try {
        await setBlogPostStatus(String(row.id), nextStatus)
        setRows(await listBlogPosts())
        success(nextStatus === 'published' ? 'Article published' : 'Article moved to draft')
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7579/ingest/4918a319-e90a-4720-9b4a-3cee86de2e01',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e489f1'},body:JSON.stringify({sessionId:'e489f1',runId:'post-fix',hypothesisId:'A',location:'AdminBlogsClient.tsx:handleToggleStatus:error',message:'List page publish failed',data:{id:String(row.id),nextStatus,errorMessage:err instanceof Error?err.message:String(err)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        error(err instanceof Error ? err.message : 'Failed to update status')
      } finally {
        setBusyId('')
      }
    },
    [busyId, error, success]
  )

  return (
    <div className="admin-page admin-services-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Newspaper size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Blogs</h1>
          <p className="admin-page-desc">
            Create and publish FlaireStack articles for the public Blog experience.
          </p>
        </div>
        <button
          type="button"
          className="admin-services-create-btn"
          onClick={() => void handleCreate()}
          disabled={isCreating}
        >
          <Plus size={16} strokeWidth={1.75} aria-hidden />
          {isCreating ? 'Creating…' : 'Create Article'}
        </button>
      </header>

      {status === 'ready' && (
        <div className="admin-content-filters">
          <label className="admin-content-filter">
            <span className="sr-only">Search articles</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, author, category…"
              className="admin-settings-input"
            />
          </label>
          <label className="admin-content-filter admin-content-filter--status">
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | 'draft' | 'published')
              }
              className="admin-settings-input"
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
      )}

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading blog posts…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={() => void load()}>
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="admin-services-table-wrap">
          {filtered.length === 0 ? (
            <div className="admin-page-placeholder">
              <p>
                {rows.length === 0
                  ? 'No blog posts yet. Create your first article to get started.'
                  : 'No articles match your search or filter.'}
              </p>
            </div>
          ) : (
            <table className="admin-services-table">
              <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col">Author</th>
                  <th scope="col">Category</th>
                  <th scope="col">Status</th>
                  <th scope="col">Published</th>
                  <th scope="col">Updated</th>
                  <th scope="col" className="admin-services-table-actions-col">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const id = String(row.id)
                  const title = String(row.title ?? 'Untitled')
                  const isPublished = row.status === 'published'
                  const isBusy = busyId === id
                  const path = publicBlogPath(row.slug)

                  return (
                    <tr key={id}>
                      <td>
                        <Link href={`/admin/blogs/${id}`} className="admin-services-table-link">
                          {title}
                        </Link>
                        {row.is_featured ? (
                          <span className="admin-content-chip">Featured</span>
                        ) : null}
                      </td>
                      <td>{String(row.author_name ?? '') || '—'}</td>
                      <td>{String(row.category ?? '') || '—'}</td>
                      <td>
                        <span
                          className={`admin-services-status${isPublished ? ' admin-services-status--published' : ' admin-services-status--draft'}`}
                        >
                          {isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td>{formatDate(row.published_at)}</td>
                      <td>{formatDate(row.updated_at)}</td>
                      <td className="admin-services-table-actions">
                        <Link
                          href={`/admin/blogs/${id}`}
                          className="admin-services-action-btn"
                          aria-label={`Edit ${title}`}
                        >
                          <Pencil size={15} strokeWidth={1.75} aria-hidden />
                          Edit
                        </Link>
                        {isPublished && path ? (
                          <Link
                            href={path}
                            className="admin-services-action-btn"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink size={15} strokeWidth={1.75} aria-hidden />
                            View
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          className="admin-services-action-btn"
                          onClick={() => void handleToggleStatus(row)}
                          disabled={isBusy}
                        >
                          {isBusy ? '…' : isPublished ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          className="admin-services-action-btn admin-services-action-btn--danger"
                          onClick={() => void handleDelete(row)}
                          disabled={isBusy}
                        >
                          <Trash2 size={15} strokeWidth={1.75} aria-hidden />
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
