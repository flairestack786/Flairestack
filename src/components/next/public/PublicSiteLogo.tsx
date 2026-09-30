'use client'

import Link from 'next/link'
import { usePublicSite } from './PublicSiteProvider'

type PublicSiteLogoProps = {
  className?: string
  href?: string
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void
}

export default function PublicSiteLogo({
  className = 'site-logo',
  href,
  onClick,
}: PublicSiteLogoProps) {
  const { settings } = usePublicSite()
  const { company_name, logo_url } = settings

  const content = logo_url ? (
    <>
      <img src={logo_url} alt={company_name} className="site-logo-image" />
      <span className="sr-only">{company_name}</span>
    </>
  ) : (
    <>
      <span className="site-logo-text">{company_name}</span>
      <span className="logo-accent" aria-hidden />
    </>
  )

  if (href) {
    return (
      <Link className={className} href={href} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return <span className={className}>{content}</span>
}
