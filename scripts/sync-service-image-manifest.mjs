/**
 * Migrates serviceImages.manifest.json:
 * - Renames legacy case1/2/3 slots to content-focused sections
 * - Syncs all alt text from serviceImageAlts.json
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { CASE_SLOT_MIGRATION, LEGACY_CASE_SLOTS } from '../src/data/serviceImageDescriptions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MANIFEST_PATH = path.join(__dirname, '..', 'src', 'data', 'serviceImages.manifest.json')
const ALTS_PATH = path.join(__dirname, '..', 'src', 'data', 'serviceImageAlts.json')

const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'))
const alts = JSON.parse(await fs.readFile(ALTS_PATH, 'utf8'))

for (const [slug, slots] of Object.entries(manifest)) {
  const slugAlts = alts[slug]
  if (!slugAlts) {
    console.warn(`No alts for ${slug}, skipping`)
    continue
  }

  for (const legacy of LEGACY_CASE_SLOTS) {
    if (!slots[legacy]) continue
    const nextSlot = CASE_SLOT_MIGRATION[legacy]
    slots[nextSlot] = {
      ...slots[legacy],
      path: `/images/services/${slug}/${nextSlot}.webp`,
      alt: slugAlts[nextSlot] ?? slots[legacy].alt,
    }
    delete slots[legacy]
  }

  for (const [slot, entry] of Object.entries(slots)) {
    if (slugAlts[slot]) {
      entry.alt = slugAlts[slot]
    }
    entry.path = `/images/services/${slug}/${slot}.webp`
  }
}

await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2))
console.log(`Updated ${MANIFEST_PATH}`)
