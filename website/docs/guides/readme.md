---
title: 'Micdrop'
---

Micdrop is a set of open source Typescript packages to build real-time voice conversations with AI agents. It handles all the complexities on the browser and server side (microphone, speaker, VAD, network communication, etc) and provides ready-to-use implementations for various AI providers.

## 📦 Packages

### Core Packages (start here)

- [`@micdrop/client`](../client/overview) - Browser library handling microphone input, audio playback, and real-time communication
- [`@micdrop/server`](../server/overview) - Server implementation for audio streaming and AI integration orchestration

### AI Implementations

- [`@micdrop/openai`](../server/openai) - OpenAI integration providing LLM agent and speech-to-text capabilities
- [`@micdrop/elevenlabs`](../server/elevenlabs) - ElevenLabs text-to-speech integration with streaming support
- [`@micdrop/cartesia`](../server/cartesia) - Cartesia text-to-speech integration for real-time voice synthesis
- [`@micdrop/mistral`](../server/mistral) - Mistral AI agent integration for conversation handling
- [`@micdrop/gladia`](../server/gladia) - Gladia speech-to-text integration for audio transcription

### Utility Packages

- [`@micdrop/react`](../client/react) - React hooks for Micdrop

### Demo Applications

- [`demo-client`](./demo-client) - Example web application with React.
- [`demo-server`](./demo-server) - Example server with fastify.

## 🎥 Demo and technical details (video)

See the author [Godefroy de Compreignac](https://www.linkedin.com/in/godefroy) talking about Micdrop and voice AI in [this video](https://www.youtube.com/watch?v=fcqVOvESQ8o):

[![Youtube video](https://img.youtube.com/vi/fcqVOvESQ8o/0.jpg)](https://www.youtube.com/watch?v=fcqVOvESQ8o)

## 🤔 Why Micdrop?

While real-time multimodal models (voice-to-voice) offer impressive capabilities, they often come with limitations in terms of customization and cost. Micdrop takes a different approach by:

- 🎯 Allowing you to choose the best-in-class API for each component:
  - Select specific voices from TTS providers
  - Use different LLMs optimized for your use case
  - Pick STT engines suited for specific languages/accents
- 💰 Reducing costs by letting you:
  - Use more cost-effective API providers
  - Mix open source and commercial solutions
  - Control exactly when APIs are called
- 🔧 Providing granular control over the conversation flow
- 🌐 Supporting a wider range of languages and voices through specialized providers

This modular approach gives you the flexibility to build voice applications that are both powerful and cost-effective.

## 🌟 Features

- 🎙️ Microphone handling with:
  - Streaming support
  - Voice Activity Detection (VAD)
- 🔊 Advanced audio playback with:
  - Streaming support
  - Device selection and control
- 🌐 WebSocket communication
- 📦 AI implementations provided for OpenAI, ElevenLabs, Mistral, Gladia, and more
- 🔌 Bring your own AI components (framework agnostic)
  - Large Language Models (LLM)
  - Text-to-Speech (TTS)
  - Speech-to-Text (STT)

## 🧪 Development

For detailed development instructions, including how to build, test, and publish packages, please see [Development](./development).

## 📄 License

MIT License - see the [LICENSE](https://github.com/lonestone/micdrop/blob/main/LICENSE) file for details

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai) and open sourced by [Lonestone](https://www.lonestone.io) ([GitHub](https://github.com/lonestone))
