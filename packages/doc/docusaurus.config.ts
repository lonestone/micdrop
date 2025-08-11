import type * as Preset from '@docusaurus/preset-classic'
import type { Config } from '@docusaurus/types'
import { themes as prismThemes } from 'prism-react-renderer'

const config: Config = {
  title: 'Micdrop',
  tagline: 'Real-time voice conversations with AI in the browser',
  favicon: 'img/favicon.svg',

  url: 'https://micdrop.dev',
  baseUrl: '/',

  organizationName: 'lonestone',
  projectName: 'micdrop',

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/lonestone/micdrop/tree/main/packages/doc/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        blog: {
          showReadingTime: true,
          editUrl:
            'https://github.com/lonestone/micdrop/tree/main/packages/doc/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/micdrop-social-card.jpg',
    navbar: {
      title: 'Micdrop',
      logo: {
        alt: 'Micdrop Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        { to: '/blog', label: 'Blog', position: 'left' },
        {
          href: 'https://github.com/lonestone/micdrop',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'Packages',
              to: '/docs/packages',
            },
            {
              label: 'Examples',
              to: '/docs/examples',
            },
          ],
        },
        {
          title: 'Packages',
          items: [
            {
              label: 'Client',
              to: '/docs/packages/client',
            },
            {
              label: 'Server',
              to: '/docs/packages/server',
            },
            {
              label: 'React Hooks',
              to: '/docs/packages/react',
            },
          ],
        },
        {
          title: 'AI Integrations',
          items: [
            {
              label: 'OpenAI',
              to: '/docs/packages/openai',
            },
            {
              label: 'ElevenLabs',
              to: '/docs/packages/elevenlabs',
            },
            {
              label: 'Cartesia',
              to: '/docs/packages/cartesia',
            },
            {
              label: 'Mistral',
              to: '/docs/packages/mistral',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/lonestone/micdrop',
            },
            {
              label: 'Lonestone',
              href: 'https://lonestone.io',
            },
          ],
        },
      ],
      copyright: `Made by <a href="https://lonestone.io">Lonestone</a> • MIT License`,
    },
    prism: {
      theme: prismThemes.oneLight,
      darkTheme: prismThemes.oneDark,
      additionalLanguages: ['bash', 'json'],
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'micdrop',
      contextualSearch: true,
      searchParameters: {},
      searchPagePath: 'search',
    },
  } satisfies Preset.ThemeConfig,

  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },

  plugins: ['./plugins/tailwind-plugin.js'],
}

export default config
