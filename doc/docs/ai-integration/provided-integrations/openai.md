# OpenAI

OpenAI implementation for [@micdrop/server](../../server).

This package provides AI agent and speech-to-text implementations using OpenAI's API.

## Installation

```bash
npm install @micdrop/openai
```

## OpenAI Agent

### Usage

```typescript
import { OpenaiAgent } from '@micdrop/openai'
import { MicdropServer } from '@micdrop/server'

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'gpt-4o', // Default model
  systemPrompt: 'You are a helpful assistant',

  // Advanced features (optional)
  autoEndCall: true, // Automatically end call when user requests
  autoSemanticTurn: true, // Handle incomplete sentences
  autoIgnoreUserNoise: true, // Filter out meaningless sounds

  // Custom OpenAI settings (optional)
  settings: {
    temperature: 0.7,
    max_output_tokens: 150,
  },
})

// Use with MicdropServer
new MicdropServer(socket, {
  agent,
  // ... other options
})
```

### Options

| Option                | Type                                                                                      | Default     | Description                             |
| --------------------- | ----------------------------------------------------------------------------------------- | ----------- | --------------------------------------- |
| `apiKey`              | `string`                                                                                  | Required    | Your OpenAI API key                     |
| `model`               | `string`                                                                                  | `'gpt-4o'`  | OpenAI model to use                     |
| `systemPrompt`        | `string`                                                                                  | Required    | System prompt for the agent             |
| `autoEndCall`         | `boolean \| string`                                                                       | `false`     | Auto-detect when user wants to end call |
| `autoSemanticTurn`    | `boolean \| string`                                                                       | `false`     | Handle incomplete user sentences        |
| `autoIgnoreUserNoise` | `boolean \| string`                                                                       | `false`     | Filter meaningless user sounds          |
| `extract`             | [`ExtractJsonOptions`](#json-extraction) \| [`ExtractTagOptions`](#custom-tag-extraction) | `undefined` | Extract structured data from responses  |
| `settings`            | `object`                                                                                  | `{}`        | Additional OpenAI API parameters        |

The OpenAI Agent supports adding and removing custom tools to extend its capabilities.

### Adding Tools

Use `addTool(tool: Tool)` to add custom functions that the agent can call during conversations:

```typescript
import { z } from 'zod'

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: 'You are a helpful assistant that can manage user information.',
})

// Add a simple tool without parameters
agent.addTool({
  name: 'get_time',
  description: 'Get the current time',
  callback: () => new Date().toLocaleTimeString(),
})

// Add a tool with typed parameters using Zod schema
agent.addTool({
  name: 'set_user_info',
  description: 'Save user information to the database',
  parameters: z.object({
    city: z.string().describe('City'),
    jobTitle: z.string().describe('Job title').nullable(),
    experience: z
      .number()
      .describe('Number of years of experience of the user')
      .nullable(),
  }),
  callback: ({ city, jobTitle, experience }) => {
    // Your implementation here
    console.log('Saving user:', { city, jobTitle, experience })
    return { success: true, message: 'User information saved' }
  },
})

// Add a tool that returns data for the conversation
agent.addTool({
  name: 'search_database',
  description: 'Search for items in the database',
  parameters: z.object({
    query: z.string().describe('Search query'),
    limit: z.number().default(10).describe('Maximum number of results'),
  }),
  callback: async ({ query, limit }) => {
    // Your search implementation
    const results = await searchDatabase(query, limit)
    return { results, total: results.length }
  },
  emitOutput: true, // Enable tool call events
})
```

#### Tool Options

| Option        | Type                             | Default  | Description                             |
| ------------- | -------------------------------- | -------- | --------------------------------------- |
| `name`        | `string`                         | Required | Unique name for the tool                |
| `description` | `string`                         | Required | Description of what the tool does       |
| `parameters`  | `z.ZodObject`                    | Optional | Zod schema for parameter validation     |
| `callback`    | `(input) => any \| Promise<any>` | Required | Function to execute when tool is called |
| `skipAnswer`  | `boolean`                        | `false`  | Skip assistant response after tool call |
| `emitOutput`  | `boolean`                        | `false`  | Emit ToolCall events for monitoring     |

:::tip

If `emitOutput` is true, the tool call output is also sent to the client and available with the `ToolCall` event.

:::

### Removing Tools

Use `removeTool(name: string)` to remove tools by name:

```typescript
// Remove a specific tool
agent.removeTool('get_time')
```

### Getting Tools

Use `getTool(name: string)` to retrieve a tool by name:

```typescript
// Get a specific tool (undefined if not found)
const tool = agent.getTool('get_time')
```

### Tool Call Events

Monitor tool executions in real-time by enabling the `emitOutput` option and listening for `ToolCall` events:

```typescript
import { OpenaiAgent } from '@micdrop/openai'

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: 'You are a helpful assistant with access to tools.',
})

// Add tool with emitOutput enabled
agent.addTool({
  name: 'save_user_data',
  description: 'Save user data to the system',
  parameters: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  emitOutput: true, // Enable events for this tool
})

// Listen for tool call event
agent.on('ToolCall', (toolCall) => {
  console.log(`Tool called: ${toolCall.name}`)
  console.log('Parameters:', toolCall.parameters)
  console.log('Output:', toolCall.output)

  if (toolCall.name === 'save_user_data') {
    // Sync data to external systems
    syncToDatabase(toolCall.output)
  }
})
```

:::tip

It may be easier to use tool `callback` option if you don't need to emit the output to the client.

:::

#### Tool Call Event Structure

The `ToolCall` event provides complete information about tool execution:

```typescript
interface ToolCall {
  name: string // Tool name that was called
  parameters: any // Parameters passed to the tool
  output: any // Result returned by the tool callback
}
```

### Auto End Call

When enabled, the agent automatically detects when the user wants to end the conversation and triggers the call termination:

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: 'You are a helpful assistant',
  autoEndCall: true, // Use default detection
  // or provide custom prompt:
  // autoEndCall: 'User is saying goodbye or wants to hang up',
})
```

### Semantic Turn Detection

Handles cases where users speak incomplete sentences, allowing for more natural conversation flow:

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: 'You are a helpful assistant',
  autoSemanticTurn: true, // Wait for complete thoughts
  // or provide custom prompt:
  // autoSemanticTurn: 'Last user message is an incomplete sentence',
})
```

