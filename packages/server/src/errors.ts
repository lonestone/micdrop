import WebSocket from 'ws'

export enum MicdropErrorCode {
  BadRequest = 4400,
  Unauthorized = 4401,
  NotFound = 4404,
}

export class MicdropError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

export function handleError(socket: WebSocket, error: unknown) {
  if (error instanceof MicdropError) {
    socket.close(error.code, error.message)
  } else {
    console.error(error)
    socket.close(1011, error instanceof Error ? error.message : undefined)
  }
  socket.terminate()
}
