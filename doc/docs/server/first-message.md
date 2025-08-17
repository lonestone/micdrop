# First Message

Configure the initial message that greets users when they start a voice conversation.

## Static First Message

Set a fixed greeting message with `firstMessage` option:

```typescript
new MicdropServer(socket, {
  firstMessage: 'Hello! How can I help you today?',
  agent,
  stt,
  tts,
})
```

## Dynamic First Message Generation

Use `generateFirstMessage: true` to let the AI agent create personalized greetings with `systemPrompt`:

```typescript
new MicdropServer(socket, {
  generateFirstMessage: true, // Agent will generate the first message
  agent: new OpenaiAgent({
    apiKey: process.env.OPENAI_API_KEY,
    systemPrompt:
      'You are a helpful assistant. Start with a warm, personalized greeting.',
  }),
  stt,
  tts,
})
```

## Let the user speak first

Don't set a first message to let the user speak first:

```typescript
new MicdropServer(socket, {
  agent,
  stt,
  tts,
})
```

## Wake word

If you want the assistant to speak only after the user has spoken specific word(s), you can use the `onBeforeAnswer` hook in your agent configuration.

```typescript
const WAKE_WORD = /Hello|Bonjour/
const FIRST_MESSAGE = 'Hello! How can I help you today?'

new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY,
  systemPrompt: 'You are a helpful assistant.',
  onBeforeAnswer(stream) {
    // Process only first message
    const isFirstAnswer = !this.conversation.some(
      (message) => message.role === 'assistant'
    )
    if (!isFirstAnswer) return

    // Get last user message
    const lastUserMessage = this.conversation.findLast(
      (message) => message.role === 'user'
    ) as MicdropConversationMessage
    if (!lastUserMessage) return

    // Check for wake word(s)
    if (!WAKE_WORD.test(lastUserMessage.content)) {
      // Remove message without answering
      this.cancelLastUserMessage()
      // Skip normal answer generation
      return true
    }

    // Send first assistant message
    this.addAssistantMessage(FIRST_MESSAGE)
    stream.write(FIRST_MESSAGE)
    // Skip normal answer generation
    return true
  },
})
```
