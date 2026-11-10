'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, ExternalLink, Loader2, Newspaper, RefreshCw } from 'lucide-react'
import ImagePickerModal from '@/components/admin/ImagePickerModal'
import RichTextEditor from '@/components/admin/RichTextEditor'
import EditorField from '@/components/admin/home/EditorField'
import EditorSection from '@/components/admin/home/EditorSection'
import SaveBar from '@/components/admin/settings/SaveBar'
import SettingsImageField from '@/components/admin/settings/SettingsImageField'
import { pathToPickerImage } from '@/components/admin/settings/settingsImage'
import { useMediaPublicUrl } from '@/components/admin/MediaUrlContext'
import { useToast } from '@/components/common/ToastProvider'
import { canonicalizeContentSlug, publicBlogPath } from '@/lib/contentSlug'
import { getBlogPost, setBlogPostStatus, updateBlogPost } from '@/lib/next/blogsBrowser'
import { nextMediaApi } from '@/lib/next/mediaBrowser'

type ImagePickerTarget = 'featured_image_path' | 'og_image_path' | null

type BlogForm = {
  title: string
  slug: string
  excerpt: string
  body_html: string
  featured_image_path: string
  author_name: string
  category: string
  tags: string
  seo_title: string
  meta_description: string
  og_image_path: string
  canonical_url: string
  is_featured: boolean
  status: 'draft' | 'published'
  slugLocked: boolean
}

function emptyForm(): BlogForm {
  return {
    title: '',
    slug: '',
    excerpt: '',
    body_html: '',
    featured_image_path: '',
    author_name: '',
    category: '',
    tags: '',
    seo_title: '',
    meta_description: '',
    og_image_path: '',
    canonical_url: '',
    is_featured: false,
    status: 'draft',
    slugLocked: false,
  }
}

function rowToForm(row: Record<string, unknown>): BlogForm {
  const tags = Array.isArray(row.tags) ? row.tags.map(String).join(', ') : ''
  return {
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    excerpt: String(row.excerpt ?? ''),
    body_html: String(row.body_html ?? ''),
    featured_image_path: String(row.featured_image_path ?? ''),
    author_name: String(row.author_name ?? ''),
    category: String(row.category ?? ''),
    tags,
    seo_title: String(row.seo_title ?? ''),
    meta_description: String(row.meta_description ?? ''),
    og_image_path: String(row.og_image_path ?? ''),
    canonical_url: String(row.canonical_url ?? ''),
    is_featured: Boolean(row.is_featured),
    status: row.status === 'published' ? 'published' : 'draft',
    slugLocked: true,
  }
}

function formToPayload(form: BlogForm): Record<string, unknown> {
  return {
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt,
    body_html: form.body_html,
    featured_image_path: form.featured_image_path || null,
    author_name: form.author_name,
    category: form.category,
    tags: form.tags,
    seo_title: form.seo_title || null,
    meta_description: form.meta_description || null,
    og_image_path: form.og_image_path || null,
    canonical_url: form.canonical_url || null,
    is_featured: form.is_featured,
  }
}

function formsEqual(a: BlogForm, b: BlogForm) {
  return JSON.stringify(formToPayload(a)) === JSON.stringify(formToPayload(b))
}

