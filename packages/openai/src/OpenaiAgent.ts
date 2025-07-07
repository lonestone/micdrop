import { Agent, AgentOptions } from '@micdrop/server'
import OpenAI from 'openai'
import { PassThrough, Readable } from 'stream'

export interface OpenaiAgentOptions extends AgentOptions {
  apiKey: string
  model?: string
}

const DEFAULT_MODEL = 'gpt-4o'

export class OpenaiAgent extends Agent<OpenaiAgentOptions> {
  private openai: OpenAI
  private abortController?: AbortController

  constructor(config: OpenaiAgentOptions) {
    super(config)
    this.openai = new OpenAI({ apiKey: config.apiKey })
  }

  answer(): Readable {
    this.abortController = new AbortController()
    const signal = this.abortController.signal
    const stream = new PassThrough()

    // Generate answer
    this.openai.responses
      .create(
        {
          model: this.options.model || DEFAULT_MODEL,
          input: this.conversation.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          temperature: 0.5,
          max_output_tokens: 250,
          stream: true,
          tools: [
            {
              type: 'function',
              name: 'end_call',
              description:
                'If the user asks to end the call, say goodbye and call this function.',
              strict: true,
              parameters: {
                type: 'object',
                properties: {},
                additionalProperties: false,
              },
            },
          ],
        },
        { signal }
      )
      .then(async (response) => {
        for await (const event of response) {
          switch (event.type) {
            case 'response.output_text.delta':
              this.log('Delta:', event.delta)
              stream.write(event.delta)
              break
            case 'response.output_text.done':
              stream.end()
              this.addAssistantMessage(event.text)
              break
            case 'response.output_item.done':
              if (
                event.item.type === 'function_call' &&
                event.item.name === 'end_call'
              ) {
                this.endCall()
              }
              break
            default:
              break
          }
        }
        this.abortController = undefined
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          this.log('Answer aborted')
        } else {
          this.log('Error:', error)
          stream.emit('error', error)
        }
        if (stream.writable) {
          stream.end()
        }
      })

    return stream
  }

  cancel() {
    if (this.abortController) {
      this.log('Cancel request')
      this.abortController.abort()
    }
  }
}
