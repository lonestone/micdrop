import { useEffect, useRef } from 'react'
import { useMicdropState } from './useMicdropState'

interface Props {
  className?: string
}

export default function Conversation({ className }: Props) {
  const { conversation } = useMicdropState()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to the bottom of the conversation
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation.length])

  return (
    <div className={`flex flex-col overflow-y-auto p-6 ${className}`}>
      <div className="flex flex-col gap-4">
        {conversation.map(({ role, content }, index) => (
          <div
            key={index}
            className={`max-w-[80%] p-3 rounded-xl ${
              role === 'assistant'
                ? 'bg-green-100 ml-0 mr-auto rounded-bl-none'
                : role === 'user'
                  ? 'bg-white ml-auto mr-0 rounded-br-none'
                  : 'bg-gray-50 mx-auto'
            }`}
          >
            {content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
