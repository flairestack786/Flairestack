/** SEO analysis utilities — scoring, validation, previews (no I/O). */

export const SEO_TITLE_MIN = 30
export const SEO_TITLE_MAX = 60
export const SEO_DESC_MIN = 120
export const SEO_DESC_MAX = 160

/**
 * @param {unknown} value
 * @returns {string}
 */
function asString(value) {
  return typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
}

/**
 * @param {Record<string, unknown>} seo
 */
export function getEffectiveTitle(seo) {
  return asString(seo.meta_title || seo.og_title || seo.twitter_title)
}

/**
 * @param {Record<string, unknown>} seo
 */
export function getEffectiveDescription(seo) {
  return asString(seo.meta_description || seo.og_description || seo.twitter_description)
}

/**
 * @param {string} jsonText
 * @returns {{ ok: boolean, value?: unknown, error?: string }}
 */
export function parseStructuredDataInput(jsonText) {
  const raw = asString(jsonText)
  if (!raw) return { ok: true, value: {} }
  try {
    const parsed = JSON.parse(raw)
    if (parsed && (typeof parsed === 'object')) {
      return { ok: true, value: parsed }
    }
    return { ok: false, error: 'JSON-LD must be a JSON object or array.' }
  } catch (err) {
    return { ok: false, error: err?.message ?? 'Invalid JSON-LD.' }
  }
}

/**
 * @param {unknown} structuredData
 * @returns {string}
 */
export function stringifyStructuredData(structuredData) {
  if (structuredData == null) return ''
  if (typeof structuredData === 'string') return structuredData
  try {
    return JSON.stringify(structuredData, null, 2)
  } catch {
    return ''
  }
}

/**
 * @typedef {{
 *   id: string,
 *   severity: 'error' | 'warning' | 'success',
 *   code: string,
 *   message: string,
 * }} SeoIssue
 */

/**
 * @param {Record<string, unknown>} seo
 * @param {{
 *   duplicates?: { titles?: Set<string>, descriptions?: Set<string>, selfTitle?: string, selfDescription?: string },
 *   siteUrl?: string,
 * }} [context]
 * @returns {SeoIssue[]}
 */
