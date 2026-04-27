import asyncio
import hashlib
import json
import logging
import os
import time
from typing import AsyncGenerator

import sentry_sdk

try:
    import psutil
    _HAS_PSUTIL = True
except ImportError:
    _HAS_PSUTIL = False

from .agent_factory import AgentFactory, _has_any_user_key
from .anonymizer import Anonymizer, AnonymityMap
from .circuit_breaker import circuit_breaker
from .convergence import check_convergence
from .cost_tracker import CostTracker
from ..shared.config.models import get_provider_for_model
from .prompts import (
    ROUND_1_SYSTEM,
    ROUND_2_SYSTEM,
    ROUND_3_SYSTEM,
    JUDGE_SYSTEM,
    SIMPLIFIED_JUDGE_SYSTEM,
    build_round_2_user_prompt,
    build_round_3_user_prompt,
    build_judge_user_prompt,
    build_simplified_judge_prompt,
)
from .shared import (
    FALLBACK_RESPONSE,
    MAX_RETRIES,
    RETRY_BACKOFF,
    REDIS_TTL,
    MINIMUM_RESPONSE_LENGTH,
    _now_iso,
    _sse,
)
from ..features.agents.base_agent import BaseAgent
from ..shared.database.redis import RedisClient
from ..shared.config.models import get_free_fallback_models

logger = logging.getLogger(__name__)


def _correlation_token(value: str | None) -> str:
    if not value:
        return "none"
    return hashlib.sha256(value.encode("utf-8", errors="replace")).hexdigest()[:12]


def _log_exc(exc: BaseException) -> str:
    return type(exc).__name__


_start_time = time.time()

CHEAP_VARIANTS = {
    "gpt-5.4": "gpt-5.4-mini",
    "gpt-5.5": "gpt-5.4-mini",
    "gpt-5.5-pro": "gpt-5.4-mini",
    "claude-sonnet-4-6": "claude-haiku-4-5-20251001",
    "claude-opus-4-7": "claude-haiku-4-5-20251001",
    "claude-opus-4-6": "claude-haiku-4-5-20251001",
    "gemini-3.1-pro-preview": "gemini-3-flash-preview",
    "grok-4-20": "grok-4-1-fast-non-reasoning",
    "grok-4-1-fast-reasoning": "grok-4-1-fast-non-reasoning",
}

_CONTEXT_TOO_LARGE_CODES = {413, 400}
_CONTEXT_TOO_LARGE_PHRASES = ("too large", "context length", "maximum context", "token limit")

_ROUND_CONFIG = {
    1: {"system": ROUND_1_SYSTEM, "description": "Independent Analysis"},
    2: {"system": ROUND_2_SYSTEM, "description": "Critique & Refinement"},
    3: {"system": ROUND_3_SYSTEM, "description": "Final Convergence"},
}


def _set_runtime_context() -> None:
    ctx: dict = {"uptime_seconds": round(time.time() - _start_time, 1)}
    if _HAS_PSUTIL:
        try:
            proc = psutil.Process(os.getpid())
            ctx["memory_mb"] = round(proc.memory_info().rss / 1024 / 1024, 1)
            ctx["cpu_percent"] = psutil.cpu_percent()
        except (psutil.Error, OSError) as exc:
            logger.debug("Failed to collect runtime metrics: %s", _log_exc(exc))
    sentry_sdk.set_context("runtime", ctx)


def _is_context_too_large(exc: Exception) -> bool:
    status = getattr(exc, "status_code", None) or getattr(exc, "status", None)
    if status in _CONTEXT_TOO_LARGE_CODES:
        return True
    msg = str(exc).lower()
    return any(phrase in msg for phrase in _CONTEXT_TOO_LARGE_PHRASES)


def _validate_response(text: str) -> str:
    if not text or len(text.strip()) < MINIMUM_RESPONSE_LENGTH:
        return FALLBACK_RESPONSE
    return text.strip()


def _get_cheap_variant(model_id: str) -> str | None:
    if model_id in CHEAP_VARIANTS:
        return CHEAP_VARIANTS[model_id]
    for prefix, cheap in CHEAP_VARIANTS.items():
        if model_id.startswith(prefix):
            return cheap
    return None


