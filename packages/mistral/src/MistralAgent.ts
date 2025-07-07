import { Agent, AgentOptions } from '@micdrop/server'
import { Mistral } from '@mistralai/mistralai'
import * as dotenv from 'dotenv'
import { PassThrough, Readable } from 'stream'

dotenv.config()

export interface MistralAgentOptions extends AgentOptions {
  apiKey: string
  model?: string
}

const DEFAULT_MODEL = 'mistral-large-latest'

export class MistralAgent extends Agent<MistralAgentOptions> {
  private mistral: Mistral
  private abortController?: AbortController

  constructor(options: MistralAgentOptions) {
    super(options)
    this.mistral = new Mistral({ apiKey: options.apiKey })
  }

  answer(): Readable {
    this.abortController = new AbortController()
    const signal = this.abortController.signal
    const stream = new PassThrough()

    // Generate answer
    ;(async () => {
      try {
        // Note: @mistralai/mistralai does not support AbortController or cancellation via 'signal'.
        const result = await this.mistral.chat.stream({
          model: this.options.model || DEFAULT_MODEL,
          messages: this.conversation.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          // Add other parameters if needed (e.g., temperature)
        })

        for await (const chunk of result) {
          const streamText = chunk.data.choices[0].delta.content
          if (typeof streamText === 'string') {
            this.log('Delta:', streamText)
            stream.write(streamText)
          }
        }
        stream.end()
        // Optionally, add the full assistant message if you accumulate it
      } catch (error: any) {
        if (error.name === 'AbortError') {
          this.log('Answer aborted')
        } else {
          this.log('Error:', error)
          stream.emit('error', error)
        }
        if (stream.writable) {
          stream.end()
        }
      } finally {
        this.abortController = undefined
      }
    })()

    return stream
  }

  cancel() {
    if (this.abortController) {
      this.log('Cancel request')
      this.abortController.abort()
    }
  }
}
