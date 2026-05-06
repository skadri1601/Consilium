from __future__ import annotations

import asyncio
import time

import pytest

from src.core.rate_limiter import ProviderRateLimiter


def _make_limiter(**overrides) -> ProviderRateLimiter:
    limits = {"openai": 3, "anthropic": 2, "test_provider": 1, **overrides}
    return ProviderRateLimiter(limits=limits)


class TestSemaphoreBasics:
    def test_acquire_and_release(self):
        async def run():
            rl = _make_limiter()
            await rl.acquire("openai")
            rl.release("openai")

        asyncio.run(run())

    def test_respects_concurrency_limit(self):
        async def run():
            rl = _make_limiter(test_provider=2)
            await rl.acquire("test_provider")
            await rl.acquire("test_provider")

            acquired = False

            async def try_acquire():
                nonlocal acquired
                await rl.acquire("test_provider")
                acquired = True
                rl.release("test_provider")

            task = asyncio.create_task(try_acquire())
            await asyncio.sleep(0.05)
            assert acquired is False

            rl.release("test_provider")
            await asyncio.wait_for(task, timeout=1.0)
            assert acquired is True

            rl.release("test_provider")

        asyncio.run(run())

    def test_different_providers_independent(self):
        async def run():
            rl = _make_limiter(openai=1, anthropic=1)
            await rl.acquire("openai")
            await rl.acquire("anthropic")
            rl.release("openai")
            rl.release("anthropic")

        asyncio.run(run())


class TestDefaultLimits:
    def test_unknown_provider_gets_default(self):
        async def run():
            rl = ProviderRateLimiter()
            sem = rl._get_semaphore("unknown_provider")
            assert sem._value == 3

        asyncio.run(run())

    def test_known_providers_have_configured_limits(self):
        rl = ProviderRateLimiter()
        assert rl._limits["openai"] == 5
        assert rl._limits["anthropic"] == 4
        assert rl._limits["google"] == 6
        assert rl._limits["groq"] == 8
        assert rl._limits["xai"] == 3


class TestRPMTracking:
    def test_tracks_calls_in_window(self):
        async def run():
            rl = _make_limiter()
            await rl.acquire("openai")
            rl.release("openai")
            await rl.acquire("openai")
            rl.release("openai")

            status = await rl.get_status()
            assert status["openai"]["calls_in_window"] == 2

        asyncio.run(run())

    def test_rpm_limit_derived_from_concurrency(self):
        rl = _make_limiter(openai=5)
        assert rl._get_rpm_limit("openai") == 50


class TestGetStatus:
    def test_reports_all_configured_providers(self):
        async def run():
            rl = _make_limiter()
            status = await rl.get_status()
            assert "openai" in status
            assert "anthropic" in status
            assert "test_provider" in status

        asyncio.run(run())

    def test_reports_available_slots(self):
        async def run():
            rl = _make_limiter(openai=3)
            await rl.acquire("openai")
            status = await rl.get_status()
            assert status["openai"]["available_slots"] == 2
            assert status["openai"]["max_concurrent"] == 3
            rl.release("openai")

        asyncio.run(run())

    def test_status_shape(self):
        async def run():
            rl = _make_limiter()
            status = await rl.get_status()
            for provider, info in status.items():
                assert "max_concurrent" in info
                assert "available_slots" in info
                assert "calls_in_window" in info
                assert "rpm_limit" in info

        asyncio.run(run())


class TestConcurrentAccess:
    def test_many_concurrent_acquires(self):
        async def run():
            rl = _make_limiter(openai=5)
            results = []

            async def worker(worker_id: int):
                await rl.acquire("openai")
                results.append(f"acquired_{worker_id}")
                await asyncio.sleep(0.01)
                rl.release("openai")
                results.append(f"released_{worker_id}")

            tasks = [asyncio.create_task(worker(i)) for i in range(10)]
            await asyncio.gather(*tasks)

            assert len([r for r in results if r.startswith("acquired")]) == 10
            assert len([r for r in results if r.startswith("released")]) == 10

        asyncio.run(run())
