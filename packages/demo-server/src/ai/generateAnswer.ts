import { CallMetadata, ConversationMessage } from '@micdrop/server'
import { openai } from './openai'

export const END_CALL = 'END_CALL'
export const CANCEL_LAST_USER_MESSAGE = 'CANCEL_LAST_USER_MESSAGE'
export const SKIP_ANSWER = 'SKIP_ANSWER'

export async function generateAnswer(
  conversation: ConversationMessage[]
): Promise<ConversationMessage> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: conversation,
    temperature: 0.5,
    max_tokens: 250,
  })

  let text = response.choices[0].message.content
  if (!text) throw new Error('Empty response')

  const metadata: CallMetadata = {}

  // Detect commands for metadata
  if (text.includes(END_CALL)) {
    text = text.replace(END_CALL, '').trim()
    metadata.commands = { endCall: true }
  } else if (text.includes(CANCEL_LAST_USER_MESSAGE)) {
    metadata.commands = { cancelLastUserMessage: true }
  } else if (text.includes(SKIP_ANSWER)) {
    metadata.commands = { skipAnswer: true }
  }

  return { role: 'assistant', content: text, metadata }
}
