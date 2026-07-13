import React from 'react'
import SettingsImageField from '../settings/SettingsImageField'
import EditorField from '../home/EditorField'
import EditorList from '../home/EditorList'
import EditorSection from '../home/EditorSection'
import SectionHeaderFields from './SectionHeaderFields'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string | boolean) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   onChooseImage: (configKey: string) => void,
 *   onRemoveImage: (configKey: string) => void,
 *   onChooseStepImage: (index: number) => void,
 *   onRemoveStepImage: (index: number) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function ProcessEditor({
  section,
  onFieldChange,
  onConfigChange,
  onChooseImage,
  onRemoveImage,
  onChooseStepImage,
  onRemoveStepImage,
  panelId,
  labelledBy,
}) {
  const config = section.config ?? {}
  const steps = Array.isArray(config.steps) ? config.steps : []
  const sectionImagePath = typeof config.image_path === 'string' ? config.image_path : ''

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Process"
      description="Delivery framework header, section image, and per-step content."
    >
      <SectionHeaderFields section={section} onFieldChange={onFieldChange} />

      <SettingsImageField
        label="Section image"
        field="image_path"
        path={sectionImagePath}
        emptyLabel="No section image selected"
        onChoose={() => onChooseImage('image_path')}
        onRemove={() => onRemoveImage('image_path')}
      />

      <EditorList
        label="Steps"
        itemLabel="Step"
        items={steps}
        reorderable
        onChange={(next) => onConfigChange('steps', next)}
        createItem={() => ({ step: '', title: '', text: '', image_path: null })}
        renderItem={(item, index, onItemChange) => {
          const step =
            /** @type {{ step?: string, title?: string, text?: string, image_path?: string | null }} */ (
              item
            )
          const imagePath = typeof step.image_path === 'string' ? step.image_path : ''

          return (
            <>
              <EditorField id={`process-step-num-${index}`} label="Step number">
                <input
                  id={`process-step-num-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={step.step ?? ''}
                  onChange={(e) => onItemChange({ ...step, step: e.target.value })}
                  placeholder="01"
                />
              </EditorField>

              <EditorField id={`process-step-title-${index}`} label="Title">
                <input
                  id={`process-step-title-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={step.title ?? ''}
                  onChange={(e) => onItemChange({ ...step, title: e.target.value })}
                />
              </EditorField>

              <EditorField id={`process-step-text-${index}`} label="Description">
                <textarea
                  id={`process-step-text-${index}`}
                  className="admin-settings-textarea"
                  rows={4}
                  value={step.text ?? ''}
                  onChange={(e) => onItemChange({ ...step, text: e.target.value })}
                />
              </EditorField>

              <SettingsImageField
                label="Step image"
                field={`process-step-image-${index}`}
                path={imagePath}
                emptyLabel="No step image selected"
                onChoose={() => onChooseStepImage(index)}
                onRemove={() => onRemoveStepImage(index)}
              />
            </>
          )
        }}
      />
    </EditorSection>
  )
}
