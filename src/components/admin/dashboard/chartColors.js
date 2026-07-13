/** Lead status colors aligned with admin badge palette. */
export const LEAD_STATUS_CHART_COLORS = {
  new: '#fdba74',
  contacted: '#67e8f9',
  qualified: '#c4b5fd',
  proposal: '#93c5fd',
  won: '#86efac',
  lost: '#fca5a5',
  archived: 'rgba(255, 255, 255, 0.45)',
}

/**
 * @param {string} status
 * @returns {string}
 */
export function getLeadStatusChartColor(status) {
  return LEAD_STATUS_CHART_COLORS[status] ?? 'rgba(255, 122, 0, 0.75)'
}
