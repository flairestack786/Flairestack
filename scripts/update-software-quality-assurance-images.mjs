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
const SLUG = 'software-quality-assurance'

const CURATED = {
  hero: 1181263,
  overview: 7688338,
  banner: 777001,
  features: 4974913,
  tech: 3861980,
  process: 6476589,
  benefits: 3861970,
  cta: 3184290,
  framework1: 3861976,
  framework2: 577585,
  framework3: 7567445,
  framework4: 265087,
  framework5: 3184314,
  clientBenefits: 572056,
  implementationApproach: 3184313,
  businessOutcomes: 6476585,
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
console.log('Software Quality Assurance: 16 images updated')
