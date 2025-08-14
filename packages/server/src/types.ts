import type { Agent } from './agent'
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
  EndCall = 'EndCall',
  ToolCall = 'ToolCall',
}

export interface MicdropConfig {
  firstMessage?: string
  generateFirstMessage?: boolean
  agent: Agent
  stt: STT
  tts: TTS
  onEnd?(call: MicdropCallSummary): void
}

export interface MicdropCallSummary {
  conversation: MicdropConversation
  duration: number
}

export type MicdropConversation = MicdropConversationMessage[]

export type MicdropAnswerMetadata = {
  [key: string]: any
}

export interface MicdropConversationMessage<
  Data extends MicdropAnswerMetadata = MicdropAnswerMetadata,
> {
  role: 'system' | 'user' | 'assistant'
  content: string
  metadata?: Data
}

export interface MicdropToolCall {
  name: string
  parameters: any
  output: any
}

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
