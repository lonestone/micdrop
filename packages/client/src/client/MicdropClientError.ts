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
    this.code = code
  }
}

export function getClientErrorFromWSCloseEvent(
  event: CloseEvent
): MicdropClientError | undefined {
  const code = getClientErrorFromWSCloseEventCode(event.code)
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
