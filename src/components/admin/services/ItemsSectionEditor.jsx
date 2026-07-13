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
 *   onChooseItemImage?: (index: number) => void,
 *   onRemoveItemImage?: (index: number) => void,
 *   panelId: string,
 *   labelledBy: string,
 *   title: string,
 *   description: string,
 *   itemLabel?: string,
 *   showEyebrow?: boolean,
 *   enableItemImages?: boolean,
 * }} props
 */
export default function ItemsSectionEditor({
  section,
  onFieldChange,
  onConfigChange,
  onChooseItemImage,
  onRemoveItemImage,
  panelId,
  labelledBy,
  title,
  description,
  itemLabel = 'Item',
  showEyebrow = true,
  enableItemImages = false,
}) {
  const config = section.config ?? {}
  const items = Array.isArray(config.items) ? config.items : []

  return (
    <EditorSection panelId={panelId} labelledBy={labelledBy} title={title} description={description}>
      <SectionHeaderFields
        section={section}
        onFieldChange={onFieldChange}
        showEyebrow={showEyebrow}
      />

      <EditorList
        label="Items"
        itemLabel={itemLabel}
        items={items}
        reorderable
        onChange={(next) => onConfigChange('items', next)}
        createItem={() =>
          enableItemImages
            ? { title: '', description: '', image_path: null }
            : { title: '', description: '' }
        }
        renderItem={(item, index, onItemChange) => {
          const row =
            /** @type {{ title?: string, description?: string, image_path?: string | null }} */ (
              item
            )
          const imagePath = typeof row.image_path === 'string' ? row.image_path : ''

          return (
            <>
              <EditorField id={`item-title-${index}`} label="Title">
                <input
                  id={`item-title-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={row.title ?? ''}
                  onChange={(e) => onItemChange({ ...row, title: e.target.value })}
                />
              </EditorField>

              <EditorField id={`item-description-${index}`} label="Description">
                <textarea
                  id={`item-description-${index}`}
                  className="admin-settings-textarea"
                  rows={3}
                  value={row.description ?? ''}
                  onChange={(e) => onItemChange({ ...row, description: e.target.value })}
                />
              </EditorField>

              {enableItemImages && onChooseItemImage && onRemoveItemImage && (
                <SettingsImageField
                  label="Image"
                  field={`item-image-${index}`}
                  path={imagePath}
                  emptyLabel="No image selected"
                  onChoose={() => onChooseItemImage(index)}
                  onRemove={() => onRemoveItemImage(index)}
                />
              )}
            </>
          )
        }}
      />
    </EditorSection>
  )
}
