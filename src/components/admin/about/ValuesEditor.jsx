import React from 'react'
import EditorField from '../home/EditorField'
import EditorList from '../home/EditorList'
import EditorSection from '../home/EditorSection'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function ValuesEditor({
  section,
  onFieldChange,
  onConfigChange,
  panelId,
  labelledBy,
}) {
  const config = section.config ?? {}
  const items = Array.isArray(config.items) ? config.items : []

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Values"
      description="Section header and value pillars."
    >
      <EditorField id="values-eyebrow" label="Eyebrow">
        <input
          id="values-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="values-title" label="Title">
        <input
          id="values-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="values-title-accent" label="Title accent">
        <input
          id="values-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorList
        label="Values"
        itemLabel="Value"
        items={items}
        reorderable
        onChange={(next) => onConfigChange('items', next)}
        createItem={() => ({ title: '', text: '', icon_name: 'Sparkles' })}
        renderItem={(item, index, onItemChange) => {
          const value = /** @type {{ title?: string, text?: string, icon_name?: string }} */ (item)
          return (
            <>
              <EditorField id={`value-title-${index}`} label="Title">
                <input
                  id={`value-title-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={value.title ?? ''}
                  onChange={(e) => onItemChange({ ...value, title: e.target.value })}
                />
              </EditorField>

              <EditorField id={`value-text-${index}`} label="Description">
                <textarea
                  id={`value-text-${index}`}
                  className="admin-settings-textarea"
                  rows={3}
                  value={value.text ?? ''}
                  onChange={(e) => onItemChange({ ...value, text: e.target.value })}
                />
              </EditorField>

              <EditorField
                id={`value-icon-${index}`}
                label="Icon name"
                hint="Lucide icon name, e.g. Sparkles, Target, Zap."
              >
                <input
                  id={`value-icon-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={value.icon_name ?? ''}
                  onChange={(e) => onItemChange({ ...value, icon_name: e.target.value })}
                />
              </EditorField>
            </>
          )
        }}
      />
    </EditorSection>
  )
}
