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

Each message in the conversation has the following structure:

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: Record<string, any>
}
```

- **`role`**: Identifies who sent the message
  - `'user'`: Messages from the user (transcribed speech)
  - `'assistant'`: Messages from the AI assistant
  - `'system'`: System messages (rare, used for debugging)
- **`content`**: The actual message text
- **`metadata`**: Optional metadata associated with the message (can be set by Agent)

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

Here's a full-featured conversation component with styling and auto-scroll:

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
```

## Clearing Conversation

Clear the conversation history when needed (doesn't apply on server):

```typescript
import { Micdrop } from '@micdrop/client'

// Clear all messages
Micdrop.conversation = []
```

The conversation is automatically cleared when the call starts, not when it ends.
