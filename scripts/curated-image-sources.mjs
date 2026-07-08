/**
 * Curated unique Pexels IDs per service slot — theme-specific, no generic meeting stock.
 * Run: node scripts/curated-image-sources.mjs
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { serviceImageDescriptions, IMAGE_SLOTS } from '../src/data/serviceImageDescriptions.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'service-image-sources.json')
const ALTS_OUT = path.join(__dirname, '..', 'src', 'data', 'serviceImageAlts.json')

/** slug → slot → pexels id */
const CURATED = {
  'web-development': {
    hero: 1181678, overview: 3183170, banner: 3184455, features: 4164416, tech: 4974915,
    process: 4164417, benefits: 7688339, cta: 6476586, framework1: 4974914, framework2: 270631,
    framework3: 4974916, framework4: 6476588, framework5: 4164419, clientBenefits: 270634,
    implementationApproach: 3183173, businessOutcomes: 196645,
  },
  'software-development': {
    hero: 1181677, overview: 3861969, banner: 7688336, features: 546819, tech: 3861972,
    process: 574071, benefits: 4974912, cta: 3184310,
    framework1: 574077, framework2: 1181244, framework3: 5380664, framework4: 1181467, framework5: 4164418,
    clientBenefits: 6476587, implementationApproach: 3184308, businessOutcomes: 11035471,
  },
  'domain-hosting': {
    hero: 325229, overview: 1148820, banner: 1181354, features: 3861971, tech: 7567523,
    process: 207580, benefits: 442150, cta: 1181723, framework1: 1181676, framework2: 7658350,
    framework3: 7567525, framework4: 7567527, framework5: 1181722, clientBenefits: 7567521,
    implementationApproach: 1181724, businessOutcomes: 1181725,
  },
  'software-quality-assurance': {
    hero: 1181263, overview: 7688338, banner: 777001, features: 4974913, tech: 3861980,
    process: 6476589, benefits: 3861970, cta: 3184290, framework1: 3861976, framework2: 577585,
    framework3: 7567445, framework4: 265087, framework5: 3184314, clientBenefits: 572056,
    implementationApproach: 3184313, businessOutcomes: 6476585,
  },
  'mobile-app-development': {
    hero: 607812, overview: 1092671, banner: 699122, features: 404280, tech: 1092644,
    process: 3184293, benefits: 3184294, cta: 3184295, framework1: 47261, framework2: 3850250,
    framework3: 341523, framework4: 5077039, framework5: 887751, clientBenefits: 3184304,
    implementationApproach: 3184305, businessOutcomes: 3184307,
  },
  'it-consultancy': {
    hero: 3184296, overview: 7688460, banner: 3184360, features: 3184292, tech: 3184324,
    process: 3184298, benefits: 3184302, cta: 3184291, framework1: 669619, framework2: 3184339,
    framework3: 1181684, framework4: 7567522, framework5: 3184318, clientBenefits: 590016,
    implementationApproach: 3184350, businessOutcomes: 7567494,
  },
  'database-development': {
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
  },
  'e-commerce-website-development': {
    hero: 5632402, overview: 5632399, banner: 4391478, features: 230544, tech: 6214472,
    process: 4482899, benefits: 4968391, cta: 6214473, framework1: 264636, framework2: 4482900,
    framework3: 5632369, framework4: 5632404, framework5: 6214474, clientBenefits: 4391479,
    implementationApproach: 5632403, businessOutcomes: 5632398,
  },
  'cloud-strategy': {
    hero: { source: 'unsplash', id: '1558494949-ef010cbdcc31' },
    overview: { source: 'unsplash', id: '1580894732444-8ecded7900cd' },
    banner: { source: 'unsplash', id: '1451187580459-43490279c0fa' },
    features: { source: 'pexels', id: 6466141 },
    tech: { source: 'unsplash', id: '1518770660439-4636190af475' },
    process: { source: 'unsplash', id: '1504384308090-c894fdcc538d' },
    benefits: { source: 'pexels', id: 2148217 },
    cta: { source: 'unsplash', id: '1531297484001-80022131f5a1' },
    framework1: { source: 'unsplash', id: '1573164713988-8665fc963095' },
    framework2: { source: 'unsplash', id: '1544197150-b99a580bb7a8' },
    framework3: { source: 'unsplash', id: '1607799279861-4dd421887fb3' },
    framework4: { source: 'pexels', id: 2881232 },
    framework5: { source: 'unsplash', id: '1487058792275-0ad4aaf24ca7' },
    clientBenefits: { source: 'unsplash', id: '1498050108023-c5249f4df085' },
    implementationApproach: { source: 'unsplash', id: '1508830524289-0adcbe822b40' },
    businessOutcomes: { source: 'pexels', id: 4508751 },
  },
  'ai-development': {
    hero: { source: 'pexels', id: 8294608 },
    overview: { source: 'pexels', id: 8297478 },
    banner: { source: 'pexels', id: 8297480 },
    features: { source: 'pexels', id: 8386437 },
    tech: { source: 'unsplash', id: '1551288049-bebda4e38f71' },
    process: { source: 'pexels', id: 8438923 },
    benefits: { source: 'pexels', id: 8566474 },
    cta: { source: 'pexels', id: 8386439 },
    framework1: { source: 'unsplash', id: '1635070041078-e363dbe005cb' },
    framework2: { source: 'unsplash', id: '1550751827-4bd374c3f58b' },
    framework3: { source: 'unsplash', id: '1504639725590-34d0984388bd' },
    framework4: { source: 'pexels', id: 8438917 },
    framework5: { source: 'pexels', id: 8386438 },
    clientBenefits: { source: 'pexels', id: 8294609 },
    implementationApproach: { source: 'pexels', id: 8438919 },
    businessOutcomes: { source: 'pexels', id: 8297481 },
  },
  'data-analytics': {
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
  },
  'business-process-services': {
    hero: { source: 'pexels', id: 6476590 },
    overview: { source: 'pexels', id: 7688462 },
    banner: { source: 'pexels', id: 590020 },
    features: { source: 'pexels', id: 6476591 },
    tech: { source: 'pexels', id: 3184456 },
    process: { source: 'pexels', id: 3184312 },
    benefits: { source: 'unsplash', id: '1600880292203-757bb62b4baf' },
    cta: { source: 'pexels', id: 3184370 },
    framework1: { source: 'pexels', id: 669621 },
    framework2: { source: 'pexels', id: 669623 },
    framework3: { source: 'pexels', id: 186461 },
    framework4: { source: 'pexels', id: 669615 },
    framework5: { source: 'pexels', id: 3184436 },
    clientBenefits: { source: 'pexels', id: 3184418 },
    implementationApproach: { source: 'pexels', id: 3183165 },
    businessOutcomes: { source: 'pexels', id: 7688463 },
  },
  'digital-marketing': {
    hero: 267350, overview: 905163, banner: 1447254, features: 7658356, tech: 7640793,
    process: 265667, benefits: 7567492, cta: 7567493, framework1: 6476584, framework2: 6476592,
    framework3: 6476593, framework4: 6476594, framework5: 6476595, clientBenefits: 6476596,
    implementationApproach: 3861959, businessOutcomes: 7567519,
  },
  'graphic-design': {
    hero: 102127, overview: 291534, banner: 7567497, features: 7567498, tech: 7567495,
    process: 7567530, benefits: 3184347, cta: 3184349,
    framework1: { source: 'pexels', id: 196644 },
    framework2: { source: 'pexels', id: 1029629 },
    framework3: { source: 'unsplash', id: '1558655146-9f40138edfeb' },
    framework4: { source: 'pexels', id: 196647 },
    framework5: 8949180, clientBenefits: 6476596, implementationApproach: 3861959, businessOutcomes: 7567519,
  },
  'ui-ux-design': {
    hero: 3184320, overview: 3184321, banner: 3184322, tech: 3184323, features: 3184325,
    process: 3184326, benefits: 3184327, cta: 3184328, framework1: 3861966, framework2: 196646,
    framework3: { source: 'unsplash', id: '1547658719-da2b51169166' }, framework4: 590022, framework5: 3184335, clientBenefits: 3184338,
    implementationApproach: 3184340, businessOutcomes: 3184341,
  },
  'game-development': {
    hero: 687811, overview: 3184346, banner: 3945313, features: 275033, tech: 3945654,
    process: 7915434, benefits: 2747449, cta: 3165332, framework1: 7915289, framework2: 9071692,
    framework3: 7567535, framework4: 3165335, framework5: 442504, clientBenefits: 3184343,
    implementationApproach: 3184344, businessOutcomes: 3184345,
  },
}

