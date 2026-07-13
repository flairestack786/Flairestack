import React from 'react'
import { Database, HardDrive, Info } from 'lucide-react'

/**
 * Small system status card for dashboard v1.1.
 * @param {{
 *   system: {
 *     cmsVersion: string,
 *     supabase: { status: 'connected' | 'error', latencyMs: number | null, message: string },
 *     lastBackup: string | null,
 *   },
 * }} props
 */
export default function SystemInfoCard({ system }) {
  const connected = system.supabase.status === 'connected'

  return (
    <section className="admin-dashboard-card admin-dashboard-system-card">
      <header className="admin-dashboard-card-header">
        <div>
          <h2 className="admin-dashboard-card-title">System Information</h2>
          <p className="admin-dashboard-card-desc">CMS health and connection status.</p>
        </div>
      </header>
      <div className="admin-dashboard-card-body">
        <ul className="admin-dashboard-system-list">
          <li className="admin-dashboard-system-row">
            <span className="admin-dashboard-system-icon" aria-hidden>
              <Info size={15} strokeWidth={1.75} />
            </span>
            <div>
              <p className="admin-dashboard-system-label">CMS version</p>
              <p className="admin-dashboard-system-value">v{system.cmsVersion}</p>
            </div>
          </li>
          <li className="admin-dashboard-system-row">
            <span className="admin-dashboard-system-icon" aria-hidden>
              <Database size={15} strokeWidth={1.75} />
            </span>
            <div>
              <p className="admin-dashboard-system-label">Supabase</p>
              <p className="admin-dashboard-system-value">
                <span
                  className={`admin-dashboard-system-status admin-dashboard-system-status--${system.supabase.status}`}
                >
                  {connected ? 'Connected' : 'Issue detected'}
                </span>
                {system.supabase.latencyMs != null && (
                  <span className="admin-dashboard-system-latency">
                    {system.supabase.latencyMs}ms
                  </span>
                )}
              </p>
            </div>
          </li>
          <li className="admin-dashboard-system-row">
            <span className="admin-dashboard-system-icon" aria-hidden>
              <HardDrive size={15} strokeWidth={1.75} />
            </span>
            <div>
              <p className="admin-dashboard-system-label">Last backup</p>
              <p className="admin-dashboard-system-value admin-dashboard-system-value--muted">
                {system.lastBackup ?? 'Not configured yet'}
              </p>
            </div>
          </li>
        </ul>
      </div>
    </section>
  )
}
