import { Agent } from '@micdrop/server'
import OpenAI from 'openai'
import { Readable } from 'stream'

export interface OpenaiAgentConfig {
  openai: OpenAI
  model?: string
}

export class OpenaiAgent extends Agent {
  private openai: OpenAI
  private model: string
  private abortController?: AbortController

  constructor({ openai, model }: OpenaiAgentConfig) {
    super()
    this.openai = openai
    this.model = model || 'gpt-4o'
  }

  answer(text: string) {
    this.abortController = new AbortController()
    const signal = this.abortController.signal
    const stream = new Readable({
      read() {
        // We push data to the stream from the openai api
      },
    })

    if (!this.call) {
      const err = new Error('Agent not attached to a call')
      this.log(err)
      stream.emit('error', err)
      return stream
    }

    const conversation = this.call.conversation

    this.openai.chat.completions
      .create(
        {
          model: this.model,
          messages: conversation,
          temperature: 0.5,
          max_tokens: 250,
          stream: true,
        },
        { signal }
      )
      .then(async (response) => {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            stream.push(content)
          }
        }
        stream.push(null) // End the stream
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          this.log('OpenAI request aborted')
        } else {
          this.log('Error from OpenAI:', error)
          stream.emit('error', error)
        }
        stream.push(null) // End the stream on error too
      })

    return stream
  }

  cancel() {
    this.log('Cancelling OpenAI request')
    this.abortController?.abort()
  }
}
