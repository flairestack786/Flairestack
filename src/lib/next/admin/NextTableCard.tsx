'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

type TableCardProps = {
  title: string
  description?: string
  viewAllHref?: string
  viewAllLabel?: string
  children: ReactNode
  className?: string
}

export default function NextTableCard({
  title,
  description,
  viewAllHref,
  viewAllLabel = 'View all',
  children,
  className = '',
}: TableCardProps) {
  return (
    <section className={`admin-dashboard-card admin-dashboard-table-card ${className}`.trim()}>
      <header className="admin-dashboard-card-header">
        <div>
          <h2 className="admin-dashboard-card-title">{title}</h2>
          {description && <p className="admin-dashboard-card-desc">{description}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="admin-dashboard-card-link">
            {viewAllLabel}
            <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden />
          </Link>
        )}
      </header>
      <div className="admin-dashboard-card-body admin-dashboard-table-card-body">{children}</div>
    </section>
  )
}
