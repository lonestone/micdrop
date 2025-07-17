import { MicdropError, MicdropErrorCode, waitForParams } from '@micdrop/server'
import { WebSocket } from 'ws'
import { z } from 'zod'

// Required authorization param to start a call
const AUTHORIZATION_KEY = '1234'

// Params schema for the call
export const callParamsSchema = z.object({
  authorization: z.string(),
  lang: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/),
})
export type CallParams = z.infer<typeof callParamsSchema>

// Optional, only if we want to check authorization and/or get other params
export async function checkParams(socket: WebSocket) {
  // Get params from first message
  const params = await waitForParams(socket, callParamsSchema.parse)
  if (params.authorization !== AUTHORIZATION_KEY) {
    throw new MicdropError(
      MicdropErrorCode.Unauthorized,
      'Invalid authorization'
    )
  }

  return {
    lang: params.lang,
  }
}
