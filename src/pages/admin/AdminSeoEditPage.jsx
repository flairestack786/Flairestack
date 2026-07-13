import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Copy, RotateCcw } from 'lucide-react'
import EditorField from '../../components/admin/home/EditorField'
import SaveBar from '../../components/admin/settings/SaveBar'
import SettingsImageField from '../../components/admin/settings/SettingsImageField'
import ImagePickerModal from '../../components/admin/ImagePickerModal'
import AdminSelect from '../../components/admin/AdminSelect'
import SeoCollapsibleSection from '../../components/admin/seo/SeoCollapsibleSection'
import SeoGooglePreview from '../../components/admin/seo/SeoGooglePreview'
import SeoSocialPreview from '../../components/admin/seo/SeoSocialPreview'
import SeoValidationPanel from '../../components/admin/seo/SeoValidationPanel'
import SeoScoreBadge from '../../components/admin/seo/SeoScoreBadge'
import SeoCharCounter from '../../components/admin/seo/SeoCharCounter'
import SeoKeywordChips from '../../components/admin/seo/SeoKeywordChips'
import SeoChecklistPanel from '../../components/admin/seo/SeoChecklistPanel'
import SeoInheritedBadge from '../../components/admin/seo/SeoInheritedBadge'
import { useToast } from '../../components/common/ToastProvider'
import { mediaPathToUrl, resolveInheritedSeo } from '../../lib/seoGlobals'
import { buildSeoChecklist } from '../../lib/seoCounters'
import {
  analyzeSeo,
  buildDuplicateCounts,
  getEffectiveDescription,
  getEffectiveTitle,
} from '../../lib/seoAnalysis'
import { fetchSeoEntity, saveSeoEntity, seoToForm } from '../../lib/seo'
import { invalidatePublicSeoCaches } from '../../lib/invalidatePublicSeoCaches'

const ROBOTS_OPTIONS = [
  { value: 'index,follow', label: 'index, follow' },
  { value: 'noindex,follow', label: 'noindex, follow' },
  { value: 'index,nofollow', label: 'index, nofollow' },
  { value: 'noindex,nofollow', label: 'noindex, nofollow' },
]

const TWITTER_CARD_OPTIONS = [
  { value: 'summary_large_image', label: 'Summary large image' },
  { value: 'summary', label: 'Summary' },
]

const DIRTY_KEYS = [
  'meta_title',
  'meta_description',
  'page_description',
  'canonical_url',
  'robots',
  'og_title',
  'og_description',
  'og_type',
  'og_image_path',
  'twitter_card',
  'twitter_title',
  'twitter_description',
  'twitter_image_path',
  'structured_data_text',
  'focus_keyword',
  'related_keywords',
  'status',
]

/**
 * @param {Record<string, unknown>} a
 * @param {Record<string, unknown>} b
 */
function formsEqual(a, b) {
  return DIRTY_KEYS.every((key) => {
    if (key === 'related_keywords') {
      return JSON.stringify(a?.[key] ?? []) === JSON.stringify(b?.[key] ?? [])
    }
    return String(a?.[key] ?? '') === String(b?.[key] ?? '')
  })
}

/**
 * @param {Record<string, unknown>} form
 */
function withImagePaths(form) {
  const extensions =
    form.extensions && typeof form.extensions === 'object' && !Array.isArray(form.extensions)
      ? /** @type {Record<string, unknown>} */ (form.extensions)
      : {}
  return {
    ...form,
    og_image_path: String(form.og_image_path ?? extensions.og_image_path ?? ''),
    twitter_image_path: String(form.twitter_image_path ?? extensions.twitter_image_path ?? ''),
    related_keywords: Array.isArray(form.related_keywords) ? form.related_keywords : [],
  }
}

/**
 * @param {string} label
 * @param {React.ReactNode} field
 * @param {boolean} [inherited]
 * @param {string} [source]
 */
function FieldLabel({ children, inherited, source }) {
  return (
    <span className="admin-seo-field-label-row">
      <span>{children}</span>
      <SeoInheritedBadge inherited={inherited} source={source} />
    </span>
  )
}

