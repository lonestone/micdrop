import { STT } from './stt'
import { TTS } from './tts/TTS'

export enum CallClientCommands {
  StartSpeaking = 'StartSpeaking',
  StopSpeaking = 'StopSpeaking',
  Mute = 'Mute',
}

export enum CallServerCommands {
  Message = 'Message',
  CancelLastAssistantMessage = 'CancelLastAssistantMessage',
  CancelLastUserMessage = 'CancelLastUserMessage',
  SkipAnswer = 'SkipAnswer',
  EnableSpeakerStreaming = 'EnableSpeakerStreaming',
  EndCall = 'EndCall',
}

export interface CallConfig {
  systemPrompt: string
  firstMessage?: string
  debugLog?: boolean
  disableTTS?: boolean
  generateAnswer(
    conversation: Conversation
  ): Promise<string | ConversationMessage>
  speech2Text: STT
  text2Speech: TTS
  onMessage?(message: ConversationMessage): void
  onEnd?(call: CallSummary): void
}

export interface CallSummary {
  conversation: Conversation
  duration: number
}

export type Conversation = ConversationMessage[]

export type AnswerCommands = {
  endCall?: boolean
  cancelLastUserMessage?: boolean
  skipAnswer?: boolean
}

export type AnswerMetadata = {
  [key: string]: any
}

export interface ConversationMessage<
  Data extends AnswerMetadata = AnswerMetadata,
> {
  role: 'system' | 'user' | 'assistant'
  content: string
  commands?: AnswerCommands
  metadata?: Data
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
