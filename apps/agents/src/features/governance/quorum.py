from __future__ import annotations

from typing import Any, Callable

from src.features.governance.types import QuorumConfig, QuorumResult, QuorumVote


class QuorumVoter:
    def __init__(self, create_agent_fn: Callable | None = None) -> None:
        self._create_agent_fn = create_agent_fn

    async def vote(self, proposal: str, config: QuorumConfig) -> QuorumResult:
        if not config.models:
            return QuorumResult(approved=False, votes=[], approval_ratio=0.0, confidence=0.0)

        votes: list[QuorumVote] = []
        for model_id in config.models:
            agent = self._create_agent_fn(model_id) if self._create_agent_fn else None
            if agent is None:
                continue
            prompt = (
                f"Should this action be approved? Respond with APPROVED or REJECTED "
                f"and explain why.\n\nProposal: {proposal}"
            )
            response = await agent.invoke(prompt)
            response_text = str(response)
            approved = "APPROVED" in response_text.upper()
            votes.append(
                QuorumVote(
                    model_id=model_id,
                    approved=approved,
                    confidence=0.8 if approved else 0.7,
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
