# Semantic Turn Detection

Semantic turn detection handles cases where users speak incomplete sentences, allowing for more natural conversation flow by waiting for complete thoughts before processing.

## Usage

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: 'You are a helpful assistant',
  autoSemanticTurn: true, // Wait for complete thoughts
  // or provide custom prompt:
  // autoSemanticTurn: 'Last user message is an incomplete sentence',
})
```

## Configuration Options

| Option             | Type                | Description                               |
| ------------------ | ------------------- | ----------------------------------------- |
| `autoSemanticTurn` | `boolean \| string` | Enable detection or provide custom prompt |

- **`true`**: Uses the default incomplete sentence detection logic
- **`string`**: Provides a custom prompt for the AI to use when determining if a message is incomplete

## How it Works

The semantic turn detection feature analyzes user messages to determine if they represent complete thoughts or incomplete sentences. When an incomplete sentence is detected, the agent emits a `SkipAnswer` event to skip the answer.

## Example Scenarios

**Without Semantic Turn Detection:**

- User: "I want to..."
- Agent: "What would you like to do?"
- User: "book a flight"

**With Semantic Turn Detection:**

- User: "I want to..."
- _Agent waits_
- User: "book a flight"
- Agent: "I'd be happy to help you book a flight. Where would you like to go?"

## Best Practices

- Use this feature for conversational applications where users might pause mid-sentence
- Consider the speech-to-text accuracy when enabling this feature
- Test with various incomplete sentence patterns to ensure proper detection
- Balance responsiveness with waiting for complete thoughts
