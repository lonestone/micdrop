import type { STT } from './stt'
import type { TTS } from './tts'

export enum MicdropClientCommands {
  StartSpeaking = 'StartSpeaking',
  StopSpeaking = 'StopSpeaking',
  Mute = 'Mute',
}

export enum MicdropServerCommands {
  Message = 'Message',
  CancelLastAssistantMessage = 'CancelLastAssistantMessage',
  CancelLastUserMessage = 'CancelLastUserMessage',
  SkipAnswer = 'SkipAnswer',
  EnableSpeakerStreaming = 'EnableSpeakerStreaming',
  EndCall = 'EndCall',
}

export interface MicdropConfig {
  systemPrompt: string
  firstMessage?: string
  debugLog?: boolean
  generateAnswer(
    conversation: MicdropConversation
  ): Promise<string | MicdropConversationMessage>
  speech2Text: STT
  text2Speech: TTS
  onMessage?(message: MicdropConversationMessage): void
  onEnd?(call: MicdropCallSummary): void
}

export interface MicdropCallSummary {
  conversation: MicdropConversation
  duration: number
}

export type MicdropConversation = MicdropConversationMessage[]

export type MicdropAnswerCommands = {
  endCall?: boolean
  cancelLastUserMessage?: boolean
  skipAnswer?: boolean
}

export type MicdropAnswerMetadata = {
  [key: string]: any
}

export interface MicdropConversationMessage<
  Data extends MicdropAnswerMetadata = MicdropAnswerMetadata,
> {
  role: 'system' | 'user' | 'assistant'
  content: string
  commands?: MicdropAnswerCommands
  metadata?: Data
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
