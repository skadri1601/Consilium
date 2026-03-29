import asyncio
import json
import logging
from typing import AsyncGenerator
from .agent_factory import AgentFactory, _has_any_user_key
from .anonymizer import Anonymizer, AnonymityMap
from .cost_tracker import CostTracker
from .prompts import (
    ROUND_1_SYSTEM,
    ROUND_2_SYSTEM,
    ROUND_3_SYSTEM,
    JUDGE_SYSTEM,
    SIMPLIFIED_JUDGE_SYSTEM,
    CONVERGENCE_CHECK_SYSTEM,
    build_round_2_user_prompt,
    build_round_3_user_prompt,
    build_judge_user_prompt,
    build_simplified_judge_prompt,
    build_convergence_prompt,
)
from ..features.agents.base_agent import BaseAgent
from ..shared.database.redis import RedisClient
from ..shared.config.models import get_free_fallback_models

logger = logging.getLogger(__name__)


MINIMUM_RESPONSE_LENGTH = 20
FALLBACK_RESPONSE = "[No response from this agent]"
REDIS_TTL = 1800
_CONTEXT_TOO_LARGE_CODES = {413, 400}
_CONTEXT_TOO_LARGE_PHRASES = ("too large", "context length", "maximum context", "token limit")


def _is_context_too_large(exc: Exception) -> bool:
    status = getattr(exc, "status_code", None) or getattr(exc, "status", None)
    if status in _CONTEXT_TOO_LARGE_CODES:
        return True
    msg = str(exc).lower()
    return any(phrase in msg for phrase in _CONTEXT_TOO_LARGE_PHRASES)


def _sse(event: str, data: dict) -> str:
    payload = {**data, "event": event}
    return f"data: {json.dumps(payload)}\n\n"


def _validate_response(text: str) -> str:
    if not text or len(text.strip()) < MINIMUM_RESPONSE_LENGTH:
        return FALLBACK_RESPONSE
    return text.strip()


