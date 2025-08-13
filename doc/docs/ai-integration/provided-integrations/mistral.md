# Mistral

Mistral AI implementation for [@micdrop/server](../../server).

This package provides AI agent implementation using Mistral AI's API for conversational AI applications.

## Installation

```bash
npm install @micdrop/mistral
```

## Mistral Agent

### Usage

```typescript
import { MistralAgent } from '@micdrop/mistral'
import { MicdropServer } from '@micdrop/server'

const agent = new MistralAgent({
  apiKey: process.env.MISTRAL_API_KEY || '',
  model: 'ministral-8b-latest', // Default model
  systemPrompt: 'You are a helpful assistant',
})

// Use with MicdropServer
new MicdropServer(socket, {
  agent,
  // ... other options
})
```

### Options

| Option         | Type     | Default                 | Description                          |
| -------------- | -------- | ----------------------- | ------------------------------------ |
| `apiKey`       | `string` | Required                | Your Mistral AI API key              |
| `model`        | `string` | `'ministral-8b-latest'` | Mistral AI model to use              |
| `systemPrompt` | `string` | Required                | System prompt for the agent          |
| `settings`     | `object` | `{}`                    | Additional Mistral AI API parameters |

### Available Models

Mistral AI offers several models you can choose from:

- **`ministral-8b-latest`** - Fast and efficient 8B parameter model (default)
- **`mistral-large-latest`** - Most capable model for complex tasks
- **`mistral-small-latest`** - Balanced performance and cost
- **`codestral-latest`** - Specialized for code generation

### Settings Object

The `settings` parameter accepts any additional options from the Mistral AI Chat Completions API:

```typescript
const agent = new MistralAgent({
  apiKey: process.env.MISTRAL_API_KEY || '',
  systemPrompt: 'You are a helpful assistant',
  settings: {
    temperature: 0.7, // Controls randomness (0-1)
    max_tokens: 1000, // Maximum tokens in response
    top_p: 0.9, // Nucleus sampling parameter
    random_seed: 42, // For reproducible outputs
    safe_prompt: false, // Enable/disable safety filtering
  },
})
```
