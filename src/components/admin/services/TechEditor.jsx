import React from 'react'
import EditorField from '../home/EditorField'
import EditorList from '../home/EditorList'
import EditorSection from '../home/EditorSection'
import SectionHeaderFields from './SectionHeaderFields'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string | boolean) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function TechEditor({ section, onFieldChange, onConfigChange, panelId, labelledBy }) {
  const config = section.config ?? {}
  const items = Array.isArray(config.items) ? config.items : []

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Tech Stack"
      description="Technologies displayed in the tech stack section."
    >
      <SectionHeaderFields section={section} onFieldChange={onFieldChange} />

      <EditorList
        label="Technologies"
        itemLabel="Technology"
        items={items}
        reorderable
        onChange={(next) => onConfigChange('items', next)}
        createItem={() => ({ name: '' })}
        renderItem={(item, index, onItemChange) => {
          const row = /** @type {{ name?: string }} */ (item)
          return (
            <EditorField id={`tech-name-${index}`} label="Name">
              <input
                id={`tech-name-${index}`}
                type="text"
                className="admin-settings-input"
                value={row.name ?? ''}
                onChange={(e) => onItemChange({ ...row, name: e.target.value })}
              />
            </EditorField>
          )
        }}
      />
    </EditorSection>
  )
}
