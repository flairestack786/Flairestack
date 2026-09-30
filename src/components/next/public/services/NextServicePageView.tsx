'use client'

import Link from 'next/link'
import type { ComponentProps, ReactNode } from 'react'
import ServicePageLayout from '@/components/service/ServicePageLayout'
import { usePublicSite } from '@/components/next/public/PublicSiteProvider'
import type { CompanyStatItem, ServiceTestimonialItem } from '@/lib/next/publicServiceServer'

function NextServiceLink({
  to,
  href,
  children,
  className,
  ...rest
}: {
  to?: string
  href?: string
  children?: ReactNode
  className?: string
} & Omit<ComponentProps<typeof Link>, 'href'>) {
  const dest = to || href || '/'
  return (
    <Link href={dest} className={className} {...rest}>
      {children}
    </Link>
  )
}

type Props = {
  service: Record<string, unknown>
  page: Record<string, unknown>
  testimonials: ServiceTestimonialItem[]
  companyStats: CompanyStatItem[]
}

/**
 * Next client wrapper around shared ServicePageLayout (next/link + injected data).
 */
export default function NextServicePageView({
  service,
  page,
  testimonials,
  companyStats,
}: Props) {
  const { settings } = usePublicSite()

  return (
    <article className="service-detail sp-page antialiased">
      <ServicePageLayout
        service={service}
        page={page}
        LinkComponent={NextServiceLink as never}
        testimonials={testimonials}
        companyStats={companyStats}
        servicesIndexHref="/services"
        contactHref="/#contact"
        phone={settings.phone}
        phoneTel={settings.phoneTel}
      />
    </article>
  )
}
