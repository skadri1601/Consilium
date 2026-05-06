from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.orchestrator import DebateOrchestrator
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


def _make_orchestrator() -> DebateOrchestrator:
    return DebateOrchestrator(FakeRedis())


class TestRunSubagentTask:
    def test_returns_finding_on_success(self):
        async def run():
            orch = _make_orchestrator()
            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                mock_agent = MagicMock()
                mock_agent.generate_response = AsyncMock(
                    return_value=("Key consideration: use connection pooling for DB access", 200)
                )
                mock_factory.create.return_value = mock_agent

                label, finding = await orch._run_subagent_task(
                    "gpt-5.4-mini",
                    "Research patterns for: database design",
                    {"openai": "fake-key"},
                    "abc123:patterns",
                )

                assert label == "abc123:patterns"
                assert finding is not None
                assert "connection pooling" in finding

        asyncio.run(run())

    def test_returns_none_on_timeout(self):
        async def run():
            orch = _make_orchestrator()
            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                async def slow_response(*args, **kwargs):
                    await asyncio.sleep(100)
                    return "late", 100

                mock_agent = MagicMock()
                mock_agent.generate_response = AsyncMock(side_effect=slow_response)
                mock_factory.create.return_value = mock_agent

                label, finding = await orch._run_subagent_task(
                    "gpt-5.4-mini", "test", {}, "timeout_test",
                )

                assert label == "timeout_test"
                assert finding is None

        asyncio.run(run())

    def test_returns_none_on_runtime_error(self):
        async def run():
            orch = _make_orchestrator()
            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                mock_agent = MagicMock()
                mock_agent.generate_response = AsyncMock(
                    side_effect=RuntimeError("provider down")
                )
                mock_factory.create.return_value = mock_agent

                label, finding = await orch._run_subagent_task(
                    "gpt-5.4-mini", "test", {}, "error_test",
                )

                assert finding is None

        asyncio.run(run())

    def test_returns_none_for_fallback_response(self):
        async def run():
            orch = _make_orchestrator()
            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                mock_agent = MagicMock()
                mock_agent.generate_response = AsyncMock(
                    return_value=("short", 10)
                )
                mock_factory.create.return_value = mock_agent

                label, finding = await orch._run_subagent_task(
                    "gpt-5.4-mini", "test", {}, "short_test",
                )

                assert finding is None

        asyncio.run(run())


class TestSubagentResearch:
    def test_collects_research_and_builds_context(self):
        async def run():
            orch = _make_orchestrator()

            call_count = 0

            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                async def fake_response(prompt, **kwargs):
                    nonlocal call_count
                    call_count += 1
                    return (f"Research finding #{call_count}: important insight about the topic at hand " * 3, 300)

                mock_agent = MagicMock()
                mock_agent.generate_response = AsyncMock(side_effect=fake_response)
                mock_factory.create.return_value = mock_agent

                events = []
                async for ev in orch._iter_subagent_research(
                    "Design a caching strategy",
                    ["gpt-5.4"],
                    {"openai": "fake-key"},
                ):
                    events.append(ev)

                assert any("subagent_research_start" in ev for ev in events)
                assert any("subagent_research_done" in ev for ev in events)

                assert orch._subagent_context != ""
                assert "SUB-AGENT RESEARCH" in orch._subagent_context

        asyncio.run(run())

    def test_spawns_3_tasks_per_model(self):
        async def run():
            orch = _make_orchestrator()

            prompts_received = []

            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                async def capture_prompt(prompt, **kwargs):
                    prompts_received.append(prompt)
                    return ("Finding: " + "x" * 50, 100)

                mock_agent = MagicMock()
                mock_agent.generate_response = AsyncMock(side_effect=capture_prompt)
                mock_factory.create.return_value = mock_agent

                events = []
                async for ev in orch._iter_subagent_research(
                    "test topic",
                    ["gpt-5.4"],
                    {"openai": "fake"},
                ):
                    events.append(ev)

                assert len(prompts_received) == 3
                topics = {"patterns", "trade-offs", "requirements"}
                found_topics = set()
                for p in prompts_received:
                    low = p.lower()
                    if "pattern" in low:
                        found_topics.add("patterns")
                    if "trade" in low:
                        found_topics.add("trade-offs")
                    if "requirement" in low or "constraint" in low:
                        found_topics.add("requirements")
                assert found_topics == topics

        asyncio.run(run())

    def test_multiple_models_multiply_tasks(self):
        async def run():
            orch = _make_orchestrator()
            task_count = 0

            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                async def count_call(prompt, **kwargs):
                    nonlocal task_count
                    task_count += 1
                    return ("Finding " + "x" * 50, 100)

                mock_agent = MagicMock()
                mock_agent.generate_response = AsyncMock(side_effect=count_call)
                mock_factory.create.return_value = mock_agent

                async for _ in orch._iter_subagent_research(
                    "topic",
                    ["gpt-5.4", "claude-sonnet-4-6"],
                    {"openai": "k1", "anthropic": "k2"},
                ):
                    pass

                assert task_count == 6

        asyncio.run(run())

    def test_empty_context_when_all_fail(self):
        async def run():
            orch = _make_orchestrator()

            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                mock_agent = MagicMock()
                mock_agent.generate_response = AsyncMock(
                    side_effect=RuntimeError("all down")
                )
                mock_factory.create.return_value = mock_agent

                events = []
                async for ev in orch._iter_subagent_research(
                    "topic", ["gpt-5.4"], {"openai": "k"},
                ):
                    events.append(ev)

                assert orch._subagent_context == ""

                done_events = [e for e in events if "subagent_research_done" in e]
                assert len(done_events) == 1

        asyncio.run(run())

    def test_skips_models_without_cheap_variant(self):
        async def run():
            orch = _make_orchestrator()

            with patch("src.core.orchestrator.AgentFactory") as mock_factory:
                mock_factory.create.return_value = MagicMock()

                with patch("src.core.orchestrator._get_cheap_variant", return_value=None):
                    async for _ in orch._iter_subagent_research(
                        "topic", ["unknown-model"], {},
                    ):
                        pass

                    assert orch._subagent_context == ""

        asyncio.run(run())


class TestSubagentContextInRound1:
    def test_context_prepended_to_topic(self):
        async def run():
            orch = _make_orchestrator()
            orch._subagent_context = (
                "=== DEEP MODE: SUB-AGENT RESEARCH ===\n"
                "Important finding.\n"
                "=== END SUB-AGENT RESEARCH ===\n\n"
            )

            original_topic = "Design a caching layer"
            effective = orch._subagent_context + original_topic

            assert effective.startswith("=== DEEP MODE")
            assert original_topic in effective
            assert "Important finding" in effective

        asyncio.run(run())

    def test_no_prefix_without_subagents(self):
        orch = _make_orchestrator()
        orch._subagent_context = ""

        topic = "Plain question"
        effective = orch._subagent_context + topic if orch._subagent_context else topic

        assert effective == "Plain question"
