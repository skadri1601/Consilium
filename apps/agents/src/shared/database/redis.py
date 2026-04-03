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

    def _sync_delete(self, key: str) -> bool:
        """Synchronous delete operation."""
        if self.client:
            self.client.delete(key)
            return True
        return False

    async def get(self, key: str) -> Optional[str]:
        """Get a value from Redis asynchronously.

        Wraps the synchronous Upstash Redis call in a thread executor
        to avoid blocking the event loop.
        """
        loop = asyncio.get_event_loop()
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
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, partial(self._sync_set, key, value, ex)
        )

    async def delete(self, key: str) -> bool:
        """Delete a key from Redis asynchronously.

        Wraps the synchronous Upstash Redis call in a thread executor
        to avoid blocking the event loop.
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, partial(self._sync_delete, key))


redis_client = RedisClient()


def get_redis() -> RedisClient:
    """Dependency injection for Redis client."""
    return redis_client
