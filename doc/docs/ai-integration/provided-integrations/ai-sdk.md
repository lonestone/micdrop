# AI SDK

AI SDK implementation for [@micdrop/server](../../server).

This package provides an AI agent implementation using the [Vercel AI SDK](https://sdk.vercel.ai/), allowing you to use any compatible language model provider.

## Installation

Install AI SDK:

```bash
npm install @micdrop/ai-sdk
```

And install the provider you want to use, for example OpenAI:

```bash
npm install @ai-sdk/openai
```

## AI SDK Agent

### Usage

```typescript
import { AiSdkAgent } from '@micdrop/ai-sdk'
import { MicdropServer } from '@micdrop/server'
import { openai } from '@ai-sdk/openai' // or any other provider

const agent = new AiSdkAgent({
  model: openai('gpt-4o'), // Use any AI SDK compatible model
  systemPrompt: 'You are a helpful assistant',

  // Custom AI SDK settings (optional)
  settings: {
    temperature: 0.7,
    maxTokens: 150,
  },
})

// Use with MicdropServer
new MicdropServer(socket, {
  agent,
  // ... other options
})
```

### Supported Providers

The AI SDK Agent supports any provider compatible with the Vercel AI SDK:

- **OpenAI**: `openai('gpt-4o')`, `openai('gpt-3.5-turbo')`
- **Anthropic**: `anthropic('claude-3-5-sonnet-20241022')`
- **Google**: `google('gemini-1.5-pro')`, `google('gemini-1.5-flash')`
- **Mistral**: `mistral('mistral-large-latest')`
- **And many more**: See [AI SDK Providers](https://sdk.vercel.ai/providers/ai-sdk-providers)

### Options

| Option                | Type                                                                                                                              | Default     | Description                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------ |
| `model`               | `LanguageModel`                                                                                                                   | Required    | Any AI SDK compatible language model                                     |
| `systemPrompt`        | `string`                                                                                                                          | Required    | System prompt for the agent                                              |
| `autoEndCall`         | `boolean \| string`                                                                                                               | `false`     | [Auto-detect when user wants to end call](../../server/auto-end-call)    |
| `autoSemanticTurn`    | `boolean \| string`                                                                                                               | `false`     | [Handle incomplete user sentences](../../server/semantic-turn-detection) |
| `autoIgnoreUserNoise` | `boolean \| string`                                                                                                               | `false`     | [Filter meaningless user sounds](../../server/user-noise-filtering)      |
| `extract`             | [`ExtractJsonOptions`](../../server/extract#json-extraction) \| [`ExtractTagOptions`](../../server/extract#custom-tag-extraction) | `undefined` | Extract structured data from responses                                   |
| `onBeforeAnswer`      | `function`                                                                                                                        | `undefined` | Hook called before answer generation - return `true` to skip generation  |
| `settings`            | `CallSettings`                                                                                                                    | `{}`        | Additional AI SDK parameters                                             |

The AI SDK Agent supports adding and removing custom tools to extend its capabilities. For detailed information about tool management, see the [Tools documentation](../../server/tools).

### Advanced Features

The AI SDK Agent supports advanced features for improved conversation handling:

- **[Auto End Call](../../server/auto-end-call)**: Automatically detect when users want to end the conversation
- **[Semantic Turn Detection](../../server/semantic-turn-detection)**: Handle incomplete sentences for natural flow
- **[User Noise Filtering](../../server/user-noise-filtering)**: Filter out meaningless sounds and filler words
- **[Extract Value from Answer](../../server/extract)**: Extract structured data from responses
- **[Tools](../../server/tools)**: Add custom tools to the agent
