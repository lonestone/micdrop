# Welcome to Micdrop

**Micdrop** is a set of open-source TypeScript packages designed to build real-time voice conversations with AI agents. It handles all the complexities of browser and server-side voice processing, including microphone input, speaker output, voice activity detection (VAD), network communication, and AI provider integrations.

## Why Micdrop?

While real-time multimodal models (voice-to-voice) offer impressive capabilities, they often come with limitations in terms of customization and cost. Micdrop takes a different approach by:

🎯 **Allowing you to choose the best-in-class API for each component:**
- Select specific voices from TTS providers
- Use different LLMs optimized for your use case  
- Pick STT engines suited for specific languages/accents

💰 **Reducing costs by letting you:**
- Use more cost-effective API providers
- Mix open source and commercial solutions
- Control exactly when APIs are called

🔧 **Providing granular control** over the conversation flow

🌐 **Supporting a wider range** of languages and voices through specialized providers

This modular approach gives you the flexibility to build voice applications that are both powerful and cost-effective.

## Key Features

🎙️ **Advanced Microphone Handling**
- Real-time streaming support
- Multiple Voice Activity Detection (VAD) algorithms
- Device selection and control
- Audio analysis and volume monitoring

🔊 **Sophisticated Audio Playback**
- Streaming audio support with buffering
- Pause/resume functionality
- Volume control and device selection
- Real-time audio analysis

🌐 **WebSocket-Based Communication**
- Low-latency audio streaming
- Robust error handling and reconnection
- Bidirectional communication protocol

🤖 **AI Provider Integrations**
- Ready-to-use implementations for popular providers
- Abstract interfaces for custom implementations
- Support for streaming responses

⚡ **Developer Experience**
- Full TypeScript support with excellent IntelliSense
- Comprehensive documentation and examples
- React hooks for frontend integration
- Framework-agnostic core packages

## Architecture Overview

Micdrop is built with a modular architecture consisting of:

### Core Packages
- **[@micdrop/client](./packages/client/)** - Browser-side implementation
- **[@micdrop/server](./packages/server/)** - Node.js server implementation

### AI Integrations
- **[@micdrop/openai](./packages/openai/)** - OpenAI LLM and STT
- **[@micdrop/elevenlabs](./packages/elevenlabs/)** - ElevenLabs TTS
- **[@micdrop/cartesia](./packages/cartesia/)** - Cartesia TTS
- **[@micdrop/mistral](./packages/mistral/)** - Mistral AI LLM
- **[@micdrop/gladia](./packages/gladia/)** - Gladia STT

### Utility Packages  
- **[@micdrop/react](./packages/react/)** - React hooks and utilities

## Quick Start

Ready to build your first voice AI application? Head over to our [Getting Started guide](./getting-started/installation.md) to begin!

## Demo Video

See Micdrop in action and learn about the technology behind it:

[![Micdrop Demo](https://img.youtube.com/vi/fcqVOvESQ8o/0.jpg)](https://www.youtube.com/watch?v=fcqVOvESQ8o)

Watch [Godefroy de Compreignac](https://www.linkedin.com/in/godefroy) explain Micdrop and voice AI technology in this comprehensive video.

## Community & Support

- 📚 **Documentation**: You're reading it!
- 🐛 **Issues**: [GitHub Issues](https://github.com/lonestone/micdrop/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/lonestone/micdrop/discussions)
- 📧 **Contact**: [hello@lonestone.io](mailto:hello@lonestone.io)

## License

Micdrop is released under the [MIT License](https://github.com/lonestone/micdrop/blob/main/LICENSE).

---

Originally developed for [Raconte.ai](https://www.raconte.ai) and open-sourced by [Lonestone](https://www.lonestone.io).