import React from 'react'
import SettingsImageField from '../settings/SettingsImageField'
import EditorField from '../home/EditorField'
import EditorList from '../home/EditorList'
import EditorSection from '../home/EditorSection'

/**
 * @param {{
 *   section: Record<string, unknown>,
 *   onFieldChange: (field: string, value: string) => void,
 *   onConfigChange: (key: string, value: unknown) => void,
 *   onChooseMemberImage: (memberIndex: number) => void,
 *   onRemoveMemberImage: (memberIndex: number) => void,
 *   panelId: string,
 *   labelledBy: string,
 * }} props
 */
export default function TeamEditor({
  section,
  onFieldChange,
  onConfigChange,
  onChooseMemberImage,
  onRemoveMemberImage,
  panelId,
  labelledBy,
}) {
  const config = section.config ?? {}
  const members = Array.isArray(config.members) ? config.members : []

  return (
    <EditorSection
      panelId={panelId}
      labelledBy={labelledBy}
      title="Team"
      description="Leadership section header and team member profiles."
    >
      <EditorField id="team-eyebrow" label="Eyebrow">
        <input
          id="team-eyebrow"
          type="text"
          className="admin-settings-input"
          value={section.eyebrow}
          onChange={(e) => onFieldChange('eyebrow', e.target.value)}
        />
      </EditorField>

      <EditorField id="team-title" label="Title">
        <input
          id="team-title"
          type="text"
          className="admin-settings-input"
          value={section.title}
          onChange={(e) => onFieldChange('title', e.target.value)}
        />
      </EditorField>

      <EditorField id="team-title-accent" label="Title accent">
        <input
          id="team-title-accent"
          type="text"
          className="admin-settings-input"
          value={section.title_accent}
          onChange={(e) => onFieldChange('title_accent', e.target.value)}
        />
      </EditorField>

      <EditorList
        label="Team members"
        itemLabel="Member"
        items={members}
        reorderable
        onChange={(next) => onConfigChange('members', next)}
        createItem={() => ({
          id: `member-${Date.now()}`,
          name: '',
          title: '',
          bio: '',
          image_alt: '',
          image_position: 'center center',
          image_path: null,
        })}
        renderItem={(item, index, onItemChange) => {
          const member =
            /** @type {{ id?: string, name?: string, title?: string, bio?: string, image_alt?: string, image_position?: string, image_path?: string | null }} */ (
              item
            )
          const imagePath = typeof member.image_path === 'string' ? member.image_path : ''

          return (
            <>
              <EditorField id={`member-name-${index}`} label="Name">
                <input
                  id={`member-name-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={member.name ?? ''}
                  onChange={(e) => onItemChange({ ...member, name: e.target.value })}
                />
              </EditorField>

              <EditorField id={`member-title-${index}`} label="Role title">
                <input
                  id={`member-title-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={member.title ?? ''}
                  onChange={(e) => onItemChange({ ...member, title: e.target.value })}
                />
              </EditorField>

              <EditorField id={`member-bio-${index}`} label="Bio">
                <textarea
                  id={`member-bio-${index}`}
                  className="admin-settings-textarea"
                  rows={4}
                  value={member.bio ?? ''}
                  onChange={(e) => onItemChange({ ...member, bio: e.target.value })}
                />
              </EditorField>

              <EditorField id={`member-alt-${index}`} label="Image alt text">
                <input
                  id={`member-alt-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={member.image_alt ?? ''}
                  onChange={(e) => onItemChange({ ...member, image_alt: e.target.value })}
                />
              </EditorField>

              <EditorField
                id={`member-position-${index}`}
                label="Image position"
                hint="CSS object-position, e.g. center 18%."
              >
                <input
                  id={`member-position-${index}`}
                  type="text"
                  className="admin-settings-input"
                  value={member.image_position ?? ''}
                  onChange={(e) => onItemChange({ ...member, image_position: e.target.value })}
                />
              </EditorField>

              <SettingsImageField
                label="Photo"
                field={`member-${index}`}
                path={imagePath}
                emptyLabel="No photo selected"
                onChoose={() => onChooseMemberImage(index)}
                onRemove={() => onRemoveMemberImage(index)}
              />
            </>
          )
        }}
      />
    </EditorSection>
  )
}
