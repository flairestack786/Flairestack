import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, Globe } from 'lucide-react'
import EditorField from '../../components/admin/home/EditorField'
import SaveBar from '../../components/admin/settings/SaveBar'
import SettingsImageField from '../../components/admin/settings/SettingsImageField'
import ImagePickerModal from '../../components/admin/ImagePickerModal'
import AdminSelect from '../../components/admin/AdminSelect'
import SeoCollapsibleSection from '../../components/admin/seo/SeoCollapsibleSection'
import { useToast } from '../../components/common/ToastProvider'
import { useAuth } from '../../context/AuthContext'
import { canManageGlobalSeo } from '../../lib/cmsPermissions'
import {
  fetchGlobalSeoSettings,
  saveGlobalSeoSettings,
} from '../../lib/seoGlobals'
import { invalidatePublicSeoCaches } from '../../lib/invalidatePublicSeoCaches'

const ROBOTS_OPTIONS = [
  { value: 'index,follow', label: 'index, follow' },
  { value: 'noindex,follow', label: 'noindex, follow' },
  { value: 'index,nofollow', label: 'index, nofollow' },
  { value: 'noindex,nofollow', label: 'noindex, nofollow' },
]

const IMAGE_FIELDS = new Set(['default_og_image', 'default_twitter_image', 'logo_url'])

/**
 * @param {Record<string, string>} a
 * @param {Record<string, string>} b
 */
function formsEqual(a, b) {
  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  return keys.every((key) => String(a[key] ?? '') === String(b[key] ?? ''))
}

