/**
 * Downloads curated service images from Pexels/Unsplash into public/images/services/
 * Run: npm run download:service-images
 */
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'images', 'services')
const MANIFEST_SRC = path.join(__dirname, 'service-image-sources.json')
const MANIFEST_OUT = path.join(ROOT, 'src', 'data', 'serviceImages.manifest.json')

const SLOTS = [
  'hero', 'overview', 'banner', 'features', 'tech', 'process', 'benefits', 'cta',
  'framework1', 'framework2', 'framework3', 'framework4', 'framework5',
  'clientBenefits', 'implementationApproach', 'businessOutcomes',
]

function sourceUrl(entry) {
  if (entry.source === 'unsplash') {
    return `https://images.unsplash.com/${entry.id}?auto=format&fit=crop&w=1400&h=900&q=88`
  }
  return `https://images.pexels.com/photos/${entry.id}/pexels-photo-${entry.id}.jpeg?auto=compress&cs=tinysrgb&w=1400&h=900&fit=crop`
}

/** Cinematic enterprise grade: darker, warmer, higher contrast */
async function gradeAndSave(buffer, destPath) {
  await sharp(buffer)
    .resize(1920, 1080, { fit: 'cover', position: 'attention' })
    .modulate({ brightness: 0.88, saturation: 0.82 })
    .linear(1.08, -(102 * 0.08))
    .webp({ quality: 88 })
    .toFile(destPath)
}

async function downloadEntry(entry) {
  const res = await fetch(sourceUrl(entry), {
    headers: { 'User-Agent': 'FlaireStack/1.0 (curated image downloader)' },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const sources = JSON.parse(await fs.readFile(MANIFEST_SRC, 'utf8'))
  await fs.mkdir(OUT_DIR, { recursive: true })

  const manifest = {}
  let ok = 0
  let fail = 0

  for (const [slug, slots] of Object.entries(sources)) {
    const dir = path.join(OUT_DIR, slug)
    await fs.mkdir(dir, { recursive: true })
    manifest[slug] = {}
    console.log(`\n[${slug}]`)

    for (const slot of SLOTS) {
      const entry = slots[slot]
      if (!entry) {
        console.error(`  ✗ ${slot}: missing in manifest`)
        fail++
        continue
      }
      const dest = path.join(dir, `${slot}.webp`)
      const publicPath = `/images/services/${slug}/${slot}.webp`

      try {
        const buf = await downloadEntry(entry)
        await gradeAndSave(buf, dest)
        manifest[slug][slot] = { path: publicPath, alt: entry.alt, ...entry }
        console.log(`  ✓ ${slot} (${entry.source}:${entry.id})`)
        ok++
      } catch (err) {
        console.error(`  ✗ ${slot}: ${err.message}`)
        fail++
      }
      await new Promise((r) => setTimeout(r, 120))
    }
  }

  await fs.writeFile(MANIFEST_OUT, JSON.stringify(manifest, null, 2))
  console.log(`\nDone: ${ok} saved, ${fail} failed`)
  console.log(`Manifest: ${MANIFEST_OUT}`)
  if (fail > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
