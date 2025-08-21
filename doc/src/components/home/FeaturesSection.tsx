import { BiCodeBlock } from 'react-icons/bi'
import { FaRobot } from 'react-icons/fa'
import { HiLightningBolt } from 'react-icons/hi'
import { Feature } from '../Feature'

type FeatureItem = {
  title: string
  Icon: React.ComponentType<React.ComponentProps<'svg'>>
  description: JSX.Element
}

const FeatureList: FeatureItem[] = [
  {
    title: 'Low Latency',
    Icon: HiLightningBolt,
    description: (
      <>
        Optimized for minimal delay with streaming audio processing, voice
        activity detection (VAD), and efficient WebSocket communication for near
        real-time voice interactions.
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

export function FeaturesSection() {
  return (
    <section className="container flex flex-wrap gap-8 justify-center">
      {FeatureList.map((props, idx) => (
        <Feature key={idx} {...props} />
      ))}
    </section>
  )
}
