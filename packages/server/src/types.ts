export enum MicdropClientCommands {
  StartSpeaking = 'StartSpeaking',
  StopSpeaking = 'StopSpeaking',
  Mute = 'Mute',
}

export enum MicdropServerCommands {
  Message = 'Message',
  PartialAssistantMessage = 'PartialAssistantMessage',
  CancelLastUserMessage = 'CancelLastUserMessage',
  SkipAnswer = 'SkipAnswer',
  EndCall = 'EndCall',
  ToolCall = 'ToolCall',
}

/**
 * Hears whether a sentence has landed, where voice activity detection only
 * hears whether someone is speaking.
 *
 * `SmartTurn` from `@micdrop/smart-turn` implements it, and so can anything
 * else, a call to a service included. Both sides of a call can hold one, the
 * client to decide when its turn ends and the server to decide when to answer.
 */
export interface TurnDetector {
  /**
   * Feeds the audio received since the last call
   * @param samples - Mono samples, in the -1..1 range
   * @param sampleRate - Sample rate of `samples`, in Hz
   */
  push(samples: Float32Array, sampleRate?: number): void

  /** Answers whether the turn pushed so far sounds finished */
  predict(): Promise<{ complete: boolean }>

  /** Starts a new turn, forgetting the previous one */
  reset(): void
}

export interface MicdropCallSummary {
  conversation: MicdropConversation
  duration: number
}

export type MicdropConversationItem =
  | MicdropConversationMessage
  | MicdropConversationToolCall
  | MicdropConversationToolResult

export type MicdropConversation = Array<MicdropConversationItem>

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

export interface MicdropConversationToolCall {
  role: 'tool_call'
  toolCallId: string
  toolName: string
  parameters: string
}

export interface MicdropConversationToolResult {
  role: 'tool_result'
  toolCallId: string
  toolName: string
  output: string
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
