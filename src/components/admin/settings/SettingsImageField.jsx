import React from 'react'
import { ImageIcon, ImagePlus, Trash2 } from 'lucide-react'
import { pathToPickerImage } from './settingsImage'

/**
 * Reusable image field for admin Settings (logo, favicon, OG image, etc.).
 * @param {{
 *   label: string,
 *   field: string,
 *   path: string,
 *   emptyLabel?: string,
 *   onChoose: (field: string) => void,
 *   onRemove: (field: string) => void,
 * }} props
 */
export default function SettingsImageField({
  label,
  field,
  path,
  emptyLabel = 'No image selected',
  onChoose,
  onRemove,
}) {
  const image = pathToPickerImage(path)

  return (
    <div className="admin-settings-field">
      <span className="admin-settings-label">{label}</span>

      <div className="admin-settings-image-field">
        {image ? (
          <div className="admin-settings-image-preview">
            <img
              src={image.publicUrl}
              alt=""
              className="admin-settings-image-preview-img"
            />
            <div className="admin-settings-image-preview-meta">
              <p className="admin-settings-image-preview-name" title={image.filename}>
                {image.filename}
              </p>
              <p className="admin-settings-image-preview-path" title={image.path}>
                {image.path}
              </p>
            </div>
          </div>
        ) : (
          <div className="admin-settings-image-empty">
            <ImageIcon size={22} strokeWidth={1.75} aria-hidden />
            <span>{emptyLabel}</span>
          </div>
        )}

        <div className="admin-settings-image-actions">
          <button
            type="button"
            className="admin-settings-image-btn admin-settings-image-btn--choose"
            onClick={() => onChoose(field)}
          >
            <ImagePlus size={16} strokeWidth={1.75} aria-hidden />
            Choose Image
          </button>

          {image && (
            <button
              type="button"
              className="admin-settings-image-btn admin-settings-image-btn--remove"
              onClick={() => onRemove(field)}
            >
              <Trash2 size={16} strokeWidth={1.75} aria-hidden />
              Remove Image
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
