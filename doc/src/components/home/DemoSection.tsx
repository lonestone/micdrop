import Heading from '@theme/Heading'

export function DemoSection() {
  return (
    <section className="container max-w-3xl px-4">
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
    </section>
  )
}
