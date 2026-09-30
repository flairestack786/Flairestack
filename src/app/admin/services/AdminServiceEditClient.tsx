'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  Layers,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import ImagePickerModal from '@/components/admin/ImagePickerModal'
import FaqEditor from '@/components/admin/services/FaqEditor'
import FinalCtaEditor from '@/components/admin/services/FinalCtaEditor'
import HeroEditor from '@/components/admin/services/HeroEditor'
import ItemsSectionEditor from '@/components/admin/services/ItemsSectionEditor'
import MediaEditor from '@/components/admin/services/MediaEditor'
import ProcessEditor from '@/components/admin/services/ProcessEditor'
import SeoEditor from '@/components/admin/services/SeoEditor'
import ServiceDetailsEditor from '@/components/admin/services/ServiceDetailsEditor'
import ServiceSectionTabs from '@/components/admin/services/ServiceSectionTabs'
import TechEditor from '@/components/admin/services/TechEditor'
import TestimonialsEditor from '@/components/admin/services/TestimonialsEditor'
import {
  formToMediaPayloads,
  formToSectionPayloads,
  formToServicePayload,
  formsAreEqual,
  serviceDataToForm,
  updateMediaSlot,
  updateSectionConfig,
  updateSectionField,
  updateServiceField,
  updateConfigListItemField,
} from '@/components/admin/services/servicePageForm'
import SaveBar from '@/components/admin/settings/SaveBar'
import { pathToPickerImage } from '@/components/admin/settings/settingsImage'
import { useMediaPublicUrl } from '@/components/admin/MediaUrlContext'
import { useToast } from '@/components/common/ToastProvider'
import {
  getServiceWithContent,
  saveServiceMedia,
  saveServiceSections,
  setServiceStatus,
  updateService,
} from '@/lib/next/servicesBrowser'
import { nextMediaApi } from '@/lib/next/mediaBrowser'
import { assertValidServiceSlug, publicServicePath } from '@/lib/serviceSlug'

type ImagePickerTarget =
  | { type: 'media'; slot: string }
  | { type: 'config'; sectionKey: string; configKey: string }
  | {
      type: 'configList'
      sectionKey: string
      listKey: string
      index: number
      field: string
    }
  | null

type ServiceForm = ReturnType<typeof serviceDataToForm>

const EMPTY_FORM = (): ServiceForm =>
  serviceDataToForm(
    {
      id: '',
      slug: '',
      title: '',
      short_description: '',
      description: '',
      icon_name: '',
      sort_order: 0,
      status: 'draft',
    },
    [],
    [],
    null
  )

/**
 * Migrated Service editor — mirrors Vite AdminServiceEditPage.
 */
