import { Agent, AgentOptions } from '@micdrop/server'
import { Mistral } from '@mistralai/mistralai'
import {
  ChatCompletionStreamRequest,
  ChatCompletionStreamRequestMessages,
} from '@mistralai/mistralai/models/components'
import { PassThrough, Writable } from 'stream'
import z, { toJSONSchema } from 'zod-v4'

export interface MistralAgentOptions extends AgentOptions {
  apiKey: string
  model?: string
  settings?: Omit<ChatCompletionStreamRequest, 'messages' | 'model'>
  maxRetry?: number
}

const DEFAULT_MODEL = 'ministral-8b-latest'
const DEFAULT_MAX_RETRY = 3

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

  private async generateAnswer(stream: Writable, callCount = 0, tryCount = 0) {
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
        messages: this.buildMessages(),
        tools: this.buildTools(),
        ...this.options.settings,
      })
      let fullAnswer = ''
      let skipAnswer = false

      // Handle response events
      for await (const event of result) {
        if (this.cancelled) return
        const delta = event.data.choices[0]?.delta
        const chunk = delta?.content
        const toolCalls = delta?.toolCalls

        // Text chunk
        if (typeof chunk === 'string') {
          if (chunk === '') continue
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
        } else if (toolCalls?.length) {
          for (const toolCall of toolCalls) {
            const result = await this.executeTool({
              role: 'tool_call',
              toolCallId: toolCall.id || '',
              toolName: toolCall.function.name,
              parameters: toolCall.function.arguments as string,
            })
            if (result.skipAnswer) {
              skipAnswer = true
            }
          }
        }
      }

      if (fullAnswer) {
        // Add full answer to conversation
        const { message, metadata } = this.extract(fullAnswer)
        this.addAssistantMessage(message, metadata)
      } else if (skipAnswer) {
        // Hack: Mistral needs an assistant message after tool calls
        this.conversation.push({
          role: 'assistant',
          content: ' ',
        })
      } else {
        // Query again in case of tool call
        await this.generateAnswer(stream, callCount + 1)
      }
    } catch (error: any) {
      console.error('[MistralAgent] Error:', error)
      if (tryCount < (this.options.maxRetry || DEFAULT_MAX_RETRY)) {
        await this.generateAnswer(stream, callCount, tryCount + 1)
      }
    } finally {
      if (stream.writable) {
        stream.end()
      }
      this.running = false
    }
  }

  private buildMessages(): ChatCompletionStreamRequestMessages[] {
    return this.conversation.map(
      (message): ChatCompletionStreamRequestMessages => {
        switch (message.role) {
          case 'user':
          case 'assistant':
          case 'system':
            return {
              role: message.role,
              content: message.content,
            }
          case 'tool_call':
            return {
              role: 'assistant',
              toolCalls: [
                {
                  type: 'function',
                  id: message.toolCallId,
                  function: {
                    name: message.toolName,
                    arguments: JSON.stringify(message.parameters),
                  },
                },
              ],
            }
          case 'tool_result':
            return {
              role: 'tool',
              toolCallId: message.toolCallId,
              name: message.toolName,
              content: [
                {
                  type: 'text',
                  text: message.output,
                },
              ],
            }
        }
      }
    )
  }

  private buildTools(): ChatCompletionStreamRequest['tools'] {
    // Disable tools if first message
    const enableTools = this.conversation.length > 1
    if (!enableTools) return undefined

    return this.tools.map((tool) => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: toJSONSchema(tool.inputSchema || z.object()),
      },
    }))
  }

  cancel() {
    if (!this.running) return
    this.log('Cancel')
    this.cancelled = true
    this.running = false
  }
}
