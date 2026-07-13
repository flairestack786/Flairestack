import React from 'react'
import { Link } from 'react-router-dom'
import { useSiteSettings } from '../hooks/useSiteSettings'

/**
 * Site logo — CMS image when available, otherwise the existing text mark.
 * @param {{
 *   className?: string,
 *   to?: string,
 *   onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void,
 * }} props
 */
export default function SiteLogo({ className = 'site-logo', to, onClick }) {
  const { settings } = useSiteSettings()
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

  if (to) {
    return (
      <Link className={className} to={to} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return <span className={className}>{content}</span>
}
