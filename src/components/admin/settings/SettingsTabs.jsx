import React from 'react'

const TABS = [
  { id: 'company', label: 'Company' },
  { id: 'branding', label: 'Branding' },
  { id: 'contact', label: 'Contact' },
  { id: 'social', label: 'Social' },
  { id: 'seo', label: 'SEO' },
  { id: 'analytics', label: 'Analytics' },
]

/**
 * Tab navigation for the admin Settings page.
 * @param {{ activeTab: string, onTabChange: (tabId: string) => void }} props
 */
export default function SettingsTabs({ activeTab, onTabChange }) {
  return (
    <nav className="admin-settings-tabs" aria-label="Settings sections">
      <ul className="admin-settings-tabs-list" role="tablist">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id
          return (
            <li key={id} role="presentation">
              <button
                type="button"
                role="tab"
                id={`settings-tab-${id}`}
                className={`admin-settings-tab${isActive ? ' admin-settings-tab--active' : ''}`}
                aria-selected={isActive}
                aria-controls={`settings-panel-${id}`}
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
