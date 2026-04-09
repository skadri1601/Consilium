from __future__ import annotations


class ConsiliumError(Exception):
    def __init__(self, message: str = "An error occurred", status_code: int | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class AuthenticationError(ConsiliumError):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)


class TimeoutError(ConsiliumError):
    def __init__(self, message: str = "Request timed out"):
        super().__init__(message, status_code=408)


class ServerError(ConsiliumError):
    def __init__(self, message: str = "Internal server error", status_code: int = 500):
        super().__init__(message, status_code=status_code)


class RateLimitError(ConsiliumError):
    def __init__(self, message: str = "Rate limit exceeded", retry_after: float | None = None):
        super().__init__(message, status_code=429)
        self.retry_after = retry_after