// Fix graphic-design duplicates and it-consultancy/database typos
CURATED['graphic-design'] = {
  hero: 102127, overview: 291534, banner: 7567497, features: 7567498, tech: 7567495,
  process: 7567530, benefits: 3184347, cta: 3184349, framework1: 313705, framework2: 1072824,
  framework3: 1703322, framework4: 6220417, framework5: 8949180, clientBenefits: 1266808,
  implementationApproach: 7567520, businessOutcomes: 7567517,
}

// Remove stray keys from earlier draft
delete CURATED['it-consultancy'].overview2
delete CURATED['database-development'].tech2

// Validate uniqueness
const used = new Map()
for (const [slug, slots] of Object.entries(CURATED)) {
  for (const [slot, id] of Object.entries(slots)) {
    if (!IMAGE_SLOTS.includes(slot)) {
      console.warn(`Unknown slot ${slug}.${slot}`)
      continue
    }
    const key = String(id)
    if (used.has(key)) {
      console.error(`DUPLICATE ${id}: ${used.get(key)} and ${slug}.${slot}`)
      process.exit(1)
    }
    used.set(key, `${slug}.${slot}`)
  }
  for (const slot of IMAGE_SLOTS) {
    if (!slots[slot]) {
      console.error(`Missing ${slug}.${slot}`)
      process.exit(1)
    }
  }
}

// Validate HTTP
async function checkId(id) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop`
  const res = await fetch(url, { headers: { 'User-Agent': 'FlaireStack/1.0' }, redirect: 'follow' })
  return res.ok
}

const ids = [...used.keys()]
let failed = 0
for (const id of ids) {
  if (!(await checkId(id))) {
    console.error(`HTTP fail: ${id} (${used.get(id)})`)
    failed++
  }
}
if (failed) {
  console.error(`${failed} IDs failed validation`)
  process.exit(1)
}

const manifest = {}
for (const [slug, slots] of Object.entries(CURATED)) {
  manifest[slug] = {}
  for (const slot of IMAGE_SLOTS) {
    manifest[slug][slot] = {
      source: 'pexels',
      id: slots[slot],
      alt: serviceImageDescriptions[slug][slot],
    }
  }
}

await fs.writeFile(OUT, JSON.stringify(manifest, null, 2))
const alts = {}
for (const [slug, slots] of Object.entries(serviceImageDescriptions)) {
  alts[slug] = { ...slots }
}
await fs.writeFile(ALTS_OUT, JSON.stringify(alts, null, 2))
console.log(`Wrote ${Object.keys(manifest).length} services, ${used.size} unique IDs`)
