export enum MicdropClientErrorCode {
  MissingUrl = 'MissingUrl',
  Mic = 'Mic',
  Connection = 'Connection',
  InternalServer = 'InternalServer',
  BadRequest = 'BadRequest',
  Unauthorized = 'Unauthorized',
  NotFound = 'NotFound',
  Unknown = 'Unknown',
}

export class MicdropClientError extends Error {
  code: MicdropClientErrorCode

  constructor(code = MicdropClientErrorCode.Unknown, message?: string) {
    super(message)
    this.name = `MicdropClientError:${code}`
    this.code = code
  }
}

/** What React Native gives on a WebSocket close */
export interface WSCloseEvent {
  code?: number
  reason?: string
}

export function getClientErrorFromWSCloseEvent(
  event: WSCloseEvent
): MicdropClientError | undefined {
  const code = getClientErrorFromWSCloseEventCode(event.code ?? 1006)
  return code && new MicdropClientError(code, event.reason)
}

export function getClientErrorFromWSCloseEventCode(
  code: number
): MicdropClientErrorCode | undefined {
  if (code === 1011) {
    return MicdropClientErrorCode.InternalServer
  } else if (code >= 1001 && code < 1011 && code !== 1005) {
    return MicdropClientErrorCode.Connection
  } else if (code === 4401) {
    return MicdropClientErrorCode.Unauthorized
  } else if (code === 4404) {
    return MicdropClientErrorCode.NotFound
  } else if (code === 4400) {
    return MicdropClientErrorCode.BadRequest
  } else if (code >= 4000) {
    return MicdropClientErrorCode.Unknown
  } else {
    return undefined
  }
}

export function isRecoverableError(error: MicdropClientError): boolean {
  return (
    error.code === MicdropClientErrorCode.Connection ||
    error.code === MicdropClientErrorCode.InternalServer ||
    error.code === MicdropClientErrorCode.Unknown
  )
}
