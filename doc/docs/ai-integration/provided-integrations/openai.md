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

| Option                | Type                                                                                                                              | Default     | Description                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `apiKey`              | `string`                                                                                                                          | Required    | Your OpenAI API key                                                      |
| `model`               | `string`                                                                                                                          | `'gpt-4o'`  | OpenAI model to use                                                      |
| `systemPrompt`        | `string`                                                                                                                          | Required    | System prompt for the agent                                              |
| `maxRetry`            | `number`                                                                                                                          | `3`         | Maximum number of retries on API failures                                |
| `maxSteps`            | `number`                                                                                                                          | `5`         | Maximum number of steps (for tool calls)                                 |
| `autoEndCall`         | `boolean \| string`                                                                                                               | `false`     | [Auto-detect when user wants to end call](../../server/auto-end-call)    |
| `autoSemanticTurn`    | `boolean \| string`                                                                                                               | `false`     | [Handle incomplete user sentences](../../server/semantic-turn-detection) |
| `autoIgnoreUserNoise` | `boolean \| string`                                                                                                               | `false`     | [Filter meaningless user sounds](../../server/user-noise-filtering)      |
| `extract`             | [`ExtractJsonOptions`](../../server/extract#json-extraction) \| [`ExtractTagOptions`](../../server/extract#custom-tag-extraction) | `undefined` | Extract structured data from responses                                   |
| `onBeforeAnswer`      | `function`                                                                                                                        | `undefined` | Hook called before answer generation - return `true` to skip generation  |
| `settings`            | `object`                                                                                                                          | `{}`        | Additional OpenAI API parameters                                         |

The OpenAI Agent supports adding and removing custom tools to extend its capabilities. For detailed information about tool management, see the [Tools documentation](../../server/tools).

### Advanced Features

The OpenAI Agent supports advanced features for improved conversation handling:

- **[Auto End Call](../../server/auto-end-call)**: Automatically detect when users want to end the conversation
- **[Semantic Turn Detection](../../server/semantic-turn-detection)**: Handle incomplete sentences for natural flow
- **[User Noise Filtering](../../server/user-noise-filtering)**: Filter out meaningless sounds and filler words
- **[Extract Value from Answer](../../server/extract)**: Extract structured data from responses
- **[Tools](../../server/tools)**: Add custom tools to the agent

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
