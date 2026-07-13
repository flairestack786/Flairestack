import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, RefreshCw, Settings } from 'lucide-react'
import ImagePickerModal from '../../components/admin/ImagePickerModal'
import AnalyticsSettings from '../../components/admin/settings/AnalyticsSettings'
import BrandingSettings from '../../components/admin/settings/BrandingSettings'
import CompanySettings from '../../components/admin/settings/CompanySettings'
import ContactSettings from '../../components/admin/settings/ContactSettings'
import SaveBar from '../../components/admin/settings/SaveBar'
import SeoSettings from '../../components/admin/settings/SeoSettings'
import SettingsTabs from '../../components/admin/settings/SettingsTabs'
import SocialSettings from '../../components/admin/settings/SocialSettings'
import { formsAreEqual, settingsToForm } from '../../components/admin/settings/settingsForm'
import { pathToPickerImage } from '../../components/admin/settings/settingsImage'
import { useToast } from '../../components/common/ToastProvider'
import { getSiteSettings, saveSiteSettings } from '../../lib/siteSettings'

/** @type {readonly string[]} */
const IMAGE_FIELDS = ['logo_url', 'favicon_url', 'default_og_image']

export default function AdminSettingsPage() {
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState('company')
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [baseline, setBaseline] = useState(() => settingsToForm(null))
  const [form, setForm] = useState(() => settingsToForm(null))
  const [isSaving, setIsSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState(/** @type {string | null} */ (null))

  const isDirty = useMemo(() => !formsAreEqual(form, baseline), [form, baseline])

  const pickerSelectedImage = useMemo(() => {
    if (!pickerTarget) return null
    return pathToPickerImage(form[pickerTarget])
  }, [pickerTarget, form])

  const loadSettings = useCallback(async () => {
    setStatus('loading')
    setLoadError('')

    try {
      const data = await getSiteSettings()
      const nextForm = settingsToForm(data)
      setBaseline(nextForm)
      setForm(nextForm)
      setStatus('ready')
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load site settings.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleChange = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }, [])

  const handleChooseImage = useCallback((field) => {
    if (!IMAGE_FIELDS.includes(field)) return
    setPickerTarget(field)
    setPickerOpen(true)
  }, [])

  const handleRemoveImage = useCallback((field) => {
    if (!IMAGE_FIELDS.includes(field)) return
    handleChange(field, '')
  }, [handleChange])

  const handleImageSelect = useCallback(
    (image) => {
      if (!pickerTarget) return
      handleChange(pickerTarget, image.path)
    },
    [pickerTarget, handleChange]
  )

  const handlePickerClose = useCallback(() => {
    setPickerOpen(false)
    setPickerTarget(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!form.company_name.trim()) {
      error('Company name is required.')
      setActiveTab('company')
      return
    }

    setIsSaving(true)

    try {
      const updated = await saveSiteSettings(form)
      const nextForm = settingsToForm(updated)
      setBaseline(nextForm)
      setForm(nextForm)
      success('Settings saved successfully')
    } catch (err) {
      error(err?.message ?? 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }, [form, success, error])

  const panelId = `settings-panel-${activeTab}`
  const labelledBy = `settings-tab-${activeTab}`

  return (
    <div className="admin-page admin-settings-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Settings size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-desc">
            Site-wide preferences, branding, contact details, SEO defaults, and integrations.
          </p>
        </div>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading settings…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={loadSettings}>
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="admin-settings-panel">
            {activeTab === 'company' && (
              <CompanySettings
                values={form}
                onChange={handleChange}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}
            {activeTab === 'branding' && (
              <BrandingSettings
                values={form}
                onChooseImage={handleChooseImage}
                onRemoveImage={handleRemoveImage}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}
            {activeTab === 'contact' && (
              <ContactSettings
                values={form}
                onChange={handleChange}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}
            {activeTab === 'social' && (
              <SocialSettings
                values={form}
                onChange={handleChange}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}
            {activeTab === 'seo' && (
              <SeoSettings
                values={form}
                onChange={handleChange}
                onChooseImage={handleChooseImage}
                onRemoveImage={handleRemoveImage}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsSettings
                values={form}
                onChange={handleChange}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}
          </div>

          <SaveBar isDirty={isDirty} isSaving={isSaving} onSave={handleSave} />

          <ImagePickerModal
            isOpen={pickerOpen}
            selectedImage={pickerSelectedImage}
            onSelect={handleImageSelect}
            onClose={handlePickerClose}
          />
        </>
      )}
    </div>
  )
}
