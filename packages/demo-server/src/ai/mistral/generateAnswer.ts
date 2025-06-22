import { MicdropConversationMessage } from '@micdrop/server'

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || ''
const MISTRAL_MODEL = 'ministral-8b-2410'

export async function generateAnswer(
  conversation: MicdropConversationMessage[]
): Promise<MicdropConversationMessage> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      messages: conversation.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: 0.5,
      max_tokens: 250,
    }),
  })

  if (!response.ok) {
    throw new Error(
      `Mistral API error: ${response.status} ${response.statusText}`
    )
  }

  const data: any = await response.json()
  let text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response')

  return { role: 'assistant', content: text }
}