async def _call_agent_try_generate(
    agent: BaseAgent,
    system_prompt: str,
    user_prompt: str,
    model_id: str,
    cost_tracker: CostTracker,
) -> tuple[str, float] | None:
    raw_response, tokens_used = await asyncio.wait_for(
        agent.generate_response(user_prompt, system_prompt=system_prompt),
        timeout=60,
    )
    validated = _validate_response(raw_response)
    if validated == FALLBACK_RESPONSE:
        logger.warning("Agent %s returned insufficient response", _correlation_token(model_id))
        return None
    input_tokens = max(tokens_used // 3, len(user_prompt.split()) * 2)
    output_tokens = max(tokens_used - input_tokens, len(validated.split()) * 2)
    cost = cost_tracker.record(model_id, input_tokens, output_tokens)
    return validated, cost


async def _circuit_failure(provider: str | None) -> None:
    if provider:
        await circuit_breaker.record_failure(provider)


def _log_call_agent_os_error(model_id: str, attempt: int, exc: OSError) -> None:
    ref = _correlation_token(model_id)
    if isinstance(exc, ConnectionError):
        logger.warning(
            "Agent %s attempt %d connection error: %s",
            ref, attempt + 1, _log_exc(exc),
        )
    else:
        logger.warning(
            "Agent %s attempt %d failed: %s",
            ref, attempt + 1, _log_exc(exc),
        )


async def _call_agent_single_attempt(
    agent: BaseAgent,
    system_prompt: str,
    user_prompt: str,
    model_id: str,
    cost_tracker: CostTracker,
    provider: str | None,
    attempt: int,
) -> tuple[str, float] | None:
    try:
        pair = await _call_agent_try_generate(
            agent, system_prompt, user_prompt, model_id, cost_tracker,
        )
        if pair is not None:
            validated, cost = pair
            if provider:
                await circuit_breaker.record_success(provider)
            return validated, cost
        logger.warning(
            "Agent %s attempt %d returned insufficient response",
            _correlation_token(model_id), attempt + 1,
        )
    except asyncio.TimeoutError:
        logger.warning("Agent %s attempt %d timed out", _correlation_token(model_id), attempt + 1)
        await _circuit_failure(provider)
    except OSError as exc:
        _log_call_agent_os_error(model_id, attempt, exc)
        await _circuit_failure(provider)
    except RuntimeError as exc:
        logger.warning(
            "Agent %s attempt %d failed: %s",
            _correlation_token(model_id), attempt + 1, _log_exc(exc),
        )
        await _circuit_failure(provider)
    return None


async def _call_agent(
    agent: BaseAgent,
    system_prompt: str,
    user_prompt: str,
    model_id: str,
    cost_tracker: CostTracker,
) -> tuple[str, float]:
    provider = get_provider_for_model(model_id)

    if provider and not await circuit_breaker.is_available(provider):
        logger.warning(
            "Circuit breaker OPEN for provider %s, skipping %s",
            _correlation_token(provider), _correlation_token(model_id),
        )
        return FALLBACK_RESPONSE, 0.0

    for attempt in range(MAX_RETRIES + 1):
        result = await _call_agent_single_attempt(
            agent, system_prompt, user_prompt, model_id, cost_tracker, provider, attempt,
        )
        if result is not None:
            return result
        if attempt < MAX_RETRIES:
            await asyncio.sleep(RETRY_BACKOFF[attempt])

    return FALLBACK_RESPONSE, 0.0


class DebateOrchestrator:

    def __init__(self, redis: RedisClient):
        self.redis = redis
        self.anonymizer = Anonymizer(redis)
        self.cost_tracker = CostTracker()
        self._event_counter = 0
        self._debate_start_time = 0.0

    async def _persist_event(self, debate_id: str, event_str: str):
        try:
            await self.redis.rpush(f"debate:{debate_id}:events", event_str)
            await self.redis.expire(f"debate:{debate_id}:events", REDIS_TTL)
        except (OSError, TimeoutError) as exc:
            logger.warning(
                "Failed to persist event for debate %s: %s",
                _correlation_token(debate_id), _log_exc(exc),
            )

    async def _save_checkpoint(self, debate_id: str, round_number: int):
        try:
            await self.redis.set(
                f"debate:{debate_id}:checkpoint",
                json.dumps({"last_completed_round": round_number, "timestamp": _now_iso()}),
                ex=REDIS_TTL,
            )
        except (OSError, TimeoutError) as exc:
            logger.warning(
                "Failed to save checkpoint for debate %s round %d: %s",
                _correlation_token(debate_id), round_number, _log_exc(exc),
            )

    async def _update_heartbeat(self, debate_id: str, round_number: int):
        try:
            await self.redis.set(
                f"debate:{debate_id}:heartbeat",
                json.dumps({"round": round_number, "timestamp": _now_iso()}),
                ex=300,
            )
        except (OSError, TimeoutError) as exc:
            logger.debug(
                "Failed to update heartbeat for debate %s: %s",
                _correlation_token(debate_id), _log_exc(exc),
            )

    async def _load_checkpoint(self, debate_id: str) -> dict | None:
        try:
            raw = await self.redis.get(f"debate:{debate_id}:checkpoint")
            if raw:
                return json.loads(raw)
        except (OSError, TimeoutError) as exc:
            logger.warning(
                "Failed to load checkpoint for debate %s: %s",
                _correlation_token(debate_id), _log_exc(exc),
            )
        except json.JSONDecodeError as exc:
            logger.warning(
                "Corrupt checkpoint data for debate %s: %s",
                _correlation_token(debate_id), _log_exc(exc),
            )
        return None

    def _tracked_sse(self, event: str, data: dict) -> str:
        self._event_counter += 1
        data["_event_id"] = self._event_counter
        payload = {**data, "event": event}
        return f"id: {self._event_counter}\nevent: {event}\ndata: {json.dumps(payload)}\n\n"

    def _build_round_user_prompt(
        self,
        round_number: int,
        topic: str,
        anon_map: AnonymityMap,
        all_responses: dict[int, dict[str, str]],
    ) -> str:
        if round_number == 1:
            return topic
        if round_number == 2:
            anon_r1 = self.anonymizer.anonymize_responses(anon_map, all_responses[1], 1)
            return build_round_2_user_prompt(topic, anon_r1)
        anon_r1 = self.anonymizer.anonymize_responses(anon_map, all_responses[1], 1)
        anon_r2 = self.anonymizer.anonymize_responses(anon_map, all_responses[2], 2)
        return build_round_3_user_prompt(topic, anon_r1, anon_r2)

    async def _run_single_round(
        self,
        debate_id: str,
        round_number: int,
        agents: dict[str, BaseAgent],
        system_prompt: str,
        user_prompt: str,
        anon_map: AnonymityMap,
        all_responses: dict[int, dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        responses_out: dict[str, str] = {}

        yield _sse("round_start", {
            "round": round_number,
            "description": _ROUND_CONFIG[round_number]["description"],
        })

        async for event in self._run_round(
            debate_id=debate_id,
            round_number=round_number,
            agents=agents,
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            responses_out=responses_out,
        ):
            yield event

        all_responses[round_number] = responses_out

        rc_event = self._tracked_sse("round_complete", {
            "round": round_number,
            "responses": self._format_round_results(responses_out, anon_map, round_number),
        })
        await self._persist_event(debate_id, rc_event)
        yield rc_event
        await self._save_checkpoint(debate_id, round_number)
        await self._update_heartbeat(debate_id, round_number)

        try:
            sentry_sdk.add_breadcrumb(
                category="debate", message=f"Round {round_number} completed", level="info",
            )
        except Exception as exc:
            logger.debug("Failed to add Sentry breadcrumb: %s", _log_exc(exc))

    async def _iter_subagent_research(
        self,
        topic: str,
        model_ids: list[str],
        api_keys: dict[str, str | None],
    ) -> AsyncGenerator[str, None]:
        yield _sse("subagent_research_start", {"models": model_ids})
        research_ok = 0
        for model_id in model_ids:
            cheap_model = _get_cheap_variant(model_id)
            if not cheap_model:
                continue
            try:
                cheap_agent = AgentFactory.create(cheap_model, api_keys)
                research_prompt = (
                    f"Research and outline key considerations for: {topic}\n"
                    f"Focus on: patterns, requirements, trade-offs, edge cases."
                )
                await asyncio.wait_for(
                    cheap_agent.generate_response(research_prompt), timeout=30,
                )
                research_ok += 1
            except asyncio.TimeoutError:
                logger.warning("Sub-agent research timed out for model %s", _correlation_token(model_id))
            except (OSError, RuntimeError) as exc:
                logger.warning(
                    "Sub-agent research failed for model %s: %s",
                    _correlation_token(model_id), _log_exc(exc),
                )
        yield _sse("subagent_research_done", {"count": research_ok})

    async def _iter_convergence_finalize(
        self,
        debate_id: str,
        topic: str,
        model_ids: list[str],
        agents: dict[str, BaseAgent],
        api_keys: dict[str, str | None],
        anon_map: AnonymityMap,
        all_responses: dict[int, dict[str, str]],
        convergence,
    ) -> AsyncGenerator[str, None]:
        yield _sse("convergence_detected", {
            "similarity": round(convergence.average_similarity, 4),
            "skippingRounds": True,
            "pairwise": [
                {"model_a": a, "model_b": b, "similarity": round(s, 4)}
                for a, b, s in convergence.pairwise_scores
            ],
        })
        async for ev in self._finalize(
            debate_id, topic, model_ids, agents, api_keys, anon_map, all_responses,
        ):
            yield ev

    async def _iter_after_round_one(
        self,
        debate_id: str,
        topic: str,
        model_ids: list[str],
        agents: dict[str, BaseAgent],
        api_keys: dict[str, str | None],
        anon_map: AnonymityMap,
        all_responses: dict[int, dict[str, str]],
        round_count: int,
    ) -> AsyncGenerator[str, None]:
        if round_count >= 2:
            try:
                convergence = await check_convergence(all_responses[1], api_keys)
                if convergence.converged:
                    async for ev in self._iter_convergence_finalize(
                        debate_id, topic, model_ids, agents, api_keys, anon_map, all_responses, convergence,
                    ):
                        yield ev
                    return
            except Exception as exc:
                logger.warning("Convergence check error, continuing: %s", _log_exc(exc))

        if round_count < 2:
            async for ev in self._finalize(
                debate_id, topic, model_ids, agents, api_keys, anon_map, all_responses,
            ):
                yield ev
            return

        async for ev in self._iter_rounds_two_three_and_finalize(
            debate_id, topic, model_ids, agents, api_keys, anon_map, all_responses, round_count,
        ):
            yield ev

    async def _iter_rounds_two_three_and_finalize(
        self,
        debate_id: str,
        topic: str,
        model_ids: list[str],
        agents: dict[str, BaseAgent],
        api_keys: dict[str, str | None],
        anon_map: AnonymityMap,
        all_responses: dict[int, dict[str, str]],
        round_count: int,
    ) -> AsyncGenerator[str, None]:
        r2_prompt = self._build_round_user_prompt(2, topic, anon_map, all_responses)
        async for ev in self._run_single_round(
            debate_id, 2, agents, ROUND_2_SYSTEM, r2_prompt, anon_map, all_responses,
        ):
            yield ev

        if round_count < 3:
            async for ev in self._finalize(
                debate_id, topic, model_ids, agents, api_keys, anon_map, all_responses,
            ):
                yield ev
            return

        r3_prompt = self._build_round_user_prompt(3, topic, anon_map, all_responses)
        async for ev in self._run_single_round(
            debate_id, 3, agents, ROUND_3_SYSTEM, r3_prompt, anon_map, all_responses,
        ):
            yield ev

        async for ev in self._finalize(
            debate_id, topic, model_ids, agents, api_keys, anon_map, all_responses,
        ):
            yield ev

    async def run_debate(
        self,
        debate_id: str,
        topic: str,
        model_ids: list[str],
        api_keys: dict[str, str | None],
        round_count: int = 3,
        system_prompt: str | None = None,
        sub_agents: bool = False,
        project_context: dict | None = None,
    ) -> AsyncGenerator[str, None]:
        self._debate_start_time = time.time()
        self._event_counter = 0

        if project_context:
            ctx_parts = ["=== PROJECT CONTEXT ==="]
            meta = project_context
            if meta.get("projectType"):
                ctx_parts.append(f"Project: {meta['projectType']} ({meta.get('language', 'unknown')})")
            if meta.get("framework") and meta["framework"] != "none":
                ctx_parts.append(f"Framework: {meta['framework']}")
            if meta.get("integrations"):
                ctx_parts.append(f"Integrations: {', '.join(meta['integrations'])}")
            files = meta.get("files", [])
            if files:
                ctx_parts.append("")
                ctx_budget = 4000
                for f in files:
                    name = f.get("name", "unknown")
                    file_content = f.get("content", "")
                    snippet = file_content[:1500]
                    if ctx_budget <= 0:
                        break
                    ctx_parts.append(f"--- FILE: {name} ---")
                    ctx_parts.append(snippet)
                    ctx_parts.append(f"--- END FILE ---")
                    ctx_budget -= len(snippet)
            ctx_parts.append("=== END PROJECT CONTEXT ===")
            topic = chr(10).join(ctx_parts) + chr(10) + chr(10) + topic

        if not _has_any_user_key(api_keys):
            model_ids = get_free_fallback_models(count=max(len(model_ids), 2))

        agents: dict[str, BaseAgent] = {}
        for model_id in model_ids:
            agents[model_id] = AgentFactory.create(model_id, api_keys)

        anon_map = await self.anonymizer.create_map(debate_id, model_ids)

        checkpoint = await self._load_checkpoint(debate_id)
        start_round = 1
        if checkpoint:
            start_round = checkpoint.get("last_completed_round", 0) + 1
            logger.info("Resuming debate %s from round %d", _correlation_token(debate_id), start_round)

        event = self._tracked_sse("debate_start", {
            "debate_id": debate_id,
            "topic": topic,
            "models": model_ids,
            "round_count": round_count,
            "sub_agents": sub_agents,
            "started_at": _now_iso(),
            "resumed_from_round": start_round if start_round > 1 else None,
        })
        await self._persist_event(debate_id, event)
        yield event

        if sub_agents:
            async for ev in self._iter_subagent_research(topic, model_ids, api_keys):
                yield ev

        all_responses: dict[int, dict[str, str]] = {}
        effective_system = system_prompt or ROUND_1_SYSTEM

        async for ev in self._run_single_round(
            debate_id, 1, agents, effective_system, topic, anon_map, all_responses,
        ):
            yield ev

        async for ev in self._iter_after_round_one(
            debate_id, topic, model_ids, agents, api_keys, anon_map, all_responses, round_count,
        ):
            yield ev

    def _round_task_completion_events(
        self,
        model_id: str,
        round_number: int,
        task: asyncio.Task[tuple[str, float]],
        responses: dict[str, str],
    ) -> tuple[bool, list[str]]:
        if not task.done():
            return False, []
        events: list[str] = []
        try:
            result = task.result()
        except (asyncio.CancelledError, Exception) as exc:
            logger.warning(
                "Task for %s failed in round %d: %s",
                _correlation_token(model_id), round_number, _log_exc(exc),
            )
            responses[model_id] = FALLBACK_RESPONSE
            try:
                sentry_sdk.set_tag("failed_model", _correlation_token(model_id))
                _set_runtime_context()
            except Exception as tag_exc:
                logger.debug(
                    "Failed to set Sentry tag for model %s: %s",
                    _correlation_token(model_id), _log_exc(tag_exc),
                )
            events.append(_sse("agent_complete", {
                "agent_id": model_id,
                "round": round_number,
                "content": FALLBACK_RESPONSE,
            }))
            return True, events

        response_text, _ = result
        responses[model_id] = response_text
        sentry_sdk.add_breadcrumb(
            category="debate",
            message=f"Agent {_correlation_token(model_id)} completed round {round_number}",
            level="info",
        )
        events.append(_sse("agent_complete", {
            "agent_id": model_id,
            "round": round_number,
            "content": responses[model_id][:200],
        }))
        return True, events

    async def _persist_round_results(
        self,
        debate_id: str,
        round_number: int,
        responses: dict[str, str],
    ) -> None:
        try:
            sentry_sdk.set_tag("current_round", round_number)
        except Exception as exc:
            logger.debug("Failed to set Sentry round tag: %s", _log_exc(exc))

        try:
            await self.redis.set(
                f"debate:{debate_id}:round:{round_number}",
                json.dumps(responses),
                ex=REDIS_TTL,
            )
        except (OSError, TimeoutError) as exc:
            logger.warning(
                "Failed to persist round %d results for debate %s: %s",
                round_number, _correlation_token(debate_id), _log_exc(exc),
            )

    async def _run_round(
        self,
        debate_id: str,
        round_number: int,
        agents: dict[str, BaseAgent],
        system_prompt: str,
        user_prompt: str,
        responses_out: dict[str, str] | None = None,
    ) -> AsyncGenerator[str, None]:
        sentry_sdk.add_breadcrumb(
            category="debate", message=f"Round {round_number} started", level="info",
        )
        _set_runtime_context()

        tasks: dict[str, asyncio.Task[tuple[str, float]]] = {}

        for model_id, agent in agents.items():
            yield _sse("agent_start", {"agent_id": model_id, "round": round_number})
            tasks[model_id] = asyncio.create_task(
                _call_agent(agent, system_prompt, user_prompt, model_id, self.cost_tracker)
            )

        responses: dict[str, str] = {}

        while tasks:
            done_ids: list[str] = []
            for model_id, task in tasks.items():
                remove, events = self._round_task_completion_events(
                    model_id, round_number, task, responses,
                )
                for sse_line in events:
                    yield sse_line
                if remove:
                    done_ids.append(model_id)
            for mid in done_ids:
                del tasks[mid]
            if tasks:
                await asyncio.sleep(0.1)

        await self._persist_round_results(debate_id, round_number, responses)

        if responses_out is not None:
            responses_out.update(responses)

    def _select_judge_agent(
        self,
        model_ids: list[str],
        agents: dict[str, BaseAgent],
        api_keys: dict[str, str | None],
    ) -> tuple[BaseAgent, str]:
        judge_model_id = model_ids[0]
        if not _has_any_user_key(api_keys):
            try:
                fallback_judge, fallback_judge_id = AgentFactory.create_fallback_judge()
                return fallback_judge, fallback_judge_id
            except ValueError:
                return agents[model_ids[0]], model_ids[0]
        return agents[judge_model_id], judge_model_id

    async def _judge_primary_golden(
        self,
        judge_agent: BaseAgent,
        judge_model_id: str,
        topic: str,
        anon_r1: list,
        anon_r2: list,
        anon_r3: list,
    ) -> str:
        judge_user_prompt = build_judge_user_prompt(topic, anon_r1, anon_r2, anon_r3)
        golden_prompt, _ = await _call_agent(
            judge_agent, JUDGE_SYSTEM, judge_user_prompt, judge_model_id, self.cost_tracker,
        )
        if golden_prompt == FALLBACK_RESPONSE:
            raise RuntimeError("Judge returned fallback response")
        return golden_prompt

    async def _judge_simplified_golden(
        self,
        judge_agent: BaseAgent,
        judge_model_id: str,
        topic: str,
        anon_r1: list,
        anon_r2: list,
        anon_r3: list,
    ) -> str:
        simplified_prompt = build_simplified_judge_prompt(topic, anon_r3 or anon_r2 or anon_r1)
        golden_prompt, _ = await _call_agent(
            judge_agent, SIMPLIFIED_JUDGE_SYSTEM, simplified_prompt, judge_model_id, self.cost_tracker,
        )
        return golden_prompt

    def _golden_from_anon_fallback(self, anon_r1: list, anon_r2: list, anon_r3: list) -> str:
        best_responses = anon_r3 or anon_r2 or anon_r1
        if best_responses:
            return best_responses[0]["text"]
        return FALLBACK_RESPONSE

    async def _call_judge_with_fallback(
        self,
        debate_id: str,
        topic: str,
        model_ids: list[str],
        agents: dict[str, BaseAgent],
        api_keys: dict[str, str | None],
        anon_map: AnonymityMap,
        all_responses: dict[int, dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        yield _sse("judge_start", {"description": "Synthesizing golden prompt"})

        anon_r1 = self.anonymizer.anonymize_responses(anon_map, all_responses.get(1, {}), 1)
        anon_r2 = self.anonymizer.anonymize_responses(anon_map, all_responses.get(2, {}), 2) if all_responses.get(2) else []
        anon_r3 = self.anonymizer.anonymize_responses(anon_map, all_responses.get(3, {}), 3) if all_responses.get(3) else []

        judge_agent, judge_model_id = self._select_judge_agent(model_ids, agents, api_keys)

        try:
            sentry_sdk.set_tag("judge_model", _correlation_token(judge_model_id))
        except Exception as exc:
            logger.debug("Failed to set Sentry judge_model tag: %s", _log_exc(exc))

        try:
            golden_prompt = await self._judge_primary_golden(
                judge_agent, judge_model_id, topic, anon_r1, anon_r2, anon_r3,
            )
        except Exception as first_err:
            ctx_large = _is_context_too_large(first_err)
            if ctx_large:
                logger.warning(
                    "Judge failed with context-too-large, retrying with simplified prompt: %s",
                    _log_exc(first_err),
                )
            else:
                logger.warning(
                    "Judge failed, retrying with simplified prompt: %s",
                    _log_exc(first_err),
                )
            yield _sse("judge_retry", {
                "debate_id": debate_id,
                "reason": "context_too_large" if ctx_large else "judge_retry_failed",
                "error_type": type(first_err).__name__,
                "error_detail": _log_exc(first_err),
            })
            try:
                golden_prompt = await self._judge_simplified_golden(
                    judge_agent, judge_model_id, topic, anon_r1, anon_r2, anon_r3,
                )
            except Exception as retry_err:
                logger.error("Simplified judge also failed: %s", _log_exc(retry_err))
                golden_prompt = self._golden_from_anon_fallback(anon_r1, anon_r2, anon_r3)

        yield _sse("consensus", {
            "golden_prompt": golden_prompt,
            "judge_model": judge_model_id,
        })

    async def _persist_results(
        self,
        debate_id: str,
        golden_prompt: str,
        judge_model_id: str,
        all_responses: dict[int, dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        try:
            await self.redis.set(
                f"debate:{debate_id}:golden_prompt",
                json.dumps({"golden_prompt": golden_prompt, "judge_model": judge_model_id}),
                ex=REDIS_TTL,
            )
        except (OSError, TimeoutError) as exc:
            logger.warning(
                "Failed to persist golden prompt for debate %s: %s",
                _correlation_token(debate_id), _log_exc(exc),
            )

        cost_summary = self.cost_tracker.to_dict()
        try:
            await self.redis.set(
                f"debate:{debate_id}:costs",
                json.dumps(cost_summary),
                ex=REDIS_TTL,
            )
        except (OSError, TimeoutError) as exc:
            logger.warning(
                "Failed to persist costs for debate %s: %s",
                _correlation_token(debate_id), _log_exc(exc),
            )

        yield _sse("cost_update", cost_summary)

        round_1_responses = all_responses.get(1, {})
        duration_ms = int((time.time() - self._debate_start_time) * 1000) if self._debate_start_time else 0
        models_succeeded = [m for m, r in round_1_responses.items() if r != FALLBACK_RESPONSE]
        models_failed = [m for m, r in round_1_responses.items() if r == FALLBACK_RESPONSE]

        done_event = self._tracked_sse("done", {
            "status": "completed",
            "debate_id": debate_id,
            "total_cost": cost_summary["total_cost"],
            "total_tokens": cost_summary["total_tokens"],
            "duration_ms": duration_ms,
            "models_succeeded": models_succeeded,
            "models_failed": models_failed,
            "completed_at": _now_iso(),
        })
        await self._persist_event(debate_id, done_event)
        yield done_event

    async def _finalize(
        self,
        debate_id: str,
        topic: str,
        model_ids: list[str],
        agents: dict[str, BaseAgent],
        api_keys: dict[str, str | None],
        anon_map: AnonymityMap,
        all_responses: dict[int, dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        golden_prompt = FALLBACK_RESPONSE
        judge_model_id = model_ids[0]

        async for ev in self._call_judge_with_fallback(
            debate_id, topic, model_ids, agents, api_keys, anon_map, all_responses,
        ):
            if '"consensus"' in ev or "'consensus'" in ev:
                try:
                    line = ev.split("data: ", 1)[1].split("\n")[0]
                    payload = json.loads(line)
                    golden_prompt = payload.get("golden_prompt", FALLBACK_RESPONSE)
                    judge_model_id = payload.get("judge_model", judge_model_id)
                except (IndexError, json.JSONDecodeError, KeyError):
                    pass
            yield ev

        async for ev in self._persist_results(debate_id, golden_prompt, judge_model_id, all_responses):
            yield ev

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
