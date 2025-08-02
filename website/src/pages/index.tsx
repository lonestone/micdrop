import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import Layout from '@theme/Layout'

import styles from './index.module.css'

function HomepageHeader(): JSX.Element {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">Micdrop</h1>
        <p className="hero__subtitle">Real-Time Voice Conversations with AI</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}

export default function Home(): JSX.Element {
  return (
    <Layout
      title="Micdrop"
      description="Documentation for building real-time voice conversations with AI"
    >
      <HomepageHeader />
    </Layout>
  )
}
