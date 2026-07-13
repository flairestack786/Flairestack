import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Home, Loader2, RefreshCw } from 'lucide-react'
import ImagePickerModal from '../../components/admin/ImagePickerModal'
import ContactEditor from '../../components/admin/home/ContactEditor'
import HeroEditor from '../../components/admin/home/HeroEditor'
import HomeSectionTabs from '../../components/admin/home/HomeSectionTabs'
import ProcessEditor from '../../components/admin/home/ProcessEditor'
import ServicesHeaderEditor from '../../components/admin/home/ServicesHeaderEditor'
import StatsEditor from '../../components/admin/home/StatsEditor'
import TechnologiesEditor from '../../components/admin/home/TechnologiesEditor'
import WhyChooseEditor from '../../components/admin/home/WhyChooseEditor'
import {
  formToSectionPayloads,
  formsAreEqual,
  homeDataToForm,
  updateSectionConfig,
  updateSectionField,
} from '../../components/admin/home/homePageForm'
import SaveBar from '../../components/admin/settings/SaveBar'
import { pathToPickerImage } from '../../components/admin/settings/settingsImage'
import { useToast } from '../../components/common/ToastProvider'
import { clearHomePageCache } from '../../hooks/useHomePage'
import { getHomePageWithSections, saveHomeSections } from '../../lib/homePage'

/**
 * @typedef {{ sectionKey: string, configKey: string } | null} ImagePickerTarget
 */

export default function AdminHomePage() {
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState('hero')
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [baseline, setBaseline] = useState(() => homeDataToForm({ id: '' }, []))
  const [form, setForm] = useState(() => homeDataToForm({ id: '' }, []))
  const [isSaving, setIsSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState(/** @type {ImagePickerTarget} */ (null))

  const isDirty = useMemo(() => !formsAreEqual(form, baseline), [form, baseline])

  const pickerSelectedImage = useMemo(() => {
    if (!pickerTarget) return null
    const section = form.sections[pickerTarget.sectionKey]
    const config = section?.config ?? {}
    const path = config[pickerTarget.configKey]
    return pathToPickerImage(typeof path === 'string' ? path : '')
  }, [pickerTarget, form])

  const loadHomePage = useCallback(async () => {
    setStatus('loading')
    setLoadError('')

    try {
      const { page, sections } = await getHomePageWithSections()
      const nextForm = homeDataToForm(page, sections)
      setBaseline(nextForm)
      setForm(nextForm)
      setStatus('ready')
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load home page content.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadHomePage()
  }, [loadHomePage])

  const handleSectionFieldChange = useCallback((sectionKey, field, value) => {
    setForm((current) => ({
      ...current,
      sections: updateSectionField(current.sections, sectionKey, field, value),
    }))
  }, [])

  const handleSectionConfigChange = useCallback((sectionKey, configKey, value) => {
    setForm((current) => ({
      ...current,
      sections: updateSectionConfig(current.sections, sectionKey, configKey, value),
    }))
  }, [])

  const handleChooseImage = useCallback((sectionKey, configKey) => {
    setPickerTarget({ sectionKey, configKey })
    setPickerOpen(true)
  }, [])

  const handleRemoveImage = useCallback(
    (sectionKey, configKey) => {
      handleSectionConfigChange(sectionKey, configKey, '')
    },
    [handleSectionConfigChange]
  )

  const handleImageSelect = useCallback(
    (image) => {
      if (!pickerTarget) return
      handleSectionConfigChange(pickerTarget.sectionKey, pickerTarget.configKey, image.path)
    },
    [pickerTarget, handleSectionConfigChange]
  )

  const handlePickerClose = useCallback(() => {
    setPickerOpen(false)
    setPickerTarget(null)
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)

    try {
      const payloads = formToSectionPayloads(form)
      const updated = await saveHomeSections(payloads)
      const nextForm = homeDataToForm({ id: form.pageId }, updated)
      setBaseline(nextForm)
      setForm(nextForm)
      clearHomePageCache()
      success('Home page saved successfully')
    } catch (err) {
      error(err?.message ?? 'Failed to save home page')
    } finally {
      setIsSaving(false)
    }
  }, [form, success, error])

  const panelId = `home-panel-${activeTab}`
  const labelledBy = `home-tab-${activeTab}`
  const activeSection = form.sections[activeTab]

  return (
    <div className="admin-page admin-settings-page admin-home-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Home size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">Home</h1>
          <p className="admin-page-desc">
            Manage hero content, homepage sections, and structured section data.
          </p>
        </div>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading home page…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={loadHomePage}>
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && activeSection && (
        <>
          <HomeSectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="admin-settings-panel">
            {activeTab === 'hero' && (
              <HeroEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('hero', field, value)}
                onChooseImage={(configKey) => handleChooseImage('hero', configKey)}
                onRemoveImage={(configKey) => handleRemoveImage('hero', configKey)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'services' && (
              <ServicesHeaderEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('services', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('services', key, value)}
                onChooseImage={(configKey) => handleChooseImage('services', configKey)}
                onRemoveImage={(configKey) => handleRemoveImage('services', configKey)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'why-choose' && (
              <WhyChooseEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('why-choose', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('why-choose', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'stats' && (
              <StatsEditor
                section={activeSection}
                onConfigChange={(key, value) => handleSectionConfigChange('stats', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'process' && (
              <ProcessEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('process', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('process', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'technologies' && (
              <TechnologiesEditor
                section={activeSection}
                onFieldChange={(field, value) =>
                  handleSectionFieldChange('technologies', field, value)
                }
                onConfigChange={(key, value) => handleSectionConfigChange('technologies', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'contact' && (
              <ContactEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('contact', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('contact', key, value)}
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
