import {
  Agent,
  AgentOptions,
  createToolCallOutput,
  createToolSchema,
  ToolCall,
  ToolCallOutput,
} from '@micdrop/server'
import OpenAI from 'openai'
import { PassThrough } from 'stream'

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
    toolInputs?: Array<ToolCall | ToolCallOutput>
  ): Promise<void> {
    if (callCount >= (this.options.maxRetry || DEFAULT_MAX_CALLS)) {
      console.error('[OpenaiAgent] Max calls reached')
      return
    }

    this.abortController = new AbortController()
    const signal = this.abortController.signal

    // Disable tools if first message
    const enableTools = this.conversation.length > 1

    // Build input
    const input: OpenAI.Responses.ResponseInput = this.conversation.map(
      (message) => ({
        role: message.role,
        content: message.content,
      })
    )
    if (toolInputs) {
      input.push(...toolInputs)
    }

    // Prepare extracting
    let extracting = false
    const extractOptions = this.getExtractOptions()

    try {
      // Generate answer
      const response = await this.openai.responses.create(
        {
          model: this.options.model || DEFAULT_MODEL,
          input,
          temperature: 0.5,
          max_output_tokens: 250,
          stream: true,
          tools: enableTools ? this.tools.map(createToolSchema) : undefined,
          ...this.options.settings,
        },
        { signal }
      )
      const toolOutputs: Array<ToolCall | ToolCallOutput> = []
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
              const result = await this.executeTool(
                toolCall.name,
                toolCall.arguments
              )
              toolOutputs.push(
                toolCall,
                createToolCallOutput(toolCall, result.output)
              )
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
      if (toolOutputs.length > 0 && !hasAnswer && !skipAnswer) {
        await this.generateAnswer(stream, callCount + 1, toolOutputs)
      }
    } catch (error) {
      if (!(error instanceof OpenAI.APIUserAbortError)) {
        console.error('[OpenaiAgent] Error answering:', error)
      }
    }
  }

  cancel() {
    if (!this.abortController) return
    this.log('Cancel')
    this.abortController.abort()
    this.abortController = undefined
  }
}
