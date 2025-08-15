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
