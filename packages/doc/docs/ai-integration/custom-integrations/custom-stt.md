# Custom STT

Build your own speech-to-text implementation by extending the abstract STT base class.

## Overview

The STT class provides the foundation for creating custom speech-to-text integrations that can convert audio to text in Micdrop voice applications.

## Basic Implementation

```typescript
import { STT } from '@micdrop/server'

class MyCustomSTT extends STT {
  private apiKey: string
  private baseURL: string

  constructor(options: { apiKey: string; baseURL: string }) {
    super()
    this.apiKey = options.apiKey
    this.baseURL = options.baseURL
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    try {
      // Convert blob to format expected by your STT service
      const audioData = await this.prepareAudioData(audioBlob)
      
      // Call your STT service
      const transcription = await this.callSTTService(audioData)
      
      return transcription
    } catch (error) {
      console.error('STT transcription failed:', error)
      throw error
    }
  }

  private async prepareAudioData(audioBlob: Blob): Promise<Buffer> {
    const arrayBuffer = await audioBlob.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  private async callSTTService(audioData: Buffer): Promise<string> {
    // Implement your STT service integration
    // This could be Google Cloud Speech, Azure Speech, AWS Transcribe, etc.
    
    const formData = new FormData()
    formData.append('audio', new Blob([audioData]), 'audio.wav')
    
    const response = await fetch(`${this.baseURL}/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    })

    const result = await response.json()
    return result.transcription || ''
  }
}
```

## Advanced Implementation

### With Configuration Options

```typescript
interface CustomSTTOptions {
  apiKey: string
  baseURL: string
  language?: string
  model?: string
  enablePunctuation?: boolean
  enableDiarization?: boolean
}

class AdvancedCustomSTT extends STT {
  private config: Required<CustomSTTOptions>

