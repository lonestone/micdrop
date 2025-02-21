import WebSocket from 'ws'

export enum CallErrorCode {
  BadRequest = 4400,
  Unauthorized = 4401,
  NotFound = 4404,
}

export class CallError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.code = code
  }
}

export function handleError(socket: WebSocket, error: unknown) {
  if (error instanceof CallError) {
    socket.close(error.code, error.message)
  } else {
    console.error(error)
    socket.close(1011)
  }
  socket.terminate()
}
