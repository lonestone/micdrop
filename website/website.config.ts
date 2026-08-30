/**
 * Site-wide configuration.
 *
 * Single source of truth for anything that varies per deployment: site URL,
 * brand name, repository links. Referenced by astro.config.ts, layouts,
 * navigation, footer, breadcrumbs and llms.txt.
 */
export default {
  // Canonical production URL. Used for sitemap, canonical tags, social previews.
  site: 'https://micdrop.dev',

  // Brand name shown in the header logo, footer, breadcrumbs, meta tags.
  siteName: 'Micdrop',

  // One-liner printed in the hero and used as the default meta description.
  tagline:
    'Real-time voice conversations with AI, in the browser and on mobile',

  description:
    'Integrate a powerful voice mode in your web or React Native app with a few lines of code using Micdrop. One server, the same call on every platform. Use provided AI integrations (agents, STT, TTS) or build your own.',

  // Public repository. Drives the GitHub links and the "edit this page" links.
  github: 'https://github.com/Godefroy/micdrop',

  // Branch and folder the docs live in, for the "edit this page" links.
  editBase: 'https://github.com/Godefroy/micdrop/tree/main/website/src/content',

  // Who created and open sourced Micdrop, credited in the footer.
  author: {
    label: 'Godefroy de Compreignac',
    href: 'https://github.com/Godefroy',
  },

  // Algolia DocSearch. The crawler runs on Algolia's side; these keys are
  // search-only and meant to be public.
  algolia: {
    appId: 'DXD2XNHHEN',
    apiKey: '48321ed44b3c849280be207db9260d46',
    indexName: 'Micdrop Documentation',
  },
} as const
