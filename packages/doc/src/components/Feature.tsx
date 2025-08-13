import Heading from '@theme/Heading'

interface FeatureProps {
  title: string
  Icon: React.ComponentType<React.ComponentProps<'svg'>>
  description: JSX.Element
}

export function Feature({ title, Icon, description }: FeatureProps) {
  return (
    <div className="flex-1 min-w-[300px]">
      <div className="text-center mb-6">
        <Icon
          className="w-32 h-32 mx-auto text-ai-primary-400 mb-4"
          role="img"
        />
      </div>
      <div className="text-center px-4">
        <Heading
          as="h3"
          className="dark:text-ai-primary-300 mb-4 font-bold text-xl"
        >
          {title}
        </Heading>
        <p className="text-ai-surface-700 dark:text-ai-surface-300 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  )
}
