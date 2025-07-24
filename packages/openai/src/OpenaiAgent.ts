import { Agent, AgentOptions, TextPromise } from '@micdrop/server'
import OpenAI from 'openai'
import { PassThrough } from 'stream'
import { z } from 'zod'
import {
  createToolCallOutput,
  createToolSchema,
  Tool,
  ToolCall,
  ToolCallOutput,
} from './tools'

export interface OpenaiAgentOptions extends AgentOptions {
  apiKey: string
  model?: string
  maxCalls?: number
  settings?: Omit<
    OpenAI.Responses.ResponseCreateParamsStreaming,
    'input' | 'model'
  >

  // Enable auto ending of the call when user asks to end the call
  // You can provide a custom prompt to use instead of the default one by passing a string
  autoEndCall?: boolean | string

  // Enable detection of an incomplete sentence, and skip the answer (assistant waits)
  // You can provide a custom prompt to use instead of the default one by passing a string
  autoSemanticTurn?: boolean | string

  // Ignore of the last user message when it's meaningless
  // You can provide a custom prompt to use instead of the default one by passing a string
  autoIgnoreUserNoise?: boolean | string
}

const DEFAULT_MODEL = 'gpt-4o'
const DEFAULT_MAX_CALLS = 5

const AUTO_END_CALL_TOOL_NAME = 'end_call'
const AUTO_END_CALL_PROMPT = 'Call this tool only if user asks to end the call'

const AUTO_SEMANTIC_TURN_TOOL_NAME = 'semantic_turn'
const AUTO_SEMANTIC_TURN_PROMPT =
  'Call this tool only if last user message is obviously an incomplete sentence that you need to wait for the end before answering'

const AUTO_IGNORE_USER_NOISE_TOOL_NAME = 'ignore_user_noise'
const AUTO_IGNORE_USER_NOISE_PROMPT =
  'Call this tool only if last user message is just an interjection or a sound that expresses emotion, hesitation, or reaction (ex: "Uh", "Ahem", "Hmm", "Ah") but doesn\'t carry any clear meaning like agreeing, refusing, or commanding'

export class OpenaiAgent extends Agent<OpenaiAgentOptions> {
  private openai: OpenAI
  private tools: Tool[]
  private abortController?: AbortController

  constructor(options: OpenaiAgentOptions) {
    super(options)
    this.openai = new OpenAI({ apiKey: options.apiKey })
    this.tools = this.getDefaultTools()
  }

  answer() {
    this.cancel()
    this.log('Start answering')
    const stream = new PassThrough()
    const textPromise = this.createTextPromise()

    this.generateAnswer(stream, textPromise).finally(() => {
      this.abortController = undefined
      if (stream.writable) {
        stream.end()
      }
    })

    return { message: textPromise.promise, stream }
  }

  private async generateAnswer(
    stream: PassThrough,
    textPromise: TextPromise,
    callCount = 0,
    toolInputs?: Array<ToolCall | ToolCallOutput>
  ): Promise<void> {
    if (callCount >= (this.options.maxCalls || DEFAULT_MAX_CALLS)) {
      console.error('[OpenaiAgent] Max calls reached')
      textPromise.resolve('')
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
            stream.write(event.delta)
            break

          case 'response.output_text.done':
            this.addAssistantMessage(event.text)
            stream.end()
            textPromise.resolve(event.text)
            hasAnswer = true
            break

          case 'response.output_item.done':
            if (event.item.type === 'function_call') {
              const result = await this.executeTool(event.item)
              toolOutputs.push(result.toolCall, result.toolCallOutput)
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
        await this.generateAnswer(
          stream,
          textPromise,
          callCount + 1,
          toolOutputs
        )
      } else {
        // Ensure promise is resolved (if skipAnswer is true in a tool)
        textPromise.resolve('')
      }
    } catch (error) {
      textPromise.resolve('')
      if (!(error instanceof OpenAI.APIUserAbortError)) {
        console.error('[OpenaiAgent] Error answering:', error)
      }
    }
  }

  addTool<Schema extends z.ZodObject>(tool: Tool<Schema>) {
    this.tools.push(tool)
  }

  removeTool(name: string) {
    this.tools = this.tools.filter((tool) => tool.name !== name)
  }

  getTool(name: string): Tool | undefined {
    return this.tools.find((tool) => tool.name === name)
  }

  private getDefaultTools() {
    const tools: Tool[] = []
    if (this.options.autoEndCall) {
      tools.push({
        name: AUTO_END_CALL_TOOL_NAME,
        description:
          typeof this.options.autoEndCall === 'string'
            ? this.options.autoEndCall
            : AUTO_END_CALL_PROMPT,
        callback: () => this.endCall(),
      })
    }
    if (this.options.autoSemanticTurn) {
      tools.push({
        name: AUTO_SEMANTIC_TURN_TOOL_NAME,
        description:
          typeof this.options.autoSemanticTurn === 'string'
            ? this.options.autoSemanticTurn
            : AUTO_SEMANTIC_TURN_PROMPT,
        skipAnswer: true,
        callback: () => this.skipAnswer(),
      })
    }
    if (this.options.autoIgnoreUserNoise) {
      tools.push({
        name: AUTO_IGNORE_USER_NOISE_TOOL_NAME,
        description:
          typeof this.options.autoIgnoreUserNoise === 'string'
            ? this.options.autoIgnoreUserNoise
            : AUTO_IGNORE_USER_NOISE_PROMPT,
        skipAnswer: true,
        callback: () => this.cancelLastUserMessage(),
      })
    }
    return tools
  }

  private async executeTool(toolCall: ToolCall) {
    try {
      const tool = this.getTool(toolCall.name)
      if (!tool) {
        throw new Error(`Tool not found "${toolCall.name}"`)
      }

      this.log('Executing tool:', toolCall.name, toolCall.arguments)
      const args = JSON.parse(toolCall.arguments)
      const result = await tool.callback(args)

      return {
        toolCall,
        toolCallOutput: createToolCallOutput(toolCall, result || {}),
        skipAnswer: tool.skipAnswer,
      }
    } catch (error: any) {
      console.error('[OpenaiAgent] Error executing tool:', error)
      return {
        toolCall,
        toolCallOutput: createToolCallOutput(toolCall, {
          error: error.message,
        }),
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
