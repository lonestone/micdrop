export enum CallHandlerErrorCode {
  Mic = 'Mic',
  Unauthorized = 'Unauthorized',
  Error = 'Error',
}

export class CallHandlerError extends Error {
  code: CallHandlerErrorCode

  constructor(code = CallHandlerErrorCode.Error) {
    super()
    this.code = code
  }
}