export function validateSeo(seo, context = {}) {
  /** @type {SeoIssue[]} */
  const issues = []
  const title = getEffectiveTitle(seo)
  const description = getEffectiveDescription(seo)
  const canonical = asString(seo.canonical_url)
  const focus = asString(seo.focus_keyword).toLowerCase()
  const ogImage = seo.og_image_id || seo.og_image_url || seo.og_image_path
  const twitterImage = seo.twitter_image_id || seo.twitter_image_url || seo.twitter_image_path

  if (!title) {
    issues.push({
      id: 'title-missing',
      severity: 'error',
      code: 'title_missing',
      message: 'Meta title is missing.',
    })
  } else {
    if (title.length < SEO_TITLE_MIN) {
      issues.push({
        id: 'title-short',
        severity: 'warning',
        code: 'title_short',
        message: `Meta title is short (${title.length}/${SEO_TITLE_MIN}–${SEO_TITLE_MAX} recommended).`,
      })
    } else if (title.length > SEO_TITLE_MAX) {
      issues.push({
        id: 'title-long',
        severity: 'warning',
        code: 'title_long',
        message: `Meta title may truncate in Google (${title.length} > ${SEO_TITLE_MAX}).`,
      })
    } else {
      issues.push({
        id: 'title-ok',
        severity: 'success',
        code: 'title_ok',
        message: 'Meta title length looks good.',
      })
    }
  }

  if (!description) {
    issues.push({
      id: 'desc-missing',
      severity: 'error',
      code: 'description_missing',
      message: 'Meta description is missing.',
    })
  } else if (description.length < SEO_DESC_MIN) {
    issues.push({
      id: 'desc-short',
      severity: 'warning',
      code: 'description_short',
      message: `Meta description is short (${description.length}/${SEO_DESC_MIN}–${SEO_DESC_MAX}).`,
    })
  } else if (description.length > SEO_DESC_MAX) {
    issues.push({
      id: 'desc-long',
      severity: 'warning',
      code: 'description_long',
      message: `Meta description may truncate (${description.length} > ${SEO_DESC_MAX}).`,
    })
  } else {
    issues.push({
      id: 'desc-ok',
      severity: 'success',
      code: 'description_ok',
      message: 'Meta description length looks good.',
    })
  }

  if (!canonical) {
    issues.push({
      id: 'canonical-missing',
      severity: 'warning',
      code: 'canonical_missing',
      message: 'Canonical URL is missing.',
    })
  } else {
    try {
      // eslint-disable-next-line no-new
      new URL(canonical)
      issues.push({
        id: 'canonical-ok',
        severity: 'success',
        code: 'canonical_ok',
        message: 'Canonical URL is set.',
      })
    } catch {
      issues.push({
        id: 'canonical-invalid',
        severity: 'error',
        code: 'canonical_invalid',
        message: 'Canonical URL is not a valid absolute URL.',
      })
    }
  }

  if (!ogImage && !twitterImage) {
    issues.push({
      id: 'image-missing',
      severity: 'warning',
      code: 'image_missing',
      message: 'No Open Graph or Twitter image is set.',
    })
  } else {
    issues.push({
      id: 'image-ok',
      severity: 'success',
      code: 'image_ok',
      message: 'Social preview image is set.',
    })
  }

  const structuredRaw = seo.structured_data_text ?? stringifyStructuredData(seo.structured_data)
  const parsed = parseStructuredDataInput(String(structuredRaw ?? ''))
  if (!parsed.ok) {
    issues.push({
      id: 'jsonld-invalid',
      severity: 'error',
      code: 'jsonld_invalid',
      message: parsed.error || 'JSON-LD is invalid.',
    })
  } else if (asString(structuredRaw)) {
    issues.push({
      id: 'jsonld-ok',
      severity: 'success',
      code: 'jsonld_ok',
      message: 'JSON-LD parses correctly.',
    })
  }

  if (focus) {
    const inTitle = title.toLowerCase().includes(focus)
    const inDesc = description.toLowerCase().includes(focus)
    if (!inTitle && !inDesc) {
      issues.push({
        id: 'keyword-missing',
        severity: 'warning',
        code: 'keyword_missing',
        message: 'Focus keyword does not appear in title or description.',
      })
    } else {
      issues.push({
        id: 'keyword-ok',
        severity: 'success',
        code: 'keyword_ok',
        message: 'Focus keyword appears in title or description.',
      })
    }
  }

  const dupTitles = context.duplicates?.titles
  const dupDescs = context.duplicates?.descriptions
  const selfTitle = (context.duplicates?.selfTitle ?? title).toLowerCase()
  const selfDesc = (context.duplicates?.selfDescription ?? description).toLowerCase()

  if (title && dupTitles?.has(selfTitle) && (dupTitles.get?.(selfTitle) ?? 0) > 1) {
    issues.push({
      id: 'title-duplicate',
      severity: 'error',
      code: 'title_duplicate',
      message: 'Meta title is duplicated on another page.',
    })
  }

  if (description && dupDescs?.has(selfDesc) && (dupDescs.get?.(selfDesc) ?? 0) > 1) {
    issues.push({
      id: 'desc-duplicate',
      severity: 'error',
      code: 'description_duplicate',
      message: 'Meta description is duplicated on another page.',
    })
  }

  return issues
}

/**
 * Count map helper for duplicate detection across entities.
 * @param {Record<string, unknown>[]} rows
 * @param {(row: Record<string, unknown>) => string} picker
 * @returns {Map<string, number>}
 */
export function buildDuplicateCounts(rows, picker) {
  /** @type {Map<string, number>} */
  const counts = new Map()
  for (const row of rows) {
    const key = asString(picker(row)).toLowerCase()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return counts
}

/**
 * @param {SeoIssue[]} issues
 * @returns {number} 0–100
 */
export function scoreSeoFromIssues(issues) {
  let score = 100
  for (const issue of issues) {
    if (issue.severity === 'success') continue
    if (issue.severity === 'error') score -= 18
    if (issue.severity === 'warning') score -= 8
  }
  return Math.max(0, Math.min(100, score))
}

/**
 * @param {number} score
 * @returns {'excellent' | 'good' | 'needs-work' | 'poor'}
 */
export function getSeoScoreBand(score) {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 45) return 'needs-work'
  return 'poor'
}