export default function AdminServiceEditClient() {
  const params = useParams()
  const serviceId = typeof params?.serviceId === 'string' ? params.serviceId : ''
  const router = useRouter()
  const toast = useToast() as {
    success: (message: string) => void
    error: (message: string) => void
  }
  const { success, error } = toast
  const getPublicUrl = useMediaPublicUrl()
  const [activeTab, setActiveTab] = useState('hero')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [loadError, setLoadError] = useState('')
  const [baseline, setBaseline] = useState<ServiceForm>(EMPTY_FORM)
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('draft')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<ImagePickerTarget>(null)

  const isDirty = useMemo(() => !formsAreEqual(form, baseline), [form, baseline])

  const pickerSelectedImage = useMemo(() => {
    if (!pickerTarget) return null

    if (pickerTarget.type === 'media') {
      const entry = (form.media[pickerTarget.slot] ?? {}) as Record<string, unknown>
      const path = typeof entry.storage_path === 'string' ? entry.storage_path : ''
      return pathToPickerImage(path, getPublicUrl)
    }

    if (pickerTarget.type === 'config') {
      const section = form.sections[pickerTarget.sectionKey]
      const config =
        section?.config && typeof section.config === 'object'
          ? (section.config as Record<string, unknown>)
          : {}
      const path =
        typeof config[pickerTarget.configKey] === 'string'
          ? (config[pickerTarget.configKey] as string)
          : ''
      return pathToPickerImage(path, getPublicUrl)
    }

    if (pickerTarget.type === 'configList') {
      const section = form.sections[pickerTarget.sectionKey]
      const config =
        section?.config && typeof section.config === 'object'
          ? (section.config as Record<string, unknown>)
          : {}
      const list = Array.isArray(config[pickerTarget.listKey])
        ? (config[pickerTarget.listKey] as unknown[])
        : []
      const item = list[pickerTarget.index]
      const path =
        item &&
        typeof item === 'object' &&
        typeof (item as Record<string, unknown>)[pickerTarget.field] === 'string'
          ? String((item as Record<string, unknown>)[pickerTarget.field])
          : ''
      return pathToPickerImage(path, getPublicUrl)
    }

    return null
  }, [pickerTarget, form, getPublicUrl])

  const loadService = useCallback(async () => {
    if (!serviceId) return

    setStatus('loading')
    setLoadError('')

    try {
      const { service, sections, media, seo } = await getServiceWithContent(serviceId)
      const nextForm = serviceDataToForm(service, sections, media, seo)
      const formCopy = structuredClone(nextForm)
      const baselineCopy = structuredClone(nextForm)
      setBaseline(baselineCopy)
      setForm(formCopy)
      setPublishStatus(formCopy.service.status === 'published' ? 'published' : 'draft')
      setStatus('ready')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load service.')
      setStatus('error')
    }
  }, [serviceId])

  useEffect(() => {
    void loadService()
  }, [loadService])

  const handleServiceFieldChange = useCallback((field: string, value: unknown) => {
    setForm((current) => ({
      ...current,
      service: updateServiceField(current.service, field, value),
    }))
  }, [])

  const handleSectionFieldChange = useCallback(
    (sectionKey: string, field: string, value: unknown) => {
      setForm((current) => ({
        ...current,
        sections: updateSectionField(current.sections, sectionKey, field, value),
      }))
    },
    []
  )

  const handleSectionConfigChange = useCallback(
    (sectionKey: string, configKey: string, value: unknown) => {
      setForm((current) => ({
        ...current,
        sections: updateSectionConfig(current.sections, sectionKey, configKey, value),
      }))
    },
    []
  )

  const handleChooseImage = useCallback((slot: string) => {
    setPickerTarget({ type: 'media', slot })
    setPickerOpen(true)
  }, [])

  const handleRemoveImage = useCallback((slot: string) => {
    setForm((current) => ({
      ...current,
      media: updateMediaSlot(current.media, slot, { storage_path: '', media_id: '' }),
    }))
  }, [])

  const handleChooseSectionImage = useCallback((sectionKey: string, configKey: string) => {
    setPickerTarget({ type: 'config', sectionKey, configKey })
    setPickerOpen(true)
  }, [])

  const handleRemoveSectionImage = useCallback(
    (sectionKey: string, configKey: string) => {
      handleSectionConfigChange(sectionKey, configKey, '')
    },
    [handleSectionConfigChange]
  )

  const handleChooseListItemImage = useCallback(
    (sectionKey: string, listKey: string, index: number, field = 'image_path') => {
      setPickerTarget({ type: 'configList', sectionKey, listKey, index, field })
      setPickerOpen(true)
    },
    []
  )

  const handleRemoveListItemImage = useCallback(
    (sectionKey: string, listKey: string, index: number, field = 'image_path') => {
      setForm((current) => ({
        ...current,
        sections: updateConfigListItemField(
          current.sections,
          sectionKey,
          listKey,
          index,
          field,
          null
        ),
      }))
    },
    []
  )

  const handleAltChange = useCallback((slot: string, value: string) => {
    setForm((current) => ({
      ...current,
      media: updateMediaSlot(current.media, slot, { alt_override: value }),
    }))
  }, [])

  const handleImageSelect = useCallback(
    (image: { path: string }) => {
      if (!pickerTarget) return

      if (pickerTarget.type === 'media') {
        setForm((current) => ({
          ...current,
          media: updateMediaSlot(current.media, pickerTarget.slot, {
            storage_path: image.path,
          }),
        }))
        return
      }

      if (pickerTarget.type === 'config') {
        handleSectionConfigChange(pickerTarget.sectionKey, pickerTarget.configKey, image.path)
        return
      }

      if (pickerTarget.type === 'configList') {
        setForm((current) => ({
          ...current,
          sections: updateConfigListItemField(
            current.sections,
            pickerTarget.sectionKey,
            pickerTarget.listKey,
            pickerTarget.index,
            pickerTarget.field,
            image.path
          ),
        }))
      }
    },
    [pickerTarget, handleSectionConfigChange]
  )

  const handlePickerClose = useCallback(() => {
    setPickerOpen(false)
    setPickerTarget(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (!serviceId) return

    setIsSaving(true)

    try {
      const servicePayload = { ...formToServicePayload(form) } as Record<string, unknown>
      delete servicePayload.status
      delete servicePayload.published_at
      servicePayload.slug = assertValidServiceSlug(servicePayload.slug)

      await updateService(serviceId, servicePayload)
      await saveServiceSections(formToSectionPayloads(form))
      await saveServiceMedia(serviceId, formToMediaPayloads(form))

      const reloaded = await getServiceWithContent(serviceId)
      const nextForm = serviceDataToForm(
        reloaded.service,
        reloaded.sections,
        reloaded.media,
        reloaded.seo
      )
      nextForm.service.status = publishStatus
      nextForm.service.published_at =
        publishStatus === 'published'
          ? nextForm.service.published_at ?? new Date().toISOString()
          : null

      const formCopy = structuredClone(nextForm)
      const baselineCopy = structuredClone(nextForm)
      setBaseline(baselineCopy)
      setForm(formCopy)
      setPublishStatus(formCopy.service.status === 'published' ? 'published' : 'draft')
      success('Service saved successfully')
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to save service')
    } finally {
      setIsSaving(false)
    }
  }, [form, publishStatus, serviceId, success, error])

  const handleToggleStatus = useCallback(async () => {
    if (!serviceId || isTogglingStatus) return

    const currentStatus = publishStatus === 'published' ? 'published' : 'draft'
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published'

    setIsTogglingStatus(true)
    setPublishStatus(nextStatus)

    try {
      const updated = await setServiceStatus(serviceId, nextStatus)

      if (!updated?.status) {
        throw new Error('Status update returned no service row.')
      }

      const confirmedStatus = updated.status === 'published' ? 'published' : 'draft'
      setPublishStatus(confirmedStatus)

      setForm((current) => ({
        ...current,
        service: {
          ...current.service,
          status: confirmedStatus,
          published_at: updated.published_at ?? null,
        },
      }))
      setBaseline((current) => ({
        ...current,
        service: {
          ...current.service,
          status: confirmedStatus,
          published_at: updated.published_at ?? null,
        },
      }))
      success(nextStatus === 'published' ? 'Service published' : 'Service moved to draft')
    } catch (err) {
      setPublishStatus(currentStatus)
      error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setIsTogglingStatus(false)
    }
  }, [isTogglingStatus, publishStatus, serviceId, success, error])

  const panelId = `service-panel-${activeTab}`
  const labelledBy = `service-tab-${activeTab}`
  const activeSection = form.sections[activeTab]
  const isPublished = publishStatus === 'published'
  const previewPath = publicServicePath(form.service.slug)

  return (
    <div className="admin-page admin-settings-page admin-service-edit-page">
      <header className="admin-page-header admin-service-edit-header">
        <Link href="/admin/services" className="admin-service-back-link">
          <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
          All services
        </Link>

        <div className="admin-service-edit-title-row">
          <span className="admin-page-icon" aria-hidden>
            <Layers size={22} strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="admin-page-title">
              {String(form.service.title || 'Edit service')}
            </h1>
            <p className="admin-page-desc">
              {previewPath || '/services/…'}
              {isPublished ? (
                <span className="admin-services-status admin-services-status--published">
                  Published
                </span>
              ) : (
                <span className="admin-services-status admin-services-status--draft">Draft</span>
              )}
            </p>
          </div>

          <div className="admin-service-edit-actions">
            {previewPath && (
              <a
                href={previewPath}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-service-preview-link"
              >
                <ExternalLink size={16} strokeWidth={1.75} aria-hidden />
                Preview
              </a>
            )}
            <button
              type="button"
              className={`admin-services-status-btn${isPublished ? ' admin-services-status-btn--draft' : ' admin-services-status-btn--publish'}`}
              onClick={() => void handleToggleStatus()}
              disabled={isTogglingStatus}
            >
              {isTogglingStatus ? 'Updating…' : isPublished ? 'Unpublish' : 'Publish'}
            </button>
          </div>
        </div>
      </header>

      {status === 'loading' && (
        <div className="admin-settings-state" role="status">
          <Loader2 size={24} strokeWidth={1.75} className="admin-settings-spinner" aria-hidden />
          <span>Loading service…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="admin-settings-state admin-settings-state--error" role="alert">
          <AlertCircle size={22} strokeWidth={1.75} aria-hidden />
          <span>{loadError}</span>
          <button
            type="button"
            className="admin-settings-retry"
            onClick={() => void loadService()}
          >
            <RefreshCw size={16} strokeWidth={1.75} aria-hidden />
            Retry
          </button>
          <button
            type="button"
            className="admin-settings-retry"
            onClick={() => router.push('/admin/services')}
          >
            Back to list
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <ServiceDetailsEditor
            service={form.service}
            onFieldChange={handleServiceFieldChange}
            panelId="service-panel-details"
            labelledBy="service-details-heading"
          />

          <ServiceSectionTabs activeTab={activeTab} onTabChange={setActiveTab} />

          <div className="admin-settings-panel">
            {activeTab === 'hero' && activeSection && (
              <HeroEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('hero', field, value)}
                onChooseImage={(configKey) => handleChooseSectionImage('hero', configKey)}
                onRemoveImage={(configKey) => handleRemoveSectionImage('hero', configKey)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'challenges' && activeSection && (
              <ItemsSectionEditor
                section={activeSection}
                onFieldChange={(field, value) =>
                  handleSectionFieldChange('challenges', field, value)
                }
                onConfigChange={(key, value) => handleSectionConfigChange('challenges', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
                title="Challenges"
                description="Problem statements addressed by this service."
                itemLabel="Challenge"
              />
            )}

            {activeTab === 'framework' && activeSection && (
              <ItemsSectionEditor
                section={activeSection}
                onFieldChange={(field, value) =>
                  handleSectionFieldChange('framework', field, value)
                }
                onConfigChange={(key, value) => handleSectionConfigChange('framework', key, value)}
                onChooseItemImage={(index) =>
                  handleChooseListItemImage('framework', 'items', index)
                }
                onRemoveItemImage={(index) =>
                  handleRemoveListItemImage('framework', 'items', index)
                }
                enableItemImages
                panelId={panelId}
                labelledBy={labelledBy}
                title="Services framework"
                description="Core service offerings shown in the framework section."
                itemLabel="Offering"
              />
            )}

            {activeTab === 'features' && activeSection && (
              <ItemsSectionEditor
                section={activeSection}
                onFieldChange={(field, value) =>
                  handleSectionFieldChange('features', field, value)
                }
                onConfigChange={(key, value) => handleSectionConfigChange('features', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
                title="Capabilities"
                description="Specialized capability cards in the bento grid."
                itemLabel="Capability"
              />
            )}

            {activeTab === 'growth' && activeSection && (
              <ItemsSectionEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('growth', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('growth', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
                title="Benefits"
                description="Business outcomes and growth drivers."
                itemLabel="Benefit"
              />
            )}

            {activeTab === 'process' && activeSection && (
              <ProcessEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('process', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('process', key, value)}
                onChooseImage={(configKey) => handleChooseSectionImage('process', configKey)}
                onRemoveImage={(configKey) => handleRemoveSectionImage('process', configKey)}
                onChooseStepImage={(index) =>
                  handleChooseListItemImage('process', 'steps', index)
                }
                onRemoveStepImage={(index) =>
                  handleRemoveListItemImage('process', 'steps', index)
                }
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'tech' && activeSection && (
              <TechEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('tech', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('tech', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'faq' && activeSection && (
              <FaqEditor
                section={activeSection}
                onFieldChange={(field, value) => handleSectionFieldChange('faq', field, value)}
                onConfigChange={(key, value) => handleSectionConfigChange('faq', key, value)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'testimonials' && activeSection && (
              <TestimonialsEditor
                section={activeSection}
                onFieldChange={(field, value) =>
                  handleSectionFieldChange('testimonials', field, value)
                }
                onChooseImage={(configKey) =>
                  handleChooseSectionImage('testimonials', configKey)
                }
                onRemoveImage={(configKey) =>
                  handleRemoveSectionImage('testimonials', configKey)
                }
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'industries' && activeSection && (
              <ItemsSectionEditor
                section={activeSection}
                onFieldChange={(field, value) =>
                  handleSectionFieldChange('industries', field, value)
                }
                onConfigChange={(key, value) =>
                  handleSectionConfigChange('industries', key, value)
                }
                panelId={panelId}
                labelledBy={labelledBy}
                title="Industries"
                description="Industry-specific solutions grid."
                itemLabel="Industry"
              />
            )}

            {activeTab === 'post_launch' && activeSection && (
              <ItemsSectionEditor
                section={activeSection}
                onFieldChange={(field, value) =>
                  handleSectionFieldChange('post_launch', field, value)
                }
                onConfigChange={(key, value) =>
                  handleSectionConfigChange('post_launch', key, value)
                }
                panelId={panelId}
                labelledBy={labelledBy}
                title="Post-launch"
                description="Post-launch support and ongoing services."
                itemLabel="Service"
              />
            )}

            {activeTab === 'final_cta' && activeSection && (
              <FinalCtaEditor
                section={activeSection}
                onFieldChange={(field, value) =>
                  handleSectionFieldChange('final_cta', field, value)
                }
                onChooseImage={(configKey) => handleChooseSectionImage('final_cta', configKey)}
                onRemoveImage={(configKey) => handleRemoveSectionImage('final_cta', configKey)}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'media' && (
              <MediaEditor
                media={form.media}
                onChooseImage={handleChooseImage}
                onRemoveImage={handleRemoveImage}
                onAltChange={handleAltChange}
                panelId={panelId}
                labelledBy={labelledBy}
              />
            )}

            {activeTab === 'seo' && (
              <SeoEditor
                serviceId={serviceId}
                panelId={panelId}
                labelledBy={labelledBy}
                LinkComponent={({ href, className, children }) => (
                  <Link href={href} className={className}>
                    {children}
                  </Link>
                )}
              />
            )}
          </div>

          <SaveBar isDirty={isDirty} isSaving={isSaving} onSave={() => void handleSave()} />

          <ImagePickerModal
            isOpen={pickerOpen}
            selectedImage={pickerSelectedImage}
            onSelect={handleImageSelect}
            onClose={handlePickerClose}
            title="Select service image"
            api={nextMediaApi}
          />
        </>
      )}
    </div>
  )
}
