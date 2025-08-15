import { Agent, AgentOptions } from '@micdrop/server'
import { Mistral } from '@mistralai/mistralai'
import { ChatCompletionStreamRequest } from '@mistralai/mistralai/models/components'
import { PassThrough, Writable } from 'stream'

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

  answer() {
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

    // Prepare extracting
    let extracting = false
    const extractOptions = this.getExtractOptions()

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
          fullAnswer += chunk

          // Extracting value?
          if (extractOptions) {
            if (!extracting) {
              const startTagIndex = fullAnswer.indexOf(extractOptions.startTag)
              if (startTagIndex !== -1) {
                extracting = true
                const messagePart = fullAnswer.slice(0, startTagIndex).trimEnd()
                stream.write(messagePart)
                continue
              }
            } else {
              // Extracting, don't write to stream
              continue
            }
          }

          stream.write(chunk)
        }
      }

      // Add full answer to conversation
      const { message, metadata } = this.extract(fullAnswer)
      this.addAssistantMessage(message, metadata)
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
