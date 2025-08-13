import CodeBlock from '@theme/CodeBlock'

interface CustomCodeBlockProps {
  language: string
  code: string
}

export function CustomCodeBlock({ language, code }: CustomCodeBlockProps) {
  return (
    <div className="[&_.theme-code-block]:mb-0">
      <CodeBlock
        language={language}
        className="p-2 m-0 text-md text-left !bg-ai-surface-50 dark:!bg-ai-surface-900"
      >
        {code}
      </CodeBlock>
    </div>
  )
}
