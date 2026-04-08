import asyncio
from functools import partial
from typing import Optional, TYPE_CHECKING, Any
from ..config import settings

if TYPE_CHECKING:
    from upstash_redis import Redis
    RedisType = Redis
else:
    RedisType = Any

try:
    from upstash_redis import Redis
    HAS_UPSTASH = True
except ImportError:
    HAS_UPSTASH = False
    Redis = None  # type: ignore


class RedisClient:
    """Redis client wrapper for Upstash Redis."""

    def __init__(self):
        self._client: Optional[RedisType] = None

    def connect(self) -> Optional[RedisType]:
        """Establish connection to Upstash Redis."""
        if not HAS_UPSTASH:
            print("Warning: upstash-redis not installed")
            return None

        if not settings.upstash_redis_url or not settings.upstash_redis_token:
            print("Warning: Upstash Redis credentials not configured")
            return None

        if self._client is None:
            self._client = Redis(
                url=settings.upstash_redis_url,
                token=settings.upstash_redis_token
            )

        return self._client

    @property
    def client(self) -> Optional[RedisType]:
        """Get the Redis client, connecting if necessary."""
        if self._client is None:
            self.connect()
        return self._client

    def _sync_get(self, key: str) -> Optional[str]:
        """Synchronous get operation."""
        if self.client:
            result = self.client.get(key)
            return str(result) if result is not None else None
        return None

    def _sync_set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        """Synchronous set operation."""
        if self.client:
            self.client.set(key, value, ex=ex)
            return True
        return False

    def _sync_rpush(self, key: str, *values: str) -> int:
        if self.client:
            return self.client.rpush(key, *values)
        return 0

    def _sync_lrange(self, key: str, start: int, stop: int) -> list[str]:
        if self.client:
            result = self.client.lrange(key, start, stop)
            return [str(item) for item in result] if result else []
        return []

    def _sync_expire(self, key: str, seconds: int) -> bool:
        if self.client:
            return bool(self.client.expire(key, seconds))
        return False

    def _sync_delete(self, key: str) -> bool:
        if self.client:
            return bool(self.client.delete(key))
        return False

    async def get(self, key: str) -> Optional[str]:
        """Get a value from Redis asynchronously.

        Wraps the synchronous Upstash Redis call in a thread executor
        to avoid blocking the event loop.
        """
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, partial(self._sync_get, key))

    async def set(
        self,
        key: str,
        value: str,
        ex: Optional[int] = None
    ) -> bool:
        """Set a value in Redis with optional expiration asynchronously.

        Wraps the synchronous Upstash Redis call in a thread executor
        to avoid blocking the event loop.
        """
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, partial(self._sync_set, key, value, ex)
        )

    async def rpush(self, key: str, *values: str) -> int:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, partial(self._sync_rpush, key, *values))

    async def lrange(self, key: str, start: int, stop: int) -> list[str]:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, partial(self._sync_lrange, key, start, stop))

    async def expire(self, key: str, seconds: int) -> bool:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, partial(self._sync_expire, key, seconds))

    async def delete(self, key: str) -> bool:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, partial(self._sync_delete, key))


redis_client = RedisClient()


def get_redis() -> RedisClient:
    """Dependency injection for Redis client."""
    return redis_client
