'use client'

import Script from 'next/script'
import type { PublicSiteSettings } from '@/lib/next/buildPublicSiteSettings'

/** Only allow typical analytics ID characters (prevents script injection from CMS fields). */
function safeAnalyticsId(value: string): string {
  const trimmed = value.trim()
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : ''
}

/**
 * Next-compatible analytics loading (parity with Vite applyAnalyticsTags).
 * Loads at most once per ID via stable Script ids. Skips empty/invalid config.
 */
export default function PublicAnalytics({ settings }: { settings: PublicSiteSettings }) {
  const gtm = safeAnalyticsId(settings.google_tag_manager_id)
  const ga = safeAnalyticsId(settings.google_analytics_id)
  const clarity = safeAnalyticsId(settings.microsoft_clarity_id)
  const pixel = safeAnalyticsId(settings.meta_pixel_id)

  return (
    <>
      {gtm ? (
        <Script id="flairestack-gtm" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');
          `}</Script>
      ) : null}

      {ga ? (
        <>
          <Script
            id="flairestack-ga"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`}
            strategy="afterInteractive"
          />
          <Script id="flairestack-ga-inline" strategy="afterInteractive">{`
              window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
              gtag('js',new Date());gtag('config','${ga}');
            `}</Script>
        </>
      ) : null}

      {clarity ? (
        <Script id="flairestack-clarity" strategy="afterInteractive">{`
            (function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarity}");
          `}</Script>
      ) : null}

      {pixel ? (
        <Script id="flairestack-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${pixel}');fbq('track','PageView');
          `}</Script>
      ) : null}
    </>
  )
}
