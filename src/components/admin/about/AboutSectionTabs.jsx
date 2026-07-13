import React from 'react'

const TABS = [
  { id: 'hero', label: 'Hero' },
  { id: 'company-story', label: 'Story' },
  { id: 'mission', label: 'Mission' },
  { id: 'vision', label: 'Vision' },
  { id: 'values', label: 'Values' },
  { id: 'team', label: 'Team' },
  { id: 'contact', label: 'Contact' },
]

/**
 * @param {{ activeTab: string, onTabChange: (tabId: string) => void }} props
 */
export default function AboutSectionTabs({ activeTab, onTabChange }) {
  return (
    <nav className="admin-settings-tabs" aria-label="About page sections">
      <ul className="admin-settings-tabs-list" role="tablist">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id
          return (
            <li key={id} role="presentation">
              <button
                type="button"
                role="tab"
                id={`about-tab-${id}`}
                className={`admin-settings-tab${isActive ? ' admin-settings-tab--active' : ''}`}
                aria-selected={isActive}
                aria-controls={`about-panel-${id}`}
                onClick={() => onTabChange(id)}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export { TABS }
