/**
 * Lightweight HTML sanitizer for CMS-authored TipTap content.
 * Strips scripts/events while keeping common editorial tags.
 * @param {string | null | undefined} html
 * @returns {string}
 */
export function sanitizeCmsHtml(html) {
  const raw = String(html ?? '')
  if (!raw.trim()) return ''

  return raw
    .replace(/<(script|iframe|object|embed|link|meta|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<(script|iframe|object|embed|link|meta|style)[^>]*\/?>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, ' $1="#"')
}
