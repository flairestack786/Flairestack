import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Info, Loader2, RefreshCw } from 'lucide-react'
import ImagePickerModal from '../../components/admin/ImagePickerModal'
import AboutSectionTabs from '../../components/admin/about/AboutSectionTabs'
import CompanyStoryEditor from '../../components/admin/about/CompanyStoryEditor'
import ContactEditor from '../../components/admin/about/ContactEditor'
import HeroEditor from '../../components/admin/about/HeroEditor'
import MissionEditor from '../../components/admin/about/MissionEditor'
import TeamEditor from '../../components/admin/about/TeamEditor'
import ValuesEditor from '../../components/admin/about/ValuesEditor'
import VisionEditor from '../../components/admin/about/VisionEditor'
import {
  aboutDataToForm,
  formToSectionPayloads,
  formsAreEqual,
  updateSectionConfig,
  updateSectionField,
  updateTeamMemberImage,
} from '../../components/admin/about/aboutPageForm'
import SaveBar from '../../components/admin/settings/SaveBar'
import { pathToPickerImage } from '../../components/admin/settings/settingsImage'
import { useToast } from '../../components/common/ToastProvider'
import { getAboutPageWithSections, saveAboutSections } from '../../lib/aboutPage'

/**
 * @typedef {{ type: 'member', memberIndex: number } | null} ImagePickerTarget
 */

export default function AdminAboutPage() {
  const { success, error } = useToast()
  const [activeTab, setActiveTab] = useState('hero')
  const [status, setStatus] = useState('loading')
  const [loadError, setLoadError] = useState('')
  const [baseline, setBaseline] = useState(() => aboutDataToForm({ id: '' }, []))
  const [form, setForm] = useState(() => aboutDataToForm({ id: '' }, []))
  const [isSaving, setIsSaving] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState(/** @type {ImagePickerTarget} */ (null))

  const isDirty = useMemo(() => !formsAreEqual(form, baseline), [form, baseline])

  const pickerSelectedImage = useMemo(() => {
    if (!pickerTarget) return null
    const config = form.sections.team?.config ?? {}
    const members = Array.isArray(config.members) ? config.members : []
    const member = members[pickerTarget.memberIndex]
    const path = typeof member?.image_path === 'string' ? member.image_path : ''
    return pathToPickerImage(path)
  }, [pickerTarget, form])

  const loadAboutPage = useCallback(async () => {
    setStatus('loading')
    setLoadError('')

    try {
      const { page, sections } = await getAboutPageWithSections()
      const nextForm = aboutDataToForm(page, sections)
      setBaseline(nextForm)
      setForm(nextForm)
      setStatus('ready')
    } catch (err) {
      setLoadError(err?.message ?? 'Failed to load about page content.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    loadAboutPage()
  }, [loadAboutPage])

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

  const handleChooseMemberImage = useCallback((memberIndex) => {
    setPickerTarget({ type: 'member', memberIndex })
    setPickerOpen(true)
  }, [])

  const handleRemoveMemberImage = useCallback((memberIndex) => {
    setForm((current) => ({
      ...current,
      sections: updateTeamMemberImage(current.sections, memberIndex, ''),
    }))
  }, [])

  const handleImageSelect = useCallback(
    (image) => {
      if (!pickerTarget) return
      setForm((current) => ({
        ...current,
        sections: updateTeamMemberImage(current.sections, pickerTarget.memberIndex, image.path),
      }))
    },
    [pickerTarget]
  )

  const handlePickerClose = useCallback(() => {
    setPickerOpen(false)
    setPickerTarget(null)
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)

    try {
      const payloads = formToSectionPayloads(form)
      const updated = await saveAboutSections(payloads)
      const nextForm = aboutDataToForm({ id: form.pageId }, updated)
      setBaseline(nextForm)
      setForm(nextForm)
      success('About page saved successfully')
    } catch (err) {
      error(err?.message ?? 'Failed to save about page')
    } finally {
      setIsSaving(false)
    }
  }, [form, success, error])

  const panelId = `about-panel-${activeTab}`
  const labelledBy = `about-tab-${activeTab}`
  const activeSection = form.sections[activeTab]

  return (
    <div className="admin-page admin-settings-page admin-about-page">
      <header className="admin-page-header">
        <span className="admin-page-icon" aria-hidden>
          <Info size={22} strokeWidth={1.75} />
        </span>
        <div>
          <h1 className="admin-page-title">About</h1>
          <p className="admin-page-desc">
            Manage About page copy, values, team profiles, and contact CTA.
          </p>
        </div>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading about page…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button type="button" className="admin-settings-retry" onClick={loadAboutPage}>
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
        </div>
      )}

      {status === 'ready' && activeSection && (
        <>
          <AboutSectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="admin-settings-panel">
            {activeTab === 'hero' && (
              <HeroEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('hero', field, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'company-story' && (
              <CompanyStoryEditor
                section={activeSection}
                onFieldChange={(field, value) =>
                  handleSectionFieldChange('company-story', field, value)
                }
                onConfigChange={(key, value) =>
                  handleSectionConfigChange('company-story', key, value)
                }
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'mission' && (
              <MissionEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('mission', field, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'vision' && (
              <VisionEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('vision', field, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'values' && (
              <ValuesEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('values', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('values', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'team' && (
              <TeamEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('team', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('team', key, value)}
                onChooseMemberImage={handleChooseMemberImage}
                onRemoveMemberImage={handleRemoveMemberImage}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'contact' && (
              <ContactEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('contact', field, value)}
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
