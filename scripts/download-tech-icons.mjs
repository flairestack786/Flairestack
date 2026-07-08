/**
 * Downloads official technology logos as SVGs into public/icons/tech
 * and writes src/data/techIcons.json (display name -> file name).
 *
 * Sources: Simple Icons CDN (brand-colored) with Devicon fallbacks
 * for logos Simple Icons no longer carries.
 */
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'icons', 'tech')
const JSON_OUT = path.join(ROOT, 'src', 'data', 'techIcons.json')

const si = (slug) => `https://cdn.simpleicons.org/${slug}`
const dev = (p) => `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${p}`

/** name -> { file, urls: [primary, ...fallbacks] } */
const SOURCES = {
  'HTML5': { file: 'html5.svg', urls: [si('html5'), dev('html5/html5-original.svg')] },
  'CSS3': { file: 'css3.svg', urls: [si('css3'), si('css'), dev('css3/css3-original.svg')] },
  'JavaScript': { file: 'javascript.svg', urls: [si('javascript')] },
  'TypeScript': { file: 'typescript.svg', urls: [si('typescript')] },
  'React': { file: 'react.svg', urls: [si('react')] },
  'React Native': { file: 'react-native.svg', urls: [si('react')] },
  'Next.js': { file: 'nextjs.svg', urls: [si('nextdotjs')] },
  'Node.js': { file: 'nodejs.svg', urls: [si('nodedotjs')] },
  'Express': { file: 'express.svg', urls: [si('express')] },
  'Tailwind CSS': { file: 'tailwindcss.svg', urls: [si('tailwindcss')] },
  'Vite': { file: 'vite.svg', urls: [si('vite')] },
  'PHP': { file: 'php.svg', urls: [si('php')] },
  'Laravel': { file: 'laravel.svg', urls: [si('laravel')] },
  'GraphQL': { file: 'graphql.svg', urls: [si('graphql')] },
  'PostgreSQL': { file: 'postgresql.svg', urls: [si('postgresql')] },
  'Vercel': { file: 'vercel.svg', urls: [si('vercel')] },
  'Figma': { file: 'figma.svg', urls: [si('figma')] },
  'Python': { file: 'python.svg', urls: [si('python')] },
  'Java': { file: 'java.svg', urls: [dev('java/java-original.svg')] },
  'C#': { file: 'csharp.svg', urls: [dev('csharp/csharp-original.svg')] },
  '.NET': { file: 'dotnet.svg', urls: [si('dotnet'), dev('dotnetcore/dotnetcore-original.svg')] },
  'Go': { file: 'go.svg', urls: [si('go')] },
  'Rust': { file: 'rust.svg', urls: [si('rust'), dev('rust/rust-original.svg')] },
  'Docker': { file: 'docker.svg', urls: [si('docker')] },
  'Kubernetes': { file: 'kubernetes.svg', urls: [si('kubernetes')] },
  'MongoDB': { file: 'mongodb.svg', urls: [si('mongodb')] },
  'Redis': { file: 'redis.svg', urls: [si('redis')] },
  'GitHub Actions': { file: 'github-actions.svg', urls: [si('githubactions')] },
  'AWS': { file: 'aws.svg', urls: [dev('amazonwebservices/amazonwebservices-original-wordmark.svg'), dev('amazonwebservices/amazonwebservices-plain-wordmark.svg')] },
  'Microsoft Azure': { file: 'azure.svg', urls: [dev('azure/azure-original.svg')] },
  'Google Cloud': { file: 'google-cloud.svg', urls: [si('googlecloud'), dev('googlecloud/googlecloud-original.svg')] },
  'Cloudflare': { file: 'cloudflare.svg', urls: [si('cloudflare')] },
  'NGINX': { file: 'nginx.svg', urls: [si('nginx')] },
  'Apache': { file: 'apache.svg', urls: [si('apache')] },
  'Linux': { file: 'linux.svg', urls: [si('linux')] },
  'Ubuntu': { file: 'ubuntu.svg', urls: [si('ubuntu')] },
  'Terraform': { file: 'terraform.svg', urls: [si('terraform'), dev('terraform/terraform-original.svg')] },
  "Let's Encrypt": { file: 'letsencrypt.svg', urls: [si('letsencrypt')] },
  'DigitalOcean': { file: 'digitalocean.svg', urls: [si('digitalocean')] },
  'GitHub': { file: 'github.svg', urls: [si('github')] },
  'cPanel': { file: 'cpanel.svg', urls: [si('cpanel')] },
  'Playwright': { file: 'playwright.svg', urls: [dev('playwright/playwright-original.svg')] },
  'Cypress': { file: 'cypress.svg', urls: [si('cypress'), dev('cypressio/cypressio-original.svg')] },
  'Selenium': { file: 'selenium.svg', urls: [si('selenium')] },
  'Jest': { file: 'jest.svg', urls: [si('jest')] },
  'Vitest': { file: 'vitest.svg', urls: [si('vitest')] },
  'Puppeteer': { file: 'puppeteer.svg', urls: [si('puppeteer')] },
  'k6': { file: 'k6.svg', urls: [si('k6')] },
  'Postman': { file: 'postman.svg', urls: [si('postman'), dev('postman/postman-original.svg')] },
  'SonarQube': { file: 'sonarqube.svg', urls: [si('sonarqube')] },
  'Appium': { file: 'appium.svg', urls: [si('appium')] },
  'Flutter': { file: 'flutter.svg', urls: [si('flutter')] },
  'Swift': { file: 'swift.svg', urls: [si('swift')] },
  'Kotlin': { file: 'kotlin.svg', urls: [si('kotlin')] },
  'Android': { file: 'android.svg', urls: [si('android')] },
  'Apple': { file: 'apple.svg', urls: [si('apple')] },
  'Firebase': { file: 'firebase.svg', urls: [si('firebase')] },
  'Expo': { file: 'expo.svg', urls: [si('expo')] },
  'Fastlane': { file: 'fastlane.svg', urls: [si('fastlane')] },
  'Redux': { file: 'redux.svg', urls: [si('redux')] },
  'Stripe': { file: 'stripe.svg', urls: [si('stripe')] },
  'Google Play': { file: 'google-play.svg', urls: [si('googleplay')] },
  'Jira': { file: 'jira.svg', urls: [si('jira'), dev('jira/jira-original.svg')] },
  'Confluence': { file: 'confluence.svg', urls: [si('confluence'), dev('confluence/confluence-original.svg')] },
  'Slack': { file: 'slack.svg', urls: [si('slack')] },
  'Notion': { file: 'notion.svg', urls: [si('notion')] },
  'Asana': { file: 'asana.svg', urls: [si('asana')] },
  'Trello': { file: 'trello.svg', urls: [si('trello'), dev('trello/trello-plain.svg')] },
  'Salesforce': { file: 'salesforce.svg', urls: [si('salesforce')] },
  'MySQL': { file: 'mysql.svg', urls: [si('mysql'), dev('mysql/mysql-original.svg')] },
  'SQL Server': { file: 'sql-server.svg', urls: [dev('microsoftsqlserver/microsoftsqlserver-plain.svg')] },
  'SQLite': { file: 'sqlite.svg', urls: [si('sqlite')] },
  'MariaDB': { file: 'mariadb.svg', urls: [si('mariadb')] },
  'Supabase': { file: 'supabase.svg', urls: [si('supabase')] },
  'Prisma': { file: 'prisma.svg', urls: [si('prisma')] },
  'Elasticsearch': { file: 'elasticsearch.svg', urls: [si('elasticsearch')] },
  'Snowflake': { file: 'snowflake.svg', urls: [si('snowflake')] },
  'BigQuery': { file: 'bigquery.svg', urls: [si('googlebigquery')] },
  'DynamoDB': { file: 'dynamodb.svg', urls: [si('amazondynamodb')] },
  'Apache Kafka': { file: 'apache-kafka.svg', urls: [si('apachekafka')] },
  'dbt': { file: 'dbt.svg', urls: [si('dbt')] },
  'Shopify': { file: 'shopify.svg', urls: [si('shopify')] },
  'WooCommerce': { file: 'woocommerce.svg', urls: [si('woocommerce')] },
  'Magento': { file: 'magento.svg', urls: [si('magento')] },
  'BigCommerce': { file: 'bigcommerce.svg', urls: [si('bigcommerce')] },
  'PayPal': { file: 'paypal.svg', urls: [si('paypal')] },
  'Sanity': { file: 'sanity.svg', urls: [si('sanity')] },
  'Klaviyo': { file: 'klaviyo.svg', urls: [si('klaviyo')] },
  'Mailchimp': { file: 'mailchimp.svg', urls: [si('mailchimp')] },
  'Google Analytics': { file: 'google-analytics.svg', urls: [si('googleanalytics')] },
  'Helm': { file: 'helm.svg', urls: [si('helm')] },
  'Ansible': { file: 'ansible.svg', urls: [si('ansible')] },
  'AWS Lambda': { file: 'aws-lambda.svg', urls: [si('awslambda')] },
  'Grafana': { file: 'grafana.svg', urls: [si('grafana')] },
  'Prometheus': { file: 'prometheus.svg', urls: [si('prometheus')] },
  'Argo': { file: 'argo.svg', urls: [si('argo')] },
  'Serverless': { file: 'serverless.svg', urls: [si('serverless')] },
  'Pulumi': { file: 'pulumi.svg', urls: [si('pulumi')] },
  'OpenAI': { file: 'openai.svg', urls: [si('openai')] },
  'Anthropic': { file: 'anthropic.svg', urls: [si('anthropic')] },
  'PyTorch': { file: 'pytorch.svg', urls: [si('pytorch')] },
  'TensorFlow': { file: 'tensorflow.svg', urls: [si('tensorflow')] },
  'LangChain': { file: 'langchain.svg', urls: [si('langchain')] },
  'Hugging Face': { file: 'huggingface.svg', urls: [si('huggingface')] },
  'FastAPI': { file: 'fastapi.svg', urls: [si('fastapi')] },
  'NumPy': { file: 'numpy.svg', urls: [si('numpy')] },
  'Pandas': { file: 'pandas.svg', urls: [si('pandas')] },
  'Jupyter': { file: 'jupyter.svg', urls: [si('jupyter')] },
  'scikit-learn': { file: 'scikit-learn.svg', urls: [si('scikitlearn')] },
  'NVIDIA': { file: 'nvidia.svg', urls: [si('nvidia')] },
  'MLflow': { file: 'mlflow.svg', urls: [si('mlflow')] },
  'Ollama': { file: 'ollama.svg', urls: [si('ollama')] },
  'Apache Spark': { file: 'apache-spark.svg', urls: [si('apachespark')] },
  'Apache Airflow': { file: 'apache-airflow.svg', urls: [si('apacheairflow')] },
  'Databricks': { file: 'databricks.svg', urls: [si('databricks')] },
  'Tableau': { file: 'tableau.svg', urls: [si('tableau')] },
  'Looker': { file: 'looker.svg', urls: [si('looker')] },
  'Metabase': { file: 'metabase.svg', urls: [si('metabase')] },
  'Zapier': { file: 'zapier.svg', urls: [si('zapier')] },
  'Make': { file: 'make.svg', urls: [si('make')] },
  'n8n': { file: 'n8n.svg', urls: [si('n8n')] },
  'HubSpot': { file: 'hubspot.svg', urls: [si('hubspot')] },
  'Airtable': { file: 'airtable.svg', urls: [si('airtable')] },
  'Google Sheets': { file: 'google-sheets.svg', urls: [si('googlesheets')] },
  'Twilio': { file: 'twilio.svg', urls: [si('twilio')] },
  'Google Ads': { file: 'google-ads.svg', urls: [si('googleads')] },
  'Google Tag Manager': { file: 'google-tag-manager.svg', urls: [si('googletagmanager')] },
  'Meta': { file: 'meta.svg', urls: [si('meta')] },
  'Semrush': { file: 'semrush.svg', urls: [si('semrush')] },
  'Hotjar': { file: 'hotjar.svg', urls: [si('hotjar')] },
  'WordPress': { file: 'wordpress.svg', urls: [si('wordpress')] },
  'YouTube': { file: 'youtube.svg', urls: [si('youtube')] },
  'Instagram': { file: 'instagram.svg', urls: [si('instagram')] },
  'LinkedIn': { file: 'linkedin.svg', urls: [dev('linkedin/linkedin-original.svg')] },
  'TikTok': { file: 'tiktok.svg', urls: [si('tiktok')] },
  'Buffer': { file: 'buffer.svg', urls: [si('buffer')] },
  'Adobe Photoshop': { file: 'photoshop.svg', urls: [dev('photoshop/photoshop-original.svg')] },
  'Adobe Illustrator': { file: 'illustrator.svg', urls: [dev('illustrator/illustrator-plain.svg')] },
  'Adobe After Effects': { file: 'after-effects.svg', urls: [dev('aftereffects/aftereffects-original.svg')] },
  'Adobe Premiere Pro': { file: 'premiere-pro.svg', urls: [dev('premierepro/premierepro-original.svg')] },
  'Adobe XD': { file: 'adobe-xd.svg', urls: [dev('xd/xd-original.svg'), dev('xd/xd-plain.svg')] },
  'Canva': { file: 'canva.svg', urls: [si('canva')] },
  'Sketch': { file: 'sketch.svg', urls: [si('sketch')] },
  'Blender': { file: 'blender.svg', urls: [si('blender')] },
  'Affinity Designer': { file: 'affinity-designer.svg', urls: [si('affinitydesigner')] },
  'Dribbble': { file: 'dribbble.svg', urls: [si('dribbble')] },
  'Behance': { file: 'behance.svg', urls: [si('behance')] },
  'InVision': { file: 'invision.svg', urls: [si('invision')] },
  'Framer': { file: 'framer.svg', urls: [si('framer')] },
  'Storybook': { file: 'storybook.svg', urls: [si('storybook')] },
  'Webflow': { file: 'webflow.svg', urls: [si('webflow')] },
  'Miro': { file: 'miro.svg', urls: [si('miro')] },
  'Zeplin': { file: 'zeplin.svg', urls: [si('zeplin')] },
  'Unity': { file: 'unity.svg', urls: [si('unity'), dev('unity/unity-original.svg')] },
  'Unreal Engine': { file: 'unreal-engine.svg', urls: [si('unrealengine'), dev('unrealengine/unrealengine-original.svg')] },
  'C++': { file: 'cpp.svg', urls: [si('cplusplus'), dev('cplusplus/cplusplus-original.svg')] },
  'Godot': { file: 'godot.svg', urls: [si('godotengine')] },
  'Autodesk Maya': { file: 'maya.svg', urls: [si('autodeskmaya'), dev('maya/maya-original.svg')] },
  'Steam': { file: 'steam.svg', urls: [si('steam')] },
  'PlayStation': { file: 'playstation.svg', urls: [si('playstation')] },
  'Xbox': { file: 'xbox.svg', urls: [si('xbox')] },
  'WebGL': { file: 'webgl.svg', urls: [si('webgl')] },
}

await fs.mkdir(OUT_DIR, { recursive: true })

const map = {}
const failed = []

for (const [name, { file, urls }] of Object.entries(SOURCES)) {
  let saved = false
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'FlaireStack/1.0' } })
      if (!res.ok) continue
      const svg = await res.text()
      if (!svg.trim().startsWith('<')) continue
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
console.log(`\nSaved ${Object.keys(map).length}/${Object.keys(SOURCES).length} icons`)
if (failed.length) console.log('Failed:', failed.join(', '))
