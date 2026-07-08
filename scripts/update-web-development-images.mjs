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
const SLUG = 'web-development'

const CURATED = {
  hero: 1181678,
  overview: 3183170,
  banner: 3184455,
  features: 4164416,
  tech: 4974915,
  process: 4164417,
  benefits: 7688339,
  cta: 6476586,
  framework1: 4974914,
  framework2: 270631,
  framework3: 577584,
  framework4: 6476588,
  framework5: 4164419,
  clientBenefits: 270634,
  implementationApproach: 3183173,
  businessOutcomes: 196645,
}

function sourceUrl(id) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop`
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
  sources[SLUG][slot] = {
    source: 'pexels',
    id: CURATED[slot],
    alt: serviceImageDescriptions[SLUG][slot],
  }
}
await fs.writeFile(SOURCES, JSON.stringify(sources, null, 2))

const dir = path.join(ROOT, 'public', 'images', 'services', SLUG)
await fs.mkdir(dir, { recursive: true })

for (const slot of IMAGE_SLOTS) {
  const entry = sources[SLUG][slot]
  const dest = path.join(dir, `${slot}.webp`)
  const res = await fetch(sourceUrl(entry.id), { headers: { 'User-Agent': 'FlaireStack/1.0' }, redirect: 'follow' })
  if (!res.ok) throw new Error(`${slot}: HTTP ${res.status}`)
  await gradeAndSave(Buffer.from(await res.arrayBuffer()), dest)
  manifest[SLUG][slot] = { path: `/images/services/${SLUG}/${slot}.webp`, ...entry }
  console.log(`✓ ${slot} (${entry.id})`)
}

await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2))
console.log('Web Development: 16 images updated')
