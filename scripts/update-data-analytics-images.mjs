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
const SLUG = 'data-analytics'

const CURATED = {
  hero: { source: 'unsplash', id: '1556155092-490a1ba16284' },
  overview: { source: 'pexels', id: 669620 },
  banner: { source: 'pexels', id: 669622 },
  features: { source: 'unsplash', id: '1554224155-6726b3ff858f' },
  tech: { source: 'pexels', id: 669618 },
  process: { source: 'unsplash', id: '1556761175-5973dc0f32e7' },
  benefits: { source: 'unsplash', id: '1553877522-43269d4ea984' },
  cta: { source: 'pexels', id: 7567496 },
  framework1: { source: 'unsplash', id: '1552664730-d307ca884978' },
  framework2: { source: 'pexels', id: 669609 },
  framework3: { source: 'unsplash', id: '1543286386-713bdd548da4' },
  framework4: { source: 'pexels', id: 7681092 },
  framework5: { source: 'pexels', id: 7681091 },
  clientBenefits: { source: 'unsplash', id: '1556761175-b413da4baf72' },
  implementationApproach: { source: 'unsplash', id: '1522071820081-009f0129c71c' },
  businessOutcomes: { source: 'pexels', id: 669616 },
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
  sources[SLUG][slot] = { ...entry, alt: serviceImageDescriptions[SLUG][slot] }
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
console.log('Data Analytics: 16 images updated')
