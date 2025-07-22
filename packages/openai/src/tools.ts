import {
  FunctionTool,
  ResponseInputItem,
  Responses,
} from 'openai/resources/responses/responses'
import { toJSONSchema, z } from 'zod'

export interface Tool<Schema extends z.ZodObject = z.ZodObject> {
  name: string
  description: string
  parameters?: Schema
  callback: (input: z.infer<Schema>) => any | Promise<any>
}

export type ToolCall = Responses.ResponseFunctionToolCall
export type ToolCallOutput = ResponseInputItem.FunctionCallOutput

export function createToolSchema<Schema extends z.ZodObject>(
  tool: Tool<Schema>
): FunctionTool {
  return {
    type: 'function',
    name: tool.name,
    description: tool.description,
    strict: true,
    parameters: toJSONSchema(tool.parameters || z.object()),
  }
}

export function createToolCallOutput(
  toolCall: ToolCall,
  args: any
): ToolCallOutput {
  return {
    type: 'function_call_output',
    call_id: toolCall.call_id,
    output: JSON.stringify(args),
  }
}
