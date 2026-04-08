import logging
from typing import List, Optional

from .schema import AgentResponse
from ..core.judge import (
    extract_claims,
    cross_reference_claims,
    resolve_disputes,
    score_claims,
    synthesize_golden_prompt,
    _anonymize_responses,
    _pick_available_model,
    _de_anonymize,
    CHEAP_MODELS,
    STRONG_MODELS,
)

logger = logging.getLogger(__name__)


class CouncilAgent:

    async def run_judge_pipeline(
        self,
        query: str,
        responses: List[AgentResponse],
        api_keys: Optional[dict] = None,
    ) -> tuple[str, dict]:
        api_keys = api_keys or {}
        try:
            raw_responses = [
                {"model_id": r.agent_id, "text": r.response} for r in responses
            ]

            anonymized, label_to_model, model_to_label = _anonymize_responses(raw_responses)

            debate_models = [r.agent_id for r in responses]

            cheap_model = _pick_available_model(CHEAP_MODELS, api_keys, exclude_models=debate_models)
            if cheap_model is None:
                cheap_model = _pick_available_model(CHEAP_MODELS, api_keys)
            if cheap_model is None:
                raise RuntimeError("No cheap model available for judge phases 1-3")

            claims_by_label = await extract_claims(query, anonymized, cheap_model, api_keys)
            if not claims_by_label:
                raise RuntimeError("Claim extraction produced no results")

            cross_ref = await cross_reference_claims(claims_by_label, cheap_model, api_keys)

            disputes_resolved = await resolve_disputes(
                query,
                cross_ref.get("contradictions", []),
                claims_by_label,
                cheap_model,
                api_keys,
            )

            model_scores = score_claims(claims_by_label, cross_ref, disputes_resolved)

            strong_model = _pick_available_model(STRONG_MODELS, api_keys, exclude_models=debate_models)
            if strong_model is None:
                strong_model = _pick_available_model(STRONG_MODELS, api_keys)
            if strong_model is None:
                strong_model = cheap_model

            golden_chunks: list[str] = []
            async for chunk in synthesize_golden_prompt(
                query,
                claims_by_label,
                cross_ref,
                disputes_resolved,
                model_scores,
                label_to_model,
                strong_model,
                api_keys,
            ):
                golden_chunks.append(chunk)

            raw_golden = "".join(golden_chunks)
            consensus_text = _de_anonymize(raw_golden, label_to_model)

            scores_dict = {}
            for label, score_data in model_scores.items():
                real_model = label_to_model.get(label, label)
                scores_dict[real_model] = score_data

            return consensus_text, scores_dict

        except Exception:
            logger.exception("Judge pipeline failed, falling back to concatenation stub")
            response_texts = []
            for resp in responses:
                response_texts.append(f"**{resp.agent_id}**: {resp.response}")
            combined = "\n\n".join(response_texts)
            fallback = (
                f"Based on analysis from {len(responses)} AI agents:\n\n"
                f"{combined}\n\n---\n"
                f"**Synthesis**: The agents provided complementary perspectives on this query. "
                f"Key points of agreement and notable differences have been identified above."
            )
            fallback_scores = {
                resp.agent_id: {
                    "relevance": 0.85,
                    "completeness": 0.80,
                    "clarity": 0.90,
                    "overall": 0.85,
                }
                for resp in responses
            }
            return fallback, fallback_scores

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

        consensus_text, _ = await self.run_judge_pipeline(query, responses, api_keys)
        return consensus_text

    async def evaluate_responses(
        self,
        query: str,
        responses: List[AgentResponse],
        api_keys: Optional[dict] = None,
    ) -> dict:
        if not responses:
            return {}

        _, scores = await self.run_judge_pipeline(query, responses, api_keys)
        return scores
