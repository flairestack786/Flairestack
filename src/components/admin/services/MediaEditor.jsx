import React from 'react'
import { SERVICE_MEDIA_SLOTS } from '../../../lib/servicePage'
import SettingsImageField from '../settings/SettingsImageField'
import EditorField from '../home/EditorField'
import EditorSection from '../home/EditorSection'

/**
 * @param {{
 *   media: Record<string, Record<string, unknown>>,
 *   onChooseImage: (slot: string) => void,
 *   onRemoveImage: (slot: string) => void,
 *   onAltChange: (slot: string, value: string) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function MediaEditor({
  media,
  onChooseImage,
  onRemoveImage,
  onAltChange,
  panelId,
  labelledBy,
}) {
  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Service images"
      description="Assign images from the Media Library to each service page slot."
    >
      {SERVICE_MEDIA_SLOTS.map(({ slot, label }) => {
        const entry = media[slot] ?? {}
        const path = typeof entry.storage_path === 'string' ? entry.storage_path : ''
        const altOverride = typeof entry.alt_override === 'string' ? entry.alt_override : ''

        return (
          <div key={slot} className="admin-services-media-slot">
            <SettingsImageField
              label={label}
              field={slot}
              path={path}
              emptyLabel="No image selected"
              onChoose={() => onChooseImage(slot)}
              onRemove={() => onRemoveImage(slot)}
            />

            {path && (
              <EditorField id={`media-alt-${slot}`} label="Alt text override">
                <input
                  id={`media-alt-${slot}`}
                  type="text"
                  className="admin-settings-input"
                  value={altOverride}
                  onChange={(e) => onAltChange(slot, e.target.value)}
                  placeholder="Optional alt text for this slot"
                />
              </EditorField>
            )}
          </div>
        )
      })}
    </EditorSection>
  )
}
