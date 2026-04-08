import time
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 3, recovery_timeout: int = 60):
        self._failure_threshold = failure_threshold
        self._recovery_timeout = recovery_timeout
        self._failures: dict[str, int] = {}
        self._last_failure_time: dict[str, float] = {}
        self._state: dict[str, CircuitState] = {}

    def get_state(self, provider: str) -> CircuitState:
        state = self._state.get(provider, CircuitState.CLOSED)
        if state == CircuitState.OPEN:
            elapsed = time.time() - self._last_failure_time.get(provider, 0)
            if elapsed >= self._recovery_timeout:
                self._state[provider] = CircuitState.HALF_OPEN
                return CircuitState.HALF_OPEN
        return state

    def is_available(self, provider: str) -> bool:
        state = self.get_state(provider)
        return state != CircuitState.OPEN

    def record_success(self, provider: str):
        self._failures[provider] = 0
        self._state[provider] = CircuitState.CLOSED

    def record_failure(self, provider: str):
        self._failures[provider] = self._failures.get(provider, 0) + 1
        self._last_failure_time[provider] = time.time()
        if self._failures[provider] >= self._failure_threshold:
            self._state[provider] = CircuitState.OPEN
            logger.warning("Circuit OPEN for provider %s after %d failures", provider, self._failures[provider])

    def get_status(self) -> dict[str, str]:
        return {p: self.get_state(p).value for p in self._state}


circuit_breaker = CircuitBreaker()
