# Noise Filtering

User noise filtering automatically filters out meaningless sounds like "uh", "hmm", "ahem" that don't carry conversational meaning, improving the quality of conversation flow.

## Usage

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: 'You are a helpful assistant',
  autoIgnoreUserNoise: true, // Ignore filler sounds
  // or provide custom prompt:
  // autoIgnoreUserNoise: 'Last user message is just an interjection',
})
```

## Configuration Options

| Option                | Type                | Description                               |
| --------------------- | ------------------- | ----------------------------------------- |
| `autoIgnoreUserNoise` | `boolean \| string` | Enable filtering or provide custom prompt |

- **`true`**: Uses the default noise detection logic
- **`string`**: Provides a custom prompt for the AI to use when determining if a message is just noise

## How it Works

A specific tool is added to the query, that will be called when the agent detects that the user message is just noise. When a noise is detected, the agent automatically emits an `CancelLastUserMessage` to removed and ignore the last user message.

## Common Filtered Sounds

The system typically filters out:

- Filler words: "uh", "um", "er"
- Interjections: "hmm", "ahem", "oh"
- Breathing sounds and background noise
- Partial words or unclear utterances

## Example Scenarios

**Without User Noise Filtering:**

- User: "Um..."
- Agent: "I'm sorry, I didn't understand. Could you please repeat that?"
- User: "I want to book a flight"

**With User Noise Filtering:**

- User: "Um..."
- _Agent ignores the noise_
- User: "I want to book a flight"
- Agent: "I'd be happy to help you book a flight. Where would you like to go?"

## Best Practices

- Consider the quality of your speech-to-text service when configuring
- Test with various noise patterns to ensure legitimate short responses aren't filtered
- Balance filtering with responsiveness to avoid ignoring valid but brief user input
- Monitor conversation logs to ensure important utterances aren't being filtered out
