import Heading from '@theme/Heading'
import { ArchitectureVisualization } from '../ArchitectureVisualization'
export function ArchitectureSection() {
  return (
    <section className="container">
      <div className="text-center mb-12">
        <Heading as="h2" className="text-3xl font-bold mb-4">
          How It Works
        </Heading>
        <p className="text-ai-surface-700 dark:text-ai-surface-300 text-lg max-w-3xl mx-auto">
          Micdrop orchestrates a complete voice conversation pipeline. Watch how
          voice data flows through each component in real-time, from your
          microphone to AI responses and back to your speakers.
        </p>
      </div>

      <ArchitectureVisualization />

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-20 text-center max-w-6xl mx-auto">
        <div className="flex-1">
          <h4 className="font-bold text-lg mb-2 text-ai-primary-600 dark:text-ai-primary-400">
            🎤 Voice Input
          </h4>
          <p className="text-ai-surface-700 dark:text-ai-surface-300 text-sm">
            Client captures microphone input, VAD detects speech, and audio
            chunks are sent to the server for processing.
          </p>
        </div>

        <GlowingChevron id="1" />

        <div className="flex-1">
          <h4 className="font-bold text-lg mb-2 text-ai-primary-600 dark:text-ai-primary-400">
            🤖 AI Processing
          </h4>
          <p className="text-ai-surface-700 dark:text-ai-surface-300 text-sm">
            Server orchestrates STT transcription, AI agent reasoning, tool
            calls, and TTS generation for natural responses.
          </p>
        </div>

        <GlowingChevron id="2" />

        <div className="flex-1">
          <h4 className="font-bold text-lg mb-2 text-ai-primary-600 dark:text-ai-primary-400">
            🔊 Voice Output
          </h4>
          <p className="text-ai-surface-700 dark:text-ai-surface-300 text-sm">
            Generated audio streams back to the client for playback, with full
            support for interruptions and real-time interaction.
          </p>
        </div>
      </div>
    </section>
  )
}

function GlowingChevron({ id }: { id: string }) {
  return (
    <div className="hidden md:block relative">
      <svg
        width="48"
        height="64"
        viewBox="0 0 48 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transform rotate-0"
      >
        <defs>
          <filter
            id={`chevron-glow-${id}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M16 16L32 32L16 48"
          stroke="#EAB308"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          filter={`url(#chevron-glow-${id})`}
        />
      </svg>
    </div>
  )
}
