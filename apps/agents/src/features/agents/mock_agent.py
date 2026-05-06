"""Deterministic mock agent for orchestrator and integration tests.

Scripted scenarios let tests exercise the debate orchestrator end-to-end
without touching real LLM providers. A scenario is selected by the
``model`` field on the request - any model id beginning with ``mock-``
routes here, and the suffix selects the scenario.

Scenarios cover the common shapes the orchestrator must handle:

* ``mock-aligned`` - a confident, well-formed response
* ``mock-disagree`` - a contrarian response that rejects the framing
* ``mock-uncertain`` - hedged, low-confidence response
* ``mock-short`` - below MINIMUM_RESPONSE_LENGTH (probe fallback path)
* ``mock-empty`` - returns empty text (probe FALLBACK_RESPONSE path)
* ``mock-rate-limit`` - raises a rate_limit LLMProviderError
* ``mock-auth`` - raises an auth LLMProviderError
* ``mock-timeout`` - raises a timeout LLMProviderError
* ``mock-server-error`` - raises a server_error LLMProviderError
* ``mock-context-overflow`` - raises a context-too-large error

The orchestrator can therefore be probed for its retry, fallback, and
error-classification behaviour deterministically.
"""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
from typing import Optional, Tuple

from .base_agent import BaseAgent, LLMProviderError


MOCK_PROVIDER = "mock"
MOCK_MODEL_PREFIX = "mock-"


_SCENARIOS: dict[str, dict] = {
    "aligned": {
        "text": (
            "I agree with the central claim. The evidence supports it on three "
            "axes: scope, clarity, and reproducibility. My recommendation is to "
            "proceed with the proposed approach."
        ),
        "tokens": 64,
    },
    "disagree": {
        "text": (
            "I disagree with the framing. The proposal conflates two distinct "
            "concerns and the evidence does not warrant the strong conclusion. "
            "I recommend reconsidering the scope before proceeding."
        ),
        "tokens": 72,
    },
    "uncertain": {
        "text": (
            "I am genuinely uncertain. The available evidence is mixed and the "
            "trade-offs are sensitive to assumptions that have not been stated. "
            "Confidence: low."
        ),
        "tokens": 60,
    },
    "short": {
        "text": "ok.",
        "tokens": 2,
    },
    "empty": {
        "text": "",
        "tokens": 0,
    },
    "rate-limit": {"error": ("rate_limit", "simulated 429 from mock provider")},
    "auth": {"error": ("auth", "simulated 401 from mock provider")},
    "timeout": {"error": ("timeout", "simulated request timeout")},
    "server-error": {"error": ("server_error", "simulated 503 from mock provider")},
    "context-overflow": {
        "error": ("server_error", "context length exceeded: token limit 8192")
    },
}


def _resolve_scenario(model: str) -> tuple[str, dict]:
    if not model.startswith(MOCK_MODEL_PREFIX):
        raise ValueError(f"mock agent requires '{MOCK_MODEL_PREFIX}*' model id, got {model!r}")
    key = model[len(MOCK_MODEL_PREFIX):]
    scenario = _SCENARIOS.get(key)
    if scenario is None:
        raise ValueError(f"unknown mock scenario: {key!r}. Known: {sorted(_SCENARIOS)}")
    return key, scenario


class MockAgent(BaseAgent):
    """Deterministic in-process agent used for tests."""

    def __init__(self, model_id: str = "mock-aligned", api_key: str | None = None):
        super().__init__(
            name="MockAgent",
            provider=MOCK_PROVIDER,
            model=model_id,
            api_key_env_var="MOCK_AGENT_KEY",
        )
        self.model_id = model_id
        self.api_key = api_key or "mock-key"
        self._key, self._scenario = _resolve_scenario(model_id)

    @classmethod
    def list_scenarios(cls) -> list[str]:
        return [f"{MOCK_MODEL_PREFIX}{k}" for k in _SCENARIOS]

    def _maybe_raise(self) -> None:
        err = self._scenario.get("error")
        if not err:
            return
        error_type, message = err
        raise LLMProviderError(
            provider=self.provider,
            error_type=error_type,
            original_error=message,
            operation="generate",
        )

    async def generate_response(
        self, query: str, system_prompt: Optional[str] = None
    ) -> Tuple[str, int]:
        await asyncio.sleep(0)
        self._maybe_raise()
        return self._scenario["text"], int(self._scenario.get("tokens", 0))

    async def stream_response(
        self, query: str, system_prompt: Optional[str] = None
    ) -> AsyncIterator[str]:
        self._maybe_raise()
        text = self._scenario["text"]
        if not text:
            return
        chunk_size = max(1, len(text) // 4)
        for i in range(0, len(text), chunk_size):
            yield text[i : i + chunk_size]
            await asyncio.sleep(0)

    async def health_check(self) -> bool:
        return "error" not in self._scenario
