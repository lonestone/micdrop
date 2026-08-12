# 🖐️🎤 Micdrop: Real-Time Voice Conversations with AI

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs)

Micdrop is a set of open source Typescript packages to build real-time voice conversations with AI agents. It handles all the complexities on the browser and server side (microphone, speaker, VAD, network communication, etc) and provides ready-to-use implementations for various AI providers.

## 📦 Packages

### Core Packages (start here)

- [`@micdrop/client`](./packages/client/README.md) - Browser library handling microphone input, audio playback, and real-time communication
- [`@micdrop/server`](./packages/server/README.md) - Server implementation for audio streaming and AI integration orchestration

### AI Implementations

- [`@micdrop/openai`](./packages/openai/README.md) - OpenAI integration providing LLM agent and speech-to-text capabilities
- [`@micdrop/ai-sdk`](./packages/ai-sdk/README.md) - AI SDK agent compatible with a lot of LLM providers.
- [`@micdrop/elevenlabs`](./packages/elevenlabs/README.md) - ElevenLabs text-to-speech integration with streaming support
- [`@micdrop/cartesia`](./packages/cartesia/README.md) - Cartesia text-to-speech integration for real-time voice synthesis
- [`@micdrop/gradium`](./packages/gradium/README.md) - Gradium speech-to-text and text-to-speech integration with WebSocket streaming
- [`@micdrop/mistral`](./packages/mistral/README.md) - Mistral AI agent and speech-to-text integration for conversation handling
- [`@micdrop/gladia`](./packages/gladia/README.md) - Gladia speech-to-text integration for audio transcription

### Utility Packages

- [`@micdrop/react`](./packages/react/README.md) - React hooks for Micdrop

### Demo Applications

- [`demo-client`](./packages/demo-client/README.md) - Example web application with React.
- [`demo-server`](./packages/demo-server/README.md) - Example server with fastify.

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
- 📦 AI implementations provided for OpenAI, ElevenLabs, Gradium, Mistral, Gladia, and more
- 🔌 Bring your own AI components (framework agnostic)
  - Large Language Models (LLM)
  - Text-to-Speech (TTS)
  - Speech-to-Text (STT)

## 🧪 Development

For detailed development instructions, including how to build, test, and publish packages, please see [DEVELOPMENT.md](DEVELOPMENT.md).

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai), created and open sourced by [Godefroy de Compreignac](https://github.com/Godefroy)

## Acknowledgements

Thanks to [ricky0123/vad](https://github.com/ricky0123/vad) for their work on voice activity detection.
