# Handling Tool Calls

Monitor and respond to AI agent tool executions in real-time on the client side.

## Overview

When AI agents use tools (functions) during conversations, you can monitor these tool calls on the client side. This is useful for:

- **Real-time UI updates**: Show users what actions the AI is performing
- **Progress indicators**: Display loading states during tool execution
- **Interactive confirmations**: Allow users to approve/deny tool actions
- **Analytics and logging**: Track tool usage and effectiveness

## Basic Tool Call Monitoring

Listen for tool call events using the Micdrop client:

```typescript
import { Micdrop } from '@micdrop/client'

// Listen for tool calls from the AI agent
Micdrop.on('ToolCall', (toolCall) => {
  console.log('AI is using tool:', toolCall.name)
  console.log('Parameters:', toolCall.parameters)
  console.log('Result:', toolCall.output)
})
```

## Tool Call Structure

Each tool call event contains complete information about the tool execution:

```typescript
interface ToolCall {
  name: string // Name of the tool that was called
  parameters: any // Parameters passed to the tool
  output: any // Result returned by the tool
}
```

## React Example

Update your interface based on specific tool calls:

```tsx
import { useMicdropState } from '@micdrop/react'
import { useState, useEffect } from 'react'

function SmartInterface() {
  const [userProfile, setUserProfile] = useState(null)
  const [emailStatus, setEmailStatus] = useState(null)
  const { isStarted } = useMicdropState()

  useEffect(() => {
    if (!isStarted) return

    const handleToolCall = (toolCall) => {
      // Handle different tool types
      switch (toolCall.name) {
        case 'save_user_data':
          // Update user profile in UI
          if (toolCall.output.success) {
            setUserProfile({
              ...toolCall.parameters,
              id: toolCall.output.userId,
              lastUpdated: new Date(),
            })
          }
          break

        case 'send_email':
          // Show email status
          setEmailStatus({
            sent: toolCall.output.sent,
            messageId: toolCall.output.messageId,
            recipient: toolCall.parameters.to,
            timestamp: new Date(),
          })
          break

        case 'search_database':
          // Could trigger a UI update with search results
          console.log(`Found ${toolCall.output.results.length} results`)
          break
      }
    }

    Micdrop.on('ToolCall', handleToolCall)

    return () => {
      Micdrop.off('ToolCall', handleToolCall)
    }
  }, [isStarted])

  return (
    <div className="smart-interface">
      {userProfile && (
        <div className="user-profile">
          <h3>User Profile</h3>
          <p>Name: {userProfile.name}</p>
          <p>Email: {userProfile.email}</p>
          <p>ID: {userProfile.id}</p>
          <small>
            Last updated: {userProfile.lastUpdated.toLocaleString()}
          </small>
        </div>
      )}

      {emailStatus && (
        <div className="email-status">
          <h3>Email Status</h3>
          <p>
            {emailStatus.sent ? '✅ Sent' : '❌ Failed'} to{' '}
            {emailStatus.recipient}
          </p>
          {emailStatus.messageId && (
            <small>Message ID: {emailStatus.messageId}</small>
          )}
        </div>
      )}
    </div>
  )
}
```

## Server-side implementation

[Agents can pass tool calls output](../ai-integration/custom-integrations/custom-agent#core-interfaces) to the client by emitting the `ToolCall` event.

For example, the [OpenAI Agent](../ai-integration/provided-integrations/openai.md#tool-call-events) emits the `ToolCall` event when a tool is called with the `emitOutput` option enabled.
