# @micdrop/mistral

[Micdrop website](https://micdrop.dev) | [Documentation](https://micdrop.dev/docs/ai-integration/provided-integrations/mistral)

Mistral AI implementation for [@micdrop/server](https://micdrop.dev/docs/server).

## Installation

```bash
npm install @micdrop/mistral
```

## Mistral Agent

### Usage with MicdropServer

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

### Usage without MicdropServer

```typescript
import { MistralAgent } from '@micdrop/mistral'

const agent = new MistralAgent({
  apiKey: process.env.MISTRAL_API_KEY || '',
  systemPrompt: 'You are a helpful assistant',
})

agent.on('Message', (message) => console.log('Message:', message))

agent.addUserMessage('Hello, what can you do?')

// The answer is a text stream, written as the model generates it
agent.answer().on('data', (chunk) => process.stdout.write(chunk))
```

### Events

| Event                   | Payload                   | Description                                                             |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------- |
| `Message`               | `MicdropConversationItem` | A message, a tool call or a tool result was added to the conversation.  |
| `ToolCall`              | `MicdropToolCall`         | A tool declared with `emitOutput` ran, with its parameters and output.  |
| `CancelLastUserMessage` | none                      | The last user message was dropped because it carried no intent.         |
| `SkipAnswer`            | none                      | The agent stays silent and waits for the user to finish their sentence. |
| `EndCall`               | none                      | The agent decided that the call is over.                                |
| `Failed`                | none                      | The agent gave up generating an answer after its retries.               |

See the [Agent interface](https://micdrop.dev/docs/ai-integration/custom-integrations/custom-agent) for the full contract.

## Mistral STT (Speech-to-Text)

Real-time transcription with Voxtral.

### Usage with MicdropServer

```typescript
import { MistralSTT } from '@micdrop/mistral'
import { MicdropServer } from '@micdrop/server'

const stt = new MistralSTT({
  apiKey: process.env.MISTRAL_API_KEY || '',
  model: 'voxtral-mini-transcribe-realtime-2602', // Default model
})

// Use with MicdropServer
new MicdropServer(socket, {
  stt,
  // ... other options
})
```

### Usage without MicdropServer

```typescript
import { MistralSTT } from '@micdrop/mistral'
import { createReadStream } from 'fs'

const stt = new MistralSTT({
  apiKey: process.env.MISTRAL_API_KEY || '',
})

stt.on('Transcript', (text) => console.log('Transcript:', text))
stt.on('Failed', (chunks) => console.error('Failed:', chunks.length, 'chunks'))

// Audio is raw PCM, 16 bits, 16 kHz, mono
stt.transcribe(createReadStream('speech.pcm'))
```

### Events

| Event        | Payload    | Description                                                                    |
| ------------ | ---------- | ------------------------------------------------------------------------------ |
| `Transcript` | `string`   | Transcription of one utterance. The text is empty when nothing was recognized. |
| `Failed`     | `Buffer[]` | Transcription gave up after its retries, with the audio chunks left pending.   |

See the [STT interface](https://micdrop.dev/docs/ai-integration/custom-integrations/custom-stt) for the full contract.

## Documentation

Read full [documentation of the Mistral integration for Micdrop](https://micdrop.dev/docs/ai-integration/provided-integrations/mistral) on the [website](https://micdrop.dev).

## License

MIT

## Author

Originally developed for [Raconte.ai](https://www.raconte.ai), created and open sourced by [Godefroy de Compreignac](https://github.com/Godefroy)
