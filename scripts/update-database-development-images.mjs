import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { serviceImageDescriptions, IMAGE_SLOTS } from '../src/data/serviceImageDescriptions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const SOURCES = path.join(__dirname, 'service-image-sources.json')
const MANIFEST = path.join(ROOT, 'src', 'data', 'serviceImages.manifest.json')
const ALTS = path.join(ROOT, 'src', 'data', 'serviceImageAlts.json')
const SLUG = 'database-development'

/** Pexels + Unsplash — royalty-free photography only (no AI-generated art). */
const CURATED = {
  hero: { source: 'pexels', id: 1148821 },
  overview: { source: 'pexels', id: 442152 },
  banner: { source: 'pexels', id: 1148819 },
  features: { source: 'pexels', id: 1181675 },
  tech: { source: 'pexels', id: 442151 },
  process: { source: 'pexels', id: 442158 },
  benefits: { source: 'unsplash', id: '1517694712202-14dd9538aa97' },
  cta: { source: 'pexels', id: 442159 },
  framework1: { source: 'unsplash', id: '1555066931-4365d14bab8c' },
  framework2: { source: 'unsplash', id: '1555949963-ff9fe0c870eb' },
  framework3: { source: 'unsplash', id: '1509966756634-9c23dd6e6815' },
  framework4: { source: 'unsplash', id: '1629654297299-c8506221ca97' },
  framework5: { source: 'unsplash', id: '1517180102446-f3ece451e9d8' },
  clientBenefits: { source: 'pexels', id: 442153 },
  implementationApproach: { source: 'unsplash', id: '1555949963-aa79dcee981c' },
  businessOutcomes: { source: 'unsplash', id: '1544383835-bda2bc66a55d' },
}

function sourceUrl(entry) {
  if (entry.source === 'unsplash') {
    return `https://images.unsplash.com/photo-${entry.id}?auto=format&fit=crop&w=1920&h=1080&q=88`
  }
  return `https://images.pexels.com/photos/${entry.id}/pexels-photo-${entry.id}.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop`
}

async function gradeAndSave(buffer, destPath) {
  await sharp(buffer)
    .resize(1920, 1080, { fit: 'cover', position: 'attention' })
    .modulate({ brightness: 0.88, saturation: 0.82 })
    .linear(1.08, -(102 * 0.08))
    .webp({ quality: 88 })
    .toFile(destPath)
}

const alts = {}
for (const [slug, slots] of Object.entries(serviceImageDescriptions)) {
  alts[slug] = { ...slots }
}
await fs.writeFile(ALTS, JSON.stringify(alts, null, 2))

const sources = JSON.parse(await fs.readFile(SOURCES, 'utf8'))
const manifest = JSON.parse(await fs.readFile(MANIFEST, 'utf8'))

sources[SLUG] = {}
for (const slot of IMAGE_SLOTS) {
  const entry = CURATED[slot]
  sources[SLUG][slot] = {
    ...entry,
    alt: serviceImageDescriptions[SLUG][slot],
  }
}
await fs.writeFile(SOURCES, JSON.stringify(sources, null, 2))

const dir = path.join(ROOT, 'public', 'images', 'services', SLUG)
await fs.mkdir(dir, { recursive: true })

for (const slot of IMAGE_SLOTS) {
  const entry = sources[SLUG][slot]
  const dest = path.join(dir, `${slot}.webp`)
  const res = await fetch(sourceUrl(entry), { headers: { 'User-Agent': 'FlaireStack/1.0' }, redirect: 'follow' })
  if (!res.ok) throw new Error(`${slot}: HTTP ${res.status}`)
  await gradeAndSave(Buffer.from(await res.arrayBuffer()), dest)
  manifest[SLUG][slot] = { path: `/images/services/${SLUG}/${slot}.webp`, ...entry }
  console.log(`✓ ${slot} (${entry.source}:${entry.id})`)
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2))
console.log('Database Development: 16 images updated')
