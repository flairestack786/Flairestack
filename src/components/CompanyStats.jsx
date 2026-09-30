import React from 'react'
import { useHomePage } from '../hooks/useHomePage'
import CompanyStatsView from './CompanyStatsView'

/**
 * Global company metrics — sourced from Admin → Home → Stats when available.
 * @param {{ id?: string }} props
 */
export default function CompanyStats({ id }) {
  const { sections } = useHomePage()
  const stats =
    Array.isArray(sections?.stats?.stats) && sections.stats.stats.length > 0
      ? sections.stats.stats
      : undefined

  return <CompanyStatsView id={id} stats={stats} />
}