/**
 * @param {Record<string, unknown>} seo
 * @param {Parameters<typeof validateSeo>[1]} [context]
 */
export function analyzeSeo(seo, context) {
  const issues = validateSeo(seo, context)
  const score = scoreSeoFromIssues(issues)
  return {
    issues,
    score,
    band: getSeoScoreBand(score),
    errors: issues.filter((i) => i.severity === 'error'),
    warnings: issues.filter((i) => i.severity === 'warning'),
    successes: issues.filter((i) => i.severity === 'success'),
  }
}

/**
 * Aggregate dashboard health from analyzed entities.
 * @param {Array<Record<string, unknown> & { analysis?: ReturnType<typeof analyzeSeo> }>} entities
 */
export function summarizeSeoHealth(entities) {
  const total = entities.length
  const scored = entities.map((entity) => entity.analysis?.score ?? Number(entity.seo_score) ?? 0)
  const avg = total ? Math.round(scored.reduce((sum, n) => sum + n, 0) / total) : 0

  let excellent = 0
  let good = 0
  let needsWork = 0
  let poor = 0
  let errorCount = 0
  let warningCount = 0
  let missingTitle = 0
  let missingDescription = 0
  let missingCanonical = 0
  let missingImage = 0
  let missingOgImage = 0
  let missingTwitterImage = 0
  let missingFocusKeyword = 0
  let invalidJsonLd = 0
  let duplicateTitles = 0
  let duplicateDescriptions = 0
  let missingMetadata = 0

  /** @type {Record<string, number>} */
  const issueCodes = {}

  for (const entity of entities) {
    const analysis = entity.analysis
    const score = analysis?.score ?? Number(entity.seo_score) ?? 0
    const band = analysis?.band ?? getSeoScoreBand(score)
    if (band === 'excellent') excellent += 1
    else if (band === 'good') good += 1
    else if (band === 'needs-work') needsWork += 1
    else poor += 1

    const form = entity.effectiveForm ?? entity.form ?? {}
    const hasOg = Boolean(String(form.og_image_path || form.og_image_id || '').trim())
    const hasTw = Boolean(String(form.twitter_image_path || form.twitter_image_id || '').trim())
    const hasFocus = Boolean(String(form.focus_keyword || '').trim())
    const hasTitle = Boolean(String(form.meta_title || '').trim())
    const hasDesc = Boolean(String(form.meta_description || '').trim())
    if (!hasOg) missingOgImage += 1
    if (!hasTw) missingTwitterImage += 1
    if (!hasFocus) missingFocusKeyword += 1
    if (!hasTitle || !hasDesc) missingMetadata += 1

    for (const issue of analysis?.issues ?? []) {
      if (issue.severity === 'success') continue
      issueCodes[issue.code] = (issueCodes[issue.code] ?? 0) + 1
      if (issue.severity === 'error') errorCount += 1
      if (issue.severity === 'warning') warningCount += 1
      if (issue.code === 'title_missing') missingTitle += 1
      if (issue.code === 'description_missing') missingDescription += 1
      if (issue.code === 'canonical_missing') missingCanonical += 1
      if (issue.code === 'image_missing') missingImage += 1
      if (issue.code === 'jsonld_invalid') invalidJsonLd += 1
      if (issue.code === 'title_duplicate') duplicateTitles += 1
      if (issue.code === 'description_duplicate') duplicateDescriptions += 1
    }
  }

  return {
    total,
    averageScore: avg,
    band: getSeoScoreBand(avg),
    distribution: { excellent, good, needsWork, poor },
    errorCount,
    warningCount,
    issueCodes,
    missingTitle,
    missingDescription,
    missingCanonical,
    missingImage,
    missingOgImage,
    missingTwitterImage,
    missingFocusKeyword,
    missingMetadata,
    invalidJsonLd,
    duplicateTitles,
    duplicateDescriptions,
    healthyCount: excellent + good,
    attentionCount: needsWork + poor,
    optimizedPages: excellent + good,
    progressPercent: total ? Math.round(((excellent + good) / total) * 100) : 0,
  }
}
