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
  debugSaveSpeech?: boolean
  disableTTS?: boolean
  generateAnswer(
    conversation: Conversation
  ): Promise<string | ConversationMessage>
  speech2Text(audioBlob: Blob, prevMessage?: string): Promise<string>
  text2Speech(text: string): Promise<ArrayBuffer | NodeJS.ReadableStream>
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
