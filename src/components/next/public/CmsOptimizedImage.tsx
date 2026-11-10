'use client'

import { useMemo, type CSSProperties } from 'react'
import { MEDIA_SIZE_PRESETS, buildResponsiveMediaSource } from '@/lib/publicMediaDelivery'
import { getPublicMediaUrl } from '@/lib/next/publicMediaUrl'

type PresetName = keyof typeof MEDIA_SIZE_PRESETS

type CmsOptimizedImageProps = {
  src?: string | null
  alt?: string
  className?: string
  style?: CSSProperties
  preset?: PresetName
  widths?: number[]
  sizes?: string
  quality?: number
  priority?: boolean
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'auto' | 'sync'
  width?: number
  height?: number
  fetchPriority?: 'high' | 'low' | 'auto'
}

function resolveObjectUrl(path: string) {
  return getPublicMediaUrl(path)
}

/**
 * Public CMS image that prefers Supabase Image Transformations (resized)
 * so browsers download far fewer bytes than the Storage original.
 * Falls back to the original URL for local assets, SVG, video, or when transforms
 * are disabled via NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS=0.
 */
export default function CmsOptimizedImage({
  src,
  alt = '',
  className,
  style,
  preset = 'card',
  widths,
  sizes,
  quality,
  priority = false,
  loading,
  decoding = 'async',
  width,
  height,
  fetchPriority,
}: CmsOptimizedImageProps) {
  const value = String(src ?? '').trim()
  const presetConfig = MEDIA_SIZE_PRESETS[preset] || MEDIA_SIZE_PRESETS.card

  // Memoize so React rerenders do not rebuild URL strings / trigger img reload churn.
  const source = useMemo(() => {
    if (!value) return { src: '', srcSet: undefined as string | undefined }
    return buildResponsiveMediaSource(value, {
      widths: widths || presetConfig.widths,
      quality: quality ?? presetConfig.quality,
      resize: 'contain',
      resolveObjectUrl,
    })
  }, [value, widths, quality, presetConfig.widths, presetConfig.quality])

  if (!value || !source.src) return null

  // Intentionally not next/image: the optimizer would still download full
  // originals from Supabase Storage on cache miss (egress unchanged / worse).
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Supabase render/image cuts Storage egress; next/image does not
    <img
      src={source.src}
      srcSet={source.srcSet}
      sizes={source.srcSet ? sizes || presetConfig.sizes : undefined}
      alt={alt}
      className={className}
      style={style}
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      decoding={decoding}
      width={width}
      height={height}
      fetchPriority={fetchPriority ?? (priority ? 'high' : undefined)}
    />
  )
}
