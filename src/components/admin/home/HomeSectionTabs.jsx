import React from 'react'

const TABS = [
  { id: 'hero', label: 'Hero' },
  { id: 'services', label: 'Services' },
  { id: 'why-choose', label: 'Why Choose' },
  { id: 'stats', label: 'Stats' },
  { id: 'process', label: 'Process' },
  { id: 'technologies', label: 'Technologies' },
  { id: 'contact', label: 'Contact' },
]

/**
 * @param {{ activeTab: string, onTabChange: (tabId: string) => void }} props
 */
export default function HomeSectionTabs({ activeTab, onTabChange }) {
  return (
    <nav className="admin-settings-tabs" aria-label="Home page sections">
      <ul className="admin-settings-tabs-list" role="tablist">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id
          return (
            <li key={id} role="presentation">
              <button
                type="button"
                role="tab"
                id={`home-tab-${id}`}
                className={`admin-settings-tab${isActive ? ' admin-settings-tab--active' : ''}`}
                aria-selected={isActive}
                aria-controls={`home-panel-${id}`}
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
