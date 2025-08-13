# @micdrop/openai

OpenAI implementation for [@micdrop/server](../server/README.md).

This package provides AI agent and speech-to-text implementations using OpenAI's API.

## Features

- 🤖 **OpenAI Agent** - GPT-powered conversational AI with advanced features:
  - Streaming responses for real-time conversation
  - Auto end call detection when user requests to end conversation
  - Semantic turn detection to handle incomplete sentences
  - User noise filtering to ignore meaningless interjections
  - Tool calling support for enhanced interactions
- 🎙️ **OpenAI STT** - Whisper-powered speech-to-text with:
  - High-quality transcription using Whisper models
  - Multi-language support
  - Configurable model selection

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

| Option                | Type                | Default    | Description                             |
| --------------------- | ------------------- | ---------- | --------------------------------------- |
| `apiKey`              | `string`            | Required   | Your OpenAI API key                     |
| `model`               | `string`            | `'gpt-4o'` | OpenAI model to use                     |
| `systemPrompt`        | `string`            | Required   | System prompt for the agent             |
| `autoEndCall`         | `boolean \| string` | `false`    | Auto-detect when user wants to end call |
| `autoSemanticTurn`    | `boolean \| string` | `false`    | Handle incomplete user sentences        |
| `autoIgnoreUserNoise` | `boolean \| string` | `false`    | Filter meaningless user sounds          |
| `settings`            | `object`            | `{}`       | Additional OpenAI API parameters        |

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

## Tool Management

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
})
```

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

## Advanced Features

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

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
