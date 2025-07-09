import { Agent, AgentOptions } from '@micdrop/server'
import OpenAI from 'openai'
import { PassThrough, Readable } from 'stream'

export interface OpenaiAgentOptions extends AgentOptions {
  apiKey: string
  model?: string
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

const AUTO_END_CALL_TOOL_NAME = 'end_call'
const AUTO_END_CALL_PROMPT = 'User asks to end the call'

const AUTO_SEMANTIC_TURN_TOOL_NAME = 'semantic_turn'
const AUTO_SEMANTIC_TURN_PROMPT = 'Last user message is an incomplete sentence'

const AUTO_IGNORE_USER_NOISE_TOOL_NAME = 'ignore_user_noise'
const AUTO_IGNORE_USER_NOISE_PROMPT =
  'Last user message is just an interjection or a sound that expresses emotion, hesitation, or reaction (ex: "Uh", "Ahem", "Hmm", "Ah") but doesn\'t carry any clear meaning like agreeing, refusing, or commanding'

export class OpenaiAgent extends Agent<OpenaiAgentOptions> {
  private openai: OpenAI
  private tools: OpenAI.Responses.Tool[]
  private abortController?: AbortController

  constructor(config: OpenaiAgentOptions) {
    super(config)
    this.openai = new OpenAI({ apiKey: config.apiKey })
    this.tools = this.getTools()
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
          tools: this.tools,
          parallel_tool_calls: false,
          ...this.options.settings,
        },
        { signal }
      )
      .then(async (response) => {
        for await (const event of response) {
          switch (event.type) {
            case 'response.output_text.delta':
              this.log('Answer chunk:', event.delta)
              stream.write(event.delta)
              break
            case 'response.output_text.done':
              stream.end()
              this.addAssistantMessage(event.text)
              break
            case 'response.output_item.done':
              if (event.item.type === 'function_call') {
                this.executeTool(event.item)
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

  private getTools() {
    const tools: OpenAI.Responses.Tool[] = []
    if (this.options.autoEndCall) {
      tools.push(
        this.getToolSchema(
          AUTO_END_CALL_TOOL_NAME,
          typeof this.options.autoEndCall === 'string'
            ? this.options.autoEndCall
            : AUTO_END_CALL_PROMPT
        )
      )
    }
    if (this.options.autoSemanticTurn) {
      tools.push(
        this.getToolSchema(
          AUTO_SEMANTIC_TURN_TOOL_NAME,
          typeof this.options.autoSemanticTurn === 'string'
            ? this.options.autoSemanticTurn
            : AUTO_SEMANTIC_TURN_PROMPT
        )
      )
    }
    if (this.options.autoIgnoreUserNoise) {
      tools.push(
        this.getToolSchema(
          AUTO_IGNORE_USER_NOISE_TOOL_NAME,
          typeof this.options.autoIgnoreUserNoise === 'string'
            ? this.options.autoIgnoreUserNoise
            : AUTO_IGNORE_USER_NOISE_PROMPT
        )
      )
    }
    return tools
  }

  private getToolSchema(
    name: string,
    description: string
  ): OpenAI.Responses.Tool {
    return {
      type: 'function',
      name,
      description,
      strict: true,
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
    }
  }

  private executeTool(toolCall: OpenAI.Responses.ResponseFunctionToolCall) {
    switch (toolCall.name) {
      case AUTO_END_CALL_TOOL_NAME:
        this.endCall()
        break
      case AUTO_SEMANTIC_TURN_TOOL_NAME:
        this.skipAnswer()
        break
      case AUTO_IGNORE_USER_NOISE_TOOL_NAME:
        this.cancelLastUserMessage()
        break
      default:
        this.log('Tool not found:', toolCall.name)
        break
    }
  }

  cancel() {
    if (!this.abortController) return
    this.log('Cancel')
    this.abortController.abort()
    this.abortController = undefined
  }
}
