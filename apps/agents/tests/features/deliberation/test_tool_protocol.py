"""Tests for the MCP tool protocol plumbing on the engine side.

These tests cover the pieces shipping in Stage 1b — payload acceptance,
the tool-results endpoint, the in-memory waiter queue. Provider adapter
integration is follow-up work and is tested separately."""

from __future__ import annotations

import asyncio
from unittest.mock import MagicMock

import pytest

from src.features.deliberation import router as deliberation_router


@pytest.fixture(autouse=True)
def reset_deliberations():
    deliberation_router._deliberations.clear()
    yield
    deliberation_router._deliberations.clear()


def _register(deliberation_id: str) -> None:
    engine = MagicMock()
    deliberation_router._store_deliberation(
        deliberation_id,
        deliberation_router.DeliberationStatus.RUNNING,
        engine,
        "topic",
    )


class TestStoreDeliberationQueue:
    def test_fresh_entry_has_empty_queues(self):
        _register("dlb_a")
        entry = deliberation_router._deliberations["dlb_a"]
        assert entry["tool_results"] == {}
        assert entry["tool_waiters"] == {}
        assert entry["tools"] == []
        assert entry["tool_call_count"] == 0


class TestRecordToolResult:
    def test_queues_result_when_no_waiter(self):
        _register("dlb_b")
        ok = deliberation_router.record_tool_result(
            "dlb_b", "call_1", {"content": [{"type": "text", "text": "hi"}]}
        )
        assert ok is True
        assert deliberation_router._deliberations["dlb_b"]["tool_results"]["call_1"] == {
            "content": [{"type": "text", "text": "hi"}]
        }

    def test_returns_false_for_unknown_deliberation(self):
        assert deliberation_router.record_tool_result("unknown", "call_1", {}) is False

    def test_fulfills_pending_waiter(self):
        async def run():
            _register("dlb_c")
            loop = asyncio.get_event_loop()
            fut = loop.create_future()
            deliberation_router._deliberations["dlb_c"]["tool_waiters"]["call_x"] = fut
            deliberation_router.record_tool_result(
                "dlb_c", "call_x", {"content": [{"type": "text", "text": "ok"}]}
            )
            result = await asyncio.wait_for(fut, timeout=1)
            assert result == {"content": [{"type": "text", "text": "ok"}]}

        asyncio.run(run())


class TestAwaitToolResult:
    def test_returns_immediately_if_already_queued(self):
        async def run():
            _register("dlb_d")
            deliberation_router._deliberations["dlb_d"]["tool_results"]["call_1"] = {
                "content": [{"type": "text", "text": "ready"}]
            }
            result = await deliberation_router.await_tool_result("dlb_d", "call_1")
            assert result["content"][0]["text"] == "ready"
            assert "call_1" not in deliberation_router._deliberations["dlb_d"]["tool_results"]

        asyncio.run(run())

    def test_waits_for_recorded_result(self):
        async def run():
            _register("dlb_e")

            async def record_later():
                await asyncio.sleep(0.05)
                deliberation_router.record_tool_result(
                    "dlb_e", "call_9", {"content": [{"type": "text", "text": "late"}]}
                )

            # Hold a reference to the task so the GC doesn't collect it
            # before record_later() finishes — see python:S6912.
            recorder = asyncio.create_task(record_later())
            try:
                result = await deliberation_router.await_tool_result("dlb_e", "call_9", timeout_ms=2000)
                assert result["content"][0]["text"] == "late"
            finally:
                await recorder

        asyncio.run(run())

    def test_times_out_when_no_result_arrives(self):
        async def run():
            _register("dlb_f")
            result = await deliberation_router.await_tool_result("dlb_f", "call_never", timeout_ms=50)
            assert result is None
            assert "call_never" not in deliberation_router._deliberations["dlb_f"]["tool_waiters"]

        asyncio.run(run())

    def test_returns_none_for_unknown_deliberation(self):
        async def run():
            result = await deliberation_router.await_tool_result("unknown", "call_1", timeout_ms=10)
            assert result is None

        asyncio.run(run())


class TestPydanticSchemas:
    def test_start_request_accepts_tools(self):
        req = deliberation_router.StartDeliberationRequest(
            topic="t",
            models=["gpt-5.4-mini"],
            api_keys={"openai": "x"},
            tools=[
                deliberation_router.ToolSchema(
                    qualifiedName="fs.read",
                    description="Read a file",
                    inputSchema={"type": "object"},
                )
            ],
            tool_budget=deliberation_router.ToolBudget(maxCallsPerTurn=3),
        )
        assert req.tools is not None
        assert req.tools[0].qualifiedName == "fs.read"
        assert req.tool_budget.maxCallsPerTurn == 3

    def test_start_request_tools_optional(self):
        req = deliberation_router.StartDeliberationRequest(
            topic="t",
            models=["gpt-5.4-mini"],
            api_keys={"openai": "x"},
        )
        assert req.tools is None
        assert req.tool_budget is None

    def test_tool_result_request_shape(self):
        req = deliberation_router.ToolResultRequest(
            callId="call_1",
            result=deliberation_router.ToolResult(
                content=[deliberation_router.ToolResultContent(type="text", text="hi")],
                isError=False,
            ),
        )
        dumped = req.model_dump()
        assert dumped["callId"] == "call_1"
        assert dumped["result"]["content"][0]["text"] == "hi"
