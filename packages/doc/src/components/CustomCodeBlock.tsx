import CodeBlock from '@theme/CodeBlock'

interface CustomCodeBlockProps {
  language: string
  code: string
  title?: string
}

export function CustomCodeBlock({
  language,
  code,
  title,
}: CustomCodeBlockProps) {
  const getBorderColor = (lang: string) => {
    switch (lang) {
      case 'bash':
        return 'border-l-ai-primary-400'
      case 'typescript':
        return 'border-l-ai-accent-400'
      default:
        return 'border-l-ai-primary-400'
    }
  }

  const getBackgroundGradient = (lang: string) => {
    switch (lang) {
      case 'bash':
        return 'bg-gradient-to-r from-ai-primary-500/5 to-transparent'
      case 'typescript':
        return 'bg-gradient-to-r from-ai-accent-500/5 to-transparent'
      default:
        return 'bg-gradient-to-r from-ai-primary-500/5 to-transparent'
    }
  }

  return (
    <div
      className={`relative border-b border-ai-surface-700/30 last:border-b-0 hover:bg-ai-primary-500/2 transition-colors duration-200`}
    >
      {title && (
        <div className="absolute top-2 right-4 text-xs text-ai-surface-400 uppercase font-mono font-semibold z-10">
          {title}
        </div>
      )}
      <div
        className={`${getBorderColor(language)} ${getBackgroundGradient(language)} border-l-4`}
      >
        <div className="[&_.prism-code]:!bg-transparent [&_.prism-code]:!p-6 [&_.prism-code]:!m-0 [&_.prism-code]:text-sm [&_.prism-code]:text-left [&_pre]:text-left [&_.prism-code]:whitespace-pre-wrap [&_pre]:whitespace-pre-wrap [&_code]:whitespace-pre-wrap">
          <CodeBlock language={language}>{code}</CodeBlock>
        </div>
      </div>
    </div>
  )
}
