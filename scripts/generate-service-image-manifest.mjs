/**
 * Generates scripts/service-image-sources.json with unique curated Pexels/Unsplash IDs per service slot.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  IMAGE_SLOTS,
  buildServiceImageAltsMap,
} from '../src/data/serviceImageDescriptions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'service-image-sources.json')
const ALTS_OUT = path.join(__dirname, '..', 'src', 'data', 'serviceImageAlts.json')

/** Verified Pexels IDs grouped by theme (no duplicates across groups) */
const POOLS = {
  web: [1181677, 3861969, 577585, 546819, 3184465, 574071, 4974912, 7688336, 3861972, 3194519, 7551619, 7374837, 4164418, 270632, 196644, 11035471],
  software: [3183150, 3184292, 3184296, 3184291, 3184339, 3184360, 3184460, 3184298, 3184302, 3184306, 3184312, 3184318, 3184324, 3184336, 3184342, 3184348, 7373592, 5943320, 3184285, 3184286],
  hosting: [325229, 1148820, 2599244, 259588, 230544, 152320, 1181200, 442150, 325562, 2582937, 8386421, 8386422, 8386423, 8386425, 8386426, 8386427],
  qa: [8850279, 572056, 777001, 442576, 791528, 713046, 196650, 3861970, 3861974, 3861976, 7567440, 7567441, 7567442, 7567462, 7567463, 7567464],
  mobile: [607812, 1092671, 699122, 404280, 1092644, 3184293, 3184294, 3184295, 47261, 3850250, 341523, 5077039, 887751, 3184304, 3184305, 3184307],
  consultancy: [669619, 265087, 7688460, 669996, 590016, 7567465, 7567466, 7567467, 7567468, 7567469, 7567470, 7567471, 7567472, 7567473, 7567474, 7567475],
  database: [8386440, 7723417, 8386434, 8386424, 8386428, 8386429, 8386430, 8386431, 8386432, 8386433, 8386435, 8386436, 8386437, 8386438, 8386439, 8386441],
  ecommerce: [5632402, 5632399, 5632401, 7567476, 7567477, 7567478, 7567479, 7567480, 7567481, 7567482, 7567483, 7567484, 7567485, 7567486, 7567487, 7567488],
  cloud: [8386442, 8386443, 8386444, 8386445, 8386446, 8386447, 8386448, 8386449, 8386450, 7723400, 7723401, 7723402, 7723403, 7723404, 7723405, 7723406],
  ai: [7723407, 7723409, 7723410, 7723411, 7723412, 7723413, 7723414, 7723415, 7723420, 7723421, 7723422, 7723423, 7723424, 7723425, 7723426, 7723427],
  analytics: [7723428, 7723429, 7723430, 7723431, 7723432, 7723433, 7723434, 7723435, 7723436, 7723437, 7723438, 7723439, 7723440, 7723441, 7723442, 7723443],
  bps: [7723444, 7723448, 7723449, 7723450, 7567489, 7567490, 7567491, 7567492, 7567493, 7567494, 7567495, 7567496, 7567497, 7567498, 7567499, 7567515],
  marketing: [7567517, 7567519, 7567520, 7658356, 7640793, 7621135, 6476589, 6205518, 6476234, 6476584, 6476592, 6476593, 6476594, 6476595, 6476596, 3861959],
  graphic: [102127, 291534, 3184287, 3184288, 3184289, 3184290, 3184308, 3184309, 3184310, 3184311, 3184313, 3184314, 3184315, 3184316, 3184317, 3184319],
  uiux: [3184320, 3184321, 3184322, 3184323, 3184325, 3184326, 3184327, 3184328, 3184331, 3184332, 3184333, 3184334, 3184335, 3184338, 3184340, 3184341],
  game: [4526697, 3945313, 3184343, 3184344, 3184345, 3184346, 3184347, 3184349, 3184350, 2747449, 3165332, 1107147, 1174746, 4004147, 4526698, 442504],
}

