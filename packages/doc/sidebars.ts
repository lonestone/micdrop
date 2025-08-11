import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Core Packages',
      items: [
        'packages/client/index',
        'packages/server/index',
      ],
    },
    {
      type: 'category',
      label: 'AI Integrations',
      items: [
        'packages/openai/index',
      ],
    },
  ],
};

export default sidebars;