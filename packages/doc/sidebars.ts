import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/index',
        'getting-started/installation',
        'getting-started/quick-start',
      ],
    },
    {
      type: 'category',
      label: 'Client (Browser)',
      items: [
        'client/index',
        'client/installation',
        'client/start-call',
        'client/pause-resume-call',
        'client/stop-call',
        'client/vad',
        'client/devices-management',
        'client/error-handling',
        'client/react-hooks',
        {
          type: 'category',
          label: 'Utility Classes',
          items: [
            'client/utility-classes/index',
            'client/utility-classes/mic',
            'client/utility-classes/micdrop-client',
            'client/utility-classes/mic-recorder',
            'client/utility-classes/speaker',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Server (Node.js)',
      items: [
        'server/index',
        'server/installation',
        'server/with-fastify',
        'server/with-nestjs',
        'server/auth-and-parameters',
        'server/first-message',
        'server/save-messages',
        'server/error-handling',
      ],
    },
    {
      type: 'category',
      label: 'AI Integration',
      items: [
        'ai-integration/index',
        {
          type: 'category',
          label: 'Provided Integrations',
          items: [
            'ai-integration/provided-integrations/cartesia',
            'ai-integration/provided-integrations/elevenlabs',
            'ai-integration/provided-integrations/gladia',
            'ai-integration/provided-integrations/mistral',
            'ai-integration/provided-integrations/openai',
          ],
        },
        {
          type: 'category',
          label: 'Custom Integrations',
          items: [
            'ai-integration/custom-integrations/custom-agent',
            'ai-integration/custom-integrations/custom-stt',
            'ai-integration/custom-integrations/custom-tts',
          ],
        },
      ],
    },
  ],
};

export default sidebars;