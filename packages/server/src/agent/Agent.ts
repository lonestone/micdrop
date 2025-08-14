import { EventEmitter } from 'eventemitter3'
import { Readable } from 'stream'
import { Logger } from '../Logger'
import {
  MicdropAnswerMetadata,
  MicdropConversation,
  MicdropConversationMessage,
  MicdropToolCall,
} from '../types'

export interface AgentOptions {
  systemPrompt: string
}

export interface AgentEvents {
  Message: [MicdropConversationMessage]
  CancelLastUserMessage: []
  CancelLastAssistantMessage: []
  SkipAnswer: []
  EndCall: []
  ToolCall: [MicdropToolCall]
}

export abstract class Agent<
  Options extends AgentOptions = AgentOptions,
> extends EventEmitter<AgentEvents> {
  public logger?: Logger

  // Conversation history
  public conversation: MicdropConversation

  constructor(protected options: Options) {
    super()
    this.conversation = [{ role: 'system', content: options.systemPrompt }]
  }

  abstract answer(): Readable
  abstract cancel(): void

  public addUserMessage(text: string, metadata?: MicdropAnswerMetadata) {
    this.addMessage('user', text, metadata)
  }

  public addAssistantMessage(text: string, metadata?: MicdropAnswerMetadata) {
    this.addMessage('assistant', text, metadata)
  }

  protected addMessage(
    role: 'user' | 'assistant' | 'system',
    text: string,
    metadata?: MicdropAnswerMetadata
  ) {
    this.log(`Adding ${role} message to conversation: ${text}`)
    const message: MicdropConversationMessage = {
      role,
      content: text,
      metadata,
    }
    this.conversation.push(message)
    this.emit('Message', message)
  }

  protected endCall() {
    this.log('Ending call')
    this.emit('EndCall')
  }

  protected cancelLastUserMessage() {
    this.log('Cancelling last user message')
    const lastMessage = this.conversation[this.conversation.length - 1]
    if (lastMessage?.role !== 'user') return
    this.conversation.pop()
    this.emit('CancelLastUserMessage')
  }

  protected cancelLastAssistantMessage() {
    this.log('Cancelling last assistant message')
    const lastMessage = this.conversation[this.conversation.length - 1]
    if (lastMessage?.role !== 'assistant') return
    this.conversation.pop()
    this.emit('CancelLastAssistantMessage')
  }

  protected skipAnswer() {
    this.log('Skipping answer')
    this.emit('SkipAnswer')
  }

  protected log(...message: any[]) {
    this.logger?.log(...message)
  }

  destroy() {
    this.log('Destroyed')
    this.removeAllListeners()
    this.cancel()
  }
}
