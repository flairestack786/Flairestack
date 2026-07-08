/**
 * Fixes icons that Simple Icons CDN no longer serves by pulling them from
 * the archived simple-icons npm package (v13) and injecting the brand color.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'icons', 'tech')
const JSON_OUT = path.join(ROOT, 'src', 'data', 'techIcons.json')

const npm = (v, slug) => `https://cdn.jsdelivr.net/npm/simple-icons@${v}/icons/${slug}.svg`
const dev = (p) => `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${p}`

const FIXES = {
  'SonarQube': { file: 'sonarqube.svg', color: '#4E9BCD', urls: [npm(13, 'sonarqube'), npm(11, 'sonarqube')] },
  'Slack': { file: 'slack.svg', color: null, urls: [dev('slack/slack-original.svg'), npm(13, 'slack')] },
  'Salesforce': { file: 'salesforce.svg', color: '#00A1E0', urls: [npm(13, 'salesforce'), npm(11, 'salesforce')] },
  'DynamoDB': { file: 'dynamodb.svg', color: '#4053D6', urls: [dev('dynamodb/dynamodb-original.svg'), npm(11, 'amazondynamodb')] },
  'dbt': { file: 'dbt.svg', color: '#FF694B', urls: [npm(13, 'dbt'), npm(11, 'dbt')] },
  'Magento': { file: 'magento.svg', color: '#EE672F', urls: [dev('magento/magento-original.svg'), npm(13, 'magento')] },
  'Klaviyo': { file: 'klaviyo.svg', color: '#0A1F44', urls: [npm(13, 'klaviyo'), npm(12, 'klaviyo')] },
  'AWS Lambda': { file: 'aws-lambda.svg', color: '#FF9900', urls: [npm(13, 'awslambda'), npm(11, 'awslambda')] },
  'OpenAI': { file: 'openai.svg', color: '#412991', urls: [npm(13, 'openai'), npm(12, 'openai')] },
  'Tableau': { file: 'tableau.svg', color: '#E97627', urls: [npm(13, 'tableau'), npm(11, 'tableau')] },
  'Twilio': { file: 'twilio.svg', color: '#F22F46', urls: [npm(13, 'twilio'), npm(11, 'twilio')] },
  'Canva': { file: 'canva.svg', color: '#00C4CC', urls: [npm(13, 'canva'), npm(11, 'canva')] },
  'Affinity Designer': { file: 'affinity-designer.svg', color: '#1B72BE', urls: [npm(13, 'affinitydesigner'), npm(11, 'affinitydesigner')] },
  'InVision': { file: 'invision.svg', color: '#FF3366', urls: [npm(13, 'invision'), npm(11, 'invision')] },
  'Zeplin': { file: 'zeplin.svg', color: '#FDBD39', urls: [npm(13, 'zeplin'), npm(11, 'zeplin')] },
  'Xbox': { file: 'xbox.svg', color: '#107C10', urls: [npm(13, 'xbox'), npm(11, 'xbox')] },
}

const map = JSON.parse(await fs.readFile(JSON_OUT, 'utf8'))
const failed = []

for (const [name, { file, color, urls }] of Object.entries(FIXES)) {
  let saved = false
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'FlaireStack/1.0' } })
      if (!res.ok) continue
      let svg = await res.text()
      if (!svg.trim().startsWith('<')) continue
      if (color && !svg.includes('fill=')) {
        svg = svg.replace('<svg ', `<svg fill="${color}" `)
      }
      await fs.writeFile(path.join(OUT_DIR, file), svg)
      map[name] = file
      saved = true
      break
    } catch {
      // try next fallback
    }
  }
  if (!saved) failed.push(name)
  console.log(saved ? `ok   ${name}` : `FAIL ${name}`)
}

await fs.writeFile(JSON_OUT, JSON.stringify(map, null, 2))
console.log(`\nTotal icons: ${Object.keys(map).length}`)
if (failed.length) console.log('Still failing:', failed.join(', '))
