export class ApiError extends Error {
  error: any

  constructor(error: any, statusCode: number) {
    super(
      error !== null && 'detail' in error ?
        error.detail :
        `HTTP error ${statusCode}`
    )
    this.error = error
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
