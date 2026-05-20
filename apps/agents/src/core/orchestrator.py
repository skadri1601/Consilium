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
from .rate_limiter import rate_limiter
from .convergence import check_convergence
from .cost_tracker import CostTracker
from .failure_taxonomy import classify, FailureClass
from .session_compaction import compact_debate_context, build_compacted_prompt, CompactionConfig
from .session_journal import SessionJournal
from .event_types import DebateEventName
from .config_layers import load_debate_config
from .permission_enforcer import PermissionEnforcer, PermissionMode
from .container_detect import get_container_environment
from .agent_lifecycle import AgentLifecycleRegistry, AgentStatus
from .task_registry import DebateTaskRegistry
from .debate_hooks import debate_hooks, HookEvent, HookContext
from .provider_health import provider_health
from .session_fork import SessionForkManager, DebateSnapshot
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
    reasoning_effort: str | None = None,
) -> tuple[str, float] | None:
    raw_response, tokens_used = await asyncio.wait_for(
        agent.generate_response(
            user_prompt,
            system_prompt=system_prompt,
            reasoning_effort=reasoning_effort,
        ),
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
    reasoning_effort: str | None = None,
) -> tuple[str, float] | None:
    try:
        pair = await _call_agent_try_generate(
            agent, system_prompt, user_prompt, model_id, cost_tracker,
            reasoning_effort=reasoning_effort,
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
    except (asyncio.TimeoutError, OSError, RuntimeError) as exc:
        failure_class = classify(exc)
        logger.warning(
            "Agent %s attempt %d [%s]: %s",
            _correlation_token(model_id), attempt + 1,
            failure_class.value, str(exc),
        )
        await _circuit_failure(provider)
    return None


async def _call_agent(
    agent: BaseAgent,
    system_prompt: str,
    user_prompt: str,
    model_id: str,
    cost_tracker: CostTracker,
    reasoning_effort: str | None = None,
) -> tuple[str, float]:
    provider = get_provider_for_model(model_id)

    if provider and not await circuit_breaker.is_available(provider):
        logger.warning(
            "Circuit breaker OPEN for provider %s, skipping %s",
            _correlation_token(provider), _correlation_token(model_id),
        )
        return FALLBACK_RESPONSE, 0.0

    if provider:
        await rate_limiter.acquire(provider)

    try:
        for attempt in range(MAX_RETRIES + 1):
            result = await _call_agent_single_attempt(
                agent, system_prompt, user_prompt, model_id, cost_tracker, provider, attempt,
                reasoning_effort=reasoning_effort,
            )
            if result is not None:
                return result
            if attempt < MAX_RETRIES:
                await asyncio.sleep(RETRY_BACKOFF[attempt])

        return FALLBACK_RESPONSE, 0.0
    finally:
        if provider:
            rate_limiter.release(provider)


class CancelledError(Exception):
    pass


ANTI_CAPITULATION_PROMPT = (
    "You are reviewing your own revision.\n\n"
    "YOUR ORIGINAL CLAIMS (Round 1):\n{round1}\n\n"
    "YOUR REVISED RESPONSE (Round 3):\n{round3}\n\n"
    "You appear to have dropped or significantly weakened many of your original positions.\n"
    "Before accepting your revision:\n"
    "1. Was each critique actually valid, or were you being polite?\n"
    "2. Reinstate any claims you still believe in with stronger evidence.\n"
    "3. Produce your FINAL response preserving defensible original claims."
)


class DebateOrchestrator:

    def __init__(self, redis: RedisClient):
        self.redis = redis
        self.anonymizer = Anonymizer(redis)
        self.cost_tracker = CostTracker()
        self._event_counter = 0
        self._debate_start_time = 0.0
        self._cancelled = False
        self._journal: SessionJournal | None = None
        self._compaction_result = None
        self._config: dict = {}
        self._enforcer: PermissionEnforcer | None = None
        self._lifecycle_registry = AgentLifecycleRegistry()
        self._task_registry: DebateTaskRegistry | None = None
        self._fork_manager = SessionForkManager()
        self._current_topic: str = ""
        self._current_model_ids: list[str] = []
        self._current_system_prompt: str | None = None
        self._current_sub_agents: bool = False
        self._current_project_context: dict | None = None
        self._current_reasoning_effort: str | None = None

    def _journal_log(self, event: str | DebateEventName, data: dict, round_number: int | None = None) -> None:
        if not self._journal:
            return
        event_str = event.value if isinstance(event, DebateEventName) else event
        try:
            self._journal.append(event_str, data, round_number=round_number)
        except Exception:
            pass

    def _emit(self, event: DebateEventName, data: dict, round_number: int | None = None) -> str:
        sse_str = _sse(event.value, data)
        self._journal_log(event, data, round_number)
        return sse_str

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

    async def _check_cancelled(self, debate_id: str) -> bool:
        if self._cancelled:
            return True
        try:
            val = await self.redis.get(f"debate:{debate_id}:cancelled")
            if val:
                self._cancelled = True
                return True
        except (OSError, TimeoutError):
            pass
        return False

    async def _raise_if_cancelled(self, debate_id: str) -> None:
        if await self._check_cancelled(debate_id):
            raise CancelledError(f"Debate {debate_id} was cancelled")

    async def _anti_capitulation_check(
        self,
        debate_id: str,
        agents: dict[str, BaseAgent],
        all_responses: dict[int, dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        r1 = all_responses.get(1, {})
        r3 = all_responses.get(3, {})
        if not r1 or not r3:
            return

        for model_id, agent in agents.items():
            r1_text = r1.get(model_id, "")
            r3_text = r3.get(model_id, "")
            if not r1_text or r1_text == FALLBACK_RESPONSE or not r3_text or r3_text == FALLBACK_RESPONSE:
                continue

            r1_lines = [l for l in r1_text.splitlines() if l.strip().startswith(("-", "*", "1", "2", "3", "[C"))]
            r3_lines = [l for l in r3_text.splitlines() if l.strip().startswith(("-", "*", "1", "2", "3", "[C"))]

            if len(r1_lines) < 3:
                continue
            drop_ratio = 1.0 - (len(r3_lines) / len(r1_lines)) if r1_lines else 0.0
            if drop_ratio <= 0.5:
                continue

            yield self._emit(DebateEventName.ANTI_CAPITULATION, {
                "agent_id": model_id,
                "r1_claims": len(r1_lines),
                "r3_claims": len(r3_lines),
                "drop_ratio": round(drop_ratio, 2),
            })

            prompt = ANTI_CAPITULATION_PROMPT.format(
                round1=r1_text[:3000], round3=r3_text[:3000],
            )
            try:
                revised, cost = await _call_agent(
                    agent, ROUND_3_SYSTEM, prompt, model_id, self.cost_tracker,
                    reasoning_effort=self._current_reasoning_effort,
                )
                if revised != FALLBACK_RESPONSE:
                    all_responses[3][model_id] = revised
                    yield self._emit(DebateEventName.ANTI_CAPITULATION_REVISED, {
                        "agent_id": model_id,
                        "cost": cost,
                    })
            except (asyncio.TimeoutError, OSError, RuntimeError) as exc:
                logger.warning(
                    "Anti-capitulation re-prompt failed for %s: %s",
                    _correlation_token(model_id), _log_exc(exc),
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

    def _tracked_sse(self, event: str | DebateEventName, data: dict) -> str:
        self._event_counter += 1
        event_str = event.value if isinstance(event, DebateEventName) else event
        data["_event_id"] = self._event_counter
        payload = {**data, "event": event_str}
        return f"id: {self._event_counter}\nevent: {event_str}\ndata: {json.dumps(payload)}\n\n"

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

        yield self._emit(DebateEventName.ROUND_START, {
            "round": round_number,
            "description": _ROUND_CONFIG[round_number]["description"],
        }, round_number=round_number)

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

        rc_event = self._tracked_sse(DebateEventName.ROUND_COMPLETE, {
            "round": round_number,
            "responses": self._format_round_results(responses_out, anon_map, round_number),
        })
        self._journal_log(DebateEventName.ROUND_COMPLETE, {"round": round_number}, round_number=round_number)
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

    async def _run_subagent_task(
        self,
        cheap_model: str,
        prompt: str,
        api_keys: dict[str, str | None],
        label: str,
    ) -> tuple[str, str | None]:
        try:
            cheap_agent = AgentFactory.create(cheap_model, api_keys)
            response, _ = await asyncio.wait_for(
                cheap_agent.generate_response(prompt), timeout=30,
            )
            validated = _validate_response(response)
            if validated != FALLBACK_RESPONSE:
                return label, validated
        except asyncio.TimeoutError:
            logger.warning("Sub-agent %s timed out", label)
        except (OSError, RuntimeError) as exc:
            logger.warning("Sub-agent %s failed: %s", label, _log_exc(exc))
        return label, None

    async def _iter_subagent_research(
        self,
        topic: str,
        model_ids: list[str],
        api_keys: dict[str, str | None],
    ) -> AsyncGenerator[str, None]:
        yield self._emit(DebateEventName.SUBAGENT_RESEARCH_START, {"models": model_ids})

        tasks = []
        sub_prompts = [
            ("patterns", f"Research design patterns and best practices for: {topic}\nFocus on: proven approaches, common patterns, industry standards."),
            ("tradeoffs", f"Analyze trade-offs and edge cases for: {topic}\nFocus on: risks, failure modes, scalability concerns, alternatives."),
            ("requirements", f"Break down requirements and constraints for: {topic}\nFocus on: must-haves, dependencies, assumptions, success criteria."),
        ]

        for model_id in model_ids:
            cheap_model = _get_cheap_variant(model_id)
            if not cheap_model:
                continue
            for label, prompt in sub_prompts:
                tasks.append(self._run_subagent_task(
                    cheap_model, prompt, api_keys, f"{_correlation_token(model_id)}:{label}",
                ))

        results = await asyncio.gather(*tasks)
        research_findings: list[str] = []
        research_ok = 0
        for label, finding in results:
            if finding:
                research_ok += 1
                research_findings.append(f"[Sub-agent {label}]: {finding[:1000]}")

        self._subagent_context = ""
        if research_findings:
            self._subagent_context = (
                "=== DEEP MODE: SUB-AGENT RESEARCH ===\n"
                + "\n\n".join(research_findings[:6])
                + "\n=== END SUB-AGENT RESEARCH ===\n\n"
            )

        yield self._emit(DebateEventName.SUBAGENT_RESEARCH_DONE, {
            "count": research_ok,
            "total_tasks": len(tasks),
        })

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
        yield self._emit(DebateEventName.CONVERGENCE_DETECTED, {
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
        await self._raise_if_cancelled(debate_id)

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
        await self._raise_if_cancelled(debate_id)

        compaction = compact_debate_context(all_responses)
        if compaction.compacted:
            self._compaction_result = compaction
            yield self._emit(DebateEventName.SESSION_COMPACTED, {
                "original_tokens": compaction.original_tokens,
                "compacted_tokens": compaction.compacted_tokens,
                "reduction_pct": round((1 - compaction.compacted_tokens / compaction.original_tokens) * 100, 1) if compaction.original_tokens > 0 else 0,
            }, round_number=2)

        r2_topic = topic
        if self._compaction_result and self._compaction_result.compacted:
            r2_topic = build_compacted_prompt(topic, self._compaction_result, 2)
        r2_prompt = self._build_round_user_prompt(2, r2_topic, anon_map, all_responses)
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

        await self._raise_if_cancelled(debate_id)

        r3_topic = topic
        if self._compaction_result and self._compaction_result.compacted:
            r3_topic = build_compacted_prompt(topic, self._compaction_result, 3)
        r3_prompt = self._build_round_user_prompt(3, r3_topic, anon_map, all_responses)
        async for ev in self._run_single_round(
            debate_id, 3, agents, ROUND_3_SYSTEM, r3_prompt, anon_map, all_responses,
        ):
            yield ev

        async for ev in self._anti_capitulation_check(
            debate_id, agents, all_responses,
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
        mode: str = "council",
        user_tier: str | None = None,
        reasoning_effort: str | None = None,
    ) -> AsyncGenerator[str, None]:
        self._debate_start_time = time.time()
        self._event_counter = 0
        self._compaction_result = None

        self._config = load_debate_config(debate_overrides={
            "max_rounds": round_count,
            "sub_agents_enabled": sub_agents,
        })

        container = get_container_environment()
        if container.in_container:
            logger.info("Running in container: runtime=%s", container.runtime)

        if user_tier:
            try:
                tier_mode = PermissionMode(user_tier)
            except ValueError:
                tier_mode = PermissionMode.FREE
            self._enforcer = PermissionEnforcer(tier_mode)
            enforcement = self._enforcer.check_debate_request(
                model_count=len(model_ids),
                round_count=round_count,
                mode=mode,
                sub_agents=sub_agents,
            )
            if not enforcement.allowed:
                yield self._emit(DebateEventName.ERROR, {
                    "message": enforcement.reason or "Permission denied",
                    "recoverable": False,
                })
                return
            if enforcement.adjusted:
                if "models" in enforcement.adjusted:
                    model_ids = model_ids[:enforcement.adjusted["models"]]
                if "rounds" in enforcement.adjusted:
                    round_count = enforcement.adjusted["rounds"]
                if "sub_agents" in enforcement.adjusted:
                    sub_agents = enforcement.adjusted["sub_agents"]

        journal_dir = os.getenv("CONSILIUM_JOURNAL_DIR")
        if journal_dir or os.getenv("CONSILIUM_JOURNAL_ENABLED"):
            self._journal = SessionJournal(debate_id, journal_dir)
            self._journal_log(DebateEventName.DEBATE_START, {
                "topic": topic[:200],
                "models": model_ids,
                "round_count": round_count,
                "mode": mode,
                "user_tier": user_tier,
                "container": container.to_dict() if container.in_container else None,
            })

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

        self._task_registry = DebateTaskRegistry(debate_id)
        self._current_topic = topic
        self._current_model_ids = list(model_ids)
        self._current_system_prompt = system_prompt
        self._current_sub_agents = sub_agents
        self._current_project_context = project_context
        self._current_reasoning_effort = reasoning_effort

        agents: dict[str, BaseAgent] = {}
        for model_id in model_ids:
            agents[model_id] = AgentFactory.create(model_id, api_keys)
            lifecycle = self._lifecycle_registry.register(model_id)
            lifecycle.mark_ready()
            p = get_provider_for_model(model_id)
            if p:
                provider_health.register_provider(p, [model_id])

        anon_map = await self.anonymizer.create_map(debate_id, model_ids)

        checkpoint = await self._load_checkpoint(debate_id)
        start_round = 1
        if checkpoint:
            start_round = checkpoint.get("last_completed_round", 0) + 1
            logger.info("Resuming debate %s from round %d", _correlation_token(debate_id), start_round)

        hook_result = await debate_hooks.run(HookContext(
            debate_id=debate_id, event=HookEvent.PRE_DEBATE,
            data={"topic": topic[:200], "models": model_ids, "round_count": round_count},
        ))
        if not hook_result.proceed:
            yield self._emit(DebateEventName.ERROR, {
                "message": hook_result.abort_reason or "Blocked by pre-debate hook",
                "recoverable": False,
            })
            return

        event = self._tracked_sse(DebateEventName.DEBATE_START, {
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

        self._subagent_context = ""
        if sub_agents:
            async for ev in self._iter_subagent_research(topic, model_ids, api_keys):
                yield ev

        effective_topic = self._subagent_context + topic if self._subagent_context else topic
        all_responses: dict[int, dict[str, str]] = {}
        effective_system = system_prompt or ROUND_1_SYSTEM

        try:
            async for ev in self._run_single_round(
                debate_id, 1, agents, effective_system, effective_topic, anon_map, all_responses,
            ):
                yield ev

            async for ev in self._iter_after_round_one(
                debate_id, topic, model_ids, agents, api_keys, anon_map, all_responses, round_count,
            ):
                yield ev
        except CancelledError:
            cost_summary = self.cost_tracker.to_dict()
            yield self._emit(DebateEventName.DEBATE_CANCELLED, {
                "debate_id": debate_id,
                "reason": "user",
                "partial_cost": cost_summary["total_cost"],
            })
            yield self._emit(DebateEventName.DONE, {"status": "cancelled", "debate_id": debate_id})

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
            lifecycle = self._lifecycle_registry.get(model_id)
            if lifecycle:
                lifecycle.mark_failed(round_number=round_number, detail=_log_exc(exc))
            task_entry = self._task_registry.get_by_agent_round(model_id, round_number) if self._task_registry else None
            if task_entry:
                task_entry.fail(_log_exc(exc))
            try:
                sentry_sdk.set_tag("failed_model", _correlation_token(model_id))
                _set_runtime_context()
            except Exception as tag_exc:
                logger.debug(
                    "Failed to set Sentry tag for model %s: %s",
                    _correlation_token(model_id), _log_exc(tag_exc),
                )
            events.append(self._emit(DebateEventName.AGENT_COMPLETE, {
                "agent_id": model_id,
                "round": round_number,
                "content": FALLBACK_RESPONSE,
            }, round_number=round_number))
            return True, events

        response_text, cost = result
        responses[model_id] = response_text
        lifecycle = self._lifecycle_registry.get(model_id)
        if lifecycle:
            lifecycle.mark_completed(round_number=round_number)
        task_entry = self._task_registry.get_by_agent_round(model_id, round_number) if self._task_registry else None
        if task_entry:
            task_entry.complete(response_text[:200], cost=cost)
        provider = get_provider_for_model(model_id)
        if provider:
            provider_health.record_success(provider)
        sentry_sdk.add_breadcrumb(
            category="debate",
            message=f"Agent {_correlation_token(model_id)} completed round {round_number}",
            level="info",
        )
        events.append(self._emit(DebateEventName.AGENT_COMPLETE, {
            "agent_id": model_id,
            "round": round_number,
            "content": responses[model_id][:200],
        }, round_number=round_number))
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
            lifecycle = self._lifecycle_registry.get(model_id)
            if lifecycle:
                lifecycle.mark_generating(round_number)
            prompt_hash = hashlib.sha256(user_prompt[:200].encode()).hexdigest()[:12]
            if self._task_registry:
                self._task_registry.create_task(model_id, round_number, prompt_hash)
            yield self._emit(DebateEventName.AGENT_START, {"agent_id": model_id, "round": round_number}, round_number=round_number)
            tasks[model_id] = asyncio.create_task(
                _call_agent(
                    agent, system_prompt, user_prompt, model_id, self.cost_tracker,
                    reasoning_effort=self._current_reasoning_effort,
                )
            )

        responses: dict[str, str] = {}

        while tasks:
            if await self._check_cancelled(debate_id):
                for task in tasks.values():
                    task.cancel()
                raise CancelledError(f"Debate {debate_id} was cancelled")

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
            reasoning_effort=self._current_reasoning_effort,
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
            reasoning_effort=self._current_reasoning_effort,
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
        yield self._emit(DebateEventName.JUDGE_START, {"description": "Synthesizing golden prompt"})

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
            yield self._emit(DebateEventName.JUDGE_RETRY, {
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

        yield self._emit(DebateEventName.CONSENSUS, {
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

        yield self._emit(DebateEventName.COST_UPDATE, cost_summary)

        round_1_responses = all_responses.get(1, {})
        duration_ms = int((time.time() - self._debate_start_time) * 1000) if self._debate_start_time else 0
        models_succeeded = [m for m, r in round_1_responses.items() if r != FALLBACK_RESPONSE]
        models_failed = [m for m, r in round_1_responses.items() if r == FALLBACK_RESPONSE]

        done_event = self._tracked_sse(DebateEventName.DONE, {
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
        self._journal_log(DebateEventName.DONE, {
            "status": "completed",
            "debate_id": debate_id,
            "total_cost": cost_summary["total_cost"],
            "duration_ms": duration_ms,
        })
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

    def create_snapshot(
        self,
        debate_id: str,
        all_responses: dict[int, dict[str, str]],
        round_count: int,
    ) -> DebateSnapshot:
        return DebateSnapshot(
            debate_id=debate_id,
            topic=self._current_topic,
            model_ids=list(self._current_model_ids),
            all_responses=all_responses,
            round_count=round_count,
            system_prompt=self._current_system_prompt,
            sub_agents=self._current_sub_agents,
            project_context=self._current_project_context,
            cost_so_far=self.cost_tracker.to_dict().get("total_cost", 0.0),
        )

    def fork_at_round(
        self,
        debate_id: str,
        fork_round: int,
        all_responses: dict[int, dict[str, str]],
        round_count: int,
        reason: str | None = None,
    ) -> tuple[str, DebateSnapshot]:
        snapshot = self.create_snapshot(debate_id, all_responses, round_count)
        fork_debate_id, forked = self._fork_manager.create_fork(
            parent_debate_id=debate_id,
            fork_round=fork_round,
            snapshot=snapshot,
            reason=reason,
        )
        self._journal_log(DebateEventName.DEBATE_START, {
            "fork_debate_id": fork_debate_id,
            "parent_debate_id": debate_id,
            "fork_round": fork_round,
            "reason": reason,
        })
        return fork_debate_id, forked

    def get_fork_lineage(self, debate_id: str) -> list[str]:
        return self._fork_manager.get_lineage(debate_id)
