export enum MicdropClientErrorCode {
  Mic = 'Mic',
  Unauthorized = 'Unauthorized',
  Error = 'Error',
}

export class MicdropClientError extends Error {
  code: MicdropClientErrorCode

  constructor(code = MicdropClientErrorCode.Error) {
    super()
    this.code = code
  }
}
