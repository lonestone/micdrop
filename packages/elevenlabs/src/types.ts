import {
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
}

export const DEFAULT_MODEL_ID = 'eleven_flash_v2_5'
export const DEFAULT_OUTPUT_FORMAT = 'mp3_44100_32'

export interface ElevenLabsWebSocketMessage {
  audio?: string
  isFinal?: boolean
}