const UNSPLASH = {
  web: ['photo-1498050108023-c5249f4df085', 'photo-1547658719-da2b51169166'],
  software: ['photo-1522071820081-009f0129c71c', 'photo-1516321318423-f06f85e504b3'],
  hosting: ['photo-1550745165-9bc0b252726f'],
  qa: ['photo-1558494949-ef010cbdcc31'],
  mobile: ['photo-1586717791821-3f44a563fa4c', 'photo-1563013544-824ae1b704d3'],
  consultancy: ['photo-1600880292203-757bb62b4baf', 'photo-1454165804606-c3d57bc86b40', 'photo-1552664730-d307ca884978'],
  database: ['photo-1551288049-bebda4e38f71', 'photo-1460925895917-afdab827c52f'],
  ecommerce: ['photo-1556742049-0cfed4f6a45d'],
  cloud: ['photo-1451187580459-43490279c0fa', 'photo-1677442136019-21780ecad995'],
  ai: ['photo-1620712943543-bcc4688e7485', 'photo-1555255707-c07966088b7b'],
  analytics: ['photo-1551288049-bebda4e38f71'],
  bps: ['photo-1556761175-5973dc0f32e7', 'photo-1559136555-9303baea8ebd'],
  marketing: ['photo-1460925895917-afdab827c52f', 'photo-1563986768609-322da13575f3', 'photo-1611224923853-80b023f02d71'],
  graphic: ['photo-1561070791-2526d30994b5'],
  uiux: ['photo-1504639725590-34d0984388bd', 'photo-1551033406-611cf9a28f67'],
  game: ['photo-1511512578047-dfb367046420', 'photo-1540575467063-178a50c2df87'],
}

const SERVICES = [
  { slug: 'web-development', pool: 'web' },
  { slug: 'software-development', pool: 'software' },
  { slug: 'domain-hosting', pool: 'hosting' },
  { slug: 'software-quality-assurance', pool: 'qa' },
  { slug: 'mobile-app-development', pool: 'mobile' },
  { slug: 'it-consultancy', pool: 'consultancy' },
  { slug: 'database-development', pool: 'database' },
  { slug: 'e-commerce-website-development', pool: 'ecommerce' },
  { slug: 'cloud-strategy', pool: 'cloud' },
  { slug: 'ai-development', pool: 'ai' },
  { slug: 'data-analytics', pool: 'analytics' },
  { slug: 'business-process-services', pool: 'bps' },
  { slug: 'digital-marketing', pool: 'marketing' },
  { slug: 'graphic-design', pool: 'graphic' },
  { slug: 'ui-ux-design', pool: 'uiux' },
  { slug: 'game-development', pool: 'game' },
]

const altsByService = buildServiceImageAltsMap()

function pickSources(pool, unsplash, count, usedPexels, usedUnsplash) {
  const out = []
  let pi = 0
  let ui = 0
  while (out.length < count) {
    if (pi < pool.length) {
      const id = pool[pi++]
      if (!usedPexels.has(id)) {
        usedPexels.add(id)
        out.push({ source: 'pexels', id })
      }
    } else if (ui < unsplash.length) {
      const id = unsplash[ui++]
      if (!usedUnsplash.has(id)) {
        usedUnsplash.add(id)
        out.push({ source: 'unsplash', id })
      }
    } else break
  }
  return out
}

const usedPexels = new Set()
const usedUnsplash = new Set()
const manifest = {}

for (const svc of SERVICES) {
  const pool = POOLS[svc.pool]
  const unsplash = UNSPLASH[svc.pool] ?? []
  const picks = pickSources(pool, unsplash, IMAGE_SLOTS.length, usedPexels, usedUnsplash)
  if (picks.length < IMAGE_SLOTS.length) {
    throw new Error(`Not enough unique images for ${svc.slug}: need ${IMAGE_SLOTS.length}, got ${picks.length}`)
  }

  const descriptions = altsByService[svc.slug]
  if (!descriptions) {
    throw new Error(`Missing image descriptions for ${svc.slug}`)
  }

  manifest[svc.slug] = {}
  IMAGE_SLOTS.forEach((slot, i) => {
    const pick = picks[i]
    const alt = descriptions[slot]
    if (!alt) {
      throw new Error(`Missing alt for ${svc.slug}.${slot}`)
    }
    manifest[svc.slug][slot] = {
      ...pick,
      alt,
    }
  })
}

await fs.writeFile(OUT, JSON.stringify(manifest, null, 2))
await fs.writeFile(ALTS_OUT, JSON.stringify(altsByService, null, 2))
console.log(`Wrote ${OUT} — ${usedPexels.size} pexels + ${usedUnsplash.size} unsplash = ${usedPexels.size + usedUnsplash.size} unique`)
console.log(`Wrote ${ALTS_OUT}`)
