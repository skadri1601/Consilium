export class ConsiliumApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string,
  ) {
    super(message);
    this.name = "ConsiliumApiError";
  }
}

export class AuthenticationError extends ConsiliumApiError {
  constructor(message = "Not authenticated") {
    super(message, 401);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends ConsiliumApiError {
  constructor(public readonly retryAfter?: number) {
    super("Rate limit exceeded", 429);
    this.name = "RateLimitError";
  }
}

export class StreamAbortedError extends Error {
  constructor() {
    super("Stream aborted");
    this.name = "StreamAbortedError";
  }
}
