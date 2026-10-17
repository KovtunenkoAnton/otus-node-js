export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: readonly string[],
  ) {
    super(message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}
