export enum CallClientCommands {
  StartSpeaking = 'startSpeaking',
  StopSpeaking = 'stopSpeaking',
  Mute = 'mute',
}

export enum CallServerCommands {
  Message = 'message',
  CancelLastAssistantMessage = 'cancelLastAssistantMessage',
  EndInterview = 'endInterview',
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

export interface ConversationMessage<Data = any> {
  role: 'system' | 'user' | 'assistant'
  content: string
  metadata?: Data
}
