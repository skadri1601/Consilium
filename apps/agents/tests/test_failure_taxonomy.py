"""Tests for the failure taxonomy + recovery dispatcher."""

import asyncio

import pytest

from src.core.failure_taxonomy import (
    FailureClass,
    RecoveryAction,
    RecoveryDecision,
    RecoveryDispatcher,
    classify,
    classify_response,
    execute,
)
from src.features.agents.base_agent import LLMProviderError


class _FakeRateLimitError(Exception):
    pass


def _make_provider_error(error_type: str) -> LLMProviderError:
    return LLMProviderError(provider="mock", error_type=error_type, original_error="x")


def test_classify_uses_provider_error_type_when_known():
    assert classify(_make_provider_error("rate_limit")) is FailureClass.RATE_LIMIT
    assert classify(_make_provider_error("auth")) is FailureClass.AUTH
    assert classify(_make_provider_error("timeout")) is FailureClass.TIMEOUT
    assert classify(_make_provider_error("server_error")) is FailureClass.SERVER_ERROR


def test_classify_falls_back_to_unknown_for_unmapped_provider_type():
    assert classify(_make_provider_error("frobnicated")) is FailureClass.UNKNOWN


def test_classify_detects_context_overflow_from_message():
    err = LLMProviderError(provider="mock", error_type="server_error", original_error="context length exceeded")
    assert classify(err) is FailureClass.CONTEXT_OVERFLOW


def test_classify_detects_rate_limit_from_message_when_no_provider_error():
    assert classify(_FakeRateLimitError("got 429 from upstream")) is FailureClass.RATE_LIMIT


def test_classify_asyncio_timeout():
    assert classify(asyncio.TimeoutError()) is FailureClass.TIMEOUT


def test_classify_response_empty_and_short():
    assert classify_response("", minimum_length=20) is FailureClass.EMPTY_RESPONSE
    assert classify_response("ok", minimum_length=20) is FailureClass.SHORT_RESPONSE
    assert classify_response("a" * 25, minimum_length=20) is None


def test_dispatcher_walks_recipe_until_budget_exhausted():
    d = RecoveryDispatcher()
    d1 = d.decide(FailureClass.RATE_LIMIT, attempt=1)
    assert d1.action is RecoveryAction.RETRY
    d2 = d.decide(FailureClass.RATE_LIMIT, attempt=2)
    assert d2.action is RecoveryAction.RETRY
    d3 = d.decide(FailureClass.RATE_LIMIT, attempt=3)
    assert d3.action is RecoveryAction.SWAP_CHEAP_MODEL
    d4 = d.decide(FailureClass.RATE_LIMIT, attempt=4)
    assert d4.action is RecoveryAction.SWAP_FREE_FALLBACK
    d5 = d.decide(FailureClass.RATE_LIMIT, attempt=5)
    assert d5.action is RecoveryAction.DROP_PARTICIPANT
    d6 = d.decide(FailureClass.RATE_LIMIT, attempt=6)
    assert d6.action is RecoveryAction.ABORT


def test_dispatcher_per_action_budget_independent_across_failures():
    d = RecoveryDispatcher()
    d.decide(FailureClass.RATE_LIMIT, attempt=1)
    d.decide(FailureClass.RATE_LIMIT, attempt=2)
    d.decide(FailureClass.TIMEOUT, attempt=1)
    assert d.usage()["retry"] == 2


def test_context_overflow_recipe_starts_with_compaction():
    d = RecoveryDispatcher()
    decision = d.decide(FailureClass.CONTEXT_OVERFLOW, attempt=1)
    assert decision.action is RecoveryAction.COMPACT_AND_RETRY


def test_decision_carries_failure_class_and_reason():
    d = RecoveryDispatcher()
    decision = d.decide(FailureClass.AUTH, attempt=1)
    assert decision.failure_class is FailureClass.AUTH
    assert "auth" in decision.reason


@pytest.mark.asyncio
async def test_execute_runs_handler_after_delay():
    decision = RecoveryDecision(action=RecoveryAction.RETRY, delay_seconds=0.0, reason="t", failure_class=FailureClass.TIMEOUT)
    called: list[RecoveryDecision] = []

    async def handler(d: RecoveryDecision) -> str:
        # Must be a coroutine because RecoveryDispatcher.execute awaits the
        # handler. The await below is a no-op yield-to-event-loop so the
        # function is genuinely async (and not flagged as a sync function
        # masquerading as async).
        await asyncio.sleep(0)
        called.append(d)
        return "handled"

    result = await execute(decision, {RecoveryAction.RETRY: handler})
    assert result == "handled"
    assert called == [decision]


@pytest.mark.asyncio
async def test_execute_raises_when_no_handler():
    decision = RecoveryDecision(action=RecoveryAction.ABORT, delay_seconds=0.0, reason="", failure_class=FailureClass.UNKNOWN)
    with pytest.raises(KeyError):
        await execute(decision, {})
