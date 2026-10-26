import React, { useState } from 'react'
import ImagePickerModal from '../ImagePickerModal'
import { useMediaPublicUrl } from '../MediaUrlContext'
import { homeProcessSteps } from '@/data/homeProcessSteps'
import { nextMediaApi } from '@/lib/next/mediaBrowser'
import EditorField from './EditorField'
import EditorList from './EditorList'
import EditorSection from './EditorSection'

/**
 * @param {string} path
 * @param {(path: string) => string} getPublicUrl
 */
function previewUrl(path, getPublicUrl) {
  const trimmed = String(path ?? '').trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('/') || /^https?:\/\//i.test(trimmed)) return trimmed
  try {
    return getPublicUrl(trimmed)
  } catch {
    return ''
  }
}

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function ProcessEditor({
  section,
  onFieldChange,
  onConfigChange,
  panelId,
  labelledBy,
}) {
  const getPublicUrl = useMediaPublicUrl()
  const [pickerIndex, setPickerIndex] = useState(/** @type {number | null} */ (null))
  const config = /** @type {Record<string, unknown>} */ (section.config ?? {})
  const steps = Array.isArray(config.steps) ? config.steps : []
  const icons = Array.isArray(config.icons) ? config.icons.map((name) => String(name)) : []
  const iconsText = icons.join(', ')

  const displaySteps = steps.map((raw, index) => {
    const step = raw && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
    const fallback = homeProcessSteps[index]
    return {
      step: String(step.step ?? fallback?.step ?? String(index + 1).padStart(2, '0')),
      title: String(step.title ?? ''),
      text: String(step.text ?? ''),
      icon_name: String(step.icon_name || icons[index] || fallback?.iconName || ''),
      image_path: Object.prototype.hasOwnProperty.call(step, 'image_path')
        ? String(step.image_path ?? '')
        : String(fallback?.image || ''),
      image_alt: Object.prototype.hasOwnProperty.call(step, 'image_alt')
        ? String(step.image_alt ?? '')
        : String(fallback?.imageAlt || ''),
      enabled: step.enabled !== false,
    }
  })

  const handleIconsChange = (text) => {
    const nextIcons = text
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
    onConfigChange('icons', nextIcons)
  }

  const pickerStep = pickerIndex == null ? null : displaySteps[pickerIndex]

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Process"
      description="Delivery steps, order, and images shown on the homepage."
    >
      <EditorField id="process-eyebrow" label="Eyebrow">
        <input
          id="process-eyebrow"
          type="text"
          className="admin-settings-input"
          value={String(section.eyebrow ?? '')}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="process-title" label="Title">
        <input
          id="process-title"
          type="text"
          className="admin-settings-input"
          value={String(section.title ?? '')}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="process-title-accent" label="Title accent">
        <input
          id="process-title-accent"
          type="text"
          className="admin-settings-input"
          value={String(section.title_accent ?? '')}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="process-intro" label="Intro">
        <textarea
          id="process-intro"
          className="admin-settings-textarea"
          rows={3}
          value={String(section.intro ?? '')}
          onChange={(e) => onFieldChange('intro', e.target.value)}
        />
      </EditorField>

      <EditorField
        id="process-icons"
        label="Fallback step icons"
        hint="Comma-separated Lucide names used when a step has no icon of its own."
      >
        <input
          id="process-icons"
          type="text"
          className="admin-settings-input"
          value={iconsText}
          onChange={(e) => handleIconsChange(e.target.value)}
        />
      </EditorField>

      <EditorList
        label="Steps"
        itemLabel="Step"
        items={displaySteps}
        reorderable
        onChange={(next) => onConfigChange('steps', next)}
        createItem={() => ({
          step: String(displaySteps.length + 1).padStart(2, '0'),
          title: '',
          text: '',
          icon_name: 'Circle',
          image_path: '',
          image_alt: '',
          enabled: true,
        })}
        renderItem={(item, index, onItemChange) => {
          const step = /** @type {Record<string, string | boolean>} */ (item)
          const imageSrc = previewUrl(String(step.image_path ?? ''), getPublicUrl)
          return (
            <>
              <EditorField id={`process-step-enabled-${index}`} label="Visible on homepage">
                <label className="admin-settings-checkbox">
                  <input
                    id={`process-step-enabled-${index}`}
                    type="checkbox"
                    checked={step.enabled !== false}
                    onChange={(e) => onItemChange({ ...step, enabled: e.target.checked })}
                  />
                  <span>{step.enabled === false ? 'Hidden' : 'Shown'}</span>
                </label>
              </EditorField>

              <EditorField id={`process-step-num-${index}`} label="Step number">
                <input
                  id={`process-step-num-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={String(step.step ?? '')}
                  onChange={(e) => onItemChange({ ...step, step: e.target.value })}
                  placeholder="01"
                />
              </EditorField>

              <EditorField id={`process-step-title-${index}`} label="Title">
                <input
                  id={`process-step-title-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={String(step.title ?? '')}
                  onChange={(e) => onItemChange({ ...step, title: e.target.value })}
                />
              </EditorField>

              <EditorField id={`process-step-text-${index}`} label="Description">
                <textarea
                  id={`process-step-text-${index}`}
                  className="admin-settings-textarea"
                  rows={4}
                  value={String(step.text ?? '')}
                  onChange={(e) => onItemChange({ ...step, text: e.target.value })}
                />
              </EditorField>

              <EditorField id={`process-step-icon-${index}`} label="Icon name">
                <input
                  id={`process-step-icon-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={String(step.icon_name ?? '')}
                  onChange={(e) => onItemChange({ ...step, icon_name: e.target.value })}
                  placeholder="Search"
                />
              </EditorField>

              <EditorField id={`process-step-image-${index}`} label="Image">
                <div className="admin-settings-image-field">
                  {imageSrc ? (
                    <div className="admin-settings-image-preview">
                      <img src={imageSrc} alt="" className="admin-settings-image-preview-img" />
                      <p className="admin-settings-image-preview-path" title={String(step.image_path ?? '')}>
                        {String(step.image_path ?? '')}
                      </p>
                    </div>
                  ) : (
                    <p className="admin-settings-hint">No image selected.</p>
                  )}
                  <div className="admin-settings-image-actions">
                    <button
                      type="button"
                      className="admin-settings-image-btn admin-settings-image-btn--choose"
                      onClick={() => setPickerIndex(index)}
                    >
                      Choose image
                    </button>
                    {step.image_path ? (
                      <button
                        type="button"
                        className="admin-settings-image-btn admin-settings-image-btn--remove"
                        onClick={() => onItemChange({ ...step, image_path: '' })}
                      >
                        Remove image
                      </button>
                    ) : null}
                  </div>
                </div>
              </EditorField>

              <EditorField id={`process-step-alt-${index}`} label="Image alt text">
                <input
                  id={`process-step-alt-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={String(step.image_alt ?? '')}
                  onChange={(e) => onItemChange({ ...step, image_alt: e.target.value })}
                />
              </EditorField>
            </>
          )
        }}
      />

      <ImagePickerModal
        isOpen={pickerIndex != null}
        title="Select process image"
        selectedImage={
          pickerStep?.image_path
            ? {
                path: String(pickerStep.image_path),
                publicUrl: previewUrl(String(pickerStep.image_path), getPublicUrl),
                filename: String(pickerStep.image_path).split('/').pop() ?? 'image',
              }
            : null
        }
        api={nextMediaApi}
        onClose={() => setPickerIndex(null)}
        onSelect={(image) => {
          if (pickerIndex == null) return
          const current = displaySteps[pickerIndex]
          if (!current) return
          const next = displaySteps.map((step, index) =>
            index === pickerIndex ? { ...step, image_path: image.path } : step
          )
          onConfigChange('steps', next)
          setPickerIndex(null)
        }}
      />
    </EditorSection>
  )
}
