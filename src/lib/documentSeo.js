/**
 * Apply resolved SEO + global verification tags to document.head.
 * @param {{
 *   title?: string,
 *   description?: string,
 *   canonical?: string,
 *   robots?: string,
 *   ogTitle?: string,
 *   ogDescription?: string,
 *   ogImage?: string,
 *   ogType?: string,
 *   twitterCard?: string,
 *   twitterTitle?: string,
 *   twitterDescription?: string,
 *   twitterImage?: string,
 *   jsonLd?: unknown,
 *   gscVerification?: string,
 *   bingVerification?: string,
 *   siteName?: string,
 * }} seo
 */
export function applyDocumentSeo(seo) {
  if (typeof document === 'undefined') return () => {}

  const previousTitle = document.title
  if (seo.title) document.title = seo.title

  /** @type {Array<() => void>} */
  const cleanups = []

  /**
   * @param {'name' | 'property'} kind
   * @param {string} key
   * @param {string} content
   */
  const upsertMeta = (kind, key, content) => {
    const value = String(content ?? '').trim()
    let el = document.head.querySelector(`meta[${kind}="${key}"]`)

    if (!value) {
      if (el) el.remove()
      return
    }

    let created = false
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute(kind, key)
      document.head.appendChild(el)
      created = true
    }
    const previous = el.getAttribute('content')
    el.setAttribute('content', value)
    cleanups.push(() => {
      if (created) {
        el?.remove()
        return
      }
      if (previous == null) el?.removeAttribute('content')
      else el?.setAttribute('content', previous)
    })
  }

  upsertMeta('name', 'description', seo.description || '')
  upsertMeta('name', 'robots', seo.robots || '')
  upsertMeta('property', 'og:title', seo.ogTitle || seo.title || '')
  upsertMeta('property', 'og:description', seo.ogDescription || seo.description || '')
  upsertMeta('property', 'og:image', seo.ogImage || '')
  upsertMeta('property', 'og:type', seo.ogType || 'website')
  upsertMeta('property', 'og:site_name', seo.siteName || '')
  upsertMeta('name', 'twitter:card', seo.twitterCard || 'summary_large_image')
  upsertMeta('name', 'twitter:title', seo.twitterTitle || seo.ogTitle || seo.title || '')
  upsertMeta(
    'name',
    'twitter:description',
    seo.twitterDescription || seo.ogDescription || seo.description || ''
  )
  upsertMeta('name', 'twitter:image', seo.twitterImage || seo.ogImage || '')
  upsertMeta('name', 'google-site-verification', seo.gscVerification || '')
  upsertMeta('name', 'msvalidate.01', seo.bingVerification || '')

  if (seo.canonical) {
    let link = document.head.querySelector('link[rel="canonical"]')
    let created = false
    if (!link) {
      link = document.createElement('link')
      link.setAttribute('rel', 'canonical')
      document.head.appendChild(link)
      created = true
    }
    link.setAttribute('href', seo.canonical)
    cleanups.push(() => {
      if (created) link?.remove()
    })
  }

  if (seo.jsonLd != null && seo.jsonLd !== '') {
    let script = document.getElementById('flairestack-jsonld')
    let created = false
    if (!script) {
      script = document.createElement('script')
      script.id = 'flairestack-jsonld'
      script.type = 'application/ld+json'
      document.head.appendChild(script)
      created = true
    }
    script.textContent =
      typeof seo.jsonLd === 'string' ? seo.jsonLd : JSON.stringify(seo.jsonLd)
    cleanups.push(() => {
      if (created) script?.remove()
    })
  }

  return () => {
    document.title = previousTitle
    cleanups.forEach((fn) => fn())
  }
}

/**
 * @param {Record<string, string | null | undefined>} globals
 */
export function applyAnalyticsTags(globals) {
  if (typeof document === 'undefined') return

  const gtm = String(globals.google_tag_manager_id ?? '').trim()
  const ga = String(globals.google_analytics_id ?? '').trim()
  const clarity = String(globals.microsoft_clarity_id ?? '').trim()
  const pixel = String(globals.meta_pixel_id ?? '').trim()

  if (gtm && !document.getElementById('flairestack-gtm')) {
    const script = document.createElement('script')
    script.id = 'flairestack-gtm'
    script.textContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`
    document.head.appendChild(script)
  }

  if (ga && !document.getElementById('flairestack-ga')) {
    const script = document.createElement('script')
    script.id = 'flairestack-ga'
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`
    document.head.appendChild(script)
    const inline = document.createElement('script')
    inline.id = 'flairestack-ga-inline'
    inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`
    document.head.appendChild(inline)
  }

  if (clarity && !document.getElementById('flairestack-clarity')) {
    const script = document.createElement('script')
    script.id = 'flairestack-clarity'
    script.textContent = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");`
    document.head.appendChild(script)
  }

  if (pixel && !document.getElementById('flairestack-pixel')) {
    const script = document.createElement('script')
    script.id = 'flairestack-pixel'
    script.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`
    document.head.appendChild(script)
  }
}
