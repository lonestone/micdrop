export function QuoteSection() {
  return (
    <section className="container text-center">
      <div className="text-2xl md:text-3xl font-bold text-ai-surface-800 dark:text-ai-surface-100 leading-relaxed">
        Just call{' '}
        <code className="bg-ai-surface-200 dark:bg-ai-surface-700 px-2 py-1 rounded text-xl md:text-2xl text-ai-primary-600 dark:text-ai-primary-400">
          start()
        </code>{' '}
        and your app has complete voice AI.
        <div className="text-lg md:text-xl text-ai-surface-600 dark:text-ai-surface-400 mt-4 font-normal">
          Micdrop handles all the complexity for you.
        </div>
      </div>
    </section>
  )
}
