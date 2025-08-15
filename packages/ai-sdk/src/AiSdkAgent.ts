import { Agent, AgentOptions } from '@micdrop/server'
import {
  CallSettings,
  LanguageModel,
  ModelMessage,
  stepCountIs,
  streamText,
  tool,
  ToolSet,
} from 'ai'
import { PassThrough } from 'stream'
import { z } from 'zod'

export interface AiSdkAgentOptions extends AgentOptions {
  model: LanguageModel
  settings?: CallSettings
}

export class AiSdkAgent extends Agent<AiSdkAgentOptions> {
  private abortController?: AbortController

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

  private async generateAnswer(stream: PassThrough): Promise<void> {
    this.abortController = new AbortController()
    const signal = this.abortController.signal

    // Prepare extracting
    let extracting = false
    const extractOptions = this.getExtractOptions()

    try {
      // Generate response using AI SDK
      const result = streamText({
        model: this.options.model,
        messages: this.buildMessages(),
        tools: this.buildTools(),
        maxRetries: 3,
        stopWhen: stepCountIs(5),
        ...this.options.settings,
        abortSignal: signal,
      })

      for await (const textPart of result.textStream) {
        this.log(`Answer chunk: "${textPart}"`)

        // Extracting value?
        if (extractOptions) {
          if (!extracting) {
            const startTagIndex = textPart.indexOf(extractOptions.startTag)
            if (startTagIndex !== -1) {
              extracting = true
              const messagePart = textPart.slice(0, startTagIndex).trimEnd()
              stream.write(messagePart)
              continue
            }
          } else {
            // Extracting, don't write to stream
            continue
          }
        }

        // Send chunk
        stream.write(textPart)
      }

      const fullText = await result.text
      const { message, metadata } = this.extract(fullText)

      // Emit message
      this.addAssistantMessage(message, metadata)
    } catch (error: any) {
      if (!signal.aborted) {
        console.error('[AiSdkAgent] Error answering:', error)
      }
    }
  }

  private buildMessages(): ModelMessage[] {
    return this.conversation.map((message): ModelMessage => {
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
            content: [
              {
                type: 'tool-call',
                toolCallId: message.toolCallId,
                toolName: message.toolName,
                input: JSON.parse(message.parameters),
              },
            ],
          }
        case 'tool_result':
          return {
            role: 'tool',
            content: [
              {
                type: 'tool-result',
                toolCallId: message.toolCallId,
                toolName: message.toolName,
                output: {
                  type: 'json',
                  value: JSON.parse(message.output),
                },
              },
            ],
          }
      }
    })
  }

  private buildTools() {
    const tools: ToolSet = {}

    // Disable tools if first message
    const enableTools = this.conversation.length > 1
    if (!enableTools) return tools

    this.tools.forEach((t) => {
      tools[t.name] = tool({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema || z.object({}),
        execute: (args, { toolCallId }) =>
          this.executeTool({
            role: 'tool_call',
            toolCallId,
            toolName: t.name,
            parameters: JSON.stringify(args),
          }),
      })
    })
    return tools
  }

  cancel() {
    if (!this.abortController) return
    this.log('Cancel')
    this.abortController.abort()
    this.abortController = undefined
  }
}