export default function AdminBlogEditClient() {
  const params = useParams()
  const blogId = typeof params?.blogId === 'string' ? params.blogId : ''
  const toast = useToast() as { success: (m: string) => void; error: (m: string) => void }
  const { success, error } = toast
  const getPublicUrl = useMediaPublicUrl()

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [form, setForm] = useState<BlogForm>(emptyForm)
  const [saved, setSaved] = useState<BlogForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<ImagePickerTarget>(null)

  const dirty = useMemo(() => !formsEqual(form, saved), [form, saved])
  const publicPath = publicBlogPath(form.slug)
  const pickerSelectedImage = useMemo(() => {
    if (!pickerTarget) return null
    return pathToPickerImage(form[pickerTarget], getPublicUrl)
  }, [form, getPublicUrl, pickerTarget])

  const load = useCallback(async () => {
    if (!blogId) return
    setStatus('loading')
    setLoadError('')
    try {
      const row = await getBlogPost(blogId)
      const next = rowToForm(row)
      setForm(structuredClone(next))
      setSaved(structuredClone(next))
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load blog post.')
      setStatus('error')
    }
  }, [blogId])

  useEffect(() => {
    void load()
  }, [load])

  const updateField = <K extends keyof BlogForm>(key: K, value: BlogForm[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'title' && !current.slugLocked) {
        next.slug = canonicalizeContentSlug(String(value))
      }
      return next
    })
  }

  const handleSave = useCallback(async () => {
    if (!blogId || saving) return
    setSaving(true)
    try {
      const updated = await updateBlogPost(blogId, formToPayload(form))
      const next = rowToForm(updated)
      setForm(structuredClone(next))
      setSaved(structuredClone(next))
      success('Article saved')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to save article')
    } finally {
      setSaving(false)
    }
  }, [blogId, error, form, saving, success])

  const handleToggleStatus = useCallback(async () => {
    if (!blogId || statusBusy) return
    if (dirty) {
      error('Save your changes before publishing or unpublishing.')
      return
    }
    const nextStatus = form.status === 'published' ? 'draft' : 'published'
    setStatusBusy(true)
    try {
      const updated = await setBlogPostStatus(blogId, nextStatus)
      const next = rowToForm(updated)
      setForm(structuredClone(next))
      setSaved(structuredClone(next))
      success(nextStatus === 'published' ? 'Article published' : 'Article moved to draft')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setStatusBusy(false)
    }
  }, [blogId, dirty, error, form.status, statusBusy, success])

  if (status === 'loading') {
    return (
      <div className="admin-settings-state" role="status">
        <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
        <span>Loading article…</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="admin-settings-state admin-settings-state--error" role="alert">
        <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
        <span>{loadError}</span>
        <button type="button" className="admin-settings-retry" onClick={() => void load()}>
          <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="admin-page admin-services-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Newspaper size={22} strokeWidth={1.75} />
        </span>
        <div>
          <Link href="/admin/blogs" className="admin-back-link">
            <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
            Back to Blogs
          </Link>
          <h1 className="admin-page-title">{form.title || 'Untitled article'}</h1>
          <p className="admin-page-desc">
            Status:{' '}
            <span
              className={`admin-services-status${form.status === 'published' ? ' admin-services-status--published' : ' admin-services-status--draft'}`}
            >
              {form.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </p>
        </div>
        <div className="admin-page-header-actions">
          {form.status === 'published' && publicPath ? (
            <Link
              href={publicPath}
              className="admin-services-action-btn"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} strokeWidth={1.75} aria-hidden />
              Preview live
            </Link>
          ) : null}
          <button
            type="button"
            className="admin-services-action-btn"
            onClick={() => void handleToggleStatus()}
            disabled={statusBusy || dirty}
          >
            {statusBusy ? '…' : form.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </header>

      <div className="admin-settings-stack">
        <EditorSection
          panelId="blog-article"
          labelledBy="blog-article-heading"
          title="Article"
          description="Core content shown on the public Blog."
        >
          <EditorField id="blog-title" label="Title">
            <input
              id="blog-title"
              className="admin-settings-input"
              value={form.title}
              onChange={(event) => updateField('title', event.target.value)}
            />
          </EditorField>
          <EditorField
            id="blog-slug"
            label="URL slug"
            hint="Lowercase letters, numbers, hyphens."
          >
            <input
              id="blog-slug"
              className="admin-settings-input"
              value={form.slug}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  slug: canonicalizeContentSlug(event.target.value),
                  slugLocked: true,
                }))
              }}
            />
          </EditorField>
          <EditorField id="blog-excerpt" label="Excerpt">
            <textarea
              id="blog-excerpt"
              className="admin-settings-textarea"
              rows={3}
              value={form.excerpt}
              onChange={(event) => updateField('excerpt', event.target.value)}
            />
          </EditorField>
          <EditorField id="blog-body" label="Article body">
            <RichTextEditor
              value={form.body_html}
              onChange={(html) => updateField('body_html', html)}
              placeholder="Write the article…"
            />
          </EditorField>
        </EditorSection>

        <EditorSection
          panelId="blog-attribution"
          labelledBy="blog-attribution-heading"
          title="Attribution"
          description="Author, category, and tags."
        >
          <EditorField id="blog-author" label="Author name">
            <input
              id="blog-author"
              className="admin-settings-input"
              value={form.author_name}
              onChange={(event) => updateField('author_name', event.target.value)}
            />
          </EditorField>
          <EditorField id="blog-category" label="Category">
            <input
              id="blog-category"
              className="admin-settings-input"
              value={form.category}
              onChange={(event) => updateField('category', event.target.value)}
              placeholder="Engineering, Product, Insights…"
            />
          </EditorField>
          <EditorField id="blog-tags" label="Tags" hint="Comma-separated.">
            <input
              id="blog-tags"
              className="admin-settings-input"
              value={form.tags}
              onChange={(event) => updateField('tags', event.target.value)}
            />
          </EditorField>
          <EditorField id="blog-featured" label="Featured">
            <label className="admin-settings-checkbox" htmlFor="blog-featured">
              <input
                id="blog-featured"
                type="checkbox"
                checked={form.is_featured}
                onChange={(event) => updateField('is_featured', event.target.checked)}
              />
              Feature on the Blog listing
            </label>
          </EditorField>
        </EditorSection>

        <EditorSection
          panelId="blog-media"
          labelledBy="blog-media-heading"
          title="Media"
          description="Featured image from the Media Library."
        >
          <SettingsImageField
            label="Featured image"
            field="featured_image_path"
            path={form.featured_image_path}
            onChoose={(field) => setPickerTarget(field as ImagePickerTarget)}
            onRemove={(field) => updateField(field as 'featured_image_path', '')}
          />
        </EditorSection>

        <EditorSection
          panelId="blog-seo"
          labelledBy="blog-seo-heading"
          title="SEO"
          description="Optional overrides for search and social."
        >
          <EditorField id="blog-seo-title" label="SEO title">
            <input
              id="blog-seo-title"
              className="admin-settings-input"
              value={form.seo_title}
              onChange={(event) => updateField('seo_title', event.target.value)}
            />
          </EditorField>
          <EditorField id="blog-meta" label="Meta description">
            <textarea
              id="blog-meta"
              className="admin-settings-textarea"
              rows={3}
              value={form.meta_description}
              onChange={(event) => updateField('meta_description', event.target.value)}
            />
          </EditorField>
          <SettingsImageField
            label="Open Graph image"
            field="og_image_path"
            path={form.og_image_path}
            onChoose={(field) => setPickerTarget(field as ImagePickerTarget)}
            onRemove={(field) => updateField(field as 'og_image_path', '')}
          />
          <EditorField id="blog-canonical" label="Canonical URL (optional)">
            <input
              id="blog-canonical"
              className="admin-settings-input"
              value={form.canonical_url}
              onChange={(event) => updateField('canonical_url', event.target.value)}
              placeholder="https://flairestack.com/blog/…"
            />
          </EditorField>
        </EditorSection>
      </div>

      <SaveBar isDirty={dirty} isSaving={saving} onSave={() => void handleSave()} />

      <ImagePickerModal
        isOpen={Boolean(pickerTarget)}
        selectedImage={pickerSelectedImage}
        api={nextMediaApi}
        onClose={() => setPickerTarget(null)}
        onSelect={(image) => {
          const path = String(image?.path ?? '').trim()
          if (pickerTarget && path) updateField(pickerTarget, path)
          setPickerTarget(null)
        }}
      />
    </div>
  )
}
