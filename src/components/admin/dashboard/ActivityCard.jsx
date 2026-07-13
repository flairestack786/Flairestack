import React from 'react'

/**
 * Timeline / activity feed card for the admin dashboard.
 * Supports lead timeline today and future global CMS events via `source`.
 * @param {{
 *   title: string,
 *   description?: string,
 *   action?: React.ReactNode,
 *   emptyMessage?: string,
 *   items: {
 *     id: string,
 *     title: string,
 *     body: string,
 *     time: string,
 *     dateTime?: string,
 *     meta?: string,
 *     source?: string,
 *     sourceLabel?: string,
 *     onClick?: () => void,
 *   }[],
 *   className?: string,
 * }} props
 */
export default function ActivityCard({
  title,
  description,
  action,
  emptyMessage = 'No recent activity yet.',
  items,
  className = '',
}) {
  return (
    <section className={`admin-dashboard-card admin-dashboard-activity-card ${className}`.trim()}>
      <header className="admin-dashboard-card-header">
        <div>
          <h2 className="admin-dashboard-card-title">{title}</h2>
          {description && <p className="admin-dashboard-card-desc">{description}</p>}
        </div>
        {action}
      </header>
      <div className="admin-dashboard-card-body">
        {items.length === 0 ? (
          <p className="admin-dashboard-empty">{emptyMessage}</p>
        ) : (
          <ol className="admin-dashboard-activity-list">
            {items.map((item) => {
              const interactive = typeof item.onClick === 'function'
              const Tag = interactive ? 'button' : 'div'
              const sourceKey = String(item.source ?? 'system')

              return (
                <li key={item.id} className="admin-dashboard-activity-item">
                  <Tag
                    type={interactive ? 'button' : undefined}
                    className={`admin-dashboard-activity-entry${interactive ? ' admin-dashboard-activity-entry--interactive' : ''}`}
                    onClick={item.onClick}
                  >
                    <span
                      className={`admin-dashboard-activity-dot admin-dashboard-activity-dot--${sourceKey}`}
                      aria-hidden
                    />
                    <div className="admin-dashboard-activity-content">
                      <div className="admin-dashboard-activity-top">
                        <span className="admin-dashboard-activity-title">{item.title}</span>
                        <time
                          className="admin-dashboard-activity-time"
                          dateTime={item.dateTime ?? item.time}
                        >
                          {item.time}
                        </time>
                      </div>
                      <div className="admin-dashboard-activity-meta-row">
                        {(item.sourceLabel || item.source) && (
                          <span
                            className={`admin-dashboard-activity-source admin-dashboard-activity-source--${sourceKey}`}
                          >
                            {item.sourceLabel || item.source}
                          </span>
                        )}
                        {item.meta && (
                          <p className="admin-dashboard-activity-meta">{item.meta}</p>
                        )}
                      </div>
                      <p className="admin-dashboard-activity-body">{item.body}</p>
                    </div>
                  </Tag>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
