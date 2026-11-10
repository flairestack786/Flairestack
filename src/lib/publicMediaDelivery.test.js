import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  MEDIA_SIZE_PRESETS,
  MEDIA_TRANSFORM_WIDTHS,
  areSupabaseImageTransformsEnabled,
  buildResponsiveMediaSource,
  buildTransformedMediaUrl,
  canTransformPublicMedia,
  cmsResponsiveImgProps,
  isSupabaseSiteMediaUrl,
  snapTransformWidth,
} from './publicMediaDelivery.js'

const OBJECT_URL =
  'https://xyzcompany.supabase.co/storage/v1/object/public/site-media/hero/office.png'
const JPEG_URL =
  'https://xyzcompany.supabase.co/storage/v1/object/public/site-media/hero/office.jpg'

test('detects site-media object URLs and skips local/SVG/video', () => {
  assert.equal(isSupabaseSiteMediaUrl(OBJECT_URL), true)
  assert.equal(isSupabaseSiteMediaUrl('/images/services/web-development/hero.webp'), false)
  assert.equal(canTransformPublicMedia(OBJECT_URL), areSupabaseImageTransformsEnabled())
  assert.equal(canTransformPublicMedia('https://cdn.example/site-media/x.svg'), false)
  assert.equal(canTransformPublicMedia(`${OBJECT_URL.replace('.png', '.mp4')}`), false)
  assert.equal(canTransformPublicMedia(OBJECT_URL.replace('.png', '.svg')), false)
  assert.equal(canTransformPublicMedia(OBJECT_URL.replace('.png', '.gif')), false)
})

test('snapTransformWidth only emits controlled allowlist values', () => {
  assert.equal(snapTransformWidth(50), 64)
  assert.equal(snapTransformWidth(800), 960)
  assert.equal(snapTransformWidth(1920), 1920)
  assert.equal(snapTransformWidth(4000), 1920)
  for (const width of MEDIA_TRANSFORM_WIDTHS) {
    assert.equal(snapTransformWidth(width), width)
  }
})

test('buildTransformedMediaUrl rewrites to render/image with snapped width/quality', () => {
  if (!areSupabaseImageTransformsEnabled()) {
    assert.equal(buildTransformedMediaUrl(OBJECT_URL, { width: 800 }), OBJECT_URL)
    return
  }

  const url = buildTransformedMediaUrl(OBJECT_URL, { width: 800, quality: 70 })
  assert.match(url, /\/storage\/v1\/render\/image\/public\/site-media\//)
  assert.match(url, /width=960/) // 800 snaps to 960
  assert.match(url, /quality=70/)
  assert.match(url, /resize=contain/)
  assert.match(url, /format=origin/) // PNG keeps alpha
  assert.doesNotMatch(url, /\/object\/public\//)

  const jpeg = buildTransformedMediaUrl(JPEG_URL, { width: 640, quality: 72 })
  assert.match(jpeg, /width=640/)
  assert.doesNotMatch(jpeg, /format=origin/)
})

test('buildResponsiveMediaSource emits srcset for multiple widths', () => {
  if (!areSupabaseImageTransformsEnabled()) {
    const source = buildResponsiveMediaSource(OBJECT_URL, { widths: [640, 1280] })
    assert.equal(source.src, OBJECT_URL)
    assert.equal(source.srcSet, undefined)
    return
  }

  const source = buildResponsiveMediaSource(OBJECT_URL, { widths: [640, 1280], quality: 75 })
  assert.match(source.src, /width=1280/)
  assert.match(source.srcSet ?? '', /640w/)
  assert.match(source.srcSet ?? '', /1280w/)
})

test('presets only use allowlisted widths', () => {
  const allowed = new Set(MEDIA_TRANSFORM_WIDTHS)
  for (const [name, preset] of Object.entries(MEDIA_SIZE_PRESETS)) {
    assert.ok(preset.widths.length >= 2, `${name} should offer multiple widths`)
    assert.ok(preset.widths.length <= 4, `${name} should stay within a small width set`)
    for (const width of preset.widths) {
      assert.ok(allowed.has(width), `${name} width ${width} not in allowlist`)
    }
    assert.ok(typeof preset.sizes === 'string' && preset.sizes.length > 0)
  }
})

test('local public assets are left unchanged', () => {
  const local = '/images/services/cloud-strategy/hero.webp'
  assert.equal(buildTransformedMediaUrl(local, { width: 800 }), local)
  const source = buildResponsiveMediaSource(local, { widths: [640, 1280] })
  assert.equal(source.src, local)
  assert.equal(source.srcSet, undefined)
})

test('cmsResponsiveImgProps includes sizes when transforms are on', () => {
  const props = cmsResponsiveImgProps(OBJECT_URL, 'avatar')
  assert.ok(props.src)
  if (areSupabaseImageTransformsEnabled()) {
    assert.match(props.srcSet ?? '', /64w/)
    assert.equal(props.sizes, '52px')
  } else {
    assert.equal(props.srcSet, undefined)
  }
})

test('kill switch restores original object URLs', () => {
  const previous = process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS
  process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS = '0'
  try {
    assert.equal(areSupabaseImageTransformsEnabled(), false)
    assert.equal(canTransformPublicMedia(OBJECT_URL), false)
    assert.equal(buildTransformedMediaUrl(OBJECT_URL, { width: 960 }), OBJECT_URL)
    const source = buildResponsiveMediaSource(OBJECT_URL, { widths: [640, 960] })
    assert.equal(source.src, OBJECT_URL)
    assert.equal(source.srcSet, undefined)
    const props = cmsResponsiveImgProps(OBJECT_URL, 'hero')
    assert.equal(props.src, OBJECT_URL)
    assert.equal(props.srcSet, undefined)
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS
    else process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORMS = previous
  }
})

test('transformed URLs keep the unique object key path for immutable replacements', () => {
  if (!areSupabaseImageTransformsEnabled()) return
  const unique =
    'https://xyzcompany.supabase.co/storage/v1/object/public/site-media/hero/office-a1b2c3d4.png'
  const url = buildTransformedMediaUrl(unique, { width: 960 })
  assert.match(url, /hero\/office-a1b2c3d4\.png/)
  assert.match(url, /\/render\/image\/public\/site-media\//)
  assert.doesNotMatch(url, /\/object\/public\//)
})
