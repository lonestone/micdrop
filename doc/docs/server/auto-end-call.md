# Auto End Call

When enabled, the agent automatically detects when the user wants to end the conversation and triggers the call termination.

## Usage

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: 'You are a helpful assistant',
  autoEndCall: true, // Use default detection
  // or provide custom prompt:
  // autoEndCall: 'User is saying goodbye or wants to hang up',
})
```

## Configuration Options

| Option        | Type                | Description                                    |
| ------------- | ------------------- | ---------------------------------------------- |
| `autoEndCall` | `boolean \| string` | Enable auto-detection or provide custom prompt |

- **`true`**: Uses the default detection logic
- **`string`**: Provides a custom prompt for the AI to use when determining if the user wants to end the call

## How it Works

The auto end call feature analyzes user messages to detect phrases and context that indicate the user wants to terminate the conversation. When such intent is detected, the agent automatically emits an `EndCall` event to gracefully close the session.

## Best Practices

- Use clear system prompts that help the agent understand when conversations should end
- Test with various farewell phrases to ensure proper detection
- Consider the context of your application when customizing the detection prompt
