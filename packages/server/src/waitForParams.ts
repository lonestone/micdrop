import { WebSocket } from 'ws'
import { CallError, CallErrorCode } from './errors'

export async function waitForParams<CallParams>(
  socket: WebSocket,
  validate: (params: any) => CallParams
): Promise<CallParams> {
  return new Promise<CallParams>((resolve, reject) => {
    // Handle timeout
    const timeout = setTimeout(() => {
      reject(new CallError(CallErrorCode.BadRequest, 'Missing params'))
    }, 3000)

    const onParams = (payload: string) => {
      // Clear timeout and listener
      clearTimeout(timeout)
      socket.off('message', onParams)

      try {
        // Parse JSON payload
        const params = validate(JSON.parse(payload))
        resolve(params)
      } catch (error) {
        reject(new CallError(CallErrorCode.BadRequest, 'Invalid params'))
      }
    }

    // Listen for params
    socket.on('message', onParams)
  })
}
