import React from 'react'

const TABS = [
  { id: 'hero', label: 'Hero' },
  { id: 'challenges', label: 'Challenges' },
  { id: 'framework', label: 'Services' },
  { id: 'features', label: 'Capabilities' },
  { id: 'growth', label: 'Benefits' },
  { id: 'process', label: 'Process' },
  { id: 'tech', label: 'Tech Stack' },
  { id: 'faq', label: 'FAQ' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'industries', label: 'Industries' },
  { id: 'post_launch', label: 'Post-Launch' },
  { id: 'final_cta', label: 'Final CTA' },
  { id: 'media', label: 'Media' },
  { id: 'seo', label: 'SEO' },
]

/**
 * @param {{ activeTab: string, onTabChange: (tabId: string) => void }} props
 */
export default function ServiceSectionTabs({ activeTab, onTabChange }) {
  return (
    <nav className="admin-settings-tabs admin-services-tabs" aria-label="Service page sections">
      <ul className="admin-settings-tabs-list" role="tablist">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id
          return (
            <li key={id} role="presentation">
              <button
                type="button"
                role="tab"
                id={`service-tab-${id}`}
                className={`admin-settings-tab${isActive ? ' admin-settings-tab--active' : ''}`}
                aria-selected={isActive}
                aria-controls={`service-panel-${id}`}
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
