'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

type QuickActionCardProps = {
  title: string
  description: string
  icon: ReactNode
  to: string
  external?: boolean
  className?: string
}

export default function NextQuickActionCard({
  title,
  description,
  icon,
  to,
  external = false,
  className = '',
}: QuickActionCardProps) {
  const content = (
    <>
      <span className="admin-dashboard-quick-icon" aria-hidden>
        {icon}
      </span>
      <div className="admin-dashboard-quick-body">
        <span className="admin-dashboard-quick-title">{title}</span>
        <span className="admin-dashboard-quick-desc">{description}</span>
      </div>
      <ArrowUpRight
        size={16}
        strokeWidth={1.75}
        className="admin-dashboard-quick-arrow"
        aria-hidden
      />
    </>
  )

  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className={`admin-dashboard-quick-card ${className}`.trim()}
      >
        {content}
      </a>
    )
  }

  return (
    <Link href={to} className={`admin-dashboard-quick-card ${className}`.trim()}>
      {content}
    </Link>
  )
}
