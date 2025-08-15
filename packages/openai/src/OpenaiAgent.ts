import { Agent, AgentOptions } from '@micdrop/server'
import OpenAI from 'openai'
import { PassThrough } from 'stream'
import z, { toJSONSchema } from 'zod'

export interface OpenaiAgentOptions extends AgentOptions {
  apiKey: string
  model?: string
  maxRetry?: number
  settings?: Omit<
    OpenAI.Responses.ResponseCreateParamsStreaming,
    'input' | 'model'
  >
}

const DEFAULT_MODEL = 'gpt-4o'
const DEFAULT_MAX_CALLS = 5
const DEFAULT_MAX_RETRIES = 3

export class OpenaiAgent extends Agent<OpenaiAgentOptions> {
  private openai: OpenAI
  private abortController?: AbortController

  constructor(options: OpenaiAgentOptions) {
    super(options)
    this.openai = new OpenAI({ apiKey: options.apiKey })
  }

  answer() {
    this.cancel()
    this.log('Start answering')
    const stream = new PassThrough()

    this.generateAnswer(stream).finally(() => {
      this.abortController = undefined
      if (stream.writable) {
        stream.end()
      }
    })

    return stream
  }

  private async generateAnswer(
    stream: PassThrough,
    callCount = 0,
    tryCount = 0
  ): Promise<void> {
    if (callCount >= (this.options.maxRetry || DEFAULT_MAX_CALLS)) {
      console.error('[OpenaiAgent] Max calls reached')
      return
    }

    this.abortController = new AbortController()
    const signal = this.abortController.signal

    // Prepare extracting
    let extracting = false
    const extractOptions = this.getExtractOptions()

    try {
      // Generate answer
      const response = await this.openai.responses.create(
        {
          model: this.options.model || DEFAULT_MODEL,
          input: this.buildInput(),
          tools: this.buildTools(),
          temperature: 0.5,
          max_output_tokens: 250,
          stream: true,
          ...this.options.settings,
        },
        { signal }
      )
      let hasAnswer = false
      let skipAnswer = false

      // Handle response events
      for await (const event of response) {
        switch (event.type) {
          case 'response.output_text.delta':
            this.log(`Answer chunk: "${event.delta}"`)

            // Extracting value?
            if (extractOptions) {
              if (!extracting) {
                const startTagIndex = event.delta.indexOf(
                  extractOptions.startTag
                )
                if (startTagIndex !== -1) {
                  extracting = true
                  const messagePart = event.delta
                    .slice(0, startTagIndex)
                    .trimEnd()
                  stream.write(messagePart)
                  break
                }
              } else {
                // Extracting, don't write to stream
                break
              }
            }

            // Send chunk
            stream.write(event.delta)
            break

          case 'response.output_text.done':
            const { message, metadata } = this.extract(event.text)
            this.addAssistantMessage(message, metadata)
            stream.end()
            hasAnswer = true
            break

          case 'response.output_item.done':
            if (event.item.type === 'function_call') {
              const toolCall = event.item
              const result = await this.executeTool({
                role: 'tool_call',
                toolCallId: toolCall.call_id,
                toolName: toolCall.name,
                parameters: toolCall.arguments,
              })
              if (result.skipAnswer) {
                skipAnswer = true
              }
            }
            break

          default:
            break
        }
      }

      // Query again in case of tool call
      if (!hasAnswer && !skipAnswer) {
        await this.generateAnswer(stream, callCount + 1)
      }
    } catch (error) {
      if (!(error instanceof OpenAI.APIUserAbortError)) {
        console.error('[OpenaiAgent] Error answering:', error)
        if (tryCount < (this.options.maxRetry || DEFAULT_MAX_RETRIES)) {
          await this.generateAnswer(stream, callCount, tryCount + 1)
        }
      }
    }
  }

  private buildInput(): OpenAI.Responses.ResponseInput {
    return this.conversation.map((message) => {
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
            type: 'function_call',
            call_id: message.toolCallId,
            name: message.toolName,
            arguments: JSON.stringify(message.parameters),
          }
        case 'tool_result':
          return {
            type: 'function_call_output',
            call_id: message.toolCallId,
            output: message.output,
          }
      }
    })
  }

  private buildTools(): OpenAI.Responses.Tool[] | undefined {
    // Disable tools if first message
    const enableTools = this.conversation.length > 1
    if (!enableTools) return undefined

    return this.tools.map((tool) => ({
      type: 'function',
      name: tool.name,
      description: tool.description,
      strict: true,
      parameters: toJSONSchema(tool.inputSchema || z.object()),
    }))
  }

  cancel() {
    if (!this.abortController) return
    this.log('Cancel')
    this.abortController.abort()
    this.abortController = undefined
  }
}