async def _call_agent(
    agent: BaseAgent,
    system_prompt: str,
    user_prompt: str,
    model_id: str,
    cost_tracker: CostTracker,
) -> tuple[str, float]:
    original_get_system_prompt = agent.get_system_prompt
    agent.get_system_prompt = lambda: system_prompt

    try:
        raw_response, tokens_used = await agent.generate_response(user_prompt)
        validated = _validate_response(raw_response)

        input_tokens = max(tokens_used // 3, len(user_prompt.split()) * 2)
        output_tokens = max(tokens_used - input_tokens, len(validated.split()) * 2)
        cost = cost_tracker.record(model_id, input_tokens, output_tokens)

        return validated, cost
    except Exception as exc:
        return FALLBACK_RESPONSE, 0.0
    finally:
        agent.get_system_prompt = original_get_system_prompt


class DebateOrchestrator:

    def __init__(self, redis: RedisClient):
        self.redis = redis
        self.anonymizer = Anonymizer(redis)
        self.cost_tracker = CostTracker()

    async def run_debate(
        self,
        debate_id: str,
        topic: str,
        model_ids: list[str],
        api_keys: dict[str, str | None],
        round_count: int = 3,
        system_prompt: str | None = None,
    ) -> AsyncGenerator[str, None]:
        if not _has_any_user_key(api_keys):
            model_ids = get_free_fallback_models(count=max(len(model_ids), 2))

        agents: dict[str, BaseAgent] = {}
        for model_id in model_ids:
            agents[model_id] = AgentFactory.create(model_id, api_keys)

        anon_map = await self.anonymizer.create_map(debate_id, model_ids)

        yield _sse("debate_start", {
            "debate_id": debate_id,
            "topic": topic,
            "models": model_ids,
            "round_count": round_count,
        })

        round_1_responses: dict[str, str] = {}
        round_2_responses: dict[str, str] = {}
        round_3_responses: dict[str, str] = {}

        effective_system = system_prompt or ROUND_1_SYSTEM

        yield _sse("round_start", {"round": 1, "description": "Independent Analysis"})
        async for event in self._run_round(
            debate_id=debate_id,
            round_number=1,
            agents=agents,
            system_prompt=effective_system if system_prompt else ROUND_1_SYSTEM,
            user_prompt=topic,
            anon_map=anon_map,
            responses_out=round_1_responses,
        ):
            yield event
        yield _sse("round_complete", {
            "round": 1,
            "responses": self._format_round_results(round_1_responses, anon_map, 1),
        })

        if round_count < 2:
            async for event in self._finalize(
                debate_id, topic, model_ids, agents, api_keys, anon_map,
                round_1_responses, round_2_responses, round_3_responses,
            ):
                yield event
            return

        yield _sse("round_start", {"round": 2, "description": "Critique & Refinement"})
        anon_round_1 = self.anonymizer.anonymize_responses(anon_map, round_1_responses, 1)
        round_2_user_prompt = build_round_2_user_prompt(topic, anon_round_1)
        async for event in self._run_round(
            debate_id=debate_id,
            round_number=2,
            agents=agents,
            system_prompt=ROUND_2_SYSTEM,
            user_prompt=round_2_user_prompt,
            anon_map=anon_map,
            responses_out=round_2_responses,
        ):
            yield event
        yield _sse("round_complete", {
            "round": 2,
            "responses": self._format_round_results(round_2_responses, anon_map, 2),
        })

        if round_count < 3:
            async for event in self._finalize(
                debate_id, topic, model_ids, agents, api_keys, anon_map,
                round_1_responses, round_2_responses, round_3_responses,
            ):
                yield event
            return

        yield _sse("round_start", {"round": 3, "description": "Final Convergence"})
        anon_round_2 = self.anonymizer.anonymize_responses(anon_map, round_2_responses, 2)
        round_3_user_prompt = build_round_3_user_prompt(topic, anon_round_1, anon_round_2)
        async for event in self._run_round(
            debate_id=debate_id,
            round_number=3,
            agents=agents,
            system_prompt=ROUND_3_SYSTEM,
            user_prompt=round_3_user_prompt,
            anon_map=anon_map,
            responses_out=round_3_responses,
        ):
            yield event
        yield _sse("round_complete", {
            "round": 3,
            "responses": self._format_round_results(round_3_responses, anon_map, 3),
        })

        async for event in self._finalize(
            debate_id, topic, model_ids, agents, api_keys, anon_map,
            round_1_responses, round_2_responses, round_3_responses,
        ):
            yield event

    async def _run_round(
        self,
        debate_id: str,
        round_number: int,
        agents: dict[str, BaseAgent],
        system_prompt: str,
        user_prompt: str,
        anon_map: AnonymityMap,
        responses_out: dict[str, str] | None = None,
    ) -> AsyncGenerator[str, None]:
        tasks: dict[str, asyncio.Task[tuple[str, float]]] = {}

        for model_id, agent in agents.items():
            yield _sse("agent_start", {"agent_id": model_id, "round": round_number})
            tasks[model_id] = asyncio.create_task(
                _call_agent(agent, system_prompt, user_prompt, model_id, self.cost_tracker)
            )

        responses: dict[str, str] = {}

        while tasks:
            done_ids = []
            for model_id, task in tasks.items():
                if task.done():
                    result = task.result()
                    if isinstance(result, Exception):
                        responses[model_id] = FALLBACK_RESPONSE
                    else:
                        response_text, cost = result
                        responses[model_id] = response_text
                    yield _sse("agent_complete", {
                        "agent_id": model_id,
                        "round": round_number,
                        "content": responses[model_id][:200],
                    })
                    done_ids.append(model_id)
            for mid in done_ids:
                del tasks[mid]
            if tasks:
                await asyncio.sleep(0.1)

        await self.redis.set(
            f"debate:{debate_id}:round:{round_number}",
            json.dumps(responses),
            ex=REDIS_TTL,
        )

        if responses_out is not None:
            responses_out.update(responses)

    async def _finalize(
        self,
        debate_id: str,
        topic: str,
        model_ids: list[str],
        agents: dict[str, BaseAgent],
        api_keys: dict[str, str | None],
        anon_map: AnonymityMap,
        round_1_responses: dict[str, str],
        round_2_responses: dict[str, str],
        round_3_responses: dict[str, str],
    ) -> AsyncGenerator[str, None]:
        yield _sse("judge_start", {"description": "Synthesizing golden prompt"})

        anon_r1 = self.anonymizer.anonymize_responses(anon_map, round_1_responses, 1)
        anon_r2 = self.anonymizer.anonymize_responses(anon_map, round_2_responses, 2) if round_2_responses else []
        anon_r3 = self.anonymizer.anonymize_responses(anon_map, round_3_responses, 3) if round_3_responses else []

        judge_model_id = model_ids[0]

        if not _has_any_user_key(api_keys):
            try:
                fallback_judge, fallback_judge_id = AgentFactory.create_fallback_judge()
                judge_agent = fallback_judge
                judge_model_id = fallback_judge_id
            except ValueError:
                judge_agent = agents[model_ids[0]]
        else:
            judge_agent = agents[judge_model_id]

        judge_user_prompt = build_judge_user_prompt(topic, anon_r1, anon_r2, anon_r3)

        golden_prompt: str = FALLBACK_RESPONSE
        judge_cost: float = 0.0

        try:
            golden_prompt, judge_cost = await _call_agent(
                judge_agent, JUDGE_SYSTEM, judge_user_prompt, judge_model_id, self.cost_tracker,
            )
            if golden_prompt == FALLBACK_RESPONSE:
                raise RuntimeError("Judge returned fallback response")
        except Exception as first_err:
            if _is_context_too_large(first_err):
                logger.warning("Judge failed with context-too-large, retrying with simplified prompt: %s", first_err)
            else:
                logger.warning("Judge failed, retrying with simplified prompt: %s", first_err)
            yield _sse("judge_retry", {
                "debate_id": debate_id,
                "reason": "context_too_large",
            })
            try:
                simplified_prompt = build_simplified_judge_prompt(topic, anon_r3 or anon_r2 or anon_r1)
                golden_prompt, judge_cost = await _call_agent(
                    judge_agent, SIMPLIFIED_JUDGE_SYSTEM, simplified_prompt, judge_model_id, self.cost_tracker,
                )
            except Exception as retry_err:
                logger.error("Simplified judge also failed: %s", retry_err)
                best_responses = anon_r3 or anon_r2 or anon_r1
                if best_responses:
                    golden_prompt = best_responses[0]["text"]
                else:
                    golden_prompt = FALLBACK_RESPONSE

        yield _sse("consensus", {
            "golden_prompt": golden_prompt,
            "judge_model": judge_model_id,
        })

        await self.redis.set(
            f"debate:{debate_id}:golden_prompt",
            json.dumps({"golden_prompt": golden_prompt, "judge_model": judge_model_id}),
            ex=REDIS_TTL,
        )

        cost_summary = self.cost_tracker.to_dict()
        await self.redis.set(
            f"debate:{debate_id}:costs",
            json.dumps(cost_summary),
            ex=REDIS_TTL,
        )

        yield _sse("cost_update", cost_summary)

        yield _sse("done", {
            "status": "completed",
            "debate_id": debate_id,
            "total_cost": cost_summary["total_cost"],
            "total_tokens": cost_summary["total_tokens"],
        })

    def _format_round_results(
        self,
        responses: dict[str, str],
        anon_map: AnonymityMap,
        round_number: int,
    ) -> list[dict[str, str]]:
        result: list[dict[str, str]] = []
        for model_id, text in responses.items():
            label = anon_map.get_label(model_id, round_number)
            result.append({
                "label": label,
                "model_id": model_id,
                "text": text[:200] + "..." if len(text) > 200 else text,
            })
        result.sort(key=lambda entry: entry["label"])
        return result
