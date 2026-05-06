from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.orchestrator import (
    CancelledError,
    DebateOrchestrator,
    ANTI_CAPITULATION_PROMPT,
    _validate_response,
)
from src.core.shared import FALLBACK_RESPONSE


class FakeRedis:
    def __init__(self):
        self._store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ex: int = 0) -> None:
        self._store[key] = value

    async def rpush(self, key: str, value: str) -> None:
        pass

    async def expire(self, key: str, ttl: int) -> None:
        pass


def _make_orchestrator(redis: FakeRedis | None = None) -> DebateOrchestrator:
    r = redis or FakeRedis()
    return DebateOrchestrator(r)


class TestCheckCancelled:
    def test_returns_false_when_no_cancel_key(self):
        async def run():
            orch = _make_orchestrator()
            result = await orch._check_cancelled("dbt_123")
            assert result is False

        asyncio.run(run())

    def test_returns_true_when_cancel_key_set(self):
        async def run():
            redis = FakeRedis()
            redis._store["debate:dbt_456:cancelled"] = "1"
            orch = _make_orchestrator(redis)
            result = await orch._check_cancelled("dbt_456")
            assert result is True

        asyncio.run(run())

    def test_caches_cancelled_state(self):
        async def run():
            redis = FakeRedis()
            redis._store["debate:dbt_789:cancelled"] = "1"
            orch = _make_orchestrator(redis)
            await orch._check_cancelled("dbt_789")
            assert orch._cancelled is True
            del redis._store["debate:dbt_789:cancelled"]
            result = await orch._check_cancelled("dbt_789")
            assert result is True

        asyncio.run(run())

    def test_tolerates_redis_failure(self):
        async def run():
            redis = FakeRedis()

            async def failing_get(key):
                raise OSError("connection lost")

            redis.get = failing_get
            orch = _make_orchestrator(redis)
            result = await orch._check_cancelled("dbt_err")
            assert result is False

        asyncio.run(run())


class TestRaiseIfCancelled:
    def test_raises_cancelled_error(self):
        async def run():
            redis = FakeRedis()
            redis._store["debate:dbt_raise:cancelled"] = "1"
            orch = _make_orchestrator(redis)
            with pytest.raises(CancelledError, match="dbt_raise"):
                await orch._raise_if_cancelled("dbt_raise")

        asyncio.run(run())

    def test_does_not_raise_when_not_cancelled(self):
        async def run():
            orch = _make_orchestrator()
            await orch._raise_if_cancelled("dbt_ok")

        asyncio.run(run())


class TestAntiCapitulationDetection:
    def _make_responses_with_drop(self, r1_claims: int, r3_claims: int):
        r1_lines = "\n".join([f"- Claim {i}: something important" for i in range(r1_claims)])
        r3_lines = "\n".join([f"- Claim {i}: revised point" for i in range(r3_claims)])
        r1_text = f"## Analysis\n{r1_lines}\n## Summary\nAll good."
        r3_text = f"## Revised Analysis\n{r3_lines}\n## Summary\nUpdated."
        return r1_text, r3_text

    def test_detects_heavy_capitulation(self):
        r1, r3 = self._make_responses_with_drop(10, 3)
        r1_lines = [l for l in r1.splitlines() if l.strip().startswith("-")]
        r3_lines = [l for l in r3.splitlines() if l.strip().startswith("-")]
        drop_ratio = 1.0 - (len(r3_lines) / len(r1_lines))
        assert drop_ratio > 0.5, f"Expected drop > 50%, got {drop_ratio:.0%}"

    def test_no_capitulation_when_claims_preserved(self):
        r1, r3 = self._make_responses_with_drop(6, 6)
        r1_lines = [l for l in r1.splitlines() if l.strip().startswith("-")]
        r3_lines = [l for l in r3.splitlines() if l.strip().startswith("-")]
        drop_ratio = 1.0 - (len(r3_lines) / len(r1_lines))
        assert drop_ratio <= 0.5

    def test_skips_when_too_few_r1_claims(self):
        r1_lines = [l for l in "- One claim\n- Two claims\n".splitlines() if l.strip().startswith("-")]
        assert len(r1_lines) < 3

    def test_anti_capitulation_reprompts_model(self):
        async def run():
            redis = FakeRedis()
            orch = _make_orchestrator(redis)

            mock_agent = MagicMock()
            mock_agent.generate_response = AsyncMock(
                return_value=("Revised response with all original claims reinstated. " * 5, 500)
            )

            r1, r3 = self._make_responses_with_drop(10, 2)
            all_responses = {
                1: {"model_a": r1},
                3: {"model_a": r3},
            }
            agents = {"model_a": mock_agent}

            events = []
            async for ev in orch._anti_capitulation_check("dbt_ac", agents, all_responses):
                events.append(ev)

            assert any("anti_capitulation" in ev for ev in events)
            assert any("anti_capitulation_revised" in ev for ev in events)
            mock_agent.generate_response.assert_awaited_once()
            assert all_responses[3]["model_a"] != r3

        asyncio.run(run())

    def test_anti_capitulation_skips_fallback_responses(self):
        async def run():
            orch = _make_orchestrator()
            all_responses = {
                1: {"model_a": FALLBACK_RESPONSE},
                3: {"model_a": "some response"},
            }
            events = []
            async for ev in orch._anti_capitulation_check("dbt_skip", {}, all_responses):
                events.append(ev)
            assert len(events) == 0

        asyncio.run(run())

    def test_anti_capitulation_tolerates_agent_failure(self):
        async def run():
            redis = FakeRedis()
            orch = _make_orchestrator(redis)

            mock_agent = MagicMock()
            mock_agent.generate_response = AsyncMock(side_effect=RuntimeError("LLM down"))

            r1, r3 = self._make_responses_with_drop(10, 2)
            all_responses = {1: {"m": r1}, 3: {"m": r3}}
            original_r3 = r3

            events = []
            async for ev in orch._anti_capitulation_check("dbt_fail", {"m": mock_agent}, all_responses):
                events.append(ev)

            assert any("anti_capitulation" in ev for ev in events)
            assert not any("anti_capitulation_revised" in ev for ev in events)
            assert all_responses[3]["m"] == original_r3

        asyncio.run(run())


class TestCancelInPollingLoop:
    def test_cancel_kills_running_tasks(self):
        async def run():
            redis = FakeRedis()
            orch = _make_orchestrator(redis)

            async def slow_agent_call(*args, **kwargs):
                await asyncio.sleep(10)
                return "done", 0.01

            redis._store["debate:dbt_poll:cancelled"] = "1"

            mock_agent = MagicMock()
            mock_agent.generate_response = AsyncMock(side_effect=slow_agent_call)

            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                mock_factory.create.return_value = mock_agent

                orch.anonymizer = MagicMock()
                orch.anonymizer.create_map = AsyncMock(
                    return_value=MagicMock(get_label=lambda *a: "Agent A")
                )

                with patch("src.core.orchestrator._has_any_user_key", return_value=True):
                    events = []
                    async for ev in orch.run_debate(
                        "dbt_poll", "test topic", ["gpt-5.4"],
                        {"openai": "fake"}, round_count=1,
                    ):
                        events.append(ev)

                    assert any(
                        "cancelled" in ev.lower()
                        for ev in events
                        if isinstance(ev, str)
                    )

        asyncio.run(run())