### User Noise Filtering

Filters out meaningless sounds like "uh", "hmm", "ahem" that don't carry conversational meaning:

```typescript
const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY || '',
  systemPrompt: 'You are a helpful assistant',
  autoIgnoreUserNoise: true, // Ignore filler sounds
  // or provide custom prompt:
  // autoIgnoreUserNoise: 'Last user message is just an interjection',
})
```

### Extract Options

The OpenAI Agent can extract structured data from assistant responses, such as JSON objects or content between custom tags. The extracted data can be processed via callbacks and saved to message metadata.

By outputting message first an then the data to extract, you can maintain a low latency. Micdrop streams immediately the answer and stops streaming when the data to extract starts.

#### JSON Extraction

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

#### Custom Tag Extraction

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

#### Extract Options

| Option           | Type                   | Description                                     |
| ---------------- | ---------------------- | ----------------------------------------------- |
| `json`           | `boolean`              | Extract JSON objects (uses `{` and `}` as tags) |
| `startTag`       | `string`               | Custom start tag for extraction                 |
| `endTag`         | `string`               | Custom end tag for extraction                   |
| `callback`       | `(value: any) => void` | Function called with extracted data             |
| `saveInMetadata` | `boolean`              | Save extracted data to message metadata         |

**Best Practices**

- Provide clear system prompts about where and how to include extractable data
- Extracted content must be at the end of responses
- Keep in mind metadata is also passed to the client, so be aware that the user can access it

## OpenAI STT (Speech-to-Text)

### Usage

```typescript
import { OpenaiSTT } from '@micdrop/openai'
import { MicdropServer } from '@micdrop/server'

const stt = new OpenaiSTT({
  apiKey: process.env.OPENAI_API_KEY || '',
  model: 'whisper-1', // Default Whisper model
  language: 'en', // Optional: specify language for better accuracy
})

// Use with MicdropServer
new MicdropServer(socket, {
  stt,
  // ... other options
})
```

### Options

| Option     | Type     | Default       | Description                     |
| ---------- | -------- | ------------- | ------------------------------- |
| `apiKey`   | `string` | Required      | Your OpenAI API key             |
| `model`    | `string` | `'whisper-1'` | Whisper model to use            |
| `language` | `string` | Optional      | Language code for transcription |
