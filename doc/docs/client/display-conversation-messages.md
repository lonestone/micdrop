# Display Conversation Messages

Display and manage conversation messages between the user and AI assistant during voice calls.

## Accessing Messages

The conversation is available through the Micdrop state and contains all messages exchanged during the current session.

### Basic Usage

Access conversation messages using the state:

```typescript
import { Micdrop } from '@micdrop/client'

// Get current conversation
const conversation = Micdrop.conversation

console.log('Total messages:', conversation.length)
conversation.forEach((message, index) => {
  console.log(`${message.role}: ${message.content}`)
})
```

### Message Structure

Each item in the conversation can be a regular message, tool call, or tool result:

```typescript
type MicdropConversationItem =
  | MicdropConversationMessage
  | MicdropConversationToolCall
  | MicdropConversationToolResult

interface MicdropConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, any>
}

interface MicdropConversationToolCall {
  role: 'tool_call'
  toolName: string
  parameters: string // JSON string
}

interface MicdropConversationToolResult {
  role: 'tool_result'
  toolName: string
  output: string // JSON string
}
```

**Message Types:**

- **`MicdropConversationMessage`**: Regular conversation messages
  - `'user'`: Messages from the user (transcribed speech)
  - `'assistant'`: Messages from the AI assistant
  - `'system'`: System messages (rare, used for debugging)
- **`MicdropConversationToolCall`**: When the AI agent calls a tool/function
- **`MicdropConversationToolResult`**: The result/output from a tool execution

## Message Events

Listen for message events to handle real-time updates:

```typescript
import { Micdrop } from '@micdrop/client'

Micdrop.on('StateChange', (state) => {
  console.log('Messages:', state.conversation)
})
```

## React Integration

Use the React hook to automatically update your UI when new messages arrive:

```tsx
import { useMicdropState } from '@micdrop/react'

function ConversationDisplay() {
  const { conversation } = useMicdropState()

  return (
    <div className="conversation">
      {conversation.map((message, index) => (
        <div key={index} className={`message ${message.role}`}>
          <strong>{message.role}:</strong> {message.content}
        </div>
      ))}
    </div>
  )
}
```

### Complete React Component Example

Here's a full-featured conversation component with styling and auto-scroll that show tool calls:

```tsx
import { useMicdropState } from '@micdrop/react'
import { useEffect, useRef } from 'react'

interface Props {
  className?: string
}

export default function Conversation({ className }: Props) {
  const { conversation } = useMicdropState()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
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
        return (
          <div
            key={index}
            className="max-w-[80%] p-3 rounded-xl bg-blue-50 ml-0 mr-auto border-l-4 border-blue-300"
          >
            <div className="text-sm text-blue-600 font-medium mb-1">
              🔧 Tool Call: {item.toolName}
            </div>
            <div className="text-xs text-blue-500 font-mono bg-blue-100 p-2 rounded">
              {JSON.stringify(JSON.parse(item.parameters), null, 2)}
            </div>
          </div>
        )

      case 'tool_result':
        return (
          <div
            key={index}
            className="max-w-[80%] p-3 rounded-xl bg-purple-50 ml-0 mr-auto border-l-4 border-purple-300"
          >
            <div className="text-sm text-purple-600 font-medium mb-1">
              📋 Tool Result: {item.toolName}
            </div>
            <div className="text-xs text-purple-500 font-mono bg-purple-100 p-2 rounded">
              {JSON.stringify(JSON.parse(item.output), null, 2)}
            </div>
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
```

## Clearing Conversation

Clear the conversation history when needed (doesn't apply on server):

```typescript
import { Micdrop } from '@micdrop/client'

// Clear all messages
Micdrop.conversation = []
```

The conversation is automatically cleared when the call starts, not when it ends.
