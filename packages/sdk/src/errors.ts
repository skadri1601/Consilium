export class ConsiliumError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ConsiliumError';
    this.statusCode = statusCode;
  }
}

export class AuthenticationError extends ConsiliumError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class TimeoutError extends ConsiliumError {
  constructor(message = 'Request timed out') {
    super(message, 408);
    this.name = 'TimeoutError';
  }
}

export class ServerError extends ConsiliumError {
  constructor(message = 'Internal server error', statusCode = 500) {
    super(message, statusCode);
    this.name = 'ServerError';
  }
}

export class RateLimitError extends ConsiliumError {
  public readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}
