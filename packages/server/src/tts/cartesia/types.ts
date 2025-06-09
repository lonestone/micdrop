export type CartesiaLanguage =
  | 'en'
  | 'fr'
  | 'de'
  | 'es'
  | 'pt'
  | 'zh'
  | 'ja'
  | 'hi'
  | 'it'
  | 'ko'
  | 'nl'
  | 'pl'
  | 'ru'
  | 'sv'
  | 'tr'

export type CartesiaPayload = CartesiaTranscriptPayload | CartesiaCancelPayload

export interface CartesiaTranscriptPayload {
  model_id: string
  transcript: string
  voice: {
    mode: 'id'
    id: string
  }
  output_format: {
    container: 'raw'
    encoding: 'pcm_s16le' | 'pcm_f32le' | 'pcm_mulaw' | 'pcm_alaw'
    sample_rate: number
  }
  language?: CartesiaLanguage
  duration?: number
  speed?: 'fast' | 'normal' | 'slow'
  context_id?: string
  continue?: boolean
  max_buffer_delay_ms?: number
  flush?: boolean
  add_timestamps?: boolean
  add_phoneme_timestamps?: boolean
  use_original_timestamps?: boolean
}

export interface CartesiaCancelPayload {
  context_id: string
  cancel: true
}

// Cartesia TTS WebSocket API response message types
export type CartesiaResponse =
  | CartesiaChunkResponse
  | CartesiaFlushDoneResponse
  | CartesiaDoneResponse
  | CartesiaTimestampsResponse
  | CartesiaErrorResponse
  | CartesiaPhonemeTimestampsResponse

export interface CartesiaChunkResponse {
  type: 'chunk'
  data: string // Base64 encoded audio
  done: boolean
  status_code: number
  step_time: number
  context_id?: string
  flush_id?: number
}

export interface CartesiaFlushDoneResponse {
  type: 'flush_done'
  done: boolean
  flush_done: boolean
  flush_id: number
  status_code: number
  context_id?: string
}

export interface CartesiaDoneResponse {
  type: 'done'
  done: boolean
  status_code: number
  context_id?: string
}

export interface CartesiaTimestampsResponse {
  type: 'timestamps'
  done: boolean
  status_code: number
  context_id?: string
  word_timestamps: {
    words: string[]
    start: number[]
    end: number[]
  }
}

export interface CartesiaErrorResponse {
  type: 'error'
  done: boolean
  error: string
  status_code: number
  context_id?: string
}

export interface CartesiaPhonemeTimestampsResponse {
  type: 'phoneme_timestamps'
  done: boolean
  status_code: number
  context_id?: string
  phoneme_timestamps: {
    phonemes: string[]
    start: number[]
    end: number[]
  }
}
