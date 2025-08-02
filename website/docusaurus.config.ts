import { themes as prismThemes } from 'prism-react-renderer'
import type { Config } from '@docusaurus/types'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
          sidebarPath: resolve(__dirname, './sidebars.ts'),
        },
        blog: false,
        theme: {
          customCss: resolve(__dirname, './src/css/custom.css'),
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
