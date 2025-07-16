import { Agent, AgentOptions } from '@micdrop/server'
import { Mistral } from '@mistralai/mistralai'
import { ChatCompletionStreamRequest } from '@mistralai/mistralai/models/components'
import { PassThrough, Readable, Writable } from 'stream'

export interface MistralAgentOptions extends AgentOptions {
  apiKey: string
  model?: string
  settings?: Omit<ChatCompletionStreamRequest, 'messages' | 'model'>
}

const DEFAULT_MODEL = 'ministral-8b-latest'

export class MistralAgent extends Agent<MistralAgentOptions> {
  private mistral: Mistral
  private cancelled: boolean = false
  private running: boolean = false

  constructor(options: MistralAgentOptions) {
    super(options)
    this.mistral = new Mistral({ apiKey: options.apiKey })
  }

  answer(): Readable {
    this.log('Start answering')
    this.cancelled = false
    const stream = new PassThrough()
    this.generateAnswer(stream)
    return stream
  }

  private async generateAnswer(stream: Writable) {
    this.running = true
    this.cancelled = false

    // Hack: Mistral needs a user message if there is only a system message
    if (this.conversation.length === 1) {
      this.conversation.push({
        role: 'user',
        content: '',
      })
    }

    try {
      const result = await this.mistral.chat.stream({
        model: this.options.model || DEFAULT_MODEL,
        messages: this.conversation.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        ...this.options.settings,
      })

      // Get and stream chunks
      let fullAnswer = ''
      for await (const event of result) {
        if (this.cancelled) return
        const chunk = event.data.choices[0].delta.content
        if (typeof chunk === 'string') {
          this.log(`Answer chunk: "${chunk}"`)
          stream.write(chunk)
          fullAnswer += chunk
        }
      }

      // Add full answer to conversation
      this.addAssistantMessage(fullAnswer)
    } catch (error: any) {
      console.error('[MistralAgent] Error:', error)
      stream.emit('error', error)
    } finally {
      if (stream.writable) {
        stream.end()
      }
      this.running = false
    }
  }

  cancel() {
    if (!this.running) return
    this.log('Cancel')
    this.cancelled = true
    this.running = false
  }
}
