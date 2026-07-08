/**
 * Unique bento-card copy per service — keyed by slug, then feature/differentiator title.
 */

export const CAPABILITY_DESCRIPTIONS = {
  'web-development': {
    'Custom web platforms & portals':
      'We build member portals, partner dashboards, and customer apps around how your teams actually work—not one-size templates that slow every update.',
    'SSR/SSG & edge rendering':
      'Important pages are pre-rendered and served close to your visitors, so load times stay low, SEO stays strong, and campaigns do not stall on slow first paints.',
    'Accessibility & SEO excellence':
      'Semantic structure, keyboard-friendly flows, and crawlable content are part of the build, so you reach more users without paying for a retrofit after launch.',
    'Design system integration':
      'Your brand becomes a shared component library, so new pages ship faster and marketing, product, and sales stay visually aligned.',
    'Security & Compliance':
      'Login, permissions, and sensitive data handling are designed in early—aligned to your compliance needs rather than patched in after an audit.',
    'Transparent Delivery':
      'You get working demos each sprint, a clear view of what is next, and direct access to the engineers shipping your site.',
  },
  'software-development': {
    'Enterprise-grade architecture and security':
      'We structure applications so teams can add features without breaking core workflows, with security controls that match how your business actually operates.',
    'Performance optimization at scale':
      'Systems are load-tested and tuned before traffic spikes hit, so APIs and dashboards stay responsive when usage grows.',
    'Dedicated senior engineering team':
      'The people planning your architecture are the same people writing and reviewing production code—no handoff to a junior bench mid-project.',
    'Transparent agile delivery':
      'Fortnightly demos, honest scope conversations, and visible backlogs keep stakeholders aligned before deadlines become surprises.',
    'Security & Compliance':
      'Role-based access, encryption, and audit-friendly logging are treated as product requirements—not optional add-ons at the end.',
    'Transparent Delivery':
      'You always know what shipped, what is in progress, and what is blocked, with documentation your internal team can maintain after go-live.',
  },
  'domain-hosting': {
    'Domain & DNS management':
      'We register, configure, and maintain domains and DNS so email, subdomains, and staging environments stay reliable through launches and migrations.',
    'SSL/TLS & security hardening':
      'Certificates renew automatically, protocols stay current, and basic hardening reduces the risk of downtime from expired or misconfigured security settings.',
    'CDN & edge caching':
      'Static assets and key pages are cached globally so international visitors get fast responses without you managing servers in every region.',
    'Uptime monitoring & alerts':
      'We watch availability and performance around the clock and respond when something breaks—not when a customer tells you the site is down.',
    'Security & Compliance':
      'Hosting choices account for data residency, access controls, and backup expectations your industry or clients require.',
    'Transparent Delivery':
      'Migration plans, cutover windows, and rollback steps are documented before anything touches production traffic.',
  },
  'software-quality-assurance': {
    'Automated test suites':
      'Regression and API tests run on every build so teams catch breaking changes in minutes instead of discovering them in production.',
    'Performance & load testing':
      'We simulate real traffic patterns before go-live so checkout, login, and reporting flows do not fail under peak load.',
    'Regression & smoke testing':
      'Critical user paths are checked before each release, giving product owners confidence that yesterday’s fixes did not break today’s launch.',
    'CI/CD quality gates':
      'Failed tests block merges and deployments, so quality standards are enforced by the pipeline—not by last-minute manual checks.',
    'Shift-Left Testing':
      'QA joins requirements and design reviews early, when fixing a misunderstanding costs hours instead of weeks.',
    'Release Confidence':
      'Sign-off checklists, environment parity, and clear exit criteria mean releases happen on schedule without heroics the night before.',
  },
  'mobile-app-development': {
    'Enterprise-grade architecture and security':
      'Mobile backends, offline sync, and auth are designed for field teams and consumer apps that cannot afford data leaks or crash loops.',
    'Performance optimization at scale':
      'We profile on real devices—not just simulators—so animations stay smooth and battery drain stays reasonable as features grow.',
    'Dedicated senior engineering team':
      'Senior iOS, Android, and backend engineers stay on your product from prototype through store submission and post-launch fixes.',
    'Transparent agile delivery':
      'TestFlight and internal builds ship regularly so stakeholders try real progress instead of reviewing slide decks.',
    'Security & Compliance':
      'Secure storage, token handling, and app store privacy requirements are built into the release process from day one.',
    'Transparent Delivery':
      'Store review status, crash reports, and sprint priorities are shared openly so you know exactly where the app stands.',
  },
  'it-consultancy': {
    'Enterprise-grade architecture and security':
      'We help leadership choose platforms and integration patterns that reduce risk instead of accumulating tools that nobody owns.',
    'Performance optimization at scale':
      'Recommendations focus on bottlenecks that actually block revenue or operations—not vanity metrics on unused systems.',
    'Dedicated senior engineering team':
      'Consultants who have shipped production systems guide your roadmap, vendor selection, and internal team structure.',
    'Transparent agile delivery':
      'Workshops, decision logs, and executive summaries keep business and IT aligned on why each recommendation matters.',
    'Security & Compliance':
      'Governance models, access policies, and vendor reviews are framed around your regulatory and operational constraints.',
    'Transparent Delivery':
      'You get plain-language options with trade-offs spelled out—no jargon-heavy decks that leave executives guessing.',
  },
  'database-development': {
    'Enterprise-grade architecture and security':
      'Schemas and access models are designed for accuracy and auditability, not just to make the first release easy.',
    'Performance optimization at scale':
      'Slow reports and APIs get fixed at the query and index level before you pay for bigger hardware every quarter.',
    'Dedicated senior engineering team':
      'DBAs and data engineers who have managed production workloads handle modeling, migration, and tuning—not generic script runners.',
    'Transparent agile delivery':
      'Migration steps, rollback plans, and validation queries are reviewed with your team before any production cutover.',
    'Data Integrity & Governance':
      'Constraints, lineage, and permission boundaries keep teams confident that dashboards reflect one trusted version of the truth.',
    'Query Performance at Scale':
      'Partitioning, indexing, and rewrite strategies keep analytics and transactional workloads fast as volume grows.',
  },
  'e-commerce-website-development': {
    'Enterprise-grade architecture and security':
      'Checkout, inventory, and customer data flows are built to handle peak sales days without cart errors or payment failures.',
    'Performance optimization at scale':
      'Product pages, search, and checkout stay fast during campaigns because caching and catalog queries are tuned for traffic spikes.',
    'Dedicated senior engineering team':
      'Commerce specialists who understand merchandising, tax, and fulfillment integrations stay embedded through launch and peak season.',
    'Transparent agile delivery':
      'Staging previews, UAT with your merchandising team, and go-live rehearsals happen before customers hit the new store.',
    'Security & Compliance':
      'PCI-aware payment flows, fraud considerations, and customer data handling follow practices appropriate to your markets.',
    'Transparent Delivery':
      'Launch timelines account for catalog migration, payment certification, and marketing cutover—not just theme installation.',
  },
  'cloud-strategy': {
    'Enterprise-grade architecture and security':
      'Landing zones, network segmentation, and identity policies are designed before workloads move—not after a security review fails.',
    'Performance optimization at scale':
      'Auto-scaling, right-sized instances, and observability keep applications responsive while cloud spend stays predictable.',
    'Dedicated senior engineering team':
      'Cloud architects who have led migrations define waves, rollback paths, and runbooks your ops team can own long term.',
    'Transparent agile delivery':
      'Each migration wave has clear success criteria, cost tracking, and stakeholder sign-off before the next system moves.',
    'Security & Compliance':
      'Encryption, logging, and access controls are mapped to your compliance frameworks across AWS, Azure, or GCP.',
    'Transparent Delivery':
      'FinOps reviews and architecture decisions are documented so finance and engineering agree on what changed and why.',
  },
  'ai-development': {
    'LLM & agent orchestration':
      'We connect models to your tools and workflows so assistants draft replies, route tasks, or summarize work—not just chat in a sandbox.',
    'RAG & knowledge systems':
      'Answers pull from your approved documents and databases with permission checks, so staff get accurate responses without exposing sensitive files.',
    'Model fine-tuning & eval':
      'We measure accuracy on your real scenarios before rollout, tuning prompts or models until outputs meet agreed quality bars.',
    'AI safety & governance':
      'Human review, logging, and escalation paths keep high-risk outputs from reaching customers or regulators unchecked.',
    'Production AI Governance':
      'Monitoring, version control, and approval workflows treat AI features like any other production system your business depends on.',
    'RAG & Knowledge Systems':
      'Retrieval pipelines respect source freshness and access rules, so teams trust what the assistant cites.',
  },
  'data-analytics': {
    'Enterprise-grade architecture and security':
      'Pipelines and warehouses are modeled so finance, ops, and product teams share metrics definitions—not conflicting spreadsheet versions.',
    'Performance optimization at scale':
      'ETL jobs and dashboards are tuned for daily refresh SLAs, so morning reports are ready when leadership starts the day.',
    'Dedicated senior engineering team':
      'Analytics engineers who have built executive reporting own modeling, testing, and documentation—not one-off SQL fixes.',
    'Transparent agile delivery':
      'Metric definitions are signed off by business owners before dashboards go company-wide, preventing arguments about the numbers.',
    'Security & Compliance':
      'Row-level security, PII handling, and access reviews keep sensitive customer and employee data out of the wrong dashboards.',
    'Transparent Delivery':
      'You see pipeline health, data quality checks, and backlog priorities—not a black box that breaks silently on month-end.',
  },
  'business-process-services': {
    'Enterprise-grade architecture and security':
      'Automations respect approval chains and audit trails so operations teams can trust what changed and who approved it.',
    'Performance optimization at scale':
      'High-volume requests—expenses, vendor onboarding, support tickets—flow through workflows without manual bottlenecks.',
    'Dedicated senior engineering team':
      'Process analysts and integration specialists map how work actually happens before any tool is configured.',
    'Transparent agile delivery':
      'Pilot groups test new workflows before company-wide rollout, with feedback folded in before go-live.',
    'Security & Compliance':
      'Role-based steps and retention rules align automations with HR, finance, and legal requirements.',
    'Transparent Delivery':
      'Cycle-time metrics and exception reports show whether automations saved time or created new confusion.',
  },
  'digital-marketing': {
    'Enterprise-grade architecture and security':
      'Tracking, consent, and data sharing are set up so campaigns stay measurable without violating privacy expectations.',
    'Performance optimization at scale':
      'Landing pages, ad creative, and site speed are tested continuously so budget goes toward what actually converts.',
    'Dedicated senior engineering team':
      'Strategists, analysts, and channel specialists work from one plan tied to pipeline and revenue—not siloed channel reports.',
    'Transparent agile delivery':
      'Monthly reviews show what moved leads and revenue, with clear next tests instead of vanity metric celebrations.',
    'Security & Compliance':
      'Ad platforms, CRM data, and email lists are handled with permissions and retention practices your legal team can stand behind.',
    'Transparent Delivery':
      'You see spend, attribution, and creative performance in language leadership understands—not platform jargon alone.',
  },
  'graphic-design': {
    'Enterprise-grade architecture and security':
      'Brand files, templates, and usage rules are organized so partners and internal teams apply identity correctly at scale.',
    'Performance optimization at scale':
      'Reusable templates and asset libraries speed campaign turnaround without sacrificing visual quality.',
    'Dedicated senior engineering team':
      'Senior designers who understand B2B and consumer contexts lead concept through final production files.',
    'Transparent agile delivery':
      'Revision rounds are structured with clear feedback loops so approvals do not stall launches indefinitely.',
    'Security & Compliance':
      'Licensed assets, trademark usage, and partner guidelines are documented to reduce brand and legal risk.',
    'Transparent Delivery':
      'You receive production-ready files with naming and specs your print, web, and sales teams can use immediately.',
  },
  'ui-ux-design': {
    'Enterprise-grade architecture and security':
      'Design systems encode patterns for forms, tables, and auth flows so complex products stay usable as they grow.',
    'Performance optimization at scale':
      'Prototypes are tested with real users on key tasks before engineering spends months building the wrong flow.',
    'Dedicated senior engineering team':
      'Researchers and designers pair on discovery, wireframes, and handoff specs engineers can implement without guesswork.',
    'Transparent agile delivery':
      'You review clickable prototypes and usability findings at each phase—not only polished visuals at the end.',
    'Security & Compliance':
      'Sensitive flows—payments, health data, permissions—are designed for clarity and error prevention, not just aesthetics.',
    'Transparent Delivery':
      'Figma files, component docs, and rationale travel with the work so your team maintains consistency after launch.',
  },
  'game-development': {
    'Enterprise-grade architecture and security':
      'Multiplayer, accounts, and in-game economies are architected for cheating resistance and stable live operations.',
    'Performance optimization at scale':
      'Frame rates, load times, and asset streaming are profiled on target hardware—not just high-end dev machines.',
    'Dedicated senior engineering team':
      'Gameplay, art, and backend engineers collaborate from vertical slice through certification and live ops.',
    'Transparent agile delivery':
      'Milestone builds are playable on schedule so publishers and stakeholders judge fun and stability, not promises.',
    'Security & Compliance':
      'Platform requirements, age ratings, and player data policies are tracked through submission and update cycles.',
    'Transparent Delivery':
      'Backlog, bug triage, and live-ops priorities stay visible so you know what ships in the next patch versus the next season.',
  },
}

/** Resolve bento card description for a service capability title */
export function getCapabilityDescription(slug, title, fallbackKeyword) {
  return (
    CAPABILITY_DESCRIPTIONS[slug]?.[title] ??
    `Practical ${fallbackKeyword} support for ${title.toLowerCase()}—scoped to your goals, timeline, and team.`
  )
}
