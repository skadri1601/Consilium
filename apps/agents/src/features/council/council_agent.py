import logging
from typing import List, Optional

from .schema import AgentResponse
from src.core.judge import run_judge_pipeline

logger = logging.getLogger(__name__)


class CouncilAgent:

    async def run_judge_pipeline(
        self,
        query: str,
        responses: List[AgentResponse],
        api_keys: Optional[dict] = None,
    ) -> tuple[str, dict] | None:
        api_keys = api_keys or {}
        raw_responses = [
            {"model_id": r.agent_id, "text": r.response} for r in responses
        ]
        return await run_judge_pipeline(query, raw_responses, api_keys)

    async def synthesize_consensus(
        self,
        query: str,
        responses: List[AgentResponse],
        api_keys: Optional[dict] = None,
    ) -> str:
        if not responses:
            return "No agent responses received."

        if len(responses) == 1:
            return responses[0].response

        result = await self.run_judge_pipeline(query, responses, api_keys)
        if result is None:
            return "No agent responses received."
        consensus_text, _ = result
        return consensus_text

    async def evaluate_responses(
        self,
        query: str,
        responses: List[AgentResponse],
        api_keys: Optional[dict] = None,
    ) -> dict:
        if not responses:
            return {}

        result = await self.run_judge_pipeline(query, responses, api_keys)
        if result is None:
            return {}
        _, scores = result
        return scores
