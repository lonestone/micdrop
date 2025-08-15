import type { z } from 'zod'

export interface Tool<Schema extends z.ZodObject = z.ZodObject> {
  name: string
  description: string
  inputSchema?: Schema
  execute?: (input: z.infer<Schema>) => any | Promise<any>
  skipAnswer?: boolean
  emitOutput?: boolean
}

export const AUTO_END_CALL_TOOL_NAME = 'end_call'
export const AUTO_END_CALL_PROMPT =
  'Call this tool only if user asks to end the call'

export const AUTO_SEMANTIC_TURN_TOOL_NAME = 'semantic_turn'
export const AUTO_SEMANTIC_TURN_PROMPT =
  'Call this tool only if last user message is obviously an incomplete sentence that you need to wait for the end before answering'

export const AUTO_IGNORE_USER_NOISE_TOOL_NAME = 'ignore_user_noise'
export const AUTO_IGNORE_USER_NOISE_PROMPT =
  'Call this tool only if last user message is just an interjection or a sound that expresses emotion, hesitation, or reaction (ex: "Uh", "Ahem", "Hmm", "Ah") but doesn\'t carry any clear meaning like agreeing, refusing, or commanding'
