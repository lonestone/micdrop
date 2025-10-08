import type {
  TextToSpeechStreamRequestOutputFormat,
  VoiceSettings,
} from '@elevenlabs/elevenlabs-js/api'

export interface ElevenLabsTTSOptions {
  apiKey: string
  voiceId: string
  modelId?: 'eleven_multilingual_v2' | 'eleven_turbo_v2_5' | 'eleven_flash_v2_5'
  language?: string
  outputFormat?: TextToSpeechStreamRequestOutputFormat
  voiceSettings?: VoiceSettings
  retryDelay?: number
}

export const DEFAULT_MODEL_ID = 'eleven_turbo_v2_5'
export const DEFAULT_OUTPUT_FORMAT = 'pcm_16000'

export type ElevenLabsWebSocketMessage =
  | ElevenLabsWebSocketAudioOutputMessage
  | ElevenLabsWebSocketFinalOutputMessage
  | ElevenLabsWebSocketErrorMessage

export interface ElevenLabsWebSocketAudioOutputMessage {
  audio: string
  normalizedAlignment: ElevenLabsWebSocketAudioOutputMessageAlignment | null
  alignment: ElevenLabsWebSocketAudioOutputMessageAlignment | null
  isFinal?: boolean | null
}

export interface ElevenLabsWebSocketAudioOutputMessageAlignment {
  chars: string[]
  charStartTimesMs: number[]
  charDurationsMs: number[]
}

export interface ElevenLabsWebSocketFinalOutputMessage {
  isFinal: boolean
}

export interface ElevenLabsWebSocketErrorMessage {
  message: string
  error: string
  code: number
}
