import React from 'react'
import airbnbLogo from '../assets/logos/airbnb.svg'
import hubspotLogo from '../assets/logos/hubspot.svg'
import slackLogo from '../assets/logos/slack.svg'
import shopifyLogo from '../assets/logos/shopify.svg'
import awsLogo from '../assets/logos/aws-logo.svg'
import stripeLogo from '../assets/logos/Stripe_Logo.svg'
import notionLogo from '../assets/logos/Notion-logo.svg'
import datadogLogo from '../assets/logos/Data-dog.svg'
import twilioLogo from '../assets/logos/Twilio_logo.svg'
import mongodbLogo from '../assets/logos/MongoDB_Logo.svg'
import atlassianLogo from '../assets/logos/Atlassian-logo.svg'
import figmaLogo from '../assets/logos/Figma-logo.svg'
import zendeskLogo from '../assets/logos/Zendesk_logo.svg'

import vercelLogo from '../assets/logos/vercel.svg'
import asanaLogo from '../assets/logos/Asana_logo.svg'
import linearLogo from '../assets/logos/Linear-logo.svg'

const uniqueLogos = [
  { name: 'Airbnb', src: airbnbLogo, height: 26 },
  { name: 'HubSpot', src: hubspotLogo, height: 28 },
  { name: 'Slack', src: slackLogo, height: 24 },
  { name: 'Shopify', src: shopifyLogo, height: 26 },
  { name: 'AWS', src: awsLogo, height: 26 },
  { name: 'Stripe', src: stripeLogo, height: 22 },
  { name: 'Notion', src: notionLogo, height: 24 },
  { name: 'Datadog', src: datadogLogo, height: 22 },
  { name: 'Twilio', src: twilioLogo, height: 24 },
  { name: 'MongoDB', src: mongodbLogo, height: 24 },
  { name: 'Atlassian', src: atlassianLogo, height: 22 },
  { name: 'Figma', src: figmaLogo, height: 24 },
  { name: 'Zendesk', src: zendeskLogo, height: 22 },

  { name: 'Vercel', src: vercelLogo, height: 22 },
  { name: 'Asana', src: asanaLogo, height: 24 },
  { name: 'Linear', src: linearLogo, height: 22 },
]

/** Repeated sequence for a visually rich marquee loop */
const marqueeSequence = [...uniqueLogos, ...uniqueLogos]

export default function TrustedBy({ variant = 'brand', align = 'start' }) {
  const track = [...marqueeSequence, ...marqueeSequence]

  return (
    <div className={`trusted-by trusted-by--${variant} trusted-by--align-${align}`}>
      <p className="trusted-label">Inspired by World-Class Technology Companies</p>
      <div className="trusted-marquee" aria-label="Inspired by Industry Leaders">
        <div className="trusted-marquee-fade trusted-marquee-fade--left" aria-hidden />
        <div className="trusted-marquee-fade trusted-marquee-fade--right" aria-hidden />
        <div className="trusted-marquee-viewport">
          <div className="trusted-marquee-track">
            {track.map((logo, i) => (
              <span
                key={`${logo.name}-${i}`}
                className="trusted-marquee-item"
                aria-hidden={i >= uniqueLogos.length}
              >
                <img
                  className="trusted-logo-img"
                  src={logo.src}
                  alt={i < uniqueLogos.length ? logo.name : ''}
                  width={Math.round(logo.height * 3.2)}
                  height={logo.height}
                  loading="lazy"
                  decoding="async"
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
