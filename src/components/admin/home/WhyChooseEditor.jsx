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
export default function WhyChooseEditor({
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
      title="Why choose us"
      description="Section header and feature cards highlighting your differentiators."
    >
      <EditorField id="why-eyebrow" label="Eyebrow">
        <input
          id="why-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="why-title" label="Title">
        <input
          id="why-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="why-title-accent" label="Title accent">
        <input
          id="why-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorField id="why-intro" label="Intro">
        <textarea
          id="why-intro"
          className="admin-settings-textarea"
          rows={3}
          value={section.intro}
          onChange={(e) => onFieldChange('intro', e.target.value)}
        />
      </EditorField>

      <EditorList
        label="Feature cards"
        itemLabel="Card"
        items={items}
        onChange={(next) => onConfigChange('items', next)}
        createItem={() => ({ title: '', description: '', icon_name: 'Layers' })}
        renderItem={(item, _index, onItemChange) => {
          const card = /** @type {{ title?: string, description?: string, icon_name?: string }} */ (item)
          return (
            <>
              <EditorField id={`why-card-title-${_index}`} label="Title">
                <input
                  id={`why-card-title-${_index}`}
                  type="text"
                  className="admin-settings-input"
                  value={card.title ?? ''}
                  onChange={(e) => onItemChange({ ...card, title: e.target.value })}
                />
              </EditorField>

              <EditorField id={`why-card-desc-${_index}`} label="Description">
                <textarea
                  id={`why-card-desc-${_index}`}
                  className="admin-settings-textarea"
                  rows={3}
                  value={card.description ?? ''}
                  onChange={(e) => onItemChange({ ...card, description: e.target.value })}
                />
              </EditorField>

              <EditorField
                id={`why-card-icon-${_index}`}
                label="Icon name"
                hint="Lucide icon name, e.g. Layers, Cpu, Rocket."
              >
                <input
                  id={`why-card-icon-${_index}`}
                  type="text"
                  className="admin-settings-input"
                  value={card.icon_name ?? ''}
                  onChange={(e) => onItemChange({ ...card, icon_name: e.target.value })}
                />
              </EditorField>
            </>
          )
        }}
      />
    </EditorSection>
  )
}
