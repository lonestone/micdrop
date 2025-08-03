import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const config: Config = {
  title: 'Micdrop',
  tagline: 'Real-Time Voice Conversations with AI',
  favicon: 'img/favicon.svg',
  url: 'https://micdrop.dev',
  baseUrl: '/',
  organizationName: 'lonestone',
  projectName: 'micdrop',
  onBrokenLinks: 'throw',
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
          sidebarPath: require.resolve('./sidebars.ts'),
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: 'Micdrop',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/lonestone/micdrop',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Lonestone.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  },
}

export default config
