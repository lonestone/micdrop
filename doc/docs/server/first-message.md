# First Message

Configure the initial message that greets users when they start a voice conversation.

## Static First Message

Set a fixed greeting message:

```typescript
new MicdropServer(socket, {
  firstMessage: 'Hello! How can I help you today?',
  agent,
  tts
})
```

## Dynamic First Message Generation

Use `generateFirstMessage: true` to let the AI agent create personalized greetings:

```typescript
new MicdropServer(socket, {
  generateFirstMessage: true, // Agent will generate the first message
  agent: new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY,
    systemPrompt: 'You are a helpful assistant. Start with a warm, personalized greeting.'
  }),
  tts
})
```

## Conditional First Messages

Customize greetings based on user context:

```typescript
function getFirstMessage(userContext) {
  if (userContext.isReturningUser) {
    return `Welcome back, ${userContext.name}! How can I assist you today?`
  }
  
  if (userContext.language === 'fr') {
    return 'Bonjour ! Comment puis-je vous aider aujourd\'hui ?'
  }
  
  return 'Hello! How can I help you today?'
}

wss.on('connection', async (socket) => {
  const params = await waitForParams(socket, ...)
  const userContext = await getUserContext(params.userId)
  
  new MicdropServer(socket, {
    firstMessage: getFirstMessage(userContext),
    agent,
    tts
  })
})
```

The `firstMessage` option in MicdropServer controls the initial greeting, while `generateFirstMessage: true` allows the AI agent to create dynamic, context-aware introductions.