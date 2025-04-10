import { ConversationMessage } from '@micdrop/server'
import { openai } from './openai'

export async function generateAnswer(
  conversation: ConversationMessage[]
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: conversation,
    temperature: 0.5,
    max_tokens: 250,
  })

  const text = response.choices[0].message.content
  if (!text) throw new Error('Empty response')
  return text
}
