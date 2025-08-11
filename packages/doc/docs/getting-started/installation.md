# Installation

Get started with Micdrop by installing the core packages and choosing your AI providers.

## Prerequisites

- **Node.js**: Version 18 or higher
- **npm/yarn/pnpm**: Latest version recommended
- **TypeScript**: Version 5.0 or higher (optional but recommended)

## Core Packages

Start by installing the essential packages:

```bash
# Install core packages
npm install @micdrop/client @micdrop/server

# Or with yarn
yarn add @micdrop/client @micdrop/server

# Or with pnpm  
pnpm add @micdrop/client @micdrop/server
```

## AI Provider Packages

Choose the AI providers you want to use:

### Language Models (LLM)
```bash
# OpenAI (GPT models)
npm install @micdrop/openai

# Mistral AI
npm install @micdrop/mistral
```

### Text-to-Speech (TTS)
```bash
# ElevenLabs (high-quality voices)
npm install @micdrop/elevenlabs

# Cartesia (low-latency streaming)
npm install @micdrop/cartesia
```

### Speech-to-Text (STT)
```bash
# Gladia (multilingual support)
npm install @micdrop/gladia

# OpenAI Whisper (via @micdrop/openai)
npm install @micdrop/openai
```

## Utility Packages

For React applications:

```bash
# React hooks and utilities
npm install @micdrop/react
```

## Complete Installation

For a full-featured setup with popular providers:

```bash
npm install @micdrop/client @micdrop/server @micdrop/openai @micdrop/elevenlabs @micdrop/gladia @micdrop/react
```

## Verify Installation

Create a simple test to verify your installation:

```typescript title="test-installation.ts"
import { Micdrop } from '@micdrop/client'
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'

console.log('✅ Micdrop packages installed successfully!')
console.log('Client:', typeof Micdrop)
console.log('Server:', typeof MicdropServer) 
console.log('OpenAI Agent:', typeof OpenaiAgent)
```

Run the test:

```bash
npx tsx test-installation.ts
# or
ts-node test-installation.ts
```

## Environment Variables

Set up your API keys as environment variables:

```bash title=".env"
# OpenAI
OPENAI_API_KEY=your_openai_api_key

# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_preferred_voice_id

# Gladia
GLADIA_API_KEY=your_gladia_api_key

# Cartesia
CARTESIA_API_KEY=your_cartesia_api_key

# Mistral
MISTRAL_API_KEY=your_mistral_api_key
```

## TypeScript Configuration

If using TypeScript, ensure your `tsconfig.json` includes:

```json title="tsconfig.json"
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true
  }
}
```

## Next Steps

Now that you have Micdrop installed, let's create your first voice application:

- [Quick Start Guide](./quick-start.md) - Build a basic voice app in 5 minutes
- [Your First App](./your-first-app.md) - Detailed walkthrough
- [Core Concepts](./core-concepts.md) - Understand the architecture

## Troubleshooting

### Common Installation Issues

**Node.js Version**
```bash
# Check your Node.js version
node --version

# Should be 18.0.0 or higher
```

**Package Manager Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors**
```bash
# Install TypeScript globally
npm install -g typescript

# Check TypeScript version
tsc --version
```

If you encounter any issues, check our [Troubleshooting Guide](../guides/troubleshooting.md) or [open an issue](https://github.com/lonestone/micdrop/issues) on GitHub.