import EventEmitter from 'eventemitter3'
import { Readable } from 'stream'
import { Logger } from '../Logger'
import { MicdropConversation, MicdropConversationMessage } from '../types'

export interface AgentOptions {
  systemPrompt: string
}

export interface AgentEvents {
  Message: [MicdropConversationMessage]
  CancelLastUserMessage: []
  CancelLastAssistantMessage: []
  SkipAnswer: []
  EndCall: []
}

export interface AgentAnswerReturn {
  text: Promise<string>
  stream: Readable
}

export interface TextPromise {
  promise: Promise<string>
  resolve: (value: string) => void
  reject: (reason?: any) => void
}

export abstract class Agent<
  Options extends AgentOptions = AgentOptions,
> extends EventEmitter {
  public logger?: Logger

  // Conversation history
  public conversation: MicdropConversation

  constructor(protected options: Options) {
    super()
    this.conversation = [{ role: 'system', content: options.systemPrompt }]
  }

  abstract answer(): AgentAnswerReturn
  abstract cancel(): void

  public addUserMessage(text: string) {
    this.addMessage('user', text)
  }

  public addAssistantMessage(text: string) {
    this.addMessage('assistant', text)
  }

  protected addMessage(role: 'user' | 'assistant' | 'system', text: string) {
    this.log(`Adding ${role} message to conversation: ${text}`)
    const message: MicdropConversationMessage = {
      role,
      content: text,
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

  protected createTextPromise(): TextPromise {
    const result: any = {}
    result.promise = new Promise<string>((resolve, reject) => {
      result.resolve = resolve
      result.reject = reject
    })
    return result
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
