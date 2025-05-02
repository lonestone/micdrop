export enum CallClientErrorCode {
  Mic = 'Mic',
  Unauthorized = 'Unauthorized',
  Error = 'Error',
}

export class CallClientError extends Error {
  code: CallClientErrorCode

  constructor(code = CallClientErrorCode.Error) {
    super()
    this.code = code
  }
}