export default function AdminSeoEditPage() {
  const { entityType, entityId } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const normalizedType = entityType === 'service' ? 'service' : 'page'

  const [status, setStatus] = useState(/** @type {'loading' | 'ready' | 'error'} */ ('loading'))
  const [loadError, setLoadError] = useState('')
  const [label, setLabel] = useState('')
  const [routePath, setRoutePath] = useState('/')
  const [baseline, setBaseline] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [form, setForm] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [peers, setPeers] = useState(/** @type {Record<string, unknown>[]} */ ([]))
  const [globals, setGlobals] = useState(/** @type {Record<string, unknown> | null} */ (null))
  const [isSaving, setIsSaving] = useState(false)
  const [saveState, setSaveState] = useState(/** @type {'idle' | 'saved'} */ ('idle'))
  const [pickerField, setPickerField] = useState(
    /** @type {null | 'og_image_path' | 'twitter_image_path'} */ (null)
  )
  const [copyFromKey, setCopyFromKey] = useState('')

  const load = useCallback(async () => {
    if (!entityId) return
    setStatus('loading')
    setLoadError('')
    try {
      const data = await fetchSeoEntity(normalizedType, entityId)
      const nextForm = withImagePaths(data.form)
      setLabel(data.label)
      setRoutePath(data.route_path)
      setBaseline(nextForm)
      setForm(nextForm)
      setPeers(data.peers ?? [])
      setGlobals(data.globals ?? null)
      setStatus('ready')
      setSaveState('idle')
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load SEO record.')
      setStatus('error')
    }
  }, [entityId, normalizedType])

  useEffect(() => {
    load()
  }, [load])

  const isDirty = Boolean(form && baseline && !formsEqual(form, baseline))

  useEffect(() => {
    const onBeforeUnload = (event) => {
      if (!isDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const inheritance = useMemo(() => {
    if (!form || !globals) {
      return { resolved: form ?? {}, inherited: /** @type {Record<string, boolean>} */ ({}) }
    }
    return resolveInheritedSeo(form, globals, {
      pageTitle: label,
      routePath,
      entityType: normalizedType,
    })
  }, [form, globals, label, routePath, normalizedType])

  const displayForm = useMemo(() => {
    if (!form) return null
    const r = inheritance.resolved
    return {
      ...form,
      meta_title: String(form.meta_title || r.meta_title || ''),
      meta_description: String(form.meta_description || r.meta_description || ''),
      canonical_url: String(form.canonical_url || r.canonical_url || ''),
      robots: String(form.robots || r.robots || 'index,follow'),
      og_title: String(form.og_title || r.og_title || ''),
      og_description: String(form.og_description || r.og_description || ''),
      og_image_path: String(form.og_image_path || r.og_image_path || ''),
      twitter_title: String(form.twitter_title || r.twitter_title || ''),
      twitter_description: String(form.twitter_description || r.twitter_description || ''),
      twitter_image_path: String(form.twitter_image_path || r.twitter_image_path || ''),
    }
  }, [form, inheritance])

  const liveAnalysis = useMemo(() => {
    if (!displayForm) return null
    const peerForms = peers
      .filter((row) => !(row.entity_type === normalizedType && row.entity_id === entityId))
      .map((row) => row.effectiveForm ?? row.form)
    const titleCounts = buildDuplicateCounts([...peerForms, displayForm], (row) =>
      getEffectiveTitle(row)
    )
    const descCounts = buildDuplicateCounts([...peerForms, displayForm], (row) =>
      getEffectiveDescription(row)
    )
    return analyzeSeo(displayForm, {
      duplicates: {
        titles: titleCounts,
        descriptions: descCounts,
        selfTitle: getEffectiveTitle(displayForm),
        selfDescription: getEffectiveDescription(displayForm),
      },
    })
  }, [displayForm, peers, normalizedType, entityId])

  const checklist = useMemo(() => {
    if (!displayForm) return null
    return buildSeoChecklist(
      {
        ...displayForm,
        structured_data_text: form?.structured_data_text,
        structured_data: form?.structured_data,
        focus_keyword: form?.focus_keyword,
      },
      inheritance.inherited
    )
  }, [displayForm, form, inheritance.inherited])

  const setField = useCallback((field, value) => {
    setForm((current) => (current ? { ...current, [field]: value } : current))
    setSaveState('idle')
  }, [])

  const previewImageUrl = useMemo(() => {
    const path = String(
      displayForm?.og_image_path || displayForm?.twitter_image_path || ''
    )
    return mediaPathToUrl(path)
  }, [displayForm?.og_image_path, displayForm?.twitter_image_path])

  const twitterPreviewImageUrl = useMemo(() => {
    const path = String(
      displayForm?.twitter_image_path || displayForm?.og_image_path || ''
    )
    return mediaPathToUrl(path)
  }, [displayForm?.twitter_image_path, displayForm?.og_image_path])

  const siteHost = useMemo(() => {
    const base = String(globals?.canonical_base_url || 'flairestack.com')
    try {
      return new URL(base.startsWith('http') ? base : `https://${base}`).hostname
    } catch {
      return 'flairestack.com'
    }
  }, [globals])

  const handleSave = useCallback(async () => {
    if (!form || !entityId) return
    setIsSaving(true)
    try {
      const extensions = {
        ...(typeof form.extensions === 'object' && form.extensions && !Array.isArray(form.extensions)
          ? form.extensions
          : {}),
        og_image_path: String(form.og_image_path || '') || null,
        twitter_image_path: String(form.twitter_image_path || '') || null,
      }

      const result = await saveSeoEntity(normalizedType, entityId, {
        ...form,
        extensions,
      })
      const nextForm = withImagePaths(
        seoToForm(result.seo, {
          entity_type: normalizedType,
          page_id: normalizedType === 'page' ? entityId : undefined,
          service_id: normalizedType === 'service' ? entityId : undefined,
          label,
          route_path: routePath,
        })
      )
      setForm(nextForm)
      setBaseline(nextForm)
      setSaveState('saved')
      invalidatePublicSeoCaches({
        entityType: normalizedType,
        slug: String(form.slug || ''),
      })
      success('SEO settings saved. Public site will use the updated values immediately.')
    } catch (err) {
      error(err?.message ?? 'Failed to save SEO settings.')
    } finally {
      setIsSaving(false)
    }
  }, [form, entityId, normalizedType, label, routePath, success, error])

  const handleResetGlobals = useCallback(() => {
    if (!form) return
    setForm({
      ...form,
      meta_title: '',
      meta_description: '',
      canonical_url: '',
      // Keep NOT NULL columns; inheritance does not apply to og_type / twitter_card.
      robots: String(form.robots || 'index,follow'),
      og_title: '',
      og_description: '',
      og_image_path: '',
      og_type: String(form.og_type || 'website').trim() || 'website',
      twitter_title: '',
      twitter_description: '',
      twitter_image_path: '',
      twitter_card: String(form.twitter_card || 'summary_large_image').trim() || 'summary_large_image',
    })
    success('Fields cleared — values will inherit from global SEO on save.')
  }, [form, success])

  const handleCopyFrom = useCallback(() => {
    if (!copyFromKey || !form) return
    const peer = peers.find((row) => String(row.key) === copyFromKey)
    if (!peer?.form) {
      error('Could not find that page to copy from.')
      return
    }
    const source = withImagePaths(peer.form)
    setForm({
      ...form,
      meta_title: source.meta_title,
      meta_description: source.meta_description,
      page_description: source.page_description,
      canonical_url: '',
      robots: source.robots,
      og_title: source.og_title,
      og_description: source.og_description,
      og_type: String(source.og_type || 'website').trim() || 'website',
      twitter_card:
        String(source.twitter_card || 'summary_large_image').trim() || 'summary_large_image',
      og_image_path: source.og_image_path,
      twitter_title: source.twitter_title,
      twitter_description: source.twitter_description,
      twitter_image_path: source.twitter_image_path,
      structured_data_text: source.structured_data_text,
      focus_keyword: source.focus_keyword,
      related_keywords: source.related_keywords,
    })
    success(`Copied SEO settings from ${peer.label}.`)
  }, [copyFromKey, form, peers, success, error])

  const inherited = inheritance.inherited

  return (
    <div className="admin-page admin-seo-page admin-seo-edit-page">
      <header className="admin-page-header admin-seo-edit-header">
        <button
          type="button"
          className="admin-settings-retry"
          onClick={() => navigate('/admin/seo')}
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back
        </button>
        <div className="admin-seo-edit-heading">
          <p className="admin-dashboard-welcome-kicker">SEO editor</p>
          <h1 className="admin-page-title">{label || 'SEO'}</h1>
          <p className="admin-page-desc">{routePath}</p>
          <p className="admin-seo-save-indicator" aria-live="polite">
            {isSaving
              ? 'Saving…'
              : isDirty
                ? 'Unsaved changes'
                : saveState === 'saved'
                  ? 'All changes saved'
                  : 'Up to date'}
          </p>
        </div>
        {liveAnalysis && (
          <div className="admin-seo-edit-score">
            <SeoScoreBadge score={liveAnalysis.score} size="lg" />
            <span className={`admin-seo-band admin-seo-band--${liveAnalysis.band}`}>
              {liveAnalysis.band.replace('-', ' ')}
            </span>
          </div>
        )}
      </header>

      {status === 'loading' && (
        <div className="admin-seo-skeleton" aria-busy="true">
          <div className="admin-seo-skeleton-block" />
          <div className="admin-seo-skeleton-block" />
          <div className="admin-seo-skeleton-block admin-seo-skeleton-block--short" />
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={load}>
            Retry
          </button>
          <Link to="/admin/seo" className="admin-settings-retry">
            Back to SEO
          </Link>
        </div>
      )}

      {status === 'ready' && form && displayForm && (
        <>
          <div className="admin-seo-edit-actions">
            <label className="admin-seo-copy-from">
              <span className="sr-only">Copy SEO from another page</span>
              <AdminSelect
                id="seo-copy-from"
                aria-label="Copy SEO from"
                value={copyFromKey}
                onChange={setCopyFromKey}
                options={[
                  { value: '', label: 'Copy SEO from…' },
                  ...peers
                    .filter((row) => !(row.entity_type === normalizedType && row.entity_id === entityId))
                    .map((row) => ({
                      value: String(row.key),
                      label: `${row.label} (${row.entity_type})`,
                    })),
                ]}
              />
            </label>
            <button type="button" className="admin-settings-retry" onClick={handleCopyFrom} disabled={!copyFromKey}>
              <Copy size={15} strokeWidth={1.75} />
              Copy
            </button>
            <button type="button" className="admin-settings-retry" onClick={handleResetGlobals}>
              <RotateCcw size={15} strokeWidth={1.75} />
              Reset to global defaults
            </button>
          </div>

          <div className="admin-seo-edit-layout">
            <div className="admin-seo-edit-main">
              <SeoCollapsibleSection
                title="Basic SEO"
                description="Meta tags, page excerpt, keywords, canonical, and robots."
                defaultOpen
              >
                <EditorField id="seo-focus-keyword" label="Primary focus keyword">
                  <input
                    id="seo-focus-keyword"
                    className="admin-settings-input"
                    value={String(form.focus_keyword ?? '')}
                    onChange={(event) => setField('focus_keyword', event.target.value)}
                    placeholder="e.g. cloud migration"
                  />
                </EditorField>

                <EditorField id="seo-related-keywords" label="Related keywords">
                  <SeoKeywordChips
                    value={Array.isArray(form.related_keywords) ? form.related_keywords : []}
                    onChange={(next) => setField('related_keywords', next)}
                  />
                </EditorField>

                <EditorField
                  id="seo-page-description"
                  label={
                    <FieldLabel>
                      Page description / excerpt
                    </FieldLabel>
                  }
                >
                  <textarea
                    id="seo-page-description"
                    className="admin-settings-textarea"
                    rows={5}
                    value={String(form.page_description ?? '')}
                    onChange={(event) => setField('page_description', event.target.value)}
                    placeholder="Longer public excerpt — separate from meta description"
                  />
                  <SeoCharCounter value={String(form.page_description ?? '')} field="page_description" />
                  <p className="admin-users-field-hint">
                    Optional public excerpt and SEO fallback. Does not replace meta description.
                  </p>
                </EditorField>

                <EditorField
                  id="seo-meta-title"
                  label={
                    <FieldLabel inherited={inherited.meta_title && !form.meta_title}>
                      Meta title
                    </FieldLabel>
                  }
                >
                  <input
                    id="seo-meta-title"
                    className="admin-settings-input"
                    value={String(form.meta_title ?? '')}
                    onChange={(event) => setField('meta_title', event.target.value)}
                    placeholder={inherited.meta_title ? String(displayForm.meta_title) : ''}
                  />
                  <SeoCharCounter
                    value={String(form.meta_title || displayForm.meta_title || '')}
                    field="meta_title"
                  />
                </EditorField>

                <EditorField
                  id="seo-meta-description"
                  label={
                    <FieldLabel
                      inherited={inherited.meta_description && !form.meta_description}
                      source={inherited.meta_description ? inheritance.inherited && form.page_description ? 'page_description' : 'global' : 'global'}
                    >
                      Meta description
                    </FieldLabel>
                  }
                >
                  <textarea
                    id="seo-meta-description"
                    className="admin-settings-textarea"
                    rows={4}
                    value={String(form.meta_description ?? '')}
                    onChange={(event) => setField('meta_description', event.target.value)}
                    placeholder={
                      inherited.meta_description ? String(displayForm.meta_description) : ''
                    }
                  />
                  <SeoCharCounter
                    value={String(form.meta_description || displayForm.meta_description || '')}
                    field="meta_description"
                  />
                </EditorField>

                <EditorField
                  id="seo-canonical"
                  label={
                    <FieldLabel inherited={inherited.canonical_url && !form.canonical_url}>
                      Canonical URL
                    </FieldLabel>
                  }
                >
                  <input
                    id="seo-canonical"
                    className="admin-settings-input"
                    value={String(form.canonical_url ?? '')}
                    onChange={(event) => setField('canonical_url', event.target.value)}
                    placeholder={String(displayForm.canonical_url || 'https://flairestack.com/...')}
                  />
                </EditorField>

                <EditorField
                  id="seo-robots"
                  label={
                    <FieldLabel inherited={inherited.robots && !form.robots}>
                      Robots
                    </FieldLabel>
                  }
                >
                  <AdminSelect
                    id="seo-robots"
                    aria-label="Robots"
                    value={String(form.robots || displayForm.robots || 'index,follow')}
                    onChange={(value) => setField('robots', value)}
                    options={ROBOTS_OPTIONS}
                  />
                </EditorField>
              </SeoCollapsibleSection>

              <SeoCollapsibleSection
                title="Open Graph"
                description="Facebook, LinkedIn, and other social share cards."
                defaultOpen={false}
              >
                <EditorField
                  id="seo-og-title"
                  label={
                    <FieldLabel inherited={inherited.og_title && !form.og_title}>
                      OG title
                    </FieldLabel>
                  }
                >
                  <input
                    id="seo-og-title"
                    className="admin-settings-input"
                    value={String(form.og_title ?? '')}
                    onChange={(event) => setField('og_title', event.target.value)}
                    placeholder={String(displayForm.og_title || '')}
                  />
                  <SeoCharCounter
                    value={String(form.og_title || displayForm.og_title || '')}
                    field="og_title"
                  />
                </EditorField>
                <EditorField
                  id="seo-og-description"
                  label={
                    <FieldLabel inherited={inherited.og_description && !form.og_description}>
                      OG description
                    </FieldLabel>
                  }
                >
                  <textarea
                    id="seo-og-description"
                    className="admin-settings-textarea"
                    rows={3}
                    value={String(form.og_description ?? '')}
                    onChange={(event) => setField('og_description', event.target.value)}
                    placeholder={String(displayForm.og_description || '')}
                  />
                  <SeoCharCounter
                    value={String(form.og_description || displayForm.og_description || '')}
                    field="og_description"
                  />
                </EditorField>
                <EditorField id="seo-og-type" label="OG type">
                  <input
                    id="seo-og-type"
                    className="admin-settings-input"
                    value={String(form.og_type ?? 'website')}
                    onChange={(event) => setField('og_type', event.target.value)}
                    onBlur={(event) => {
                      const next = event.target.value.trim() || 'website'
                      setField('og_type', next)
                    }}
                  />
                </EditorField>
                <div className="admin-seo-image-field-wrap">
                  <SeoInheritedBadge inherited={inherited.og_image_path && !form.og_image_path} />
                  <SettingsImageField
                    label="OG image"
                    field="og_image_path"
                    path={String(form.og_image_path || displayForm.og_image_path || '')}
                    onChoose={() => setPickerField('og_image_path')}
                    onRemove={() => setField('og_image_path', '')}
                  />
                </div>
              </SeoCollapsibleSection>

              <SeoCollapsibleSection
                title="Twitter Card"
                description="X / Twitter share presentation."
                defaultOpen={false}
              >
                <EditorField id="seo-twitter-card" label="Card type">
                  <AdminSelect
                    id="seo-twitter-card"
                    aria-label="Twitter card type"
                    value={String(form.twitter_card ?? 'summary_large_image')}
                    onChange={(value) => setField('twitter_card', value)}
                    options={TWITTER_CARD_OPTIONS}
                  />
                </EditorField>
                <EditorField
                  id="seo-twitter-title"
                  label={
                    <FieldLabel inherited={inherited.twitter_title && !form.twitter_title}>
                      Twitter title
                    </FieldLabel>
                  }
                >
                  <input
                    id="seo-twitter-title"
                    className="admin-settings-input"
                    value={String(form.twitter_title ?? '')}
                    onChange={(event) => setField('twitter_title', event.target.value)}
                    placeholder={String(displayForm.twitter_title || '')}
                  />
                  <SeoCharCounter
                    value={String(form.twitter_title || displayForm.twitter_title || '')}
                    field="twitter_title"
                  />
                </EditorField>
                <EditorField
                  id="seo-twitter-description"
                  label={
                    <FieldLabel
                      inherited={inherited.twitter_description && !form.twitter_description}
                    >
                      Twitter description
                    </FieldLabel>
                  }
                >
                  <textarea
                    id="seo-twitter-description"
                    className="admin-settings-textarea"
                    rows={3}
                    value={String(form.twitter_description ?? '')}
                    onChange={(event) => setField('twitter_description', event.target.value)}
                    placeholder={String(displayForm.twitter_description || '')}
                  />
                  <SeoCharCounter
                    value={String(
                      form.twitter_description || displayForm.twitter_description || ''
                    )}
                    field="twitter_description"
                  />
                </EditorField>
                <div className="admin-seo-image-field-wrap">
                  <SeoInheritedBadge
                    inherited={inherited.twitter_image_path && !form.twitter_image_path}
                  />
                  <SettingsImageField
                    label="Twitter image"
                    field="twitter_image_path"
                    path={String(form.twitter_image_path || displayForm.twitter_image_path || '')}
                    onChoose={() => setPickerField('twitter_image_path')}
                    onRemove={() => setField('twitter_image_path', '')}
                  />
                </div>
              </SeoCollapsibleSection>

              <SeoCollapsibleSection
                title="JSON-LD structured data"
                description="Schema.org markup for rich results. Future AI can write into extensions without schema changes."
                defaultOpen={false}
              >
                <EditorField id="seo-jsonld" label="Structured data (JSON)">
                  <textarea
                    id="seo-jsonld"
                    className="admin-settings-textarea admin-seo-jsonld"
                    rows={12}
                    spellCheck={false}
                    value={String(form.structured_data_text ?? '')}
                    onChange={(event) => setField('structured_data_text', event.target.value)}
                    placeholder={`{\n  "@context": "https://schema.org",\n  "@type": "Organization",\n  "name": "FlaireStack"\n}`}
                  />
                </EditorField>
              </SeoCollapsibleSection>
            </div>

            <aside className="admin-seo-edit-aside">
              {liveAnalysis && checklist && (
                <SeoChecklistPanel checklist={checklist} score={liveAnalysis.score} />
              )}
              {liveAnalysis && (
                <div className="admin-seo-aside-score">
                  <p className="admin-seo-preview-kicker">Live SEO score</p>
                  <SeoScoreBadge score={liveAnalysis.score} size="lg" />
                </div>
              )}
              <SeoGooglePreview seo={displayForm} fallbackPath={routePath} />
              <SeoSocialPreview
                seo={displayForm}
                imageUrl={previewImageUrl}
                siteName={siteHost}
                variant="facebook"
              />
              <SeoSocialPreview
                seo={displayForm}
                imageUrl={previewImageUrl}
                siteName={siteHost}
                variant="linkedin"
              />
              <SeoSocialPreview
                seo={displayForm}
                imageUrl={twitterPreviewImageUrl}
                siteName={siteHost}
                variant="twitter"
              />
              <SeoValidationPanel analysis={liveAnalysis} />
            </aside>
          </div>

          <SaveBar isDirty={isDirty} isSaving={isSaving} onSave={handleSave} />

          <ImagePickerModal
            isOpen={Boolean(pickerField)}
            onClose={() => setPickerField(null)}
            onSelect={(image) => {
              if (!pickerField) return
              setField(pickerField, image?.path || '')
              setPickerField(null)
            }}
          />
        </>
      )}
    </div>
  )
}
