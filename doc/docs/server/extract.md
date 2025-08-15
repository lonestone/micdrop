# Extract Value from Answer

The Agent system can extract structured data from assistant responses, such as JSON objects or content between custom tags. The extracted data can be processed via callbacks and saved to message metadata.

By outputting message first and then the data to extract, you can maintain a low latency. Micdrop streams immediately the answer and stops streaming when the data to extract starts.

## JSON Extraction

Extract JSON objects from the end of assistant responses:

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: `You are a helpful assistant that extracts user information.
  When collecting user details, append them as JSON at the end of your response.`,
  extract: {
    json: true,
    callback: (data) => {
      console.log('Extracted data:', data)
    },
    saveInMetadata: true,
  },
})
```

Example conversation:

- **Input**: `"I'm John, 25 years old, living in Paris"`
- **Received output**: `"Nice to meet you John! I've noted your information. {"name": "John", "age": 25, "city": "Paris"}"`
- **Message**: `{"role": "assistant", "content": "Nice to meet you John! I've noted your information.", "metadata": {"extracted": {"name": "John", "age": 25, "city": "Paris"}}}`
- **Callback**: `{"name": "John", "age": 25, "city": "Paris"}`

## Custom Tag Extraction

Extract content between custom start and end tags:

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: `You are a task management assistant.
  When creating tasks, wrap the task details in <TASK></TASK> tags at the end.`,
  extract: {
    startTag: '<TASK>',
    endTag: '</TASK>',
    callback: (taskData) => {
      console.log('New task created:', taskData)
      createTask(taskData)
    },
    saveInMetadata: true,
  },
})
```

Example conversation:

- **Input**: `"Remind me to call mom tomorrow at 3pm"`
- **Received output**: `"I'll create that reminder for you! <TASK>Call mom tomorrow at 3pm - priority: normal</TASK>"`
- **Message**: `{"role": "assistant", "content": "I'll create that reminder for you!", "metadata": {"extracted": "Call mom tomorrow at 3pm - priority: normal"}}`
- **Callback**: `{"task": "Call mom tomorrow at 3pm - priority: normal"}`

## Extract Options

| Option           | Type                   | Description                                     |
| ---------------- | ---------------------- | ----------------------------------------------- |
| `json`           | `boolean`              | Extract JSON objects (uses `{` and `}` as tags) |
| `startTag`       | `string`               | Custom start tag for extraction                 |
| `endTag`         | `string`               | Custom end tag for extraction                   |
| `callback`       | `(value: any) => void` | Function called with extracted data             |
| `saveInMetadata` | `boolean`              | Save extracted data to message metadata         |

## Best Practices

- Provide clear system prompts about where and how to include extractable data
- Extracted content must be at the end of responses
- Keep in mind metadata is also passed to the client, so be aware that the user can access it
