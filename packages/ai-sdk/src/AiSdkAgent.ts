import { Agent, AgentOptions } from '@micdrop/server'
import {
  CallSettings,
  LanguageModel,
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

    // Disable tools if first message
    const enableTools = this.conversation.length > 1

    // Build messages for AI SDK
    const messages = this.conversation.map((message) => ({
      role: message.role as 'user' | 'assistant' | 'system',
      content: message.content,
    }))

    // Prepare extracting
    let extracting = false
    const extractOptions = this.getExtractOptions()

    try {
      // Generate response using AI SDK
      const result = streamText({
        model: this.options.model,
        messages,
        tools: enableTools ? this.convertToAISDKTools() : undefined,
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
      stream.write(message)
    } catch (error: any) {
      if (!signal.aborted) {
        console.error('[AiSdkAgent] Error answering:', error)
      }
    }
  }

  private convertToAISDKTools() {
    const tools: ToolSet = {}
    this.tools.forEach((t) => {
      tools[t.name] = tool({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema || z.object({}),
        execute: (args) => this.executeTool(t.name, JSON.stringify(args)),
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