  constructor(options: CustomSTTOptions) {
    super()
    this.config = {
      language: 'en',
      model: 'base',
      enablePunctuation: true,
      enableDiarization: false,
      ...options
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    const audioBuffer = await audioBlob.arrayBuffer()
    
    // Prepare request with configuration
    const requestData = {
      audio: Buffer.from(audioBuffer).toString('base64'),
      config: {
        language: this.config.language,
        model: this.config.model,
        enable_punctuation: this.config.enablePunctuation,
        enable_diarization: this.config.enableDiarization
      }
    }

    const response = await fetch(`${this.config.baseURL}/v1/transcribe`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })

    if (!response.ok) {
      throw new Error(`STT service error: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    return result.text || ''
  }
}
```

## Real-World Examples

### Google Cloud Speech-to-Text

```typescript
import { STT } from '@micdrop/server'
import { SpeechClient } from '@google-cloud/speech'

class GoogleCloudSTT extends STT {
  private client: SpeechClient
  private config: any

  constructor(options: {
    keyFilename?: string
    projectId?: string
    language?: string
    model?: string
  }) {
    super()
    
    this.client = new SpeechClient({
      keyFilename: options.keyFilename,
      projectId: options.projectId
    })
    
    this.config = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: options.language || 'en-US',
      model: options.model || 'latest_long'
    }
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    try {
      const audioBytes = Buffer.from(await audioBlob.arrayBuffer()).toString('base64')
      
      const request = {
        audio: { content: audioBytes },
        config: this.config
      }

      const [response] = await this.client.recognize(request)
      
      if (response.results && response.results.length > 0) {
        return response.results
          .map(result => result.alternatives?.[0]?.transcript)
          .filter(Boolean)
          .join(' ')
      }

      return ''
    } catch (error) {
      console.error('Google Cloud STT error:', error)
      throw error
    }
  }
}
```

### Azure Cognitive Services Speech

```typescript
import { STT } from '@micdrop/server'
import * as sdk from 'microsoft-cognitiveservices-speech-sdk'

class AzureSTT extends STT {
  private speechConfig: sdk.SpeechConfig
  
  constructor(options: {
    subscriptionKey: string
    region: string
    language?: string
  }) {
    super()
    
    this.speechConfig = sdk.SpeechConfig.fromSubscription(
      options.subscriptionKey, 
      options.region
    )
    this.speechConfig.speechRecognitionLanguage = options.language || 'en-US'
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const audioBuffer = Buffer.from(await audioBlob.arrayBuffer())
        const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer)
        const recognizer = new sdk.SpeechRecognizer(this.speechConfig, audioConfig)

        recognizer.recognizeOnceAsync(
          result => {
            if (result.reason === sdk.ResultReason.RecognizedSpeech) {
              resolve(result.text)
            } else {
              reject(new Error(`Recognition failed: ${result.errorDetails}`))
            }
            recognizer.close()
          },
          error => {
            console.error('Azure STT error:', error)
            recognizer.close()
            reject(error)
          }
        )
      } catch (error) {
        reject(error)
      }
    })
  }
}
```

### Local Whisper Implementation

```typescript
import { STT } from '@micdrop/server'
import { spawn } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { join } from 'path'

class LocalWhisperSTT extends STT {
  private modelPath: string
  private tempDir: string

  constructor(options: {
    modelPath: string
    tempDir?: string
  }) {
    super()
    this.modelPath = options.modelPath
    this.tempDir = options.tempDir || '/tmp'
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    const tempFile = join(this.tempDir, `audio_${Date.now()}.wav`)
    
    try {
      // Save audio to temporary file
      const audioBuffer = Buffer.from(await audioBlob.arrayBuffer())
      writeFileSync(tempFile, audioBuffer)

      // Run Whisper CLI
      const result = await this.runWhisper(tempFile)
      
      return result
    } finally {
      // Clean up temporary file
      try {
        unlinkSync(tempFile)
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  private runWhisper(audioFile: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const whisper = spawn('whisper', [
        audioFile,
        '--model', this.modelPath,
        '--output_format', 'txt',
        '--output_dir', this.tempDir
      ])

      let output = ''
      let error = ''

      whisper.stdout.on('data', (data) => {
        output += data.toString()
      })

      whisper.stderr.on('data', (data) => {
        error += data.toString()
      })

      whisper.on('close', (code) => {
        if (code === 0) {
          // Extract transcription from output
          const transcription = this.extractTranscription(output)
          resolve(transcription)
        } else {
          reject(new Error(`Whisper failed with code ${code}: ${error}`))
        }
      })
    })
  }

  private extractTranscription(output: string): string {
    // Parse Whisper output to extract transcription
    const lines = output.split('\n')
    const transcriptionLines = lines.filter(line => 
      !line.startsWith('[') && line.trim().length > 0
    )
    return transcriptionLines.join(' ').trim()
  }
}
```

## Usage Example

```typescript
import { MicdropServer } from '@micdrop/server'
import { OpenaiAgent } from '@micdrop/openai'

// Use your custom STT
const customSTT = new MyCustomSTT({
  apiKey: process.env.CUSTOM_STT_API_KEY,
  baseURL: 'https://your-stt-service.com'
})

const agent = new OpenaiAgent({
  apiKey: process.env.OPENAI_API_KEY
})

wss.on('connection', (socket) => {
  new MicdropServer(socket, {
    agent,
    stt: customSTT,
    firstMessage: 'Hello! I\'m using custom speech-to-text.'
  })
})
```

## Testing Your STT

```typescript
// Test your custom STT implementation
async function testSTT() {
  const stt = new MyCustomSTT({
    apiKey: 'test-key',
    baseURL: 'https://test-stt-service.com'
  })

  // Create test audio blob (you'd use real audio in practice)
  const testAudio = new Blob(['fake audio data'], { type: 'audio/wav' })
  
  try {
    const transcription = await stt.transcribe(testAudio)
    console.log('Transcription:', transcription)
  } catch (error) {
    console.error('STT test failed:', error)
  }
}
```

For more details on the STT interface and requirements, see the [STT documentation](../../../packages/server/docs/STT.md).