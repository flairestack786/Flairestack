import React from 'react'
import EditorField from './EditorField'
import EditorList from './EditorList'
import EditorSection from './EditorSection'

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
  const config = section.config ?? {}
  const steps = Array.isArray(config.steps) ? config.steps : []
  const icons = Array.isArray(config.icons) ? config.icons : []

  const iconsText = icons.join(', ')

  const handleIconsChange = (text) => {
    const nextIcons = text
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
    onConfigChange('icons', nextIcons)
  }

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Process"
      description="Six-step delivery framework shown on the homepage."
    >
      <EditorField id="process-eyebrow" label="Eyebrow">
        <input
          id="process-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="process-title" label="Title">
        <input
          id="process-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="process-title-accent" label="Title accent">
        <input
          id="process-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="process-intro" label="Intro">
        <textarea
          id="process-intro"
          className="admin-settings-textarea"
          rows={3}
          value={section.intro}
          onChange={(e) => onFieldChange('intro', e.target.value)}
        />
      </EditorField>

      <EditorField
        id="process-icons"
        label="Step icons"
        hint="Comma-separated Lucide icon names, one per step in order."
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
        items={steps}
        onChange={(next) => onConfigChange('steps', next)}
        createItem={() => ({ step: '', title: '', text: '' })}
        renderItem={(item, _index, onItemChange) => {
          const step = /** @type {{ step?: string, title?: string, text?: string }} */ (item)
          return (
            <>
              <EditorField id={`process-step-num-${_index}`} label="Step number">
                <input
                  id={`process-step-num-${_index}`}
                  type="text"
                  className="admin-settings-input"
                  value={step.step ?? ''}
                  onChange={(e) => onItemChange({ ...step, step: e.target.value })}
                  placeholder="01"
                />
              </EditorField>

              <EditorField id={`process-step-title-${_index}`} label="Title">
                <input
                  id={`process-step-title-${_index}`}
                  type="text"
                  className="admin-settings-input"
                  value={step.title ?? ''}
                  onChange={(e) => onItemChange({ ...step, title: e.target.value })}
                />
              </EditorField>

              <EditorField id={`process-step-text-${_index}`} label="Description">
                <textarea
                  id={`process-step-text-${_index}`}
                  className="admin-settings-textarea"
                  rows={4}
                  value={step.text ?? ''}
                  onChange={(e) => onItemChange({ ...step, text: e.target.value })}
                />
              </EditorField>
            </>
          )
        }}
      />
    </EditorSection>
  )
}
