# 🖐️🎤 Micdrop: Real-Time Voice Conversations with AI

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/react-native) | [Example app](../../examples/react-native)

Micdrop is a set of open source Typescript packages to build real-time voice conversations with AI agents. It handles all the complexities on the client and server side (microphone, speaker, VAD, network communication, etc) and provides ready-to-use implementations for various AI providers.

# @micdrop/react-native

The React Native implementation of [Micdrop](https://micdrop.dev), for iOS and Android.

It talks to the same [@micdrop/server](https://micdrop.dev/docs/server) as the browser client, over the same protocol, so a web app and a mobile app share one backend.

## Features

- 🎤 Real-time microphone recording and playback, with the audio session set up for a phone call
- 🗣️ Voice activity detection (VAD), so the user just talks
- 🔊 Loudspeaker or earpiece, and the input devices the OS offers
- ⚛️ React hooks for the whole call state
- 🔌 Reconnection, mute, pause and interruption handled for you
- 🌐 WebSocket audio streaming, 16 kHz PCM both ways

## Installation

```bash
npm install @micdrop/react-native react-native-audio-api
```

Audio is captured and played through [`react-native-audio-api`](https://github.com/software-mansion/react-native-audio-api), which needs native code: the app runs from a development build rather than from Expo Go.

That library also ships a player UI that pulls in three more packages, so install them as well:

```bash
npx expo install react-native-worklets react-native-gesture-handler react-native-reanimated
```

For the React hooks:

```bash
npm install @micdrop/react
```

### Expo

Add the config plugin to `app.json`, so the microphone permission and the audio service land in the native projects:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-audio-api",
        {
          "iosMicrophonePermission": "We need the microphone so you can talk with the assistant.",
          "androidPermissions": [
            "android.permission.RECORD_AUDIO",
            "android.permission.MODIFY_AUDIO_SETTINGS",
            "android.permission.FOREGROUND_SERVICE",
            "android.permission.FOREGROUND_SERVICE_MICROPHONE",
            "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK"
          ],
          "androidFSTypes": ["microphone", "mediaPlayback"]
        }
      ]
    ]
  }
}
```

Then build the app once with `npx expo run:ios` or `npx expo run:android`.

### Bare React Native

Add `NSMicrophoneUsageDescription` to `Info.plist`, `RECORD_AUDIO` to `AndroidManifest.xml`, and run `pod install`.

## Quick start

```tsx
import { useMicdropState } from '@micdrop/react'
import { Micdrop } from '@micdrop/react-native'
import { Button, Text, View } from 'react-native'

export default function Call() {
  const state = useMicdropState()

  const handlePress = () =>
    state.isStarted
      ? Micdrop.stop()
      : Micdrop.start({ url: 'wss://example.com/call' })

  return (
    <View>
      <Text>{state.isUserSpeaking ? 'Listening' : 'Your turn'}</Text>
      <Button
        title={state.isStarted ? 'Hang up' : 'Start the call'}
        onPress={handlePress}
      />
    </View>
  )
}
```

`Micdrop.start()` asks for the microphone permission, opens the audio session, connects to the server and starts listening. There is nothing else to wire.

See the [example app](../../examples/react-native) for a complete screen with the conversation, the level meters and the call controls.

## Call state

`useMicdropState()` returns the whole state, and re-renders when any of it changes:

| Field                           | Meaning                                     |
| ------------------------------- | ------------------------------------------- |
| `isStarting`, `isStarted`       | Where the call is                           |
| `isListening`, `isUserSpeaking` | The microphone side                         |
| `isProcessing`                  | The server is working on an answer          |
| `isAssistantSpeaking`           | The answer is being played                  |
| `isMuted`, `isPaused`           | What the user asked for                     |
| `isReconnecting`                | The connection dropped and is being retried |
| `conversation`                  | Everything said so far                      |
| `speakerDeviceId`               | `speaker` or `earpiece`                     |
| `micDevices`, `speakerDevices`  | What the OS offers                          |
| `error`                         | The last error, if any                      |

## Hooks

The hooks live in [`@micdrop/react`](../react) and are the same ones a web app uses.

- `useMicdropState` for the state above
- `useMicdropError` when the microphone is refused or the server is unreachable
- `useMicdropEndCall` when the assistant hangs up on its own
- `useMicdropToolCall` when the agent runs a tool
- `useMicVolume` and `useSpeakerVolume` for level meters

## Differences with the browser

The call itself is the very same code, [`@micdrop/client`](../client), which this package and [`@micdrop/web`](../web) both build on. What changes is the hardware underneath:

- Outputs are routes rather than devices: `Micdrop.changeSpeakerDevice('speaker' | 'earpiece')`. Headphones and Bluetooth are routed by the operating system.
- The audio session is configured as a phone call, which is what turns on echo cancellation
- Settings are not persisted unless the app installs a storage with `setMicdropStorage()`

## Voice activity detection

`VolumeVAD` follows the level of the room and costs nothing. It is the default and needs no extra package.

`SileroVAD` runs a small model that hears the difference between a voice and a noise. It needs `onnxruntime-react-native`, which **does not autolink on Expo SDK 57**: version 1.24.3 ships the retired `unimodule.json` marker that React Native autolinking skips and Expo no longer reads, and its Gradle file uses `VersionNumber`, removed in Gradle 9. Both need patching or a manual link before this works.

```ts
import '@micdrop/react-native/silero'

await Micdrop.start({ url, vad: 'silero' })
```

The model is about two megabytes, fetched once on the first call. To ship it with the app instead:

```ts
import { setSileroOptions } from '@micdrop/react-native/silero'

setSileroOptions({ model: '/path/on/the/device/silero_vad_v5.onnx' })
```

Both detectors, and the algorithm behind them, come from `@micdrop/client` and behave exactly as they do in a browser.

## Using another audio library

Recording and playback sit behind two small interfaces, so `react-native-audio-api` can be swapped out:

```ts
import { Mic, MicDriver, Speaker, SpeakerDriver } from '@micdrop/react-native'

Mic.setDriver(myMicDriver)
Speaker.setDriver(mySpeakerDriver)
```

A `MicDriver` emits `Frames` with mono float samples, a `SpeakerDriver` plays 16 kHz PCM16. Everything above them, from the voice activity detection to the protocol, stays the same.

## Documentation

Read the full [React Native documentation](https://micdrop.dev/docs/react-native) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai), created and open sourced by [Godefroy de Compreignac](https://github.com/Godefroy)
