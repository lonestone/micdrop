import Heading from '@theme/Heading'
import { BiCodeBlock } from 'react-icons/bi'
import { FaRobot } from 'react-icons/fa'
import { HiMicrophone } from 'react-icons/hi2'
import { Feature } from './Feature'

type FeatureItem = {
  title: string
  Icon: React.ComponentType<React.ComponentProps<'svg'>>
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Real-time Voice Processing',
    Icon: HiMicrophone,
    description: (
      <>
        Advanced microphone handling with voice activity detection (VAD),
        streaming audio processing, and real-time WebSocket communication
        between browser and server.
      </>
    ),
  },
  {
    title: 'AI Provider Agnostic',
    Icon: FaRobot,
    description: (
      <>
        Choose the best AI providers for your use case. Mix and match OpenAI,
        ElevenLabs, Cartesia, Mistral, Gladia, and more. Build custom
        integrations using our abstract interfaces.
      </>
    ),
  },
  {
    title: 'Developer Experience',
    Icon: BiCodeBlock,
    description: (
      <>
        Built with TypeScript for excellent DX. Comprehensive documentation,
        React hooks, demo applications, and detailed examples to get you started
        quickly.
      </>
    ),
  },
]

export function HomepageFeatures() {
  return (
    <section className="flex items-center py-8 w-full bg-ai-surface-100 dark:bg-ai-surface-900">
      <div className="container flex flex-col gap-24 my-24 mx-auto px-4">
        {/* Features Section */}
        <div className="flex flex-wrap gap-8 justify-center">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>

        {/* Packages Section */}
        <div className="pt-12 border-t border-ai-surface-700/30">
          <div className="text-center mb-8">
            <Heading as="h2" className="text-3xl font-bold mb-4">
              📦 Packages
            </Heading>
            <p className="text-ai-surface-700 dark:text-ai-surface-300 text-lg">
              Modular architecture with specialized packages for different use
              cases
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {/* Core Packages */}
            <div className="ai-card text-center">
              <h3 className="dark:text-ai-primary-300 font-bold text-xl mb-4">
                Core Packages
              </h3>
              <p className="text-ai-surface-700 dark:text-ai-surface-300">
                Essential packages for browser and server-side implementation
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <a href="/docs/packages/client" className="ai-badge-core">
                  @micdrop/client
                </a>
                <a href="/docs/packages/server" className="ai-badge-core">
                  @micdrop/server
                </a>
              </div>
            </div>

            {/* AI Integrations */}
            <div className="ai-card text-center">
              <h3 className="dark:text-ai-primary-300 font-bold text-xl mb-4">
                AI Integrations
              </h3>
              <p className="text-ai-surface-700 dark:text-ai-surface-300">
                Ready-to-use integrations with popular AI providers
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <a href="/docs/packages/openai" className="ai-badge-ai">
                  @micdrop/openai
                </a>
                <a href="/docs/packages/elevenlabs" className="ai-badge-ai">
                  @micdrop/elevenlabs
                </a>
                <a href="/docs/packages/cartesia" className="ai-badge-ai">
                  @micdrop/cartesia
                </a>
                <a href="/docs/packages/mistral" className="ai-badge-ai">
                  @micdrop/mistral
                </a>
                <a href="/docs/packages/gladia" className="ai-badge-ai">
                  @micdrop/gladia
                </a>
              </div>
            </div>

            {/* Utilities */}
            <div className="ai-card text-center">
              <h3 className="dark:text-ai-primary-300 font-bold text-xl mb-4">
                Utilities
              </h3>
              <p className="text-ai-surface-700 dark:text-ai-surface-300">
                React hooks and utilities for seamless frontend integration
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <a href="/docs/packages/react" className="ai-badge-utility">
                  @micdrop/react
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="ai-card text-center">
          <Heading as="h2" className="text-2xl font-bold mb-4">
            🎥 See it in Action
          </Heading>
          <p className="text-ai-surface-700 dark:text-ai-surface-300 mb-6 text-lg">
            Watch the creator explain Micdrop and voice AI technology
          </p>
          <a
            href="https://www.youtube.com/watch?v=fcqVOvESQ8o"
            target="_blank"
            className="ai-button"
          >
            Watch Demo Video ▶️
          </a>
        </div>
      </div>
    </section>
  )
}
