/**
 * Pure public-visibility rules for blog posts.
 * Drafts are never public. Published posts are public once published_at is set
 * and not in the future (scheduled/future-dated remain hidden).
 *
 * @param {{
 *   status?: unknown,
 *   published_at?: unknown,
 * } | null | undefined} row
 * @param {Date} [now]
 * @returns {boolean}
 */
export function isPubliclyVisibleBlogPost(row, now = new Date()) {
  if (!row || typeof row !== 'object') return false
  if (String(row.status ?? '') !== 'published') return false
  if (row.published_at == null || row.published_at === '') return false
  const publishedAt = new Date(String(row.published_at))
  if (Number.isNaN(publishedAt.getTime())) return false
  return publishedAt.getTime() <= now.getTime()
}
