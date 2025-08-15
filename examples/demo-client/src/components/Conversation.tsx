import { MicdropConversationToolResult } from '@micdrop/client'
import { useMicdropState } from '@micdrop/react'
import { useEffect, useRef } from 'react'

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

  const renderMessage = (item: (typeof conversation)[0], index: number) => {
    switch (item.role) {
      case 'user':
      case 'assistant':
      case 'system':
        return (
          <div
            key={index}
            className={`max-w-[80%] p-3 rounded-xl ${
              item.role === 'assistant'
                ? 'bg-green-100 ml-0 mr-auto rounded-bl-none'
                : item.role === 'user'
                  ? 'bg-white ml-auto mr-0 rounded-br-none'
                  : 'bg-gray-50 mx-auto'
            }`}
          >
            {item.content}
          </div>
        )

      case 'tool_call':
        const result = conversation.find(
          (message) =>
            message.role === 'tool_result' &&
            message.toolCallId === item.toolCallId
        ) as MicdropConversationToolResult | undefined
        return (
          <div
            key={index}
            className="max-w-[80%] p-3 rounded-xl bg-purple-50 ml-0 mr-auto border-l-4 border-purple-300"
          >
            <div className="flex flex-row gap-1 items-center text-sm text-purple-600 font-medium mb-2">
              🔧 {item.toolName}
              <div className="text-xs text-purple-500 font-mono bg-purple-100 p-2 rounded">
                {JSON.stringify(JSON.parse(item.parameters), null, 2)}
              </div>
            </div>
            {result && (
              <div className="text-xs text-purple-500 font-mono bg-purple-100 p-2 rounded">
                ✅ {JSON.stringify(JSON.parse(result.output), null, 2)}
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`flex flex-col overflow-y-auto p-6 ${className}`}>
      <div className="flex flex-col gap-4">
        {conversation.map((item, index) => renderMessage(item, index))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
