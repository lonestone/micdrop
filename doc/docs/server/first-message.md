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

If you want the assistant to speak only after the user has spoken specific word(s), you can handle it on the [Agent](../ai-integration/custom-integrations/custom-agent.md) level by reacting differently in the `answer` method.

**Pseudo-code example:**

- If this is the first message
  - If user says "Ok Micdrop" → answer
  - Else → ignore and remove message (`cancelLastUserMessage` method)
- Else → answer normally
