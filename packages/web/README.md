# 🖐️🎤 Micdrop: Real-Time Voice Conversations with AI

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/client) | [Basic example](../../examples/basic) | [Demo](../../examples/advanced)

Micdrop is a set of open source Typescript packages to build real-time voice conversations with AI agents. It handles all the complexities on the client and server side (microphone, speaker, VAD, network communication, etc) and provides ready-to-use implementations for various AI providers.

# @micdrop/web

The browser side of [Micdrop](https://micdrop.dev). It records and plays with the Web Audio API, and re-exports the whole [`@micdrop/client`](../client) API, so this is the only package a web app installs.

It is framework agnostic, you can use it with React, Vue, Angular or any other framework. See the [advanced demo](../../examples/advanced) for a complete example with React.

For server implementation, see [@micdrop/server](https://micdrop.dev/docs/server).

## Features

- 🎤 Real-time microphone recording and playback
- 🗣️ Voice activity detection, on volume or with the Silero model
- 🔊 Device selection and testing
- 🔌 Full state and events for UI integration
- 🌐 WebSocket audio streaming

## Installation

```bash
npm install @micdrop/web
```

That's it 🎉 No configuration, no asset to copy.

## Usage

```ts
import { Micdrop } from '@micdrop/web'

await Micdrop.start({ url: 'wss://example.com/call' })

Micdrop.on('StateChange', (state) => {
  console.log(state.isAssistantSpeaking, state.conversation)
})
```

## Browser specifics

- `import '@micdrop/web/silero'` adds the Silero voice detection, and only then does the ONNX runtime enter your bundle
- `setSileroOptions({ model })` serves the Silero model from your own domain rather than from a CDN
- `getSpeakerOutput()` gives the node the assistant voice comes out of, to analyse or process it
- `audioContext` is the shared `AudioContext`

## Documentation

Read the full [client documentation](https://micdrop.dev/docs/client) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai), created and open sourced by [Godefroy de Compreignac](https://github.com/Godefroy)
