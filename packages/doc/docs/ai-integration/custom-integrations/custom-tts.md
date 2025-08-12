# Custom TTS

Build your own text-to-speech implementation by extending the abstract TTS base class.

## Overview

The TTS class provides the foundation for creating custom text-to-speech integrations that can convert text to audio in Micdrop voice applications.

## Basic Implementation

```typescript
import { TTS } from '@micdrop/server'

class MyCustomTTS extends TTS {
  private apiKey: string
  private baseURL: string
  private voiceId: string

  constructor(options: { 
    apiKey: string 
    baseURL: string 
    voiceId: string 
  }) {
    super()
    this.apiKey = options.apiKey
    this.baseURL = options.baseURL
    this.voiceId = options.voiceId
  }

  async speak(text: string): Promise<Blob> {
    try {
      // Call your TTS service
      const audioData = await this.callTTSService(text)
      
      // Return audio as Blob in PCM s16le format
      return new Blob([audioData], { type: 'audio/wav' })
    } catch (error) {
      console.error('TTS synthesis failed:', error)
      throw error
    }
  }

  private async callTTSService(text: string): Promise<Buffer> {
    const response = await fetch(`${this.baseURL}/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice_id: this.voiceId,
        output_format: 'pcm_s16le',
        sample_rate: 22050
      })
    })

    if (!response.ok) {
      throw new Error(`TTS service error: ${response.status} ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    return Buffer.from(audioBuffer)
  }
}
```

## Advanced Implementation

### With Streaming Support

```typescript
interface CustomTTSOptions {
  apiKey: string
  baseURL: string
  voiceId: string
  model?: string
  sampleRate?: number
  enableStreaming?: boolean
}

class StreamingCustomTTS extends TTS {
  private config: Required<CustomTTSOptions>
  private currentRequest?: AbortController

  constructor(options: CustomTTSOptions) {
    super()
    this.config = {
      model: 'standard',
      sampleRate: 22050,
      enableStreaming: true,
      ...options
    }
  }

  async speak(text: string): Promise<Blob> {
    // Cancel any ongoing request
    await this.cancel()
    
    this.currentRequest = new AbortController()

    try {
      if (this.config.enableStreaming) {
        return await this.streamingSynthesize(text)
      } else {
        return await this.batchSynthesize(text)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('TTS request cancelled')
        return new Blob()
      }
      throw error
    }
  }

  private async streamingSynthesize(text: string): Promise<Blob> {
    const response = await fetch(`${this.config.baseURL}/v1/stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice_id: this.config.voiceId,
        model: this.config.model,
        sample_rate: this.config.sampleRate,
        output_format: 'pcm_s16le'
      }),
      signal: this.currentRequest?.signal
    })

    if (!response.ok) {
      throw new Error(`Streaming TTS error: ${response.statusText}`)
    }

    // Collect streaming audio chunks
    const audioChunks: Uint8Array[] = []
    const reader = response.body?.getReader()
    
    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        audioChunks.push(value)
      }
    }

    // Combine chunks into single blob
    const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const audioData = new Uint8Array(totalLength)
    let offset = 0
    
    for (const chunk of audioChunks) {
      audioData.set(chunk, offset)
      offset += chunk.length
    }

    return new Blob([audioData], { type: 'audio/wav' })
  }

  private async batchSynthesize(text: string): Promise<Blob> {
    const response = await fetch(`${this.config.baseURL}/v1/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice_id: this.config.voiceId,
        model: this.config.model,
        sample_rate: this.config.sampleRate,
        output_format: 'pcm_s16le'
      }),
      signal: this.currentRequest?.signal
    })

    if (!response.ok) {
      throw new Error(`Batch TTS error: ${response.statusText}`)
    }

    const audioBuffer = await response.arrayBuffer()
    return new Blob([audioBuffer], { type: 'audio/wav' })
  }

  async cancel(): Promise<void> {
    if (this.currentRequest) {
      this.currentRequest.abort()
      this.currentRequest = undefined
    }
  }
}
```

## Real-World Examples

### Google Cloud Text-to-Speech

```typescript
import { TTS } from '@micdrop/server'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'

class GoogleCloudTTS extends TTS {
  private client: TextToSpeechClient
  private voiceName: string
  private languageCode: string

  constructor(options: {
    keyFilename?: string
    projectId?: string
    voiceName?: string
    languageCode?: string
  }) {
    super()
    
    this.client = new TextToSpeechClient({
      keyFilename: options.keyFilename,
      projectId: options.projectId
    })
    
    this.voiceName = options.voiceName || 'en-US-Standard-A'
    this.languageCode = options.languageCode || 'en-US'
  }

  async speak(text: string): Promise<Blob> {
    try {
      const request = {
        input: { text },
        voice: {
          name: this.voiceName,
          languageCode: this.languageCode
        },
        audioConfig: {
          audioEncoding: 'LINEAR16' as const,
          sampleRateHertz: 22050
        }
      }

      const [response] = await this.client.synthesizeSpeech(request)
      
      if (response.audioContent) {
        return new Blob([response.audioContent], { type: 'audio/wav' })
      }
      
      throw new Error('No audio content received')
    } catch (error) {
      console.error('Google Cloud TTS error:', error)
      throw error
    }
  }
}
```

### AWS Polly

```typescript
import { TTS } from '@micdrop/server'
import { PollyClient, SynthesizeSpeechCommand } from '@aws-sdk/client-polly'

class AWSPollyTTS extends TTS {
  private client: PollyClient
  private voiceId: string
  private engine: string

  constructor(options: {
    region: string
    accessKeyId: string
    secretAccessKey: string
    voiceId?: string
    engine?: string
  }) {
    super()
    
    this.client = new PollyClient({
      region: options.region,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey
      }
    })
    
    this.voiceId = options.voiceId || 'Joanna'
    this.engine = options.engine || 'neural'
  }

  async speak(text: string): Promise<Blob> {
    try {
      const command = new SynthesizeSpeechCommand({
        Text: text,
        OutputFormat: 'pcm',
        VoiceId: this.voiceId,
        Engine: this.engine,
        SampleRate: '22050'
      })

      const response = await this.client.send(command)
      
      if (response.AudioStream) {
        const audioData = await this.streamToBuffer(response.AudioStream)
        return new Blob([audioData], { type: 'audio/wav' })
      }
      
      throw new Error('No audio stream received')
    } catch (error) {
      console.error('AWS Polly TTS error:', error)
      throw error
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = []
    
    for await (const chunk of stream) {
      chunks.push(chunk)
    }
    
    return Buffer.concat(chunks)
  }
}
```

### Local TTS (eSpeak/Festival)

```typescript
import { TTS } from '@micdrop/server'
import { spawn } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync } from 'fs'
import { join } from 'path'

class LocalTTS extends TTS {
  private voice: string
  private speed: number
  private tempDir: string

  constructor(options: {
    voice?: string
    speed?: number
    tempDir?: string
  }) {
    super()
    this.voice = options.voice || 'en'
    this.speed = options.speed || 175
    this.tempDir = options.tempDir || '/tmp'
  }

  async speak(text: string): Promise<Blob> {
    const tempFile = join(this.tempDir, `tts_${Date.now()}.wav`)
    
    try {
      await this.generateSpeech(text, tempFile)
      
      // Read the generated audio file
      const audioBuffer = readFileSync(tempFile)
      return new Blob([audioBuffer], { type: 'audio/wav' })
    } finally {
      // Clean up temporary file
      try {
        unlinkSync(tempFile)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  private generateSpeech(text: string, outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const espeak = spawn('espeak', [
        '-v', this.voice,
        '-s', this.speed.toString(),
        '-w', outputFile,
        text
      ])

      let error = ''

      espeak.stderr.on('data', (data) => {
        error += data.toString()
      })

      espeak.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`eSpeak failed with code ${code}: ${error}`))
        }
      })
    })
  }
}
```

## Cancellation Support

Implement proper cancellation for long-running requests:

```typescript
class CancellableTTS extends TTS {
  private currentController?: AbortController

  async speak(text: string): Promise<Blob> {
    // Cancel any previous request
    await this.cancel()
    
    this.currentController = new AbortController()

    try {
      const response = await fetch('/tts-endpoint', {
        method: 'POST',
        body: JSON.stringify({ text }),
        signal: this.currentController.signal
      })

      const audioBuffer = await response.arrayBuffer()
      return new Blob([audioBuffer])
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('TTS request cancelled')
        return new Blob() // Return empty blob
      }
      throw error
    } finally {
      this.currentController = undefined
    }
  }

  async cancel(): Promise<void> {
    if (this.currentController) {
      this.currentController.abort()
      this.currentController = undefined
    }
  }
}
```

## Usage Example

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'

// Use your custom TTS
const customTTS = new MyCustomTTS({
  apiKey: process.env.CUSTOM_TTS_API_KEY,
  baseURL: 'https://your-tts-service.com',
  voiceId: 'your-voice-id'
})

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY
})

wss.on('connection', (socket) => {
  new MicdropServer(socket, {
    agent,
    tts: customTTS,
    firstMessage: 'Hello! I\'m using custom text-to-speech.'
  })
})
```

## Testing Your TTS

```typescript
// Test your custom TTS implementation
async function testTTS() {
  const tts = new MyCustomTTS({
    apiKey: 'test-key',
    baseURL: 'https://test-tts-service.com',
    voiceId: 'test-voice'
  })

  try {
    const audioBlob = await tts.speak('Hello, this is a test of my custom TTS.')
    console.log('Generated audio blob size:', audioBlob.size, 'bytes')
    
    // Save to file for testing
    const buffer = Buffer.from(await audioBlob.arrayBuffer())
    require('fs').writeFileSync('test_output.wav', buffer)
    console.log('Audio saved to test_output.wav')
  } catch (error) {
    console.error('TTS test failed:', error)
  }
}
```

For more details on the TTS interface and audio format requirements, see the [TTS documentation](../../../packages/server/docs/TTS.md).