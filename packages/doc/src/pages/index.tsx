import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Heading from '@theme/Heading'
import Layout from '@theme/Layout'
import { HomepageCodeBlock } from '../components/HomepageCodeBlock'
import { HomepageFeatures } from '../components/HomepageFeatures'

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext()
  return (
    <header className="hero hero--primary py-16 text-center relative overflow-hidden bg-grid">
      <div className="absolute inset-0 bg-gradient-to-br from-ai-surface-950 via-ai-surface-900 to-ai-surface-950"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="text-left">
            <Heading
              as="h1"
              className="text-5xl font-black mb-4 bg-gradient-to-r from-ai-primary-400 via-ai-primary-300 to-ai-accent-400 bg-clip-text text-transparent text-glow"
            >
              🖐️🎤 {siteConfig.title}
            </Heading>
            <p className="text-2xl text-ai-surface-200 mb-8">
              {siteConfig.tagline}
            </p>
            <p className="text-lg leading-relaxed text-ai-surface-300 mb-8">
              Build real-time voice conversations with AI agents using
              TypeScript. Micdrop handles all the complexities of microphone
              input, audio playbook, streaming, and AI integration.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                className="ai-button"
                to="/docs/getting-started/installation"
              >
                Get Started - 5min ⏱️
              </Link>
              <Link
                className="ai-button-secondary"
                to="https://github.com/lonestone/micdrop"
                target="_blank"
              >
                View on GitHub
              </Link>
            </div>
          </div>
          <HomepageCodeBlock />
        </div>
      </div>
    </header>
  )
}

export default function Home(): JSX.Element {
  const { siteConfig } = useDocusaurusContext()
  return (
    <Layout
      title={`${siteConfig.title} - TypeScript Voice AI Library`}
      description="TypeScript library for real-time voice conversations with AI agents. Build voice apps with microphone input, audio playback, and AI integration."
    >
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  )
}