export default function AdminSeoGlobalPage() {
  const { cmsRole } = useAuth()
  const { success, error } = useToast()
  const allowed = canManageGlobalSeo(cmsRole)

  const [status, setStatus] = useState(/** @type {'loading' | 'ready' | 'error'} */ ('loading'))
  const [loadError, setLoadError] = useState('')
  const [baseline, setBaseline] = useState(/** @type {Record<string, string> | null} */ (null))
  const [form, setForm] = useState(/** @type {Record<string, string> | null} */ (null))
  const [isSaving, setIsSaving] = useState(false)
  const [pickerField, setPickerField] = useState(/** @type {string | null} */ (null))

  const load = useCallback(async () => {
    setStatus('loading')
    setLoadError('')
    try {
      const { form: next } = await fetchGlobalSeoSettings()
      setForm(next)
      setBaseline(next)
      setStatus('ready')
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load global SEO settings.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (allowed) load()
  }, [allowed, load])

  useEffect(() => {
    if (!form || !baseline) return undefined
    const dirty = !formsEqual(form, baseline)
    const onBeforeUnload = (event) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [form, baseline])

  const isDirty = Boolean(form && baseline && !formsEqual(form, baseline))

  const setField = useCallback((field, value) => {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }, [])

  const handleSave = useCallback(async () => {
    if (!form) return
    setIsSaving(true)
    try {
      const { form: next } = await saveGlobalSeoSettings(form)
      setForm(next)
      setBaseline(next)
      invalidatePublicSeoCaches()
      success('Global SEO settings saved.')
    } catch (err) {
      error(err?.message ?? 'Failed to save global SEO settings.')
    } finally {
      setIsSaving(false)
    }
  }, [form, success, error])

  const templateHint = useMemo(
    () =>
      'Variables: {{Page Title}}, {{Service Name}}, {{Company Name}}, {{Website Name}}, {{Primary Keyword}}',
    []
  )

  if (!allowed) {
    return <Navigate to="/admin/forbidden" replace />
  }

  return (
    <div className="admin-page admin-seo-page admin-seo-global-page">
      <header className="admin-page-header admin-seo-edit-header">
        <Link to="/admin/seo" className="admin-settings-retry">
          <ArrowLeft size={16} strokeWidth={1.75} />
          Back to SEO
        </Link>
        <div className="admin-seo-edit-heading">
          <p className="admin-dashboard-welcome-kicker">Site-wide defaults</p>
          <h1 className="admin-page-title">Global SEO Settings</h1>
          <p className="admin-page-desc">
            Defaults, templates, verification, and analytics. Empty page fields inherit these values.
          </p>
        </div>
        <span className="admin-page-icon" aria-hidden>
          <Globe size={22} strokeWidth={1.75} />
        </span>
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
        </div>
      )}

      {status === 'ready' && form && (
        <>
          <div className="admin-seo-edit-main admin-seo-global-main">
            <SeoCollapsibleSection title="Brand & defaults" description="Website identity and default meta." defaultOpen>
              <EditorField id="gseo-website-name" label="Website name">
                <input
                  id="gseo-website-name"
                  className="admin-settings-input"
                  value={form.website_name}
                  onChange={(e) => setField('website_name', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-company-name" label="Company name">
                <input
                  id="gseo-company-name"
                  className="admin-settings-input"
                  value={form.company_name}
                  onChange={(e) => setField('company_name', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-default-title" label="Default meta title">
                <input
                  id="gseo-default-title"
                  className="admin-settings-input"
                  value={form.default_meta_title}
                  onChange={(e) => setField('default_meta_title', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-default-desc" label="Default meta description">
                <textarea
                  id="gseo-default-desc"
                  className="admin-settings-textarea"
                  rows={4}
                  value={form.default_meta_description}
                  onChange={(e) => setField('default_meta_description', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-canonical-base" label="Canonical base URL">
                <input
                  id="gseo-canonical-base"
                  className="admin-settings-input"
                  placeholder="https://flairestack.com"
                  value={form.canonical_base_url}
                  onChange={(e) => setField('canonical_base_url', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-robots" label="Default robots">
                <AdminSelect
                  id="gseo-robots"
                  aria-label="Default robots"
                  value={form.default_robots || 'index,follow'}
                  onChange={(value) => setField('default_robots', value)}
                  options={ROBOTS_OPTIONS}
                />
              </EditorField>
              <SettingsImageField
                label="Default Open Graph image"
                field="default_og_image"
                path={form.default_og_image}
                onChoose={() => setPickerField('default_og_image')}
                onRemove={() => setField('default_og_image', '')}
              />
              <SettingsImageField
                label="Default Twitter image"
                field="default_twitter_image"
                path={form.default_twitter_image}
                onChoose={() => setPickerField('default_twitter_image')}
                onRemove={() => setField('default_twitter_image', '')}
              />
              <SettingsImageField
                label="Company logo"
                field="logo_url"
                path={form.logo_url}
                onChoose={() => setPickerField('logo_url')}
                onRemove={() => setField('logo_url', '')}
              />
            </SeoCollapsibleSection>

            <SeoCollapsibleSection
              title="Verification & analytics"
              description="Search Console, Bing, GA, GTM, Clarity, and Meta Pixel."
              defaultOpen={false}
            >
              <EditorField id="gseo-gsc" label="Google Search Console verification">
                <input
                  id="gseo-gsc"
                  className="admin-settings-input"
                  value={form.gsc_verification}
                  onChange={(e) => setField('gsc_verification', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-bing" label="Bing Webmaster verification">
                <input
                  id="gseo-bing"
                  className="admin-settings-input"
                  value={form.bing_verification}
                  onChange={(e) => setField('bing_verification', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-ga" label="Google Analytics ID">
                <input
                  id="gseo-ga"
                  className="admin-settings-input"
                  placeholder="G-XXXXXXXX"
                  value={form.google_analytics_id}
                  onChange={(e) => setField('google_analytics_id', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-gtm" label="Google Tag Manager ID">
                <input
                  id="gseo-gtm"
                  className="admin-settings-input"
                  placeholder="GTM-XXXXXXX"
                  value={form.google_tag_manager_id}
                  onChange={(e) => setField('google_tag_manager_id', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-clarity" label="Microsoft Clarity ID">
                <input
                  id="gseo-clarity"
                  className="admin-settings-input"
                  value={form.microsoft_clarity_id}
                  onChange={(e) => setField('microsoft_clarity_id', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-pixel" label="Facebook Pixel ID">
                <input
                  id="gseo-pixel"
                  className="admin-settings-input"
                  value={form.meta_pixel_id}
                  onChange={(e) => setField('meta_pixel_id', e.target.value)}
                />
              </EditorField>
            </SeoCollapsibleSection>

            <SeoCollapsibleSection
              title="Default social links"
              description="Organization social profiles used in JSON-LD and footers."
              defaultOpen={false}
            >
              {[
                ['facebook_url', 'Facebook'],
                ['instagram_url', 'Instagram'],
                ['linkedin_url', 'LinkedIn'],
                ['x_url', 'X / Twitter'],
                ['youtube_url', 'YouTube'],
                ['github_url', 'GitHub'],
              ].map(([field, label]) => (
                <EditorField key={field} id={`gseo-${field}`} label={label}>
                  <input
                    id={`gseo-${field}`}
                    className="admin-settings-input"
                    value={form[field] ?? ''}
                    onChange={(e) => setField(field, e.target.value)}
                  />
                </EditorField>
              ))}
            </SeoCollapsibleSection>

            <SeoCollapsibleSection
              title="Organization & Website JSON-LD"
              description="Site-wide structured data fallback when a page has none."
              defaultOpen={false}
            >
              <EditorField id="gseo-org-jsonld" label="Organization JSON-LD">
                <textarea
                  id="gseo-org-jsonld"
                  className="admin-settings-textarea admin-seo-jsonld"
                  rows={10}
                  spellCheck={false}
                  value={form.organization_jsonld_text}
                  onChange={(e) => setField('organization_jsonld_text', e.target.value)}
                />
              </EditorField>
              <EditorField id="gseo-web-jsonld" label="Website JSON-LD">
                <textarea
                  id="gseo-web-jsonld"
                  className="admin-settings-textarea admin-seo-jsonld"
                  rows={10}
                  spellCheck={false}
                  value={form.website_jsonld_text}
                  onChange={(e) => setField('website_jsonld_text', e.target.value)}
                />
              </EditorField>
            </SeoCollapsibleSection>

            <SeoCollapsibleSection
              title="SEO templates"
              description="Used for new pages and as inheritance fallbacks when defaults are empty."
              defaultOpen
            >
              <p className="admin-users-field-hint">{templateHint}</p>
              {[
                ['template_meta_title', 'Meta title template'],
                ['template_meta_description', 'Meta description template'],
                ['template_og_title', 'Open Graph title template'],
                ['template_og_description', 'Open Graph description template'],
                ['template_twitter_title', 'Twitter title template'],
                ['template_twitter_description', 'Twitter description template'],
              ].map(([field, label]) => (
                <EditorField key={field} id={`gseo-${field}`} label={label}>
                  <input
                    id={`gseo-${field}`}
                    className="admin-settings-input"
                    value={form[field] ?? ''}
                    onChange={(e) => setField(field, e.target.value)}
                  />
                </EditorField>
              ))}
            </SeoCollapsibleSection>
          </div>

          <SaveBar isDirty={isDirty} isSaving={isSaving} onSave={handleSave} />

          <ImagePickerModal
            isOpen={Boolean(pickerField)}
            onClose={() => setPickerField(null)}
            onSelect={(image) => {
              if (!pickerField || !IMAGE_FIELDS.has(pickerField)) return
              setField(pickerField, image?.path || '')
              setPickerField(null)
            }}
          />
        </>
      )}
    </div>
  )
}
