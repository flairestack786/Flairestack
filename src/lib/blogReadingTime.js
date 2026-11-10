/**
 * Estimate reading time from HTML or plain text (~200 wpm).
 * @param {string | null | undefined} htmlOrText
 * @returns {number} minutes (min 1)
 */
export function estimateReadingTimeMinutes(htmlOrText) {
  const raw = String(htmlOrText ?? '')
  const text = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) return 1
  const words = text.split(' ').filter(Boolean).length
  return Math.min(120, Math.max(1, Math.ceil(words / 200)))
}
