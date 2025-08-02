# Micdrop

Micdrop is a set of open source TypeScript packages to build real-time voice conversations with AI agents. It handles complexities on the browser and server side (microphone, speaker, VAD, network communication) and provides ready-to-use implementations for various AI providers.

## Packages

### Core Packages

- `@micdrop/client` – Browser library handling microphone input, audio playback, and real-time communication
- `@micdrop/server` – Server implementation for audio streaming and AI integration orchestration

### AI Implementations

- `@micdrop/openai` – OpenAI integration providing LLM agent and speech-to-text capabilities
- `@micdrop/elevenlabs` – ElevenLabs text-to-speech integration with streaming support
- `@micdrop/cartesia` – Cartesia text-to-speech integration for real-time voice synthesis
- `@micdrop/mistral` – Mistral AI agent integration for conversation handling
- `@micdrop/gladia` – Gladia speech-to-text integration for audio transcription

### Utility Packages

- `@micdrop/react` – React hooks for Micdrop

### Demo Applications

- `demo-client` – Example web application with React
- `demo-server` – Example server with Fastify

## Features

- Microphone handling with streaming and Voice Activity Detection (VAD)
- Advanced audio playback with streaming and device control
- WebSocket communication
- AI implementations for OpenAI, ElevenLabs, Mistral, Gladia, and more
- Bring your own AI components (framework agnostic)
