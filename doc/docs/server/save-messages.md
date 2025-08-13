# Save Messages

Capture and store conversation messages by listening to the Agent "Message" event for analytics, logging, and conversation history.

## Basic Message Logging

Listen for conversation messages:

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY,
  systemPrompt: 'You are a helpful assistant'
})

// Listen for all conversation messages
agent.on('Message', (message) => {
  console.log('New message:', {
    role: message.role,        // 'user' or 'assistant' 
    content: message.content,  // The message text
    timestamp: new Date().toISOString()
  })
})

new MicdropServer(socket, { agent, tts })
```

## Save to Database

Store messages in your database:

```typescript
import { db } from './database' // Your database connection

agent.on('Message', async (message) => {
  try {
    await db.conversations.create({
      userId: currentUserId,
      sessionId: currentSessionId,
      role: message.role,
      content: message.content,
      timestamp: new Date()
    })
  } catch (error) {
    console.error('Failed to save message:', error)
  }
})
```

## Conversation Analytics

Track conversation metrics:

```typescript
class ConversationAnalytics {
  private stats = {
    messageCount: 0,
    userMessages: 0,
    assistantMessages: 0,
    startTime: Date.now()
  }

  constructor(agent) {
    agent.on('Message', this.trackMessage.bind(this))
  }

  private trackMessage(message) {
    this.stats.messageCount++
    
    if (message.role === 'user') {
      this.stats.userMessages++
    } else {
      this.stats.assistantMessages++
    }
    
    console.log('Conversation stats:', this.getStats())
  }

  getStats() {
    return {
      ...this.stats,
      duration: Date.now() - this.stats.startTime,
      avgResponseTime: this.calculateAvgResponseTime()
    }
  }
}

const analytics = new ConversationAnalytics(agent)
```

The Agent "Message" event captures all conversation messages, allowing you to implement custom storage, analytics, and conversation management features.