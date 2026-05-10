from __future__ import annotations

import asyncio
import logging
import re
from collections.abc import Callable
from typing import Any

from src.features.governance.types import QuorumConfig, QuorumResult, QuorumVote

logger = logging.getLogger(__name__)

QUORUM_INVOKE_TIMEOUT = 30.0

_APPROVAL_RE = re.compile(r"^\s*(?:APPROVED|YES|ACCEPTED)\b", re.IGNORECASE)
_REJECTION_PREFIXES = ("NOT", "NO", "REJECTED", "DENY", "DENIED")


def _parse_approval(response_text: str) -> bool:
    stripped = response_text.strip()
    if not stripped:
        return False
    first_token = stripped.split()[0].upper()
    if first_token in _REJECTION_PREFIXES:
        return False
    return _APPROVAL_RE.match(stripped) is not None


def _extract_confidence(response: Any) -> float | None:
    if isinstance(response, dict):
        for key in ("confidence", "score"):
            value = response.get(key)
            if isinstance(value, int | float):
                return max(0.0, min(1.0, float(value)))
        meta = response.get("metadata")
        if isinstance(meta, dict):
            value = meta.get("confidence")
            if isinstance(value, int | float):
                return max(0.0, min(1.0, float(value)))
        choices = response.get("choices")
        if isinstance(choices, list) and choices:
            first = choices[0]
            if isinstance(first, dict):
                for key in ("confidence", "score"):
                    value = first.get(key)
                    if isinstance(value, int | float):
                        return max(0.0, min(1.0, float(value)))
        return None
    for attr in ("confidence", "score"):
        value = getattr(response, attr, None)
        if isinstance(value, int | float):
            return max(0.0, min(1.0, float(value)))
    return None


class QuorumVoter:
    def __init__(self, create_agent_fn: Callable | None = None) -> None:
        self._create_agent_fn = create_agent_fn

    async def vote(self, proposal: str, config: QuorumConfig) -> QuorumResult:
        if not config.models:
            return QuorumResult(approved=False, votes=[], approval_ratio=0.0, confidence=0.0)

        votes: list[QuorumVote] = []
        for model_id in config.models:
            try:
                agent = (
                    self._create_agent_fn(model_id) if self._create_agent_fn else None
                )
            except Exception as exc:
                logger.warning(
                    "quorum: failed to create agent for model_id=%s: %s", model_id, exc
                )
                continue
            if agent is None:
                continue
            prompt = (
                f"Should this action be approved? Respond with APPROVED or REJECTED "
                f"and explain why.\n\nProposal: {proposal}"
            )
            try:
                response = await asyncio.wait_for(
                    agent.invoke(prompt), timeout=QUORUM_INVOKE_TIMEOUT
                )
            except TimeoutError:
                logger.warning(
                    "quorum: model_id=%s timed out after %.1fs",
                    model_id,
                    QUORUM_INVOKE_TIMEOUT,
                )
                continue
            except Exception as exc:
                logger.warning(
                    "quorum: model_id=%s invoke failed: %s", model_id, exc
                )
                continue
            response_text = str(response)
            approved = _parse_approval(response_text)
            confidence = _extract_confidence(response)
            if confidence is None:
                confidence = 0.8 if approved else 0.7
            votes.append(
                QuorumVote(
                    model_id=model_id,
                    approved=approved,
                    confidence=confidence,
                    reasoning=response_text,
                )
            )

        if not votes:
            return QuorumResult(approved=False, votes=[], approval_ratio=0.0, confidence=0.0)

        approval_count = sum(1 for v in votes if v.approved)
        approval_ratio = approval_count / len(votes)
        avg_confidence = sum(v.confidence for v in votes) / len(votes)

        return QuorumResult(
            approved=approval_ratio >= config.required_majority,
            votes=votes,
            approval_ratio=approval_ratio,
            confidence=avg_confidence,
        )
