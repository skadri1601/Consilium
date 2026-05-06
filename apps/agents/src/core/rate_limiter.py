import asyncio
import logging
import time

logger = logging.getLogger(__name__)

DEFAULT_LIMITS: dict[str, int] = {
    "openai": 5,
    "anthropic": 4,
    "google": 6,
    "groq": 8,
    "xai": 3,
    "openrouter": 5,
}

WINDOW_SECONDS = 60.0


class ProviderRateLimiter:
    def __init__(self, limits: dict[str, int] | None = None):
        self._limits = limits or DEFAULT_LIMITS
        self._semaphores: dict[str, asyncio.Semaphore] = {}
        self._call_times: dict[str, list[float]] = {}
        self._lock = asyncio.Lock()

    def _get_semaphore(self, provider: str) -> asyncio.Semaphore:
        if provider not in self._semaphores:
            max_concurrent = self._limits.get(provider, 3)
            self._semaphores[provider] = asyncio.Semaphore(max_concurrent)
        return self._semaphores[provider]

    def _get_rpm_limit(self, provider: str) -> int:
        base = self._limits.get(provider, 3)
        return base * 10

    async def _wait_for_window(self, provider: str) -> None:
        rpm_limit = self._get_rpm_limit(provider)
        async with self._lock:
            if provider not in self._call_times:
                self._call_times[provider] = []

            now = time.monotonic()
            window_start = now - WINDOW_SECONDS
            self._call_times[provider] = [
                t for t in self._call_times[provider] if t > window_start
            ]

            if len(self._call_times[provider]) >= rpm_limit:
                oldest = self._call_times[provider][0]
                wait_time = WINDOW_SECONDS - (now - oldest)
                if wait_time > 0:
                    logger.info(
                        "Rate limit: waiting %.1fs for provider %s (%d/%d calls in window)",
                        wait_time, provider, len(self._call_times[provider]), rpm_limit,
                    )
                    async with self._lock:
                        pass
                    await asyncio.sleep(wait_time)

            self._call_times.setdefault(provider, []).append(time.monotonic())

    async def acquire(self, provider: str) -> None:
        sem = self._get_semaphore(provider)
        await sem.acquire()
        await self._wait_for_window(provider)

    def release(self, provider: str) -> None:
        sem = self._get_semaphore(provider)
        sem.release()

    async def get_status(self) -> dict[str, dict]:
        async with self._lock:
            now = time.monotonic()
            window_start = now - WINDOW_SECONDS
            status = {}
            for provider in self._limits:
                calls = [
                    t for t in self._call_times.get(provider, []) if t > window_start
                ]
                sem = self._semaphores.get(provider)
                status[provider] = {
                    "max_concurrent": self._limits.get(provider, 3),
                    "available_slots": sem._value if sem else self._limits.get(provider, 3),
                    "calls_in_window": len(calls),
                    "rpm_limit": self._get_rpm_limit(provider),
                }
            return status


rate_limiter = ProviderRateLimiter()
