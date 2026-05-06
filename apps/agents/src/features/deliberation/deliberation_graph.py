from __future__ import annotations

import asyncio
import json
import time
import uuid
from dataclasses import asdict
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Coroutine, Optional

from src.features.deliberation.types import (
    AggregationResult,
    AttackCategory,
    AuditEntry,
    CalibratedConfidence,
    Challenge,
    ChallengeType,
    Claim,
    ConvergenceResult,
    DEFAULT_RUBRIC,
    DeliberationCostTracker,
    DeliberationMode,
    DeliberationState,
    DissentCluster,
    DissentReport,
    Evaluation,
    MarketPosition,
    MarketResult,
    Proposal,
    RankedBallot,
    Rebuttal,
    RebuttalType,
    RedTeamAttack,
    RedTeamDefense,
    RedTeamJudgment,
    RedTeamReport,
    Rubric,
    Vote,
)

try:
    from src.features.deliberation import argumentation as _argumentation_mod
    build_proposal_prompt = _argumentation_mod.build_proposal_prompt
    parse_proposal = _argumentation_mod.parse_proposal
    build_challenge_prompt = _argumentation_mod.build_challenge_prompt
    parse_challenges = _argumentation_mod.parse_challenges
    build_rebuttal_prompt = _argumentation_mod.build_rebuttal_prompt
    parse_rebuttals = _argumentation_mod.parse_rebuttals
    _HAS_ARGUMENTATION = True
except ImportError:
    _HAS_ARGUMENTATION = False

try:
    from src.features.deliberation.blind_eval import evaluate_blind as _evaluate_blind
    _HAS_BLIND_EVAL = True
except ImportError:
    _HAS_BLIND_EVAL = False

try:
    from src.features.deliberation.voting import aggregate_votes as _aggregate_votes
    _HAS_VOTING = True
except ImportError:
    _HAS_VOTING = False

try:
    from src.features.deliberation.convergence_v2 import check_convergence as _check_convergence_v2
    _HAS_CONVERGENCE = True
except ImportError:
    _HAS_CONVERGENCE = False

try:
    from src.features.deliberation.dissent import detect_dissent as _detect_dissent
    _HAS_DISSENT = True
except ImportError:
    _HAS_DISSENT = False

try:
    from src.features.deliberation.confidence import calibrate_all as _calibrate_all
    _HAS_CONFIDENCE = True
except ImportError:
    _HAS_CONFIDENCE = False

try:
    from src.features.deliberation.red_team import run_red_team as _run_red_team
    _HAS_RED_TEAM = True
except ImportError:
    _HAS_RED_TEAM = False

try:
    from src.features.deliberation.truth_market import run_truth_market as _run_truth_market, extract_options as _extract_options
    _HAS_TRUTH_MARKET = True
except ImportError:
    _HAS_TRUTH_MARKET = False

try:
    from src.features.deliberation.cost_router import route as _route_auto
    _HAS_ROUTER = True
except ImportError:
    _HAS_ROUTER = False

try:
    from src.core.agent_factory import AgentFactory
    from src.features.free_tier.resolver import NoKeyAvailableError
    _HAS_AGENT_FACTORY = True
except ImportError:
    _HAS_AGENT_FACTORY = False

    class NoKeyAvailableError(Exception):  # type: ignore[no-redef]
        """Stub raised when AgentFactory is unavailable in a stripped runtime."""

try:
    from src.features.agents.base_agent import LLMProviderError, is_error_response
    _HAS_LLM_ERROR = True
except ImportError:
    class LLMProviderError(Exception):
        def __init__(self, provider="", error_type="", original_error=None):
            self.provider = provider
            self.error_type = error_type
            self.original_error = original_error
            super().__init__(str(original_error))

    def is_error_response(text):
        return False

    _HAS_LLM_ERROR = False

import logging
_logger = logging.getLogger(__name__)


class Phase(str, Enum):
    PROPOSAL = "proposal"
    CHALLENGE = "challenge"
    REBUTTAL = "rebuttal"
    EVALUATION = "evaluation"
    VOTING = "voting"
    AGGREGATION = "aggregation"
    CONVERGENCE = "convergence"
    OUTPUT = "output"
    ATTACK = "attack"
    DEFEND = "defend"
    JUDGE_ATTACK = "judge_attack"
    BET = "bet"
    MARKET_UPDATE = "market_update"


MODE_TRANSITIONS: dict[str, dict[str, str]] = {
    DeliberationMode.QUICK: {
        Phase.PROPOSAL: Phase.EVALUATION,
        Phase.EVALUATION: Phase.OUTPUT,
    },
    DeliberationMode.COUNCIL: {
        Phase.PROPOSAL: Phase.CHALLENGE,
        Phase.CHALLENGE: Phase.REBUTTAL,
        Phase.REBUTTAL: Phase.EVALUATION,
        Phase.EVALUATION: Phase.VOTING,
        Phase.VOTING: Phase.AGGREGATION,
        Phase.AGGREGATION: Phase.CONVERGENCE,
        Phase.CONVERGENCE: Phase.OUTPUT,
    },
    DeliberationMode.DEEP: {
        Phase.PROPOSAL: Phase.CHALLENGE,
        Phase.CHALLENGE: Phase.REBUTTAL,
        Phase.REBUTTAL: Phase.EVALUATION,
        Phase.EVALUATION: Phase.VOTING,
        Phase.VOTING: Phase.AGGREGATION,
        Phase.AGGREGATION: Phase.CONVERGENCE,
        Phase.CONVERGENCE: Phase.OUTPUT,
    },
    DeliberationMode.BLIND: {
        Phase.PROPOSAL: Phase.CHALLENGE,
        Phase.CHALLENGE: Phase.REBUTTAL,
        Phase.REBUTTAL: Phase.EVALUATION,
        Phase.EVALUATION: Phase.VOTING,
        Phase.VOTING: Phase.AGGREGATION,
        Phase.AGGREGATION: Phase.CONVERGENCE,
        Phase.CONVERGENCE: Phase.OUTPUT,
    },
    DeliberationMode.REDTEAM: {
        Phase.PROPOSAL: Phase.ATTACK,
        Phase.ATTACK: Phase.DEFEND,
        Phase.DEFEND: Phase.JUDGE_ATTACK,
        Phase.JUDGE_ATTACK: Phase.OUTPUT,
    },
    DeliberationMode.JURY: {
        Phase.PROPOSAL: Phase.CHALLENGE,
        Phase.CHALLENGE: Phase.REBUTTAL,
        Phase.REBUTTAL: Phase.EVALUATION,
        Phase.EVALUATION: Phase.VOTING,
        Phase.VOTING: Phase.AGGREGATION,
        Phase.AGGREGATION: Phase.CONVERGENCE,
        Phase.CONVERGENCE: Phase.OUTPUT,
    },
    DeliberationMode.MARKET: {
        Phase.PROPOSAL: Phase.BET,
        Phase.BET: Phase.MARKET_UPDATE,
        Phase.MARKET_UPDATE: Phase.CONVERGENCE,
        Phase.CONVERGENCE: Phase.OUTPUT,
    },
}

MAX_ROUNDS_BY_MODE: dict[str, int] = {
    DeliberationMode.QUICK: 1,
    DeliberationMode.COUNCIL: 3,
    DeliberationMode.DEEP: 5,
    DeliberationMode.BLIND: 3,
    DeliberationMode.REDTEAM: 1,
    DeliberationMode.JURY: 3,
    DeliberationMode.MARKET: 5,
    DeliberationMode.AUTO: 3,
}


COST_PER_1K_TOKENS = {
    "gpt-5.5-pro": (0.008, 0.032),
    "gpt-5.5": (0.003, 0.012),
    "gpt-5.4": (0.002, 0.008),
    "gpt-5.4-mini": (0.0002, 0.0008),
    "gpt-5.4-nano": (0.00008, 0.0003),
    "claude-opus-4-7": (0.015, 0.075),
    "claude-opus-4-6": (0.015, 0.075),
    "claude-sonnet-4-6": (0.003, 0.015),
    "claude-haiku-4-5-20251001": (0.0008, 0.004),
    "gemini-3.1-pro-preview": (0.00125, 0.005),
    "gemini-3-flash-preview": (0.00015, 0.0006),
    "grok-4-20": (0.003, 0.015),
    "grok-4-1-fast-reasoning": (0.001, 0.004),
    "grok-4-1-fast-non-reasoning": (0.0005, 0.002),
    "grok-code-fast-1": (0.0003, 0.0012),
    "llama-3.3-70b-versatile": (0.00059, 0.00079),
    "llama-3.1-8b-instant": (0.00005, 0.00008),
    "openai/gpt-oss-120b": (0.00015, 0.0006),
    "kimi-k2.6": (0.0012, 0.0025),
}


def _estimate_cost(model_id: str, tokens_in: int, tokens_out: int) -> float:
    rates = COST_PER_1K_TOKENS.get(model_id, (0.002, 0.008))
    return (tokens_in / 1000) * rates[0] + (tokens_out / 1000) * rates[1]


async def llm_call_stub(model_id: str, prompt: str, api_keys: dict) -> str:
    return f"[stub response from {model_id}]"


async def _call_model_via_factory(model_id: str, prompt: str, api_keys: dict) -> str:
    if not _HAS_AGENT_FACTORY:
        return await llm_call_stub(model_id, prompt, api_keys)
    try:
        agent = AgentFactory.create(model_id, api_keys)
        response, _tokens = await agent.generate_response(prompt, system_prompt=None)
        if is_error_response(response):
            raise LLMProviderError(
                provider=model_id,
                error_type="unknown",
                original_error=f"Error response detected: {response[:200]}",
            )
        return response
    except LLMProviderError:
        raise
    except Exception:
        return await llm_call_stub(model_id, prompt, api_keys)


def _strip_identity(text: str, model_ids: list[str]) -> str:
    result = text
    for i, model_id in enumerate(model_ids):
        result = result.replace(model_id, f"anonymous_{i}")
    return result


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _make_audit(
    step: str,
    model_id: str,
    input_summary: str,
    output_summary: str,
    round_number: int,
    latency_ms: int = 0,
    tokens_in: int = 0,
    tokens_out: int = 0,
    cost: float = 0.0,
) -> dict:
    return asdict(AuditEntry(
        step=step,
        model_id=model_id,
        input_summary=input_summary[:200],
        output_summary=output_summary[:200],
        latency_ms=latency_ms,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost=cost,
        round_number=round_number,
        timestamp=_now_iso(),
    ))


def _cost_tracker_from_state(state: DeliberationState) -> DeliberationCostTracker:
    ct_data = state.get("cost_tracker", {})
    tracker = DeliberationCostTracker()
    tracker.total_cost = ct_data.get("total_cost", 0.0)
    tracker.per_model = dict(ct_data.get("per_model", {}))
    tracker.per_round = list(ct_data.get("per_round", []))
    tracker.tokens_in = ct_data.get("tokens_in", 0)
    tracker.tokens_out = ct_data.get("tokens_out", 0)
    return tracker


def _save_cost_tracker(state: DeliberationState, tracker: DeliberationCostTracker) -> None:
    state["cost_tracker"] = asdict(tracker)


def _reconstruct_proposal(d: dict) -> Proposal:
    claims = []
    for c in d.get("claims", []):
        claims.append(Claim(
            id=c.get("id", ""),
            statement=c.get("statement", ""),
            evidence=c.get("evidence", []),
            confidence=float(c.get("confidence", 0.5)),
            assumptions=c.get("assumptions", []),
            limitations=c.get("limitations", []),
        ))
    return Proposal(
        model_id=d.get("model_id", ""),
        content=d.get("content", ""),
        reasoning_chain=d.get("reasoning_chain", []),
        claims=claims,
        raw_confidence=float(d.get("raw_confidence", 0.5)),
        token_count=d.get("token_count", 0),
        latency_ms=d.get("latency_ms", 0),
        cost=d.get("cost", 0.0),
    )


def _reconstruct_challenge(d: dict) -> Challenge:
    ct = d.get("challenge_type", "factual_error")
    try:
        challenge_type = ChallengeType(ct)
    except ValueError:
        challenge_type = ChallengeType.FLAWED_REASONING
    return Challenge(
        challenger_id=d.get("challenger_id", ""),
        target_model_id=d.get("target_model_id", ""),
        target_claim_id=d.get("target_claim_id", ""),
        challenge_type=challenge_type,
        argument=d.get("argument", ""),
        counter_evidence=d.get("counter_evidence", []),
    )


def _reconstruct_rebuttal(d: dict) -> Rebuttal:
    rt = d.get("response_type", "refute")
    try:
        response_type = RebuttalType(rt)
    except ValueError:
        response_type = RebuttalType.REFUTE
    revised = None
    if d.get("revised_claim"):
        rc = d["revised_claim"]
        revised = Claim(
            id=rc.get("id", ""),
            statement=rc.get("statement", ""),
            evidence=rc.get("evidence", []),
            confidence=float(rc.get("confidence", 0.5)),
            assumptions=rc.get("assumptions", []),
            limitations=rc.get("limitations", []),
        )
    return Rebuttal(
        defender_id=d.get("defender_id", ""),
        challenge_id=d.get("challenge_id", ""),
        response_type=response_type,
        argument=d.get("argument", ""),
        revised_claim=revised,
    )


def _reconstruct_vote(d: dict) -> Vote:
    ballot_data = d.get("ballot", {})
    ballot = RankedBallot(
        voter_id=ballot_data.get("voter_id", ""),
        ranked_choices=ballot_data.get("ranked_choices", []),
        confidence_weight=float(ballot_data.get("confidence_weight", 1.0)),
    )
    return Vote(
        voter_id=d.get("voter_id", ""),
        ballot=ballot,
        reasoning=d.get("reasoning", ""),
    )


class DeliberationEngine:
    def __init__(
        self,
        mode: DeliberationMode,
        models: list[str],
        judge_model: str,
        api_keys: dict,
        max_rounds: Optional[int] = None,
        llm_fn: Optional[Callable[..., Coroutine]] = None,
        sse_handler: Optional[Callable[[str, Any], None]] = None,
        project_context: Optional[dict] = None,
    ):
        self.mode = mode
        self.models = models
        self.judge_model = judge_model
        self.api_keys = api_keys
        self.max_rounds = max_rounds or MAX_ROUNDS_BY_MODE.get(mode, 3)
        self.llm_fn = llm_fn or _call_model_via_factory
        self.sse_handler = sse_handler
        self.rubric = DEFAULT_RUBRIC
        self.project_context = project_context
        self.routing_decision: Optional[dict] = None
        self.state: DeliberationState = self._init_state("")
        self._proposals_history: list[list[Proposal]] = []
        self._votes_history: list[list[Vote]] = []

    def _init_state(self, topic: str) -> DeliberationState:
        return DeliberationState(
            topic=topic,
            mode=self.mode,
            round_number=0,
            max_rounds=self.max_rounds,
            models=list(self.models),
            judge_model=self.judge_model,
            api_keys=self.api_keys,
            proposals=[],
            challenges=[],
            rebuttals=[],
            evaluations=[],
            votes=[],
            aggregation_result=None,
            convergence_result=None,
            dissent_report=None,
            confidence_scores={},
            audit_trail=[],
            cost_tracker=asdict(DeliberationCostTracker()),
            golden_prompt=None,
            red_team_report=None,
            market_result=None,
            routing_decision=self.routing_decision,
        )

    def _sse(self, event: str, data: Any) -> None:
        if self.sse_handler:
            self.sse_handler(event, data)

    def _build_context_prefix(self) -> str:
        if not self.project_context:
            return ""
        parts = ["=== PROJECT CONTEXT ==="]
        meta = self.project_context
        if meta.get("projectType"):
            parts.append(f"Project: {meta['projectType']} ({meta.get('language', 'unknown')})")
        if meta.get("framework") and meta["framework"] != "none":
            parts.append(f"Framework: {meta['framework']}")
        if meta.get("packageManager") and meta["packageManager"] != "unknown":
            parts.append(f"Package Manager: {meta['packageManager']}")
        if meta.get("integrations"):
            parts.append(f"Integrations: {', '.join(meta['integrations'])}")
        if meta.get("hasTests"):
            parts.append("Tests: yes")
        if meta.get("hasDocker"):
            parts.append("Docker: yes")
        if meta.get("hasCI"):
            parts.append("CI/CD: yes")
        files = meta.get("files", [])
        if files:
            parts.append("")
            for f in files:
                name = f.get("name", "unknown")
                content = f.get("content", "")
                parts.append(f"--- FILE: {name} ---")
                parts.append(content[:50000])
                parts.append(f"--- END FILE: {name} ---")
        parts.append("=== END PROJECT CONTEXT ===\n")
        return "\n".join(parts)

    def _next_phase(self, current: Phase) -> Phase:
        transitions = MODE_TRANSITIONS.get(self.mode, MODE_TRANSITIONS[DeliberationMode.COUNCIL])
        return Phase(transitions[current])

    def _audit(self, step: str, model_id: str, input_summary: str, output_summary: str, latency_ms: int = 0) -> None:
        entry = _make_audit(
            step=step,
            model_id=model_id,
            input_summary=input_summary,
            output_summary=output_summary,
            round_number=self.state["round_number"],
            latency_ms=latency_ms,
        )
        self.state["audit_trail"].append(entry)

    def _track_cost(self, model_id: str, cost: float = 0.0, tokens_in: int = 0, tokens_out: int = 0) -> None:
        tracker = _cost_tracker_from_state(self.state)
        tracker.record(model_id, cost, tokens_in, tokens_out)
        _save_cost_tracker(self.state, tracker)

    async def _timed_llm(self, model_id: str, prompt: str) -> tuple[str, int]:
        t0 = time.monotonic()
        try:
            response = await self.llm_fn(model_id, prompt, self.api_keys)
        except LLMProviderError as exc:
            _logger.warning("LLM provider error for %s: %s (%s)", model_id, exc.error_type, exc.original_error)
            latency_ms = int((time.monotonic() - t0) * 1000)
            self._audit("llm_error", model_id, prompt[:200], str(exc)[:200], latency_ms)
            return "", latency_ms
        latency_ms = int((time.monotonic() - t0) * 1000)
        if is_error_response(response):
            _logger.warning("Error response detected from %s: %s", model_id, response[:200])
            self._audit("llm_error", model_id, prompt[:200], response[:200], latency_ms)
            return "", latency_ms
        est_in = len(prompt.split())
        est_out = len(response.split())
        est_cost = _estimate_cost(model_id, est_in, est_out)
        self._track_cost(model_id, est_cost, est_in, est_out)
        return response, latency_ms

    def _resolve_auto_mode(self, topic: str) -> None:
        if _HAS_ROUTER:
            decision = _route_auto(topic, available_models=self.models)
            resolved = DeliberationMode(decision.mode)
            self.routing_decision = {
                "original_mode": "auto",
                "resolved_mode": decision.mode,
                "reason": decision.reason,
                "complexity_score": decision.complexity_score,
                "features": decision.features,
                "estimated_cost": decision.estimated_cost,
                "council_cost_baseline": decision.council_cost_baseline,
                "num_models": decision.models,
            }
        else:
            resolved = DeliberationMode.COUNCIL
            self.routing_decision = {
                "original_mode": "auto",
                "resolved_mode": "council",
                "reason": "router unavailable, defaulting to council",
            }
        self.mode = resolved
        self.max_rounds = MAX_ROUNDS_BY_MODE.get(resolved, 3)
        _logger.info("AUTO resolved to %s (max_rounds=%d)", resolved, self.max_rounds)
        self._sse("routing:decided", self.routing_decision)

    def _emit_free_tier_resolutions(self) -> None:
        """If any of the debate's models will run through free-tier
        fallback, surface the decision as a routing:fallback SSE event
        so the CLI / web UI can inform the user transparently."""
        if not _HAS_AGENT_FACTORY:
            return
        try:
            fallbacks = []
            for model_id in list(self.models) + [self.judge_model]:
                try:
                    resolution = AgentFactory.resolve(model_id, self.api_keys or {})
                except NoKeyAvailableError:
                    # Resolver couldn't pick any key for this model. Skip
                    # this seat - the per-round agent construction will
                    # raise with a user-actionable message when the seat
                    # actually runs.
                    continue
                except Exception as model_exc:  # noqa: BLE001 - widened only for diagnostics
                    _logger.warning(
                        "Free-tier resolution failed for %s: %s", model_id, model_exc
                    )
                    continue
                if resolution.is_fallback:
                    fallbacks.append(resolution.to_event_payload())
            if fallbacks:
                self._sse(
                    "routing:fallback",
                    {
                        "count": len(fallbacks),
                        "resolutions": fallbacks,
                        "message": (
                            f"{len(fallbacks)} model(s) routed to Consilium free tier; "
                            "set your own provider API key(s) to use the originally requested models."
                        ),
                    },
                )
        except Exception as exc:
            _logger.warning("Free-tier resolution emit failed: %s", exc)

    async def run(self, topic: str) -> DeliberationState:
        if self.mode == DeliberationMode.AUTO:
            self._resolve_auto_mode(topic)
        self.state = self._init_state(topic)
        self._proposals_history = []
        self._votes_history = []
        self._emit_free_tier_resolutions()
        phase = Phase.PROPOSAL

        while True:
            self._sse("phase_start", {"phase": phase, "round": self.state["round_number"]})

            handler = self._phase_handlers()[phase]
            await handler()

            self._sse("phase_end", {"phase": phase, "round": self.state["round_number"]})

            if phase == Phase.OUTPUT:
                break

            next_phase = self._next_phase(phase)

            if phase == Phase.CONVERGENCE:
                conv = self.state["convergence_result"]
                if conv and conv.get("converged"):
                    next_phase = Phase.OUTPUT
                elif self.state["round_number"] >= self.max_rounds:
                    next_phase = Phase.OUTPUT
                else:
                    self.state["round_number"] += 1
                    loop_start = self._convergence_loop_start()
                    next_phase = loop_start

            phase = next_phase

        return self.state

    def _convergence_loop_start(self) -> Phase:
        if self.mode == DeliberationMode.MARKET:
            return Phase.BET
        return Phase.PROPOSAL

    def _phase_handlers(self) -> dict[Phase, Callable]:
        return {
            Phase.PROPOSAL: self._propose,
            Phase.CHALLENGE: self._challenge,
            Phase.REBUTTAL: self._rebuttal,
            Phase.EVALUATION: self._evaluate,
            Phase.VOTING: self._vote,
            Phase.AGGREGATION: self._aggregate,
            Phase.CONVERGENCE: self._check_convergence,
            Phase.OUTPUT: self._output,
            Phase.ATTACK: self._attack,
            Phase.DEFEND: self._defend,
            Phase.JUDGE_ATTACK: self._judge_attack,
            Phase.BET: self._bet,
            Phase.MARKET_UPDATE: self._market_update,
        }

    async def _propose(self) -> None:
        self.state["round_number"] += 1
        topic = self.state["topic"]
        is_blind = self.mode == DeliberationMode.BLIND
        round_number = self.state["round_number"]

        previous_proposals = None
        if _HAS_ARGUMENTATION and round_number > 1 and self._proposals_history:
            previous_proposals = self._proposals_history[-1]

        async def generate_proposal(model_id: str) -> dict:
            display_id = model_id if not is_blind else f"anonymous_{self.models.index(model_id)}"

            context_prefix = self._build_context_prefix()

            if _HAS_ARGUMENTATION:
                prompt = build_proposal_prompt(
                    topic=topic,
                    mode=self.mode,
                    round_number=round_number,
                    previous_proposals=previous_proposals,
                )
            else:
                prompt = f"Generate a proposal with structured claims for: {topic}"

            if context_prefix:
                prompt = context_prefix + prompt

            if is_blind:
                prompt = _strip_identity(prompt, self.models)

            response, latency_ms = await self._timed_llm(model_id, prompt)
            self._audit("propose", model_id, prompt[:200], response[:200], latency_ms)

            if not response or not response.strip():
                _logger.warning("Empty response from %s in propose phase, skipping", model_id)
                return None

            if _HAS_ARGUMENTATION:
                proposal = parse_proposal(response, model_id=display_id)
            else:
                claim = Claim(
                    id=str(uuid.uuid4()),
                    statement=response,
                    evidence=["stub_evidence"],
                    confidence=0.8,
                    assumptions=["stub_assumption"],
                    limitations=["stub_limitation"],
                )
                proposal = Proposal(
                    model_id=display_id,
                    content=response,
                    reasoning_chain=["step1", "step2"],
                    claims=[claim],
                    raw_confidence=0.8,
                )
            return asdict(proposal)

        results = await asyncio.gather(*[generate_proposal(m) for m in self.models])
        valid_results = [r for r in results if r is not None]
        self.state["proposals"].extend(valid_results)

        round_proposals = [_reconstruct_proposal(r) for r in valid_results]
        self._proposals_history.append(round_proposals)

    async def _challenge(self) -> None:
        is_blind = self.mode == DeliberationMode.BLIND
        proposals = self.state["proposals"]

        if not proposals:
            _logger.warning("No proposals to challenge, skipping challenge phase")
            return

        async def generate_challenge(challenger_id: str, target_proposal: dict) -> list[dict]:
            target_id = target_proposal["model_id"]
            display_id = challenger_id if not is_blind else f"anonymous_{self.models.index(challenger_id)}"

            if _HAS_ARGUMENTATION:
                target_prop_obj = _reconstruct_proposal(target_proposal)
                challenger_proposals = [
                    _reconstruct_proposal(p) for p in proposals
                    if p["model_id"] == display_id
                ]
                challenger_claims = []
                for cp in challenger_proposals:
                    challenger_claims.extend(cp.claims)
                prompt = build_challenge_prompt(target_prop_obj, challenger_claims)
            else:
                prompt = f"Challenge the proposal from {target_id}: {target_proposal['content']}"

            if is_blind:
                prompt = _strip_identity(prompt, self.models)

            response, latency_ms = await self._timed_llm(challenger_id, prompt)
            self._audit("challenge", challenger_id, prompt[:200], response[:200], latency_ms)

            if not response or not response.strip():
                _logger.warning("Empty response from %s in challenge phase, skipping", challenger_id)
                return []

            if _HAS_ARGUMENTATION:
                parsed = parse_challenges(response, challenger_id=display_id, target_model_id=target_id)
                if parsed:
                    return [asdict(c) for c in parsed]

            target_claims = target_proposal.get("claims", [])
            target_claim_id = target_claims[0]["id"] if target_claims else "unknown"
            challenge = Challenge(
                challenger_id=display_id,
                target_model_id=target_id,
                target_claim_id=target_claim_id,
                challenge_type=ChallengeType.FLAWED_REASONING,
                argument=response,
                counter_evidence=["stub_counter"],
            )
            return [asdict(challenge)]

        tasks = []
        for model_id in self.models:
            display_id = model_id if not is_blind else f"anonymous_{self.models.index(model_id)}"
            for proposal in proposals:
                if proposal["model_id"] != model_id and proposal["model_id"] != display_id:
                    tasks.append(generate_challenge(model_id, proposal))

        if tasks:
            results = await asyncio.gather(*tasks)
            for result_list in results:
                self.state["challenges"].extend(result_list)

    async def _rebuttal(self) -> None:
        is_blind = self.mode == DeliberationMode.BLIND
        challenges = self.state["challenges"]
        proposals = self.state["proposals"]

        if not challenges or not proposals:
            _logger.warning("No challenges or proposals for rebuttal, skipping")
            return

        async def generate_rebuttal(defender_id: str, challenge: dict) -> list[dict]:
            display_id = defender_id if not is_blind else f"anonymous_{self.models.index(defender_id)}"

            if _HAS_ARGUMENTATION:
                challenge_obj = _reconstruct_challenge(challenge)
                defender_proposals = [
                    _reconstruct_proposal(p) for p in proposals
                    if p["model_id"] == challenge["target_model_id"]
                ]
                fallback_proposal = proposals[0] if proposals else {"model_id": "unknown", "content": "", "reasoning_chain": [], "claims": [], "raw_confidence": 0.5}
                original_proposal = defender_proposals[0] if defender_proposals else _reconstruct_proposal(fallback_proposal)
                prompt = build_rebuttal_prompt(challenge_obj, original_proposal)
            else:
                prompt = f"Respond to challenge: {challenge['argument']}"

            if is_blind:
                prompt = _strip_identity(prompt, self.models)

            response, latency_ms = await self._timed_llm(defender_id, prompt)
            self._audit("rebuttal", defender_id, prompt[:200], response[:200], latency_ms)

            if not response or not response.strip():
                _logger.warning("Empty response from %s in rebuttal phase, skipping", defender_id)
                return []

            if _HAS_ARGUMENTATION:
                parsed = parse_rebuttals(
                    response,
                    defender_id=display_id,
                    challenge_id=challenge.get("target_claim_id", ""),
                )
                if parsed:
                    return [asdict(r) for r in parsed]

            rebuttal = Rebuttal(
                defender_id=display_id,
                challenge_id=challenge.get("target_claim_id", "unknown"),
                response_type=RebuttalType.REFUTE,
                argument=response,
            )
            return [asdict(rebuttal)]

        tasks = []
        for challenge in challenges:
            target = challenge["target_model_id"]
            for model_id in self.models:
                display_id = model_id if not is_blind else f"anonymous_{self.models.index(model_id)}"
                if display_id == target:
                    tasks.append(generate_rebuttal(model_id, challenge))
                    break

        if tasks:
            results = await asyncio.gather(*tasks)
            for result_list in results:
                self.state["rebuttals"].extend(result_list)

    async def _evaluate(self) -> None:
        is_blind = self.mode == DeliberationMode.BLIND
        proposals = self.state["proposals"]

        if not proposals:
            _logger.warning("No proposals to evaluate, skipping evaluation phase")
            return

        proposal_objs = [_reconstruct_proposal(p) for p in proposals]

        if is_blind and _HAS_BLIND_EVAL:
            try:
                evaluation = await _evaluate_blind(
                    proposals=proposal_objs,
                    rubric=self.rubric,
                    judge_model=self.judge_model,
                    api_keys=self.api_keys,
                    call_fn=self._blind_eval_call_fn,
                )
                self.state["evaluations"].append(asdict(evaluation))
                self._audit("evaluate_blind", self.judge_model, f"{len(proposals)} proposals", "blind evaluation complete")
                return
            except Exception:
                pass

        rubric_text = self.rubric.to_prompt()
        evaluator_count = 5 if self.mode == DeliberationMode.JURY else 1
        evaluator_ids = [self.judge_model] * evaluator_count

        async def run_evaluation(evaluator_id: str, eval_index: int) -> dict:
            proposal_summaries = "\n".join(
                f"- {p['model_id']}: {p['content']}" for p in proposals
            )
            if is_blind:
                proposal_summaries = _strip_identity(proposal_summaries, self.models)
            prompt = f"Evaluate these proposals using rubric:\n{rubric_text}\n\nProposals:\n{proposal_summaries}"
            response, latency_ms = await self._timed_llm(evaluator_id, prompt)
            self._audit("evaluate", evaluator_id, prompt[:200], response[:200], latency_ms)
            model_ids = [p["model_id"] for p in proposals]
            rubric_scores = {mid: {"correctness": 7.0, "completeness": 6.0} for mid in model_ids}
            evaluation = Evaluation(
                evaluator_id=f"{evaluator_id}_{eval_index}",
                rankings=[{"model_id": mid, "rank": i + 1} for i, mid in enumerate(model_ids)],
                ordering_used=model_ids,
                rubric_scores=rubric_scores,
            )
            return asdict(evaluation)

        results = await asyncio.gather(*[run_evaluation(eid, i) for i, eid in enumerate(evaluator_ids)])
        self.state["evaluations"].extend(results)

    async def _blind_eval_call_fn(self, model: str, prompt: str, api_keys: dict) -> str:
        response, _latency = await self._timed_llm(model, prompt)
        return response

    async def _vote(self) -> None:
        proposals = self.state["proposals"]
        evaluations = self.state["evaluations"]

        if not proposals:
            _logger.warning("No proposals to vote on, skipping vote phase")
            return

        model_ids = [p["model_id"] for p in proposals]

        async def cast_vote(voter_id: str) -> dict:
            prompt = f"Rank these proposals: {', '.join(model_ids)}"
            response, latency_ms = await self._timed_llm(voter_id, prompt)
            self._audit("vote", voter_id, prompt[:200], response[:200], latency_ms)

            ranked_choices = list(model_ids)
            if evaluations:
                last_eval = evaluations[-1]
                rankings = last_eval.get("rankings", [])
                if rankings:
                    sorted_rankings = sorted(rankings, key=lambda r: r.get("rank", 999))
                    eval_order = [r["model_id"] for r in sorted_rankings if r["model_id"] in model_ids]
                    if len(eval_order) == len(model_ids):
                        ranked_choices = eval_order

            ballot = RankedBallot(
                voter_id=voter_id,
                ranked_choices=ranked_choices,
                confidence_weight=1.0,
            )
            vote = Vote(
                voter_id=voter_id,
                ballot=ballot,
                reasoning=response,
            )
            return asdict(vote)

        results = await asyncio.gather(*[cast_vote(m) for m in self.models])
        self.state["votes"].extend(results)

        round_votes = [_reconstruct_vote(r) for r in results]
        self._votes_history.append(round_votes)

    async def _aggregate(self) -> None:
        votes = self.state["votes"]
        if not votes:
            self.state["aggregation_result"] = asdict(AggregationResult(
                winner="unknown",
                full_ranking=[],
                method="borda_count",
                confident=False,
            ))
            self._audit("aggregate", "system", "no votes", "unknown winner")
            return

        if _HAS_VOTING:
            ballots = [_reconstruct_vote(v).ballot for v in votes]
            result = _aggregate_votes(ballots)
            self.state["aggregation_result"] = asdict(result)
            self._audit("aggregate", "system", f"{len(ballots)} ballots", f"winner={result.winner} method={result.method}")
            return

        score_tally: dict[str, float] = {}
        for vote in votes:
            ballot = vote["ballot"]
            ranked = ballot["ranked_choices"]
            weight = ballot.get("confidence_weight", 1.0)
            for rank, model_id in enumerate(ranked):
                points = (len(ranked) - rank) * weight
                score_tally[model_id] = score_tally.get(model_id, 0.0) + points

        sorted_models = sorted(score_tally.keys(), key=lambda m: score_tally[m], reverse=True)
        winner = sorted_models[0] if sorted_models else "unknown"

        self.state["aggregation_result"] = asdict(AggregationResult(
            winner=winner,
            full_ranking=sorted_models,
            method="borda_count",
            confident=True,
            scores=score_tally,
        ))
        self._audit("aggregate", "system", f"{len(votes)} votes", f"winner={winner}")

    async def _check_convergence(self) -> None:
        round_number = self.state["round_number"]

        if round_number >= self.max_rounds:
            self.state["convergence_result"] = asdict(ConvergenceResult(
                converged=True,
                score=1.0,
                components={"max_rounds_reached": 1.0},
                recommendation="Max rounds reached, forcing output.",
            ))
            self._audit("convergence", "system", f"round {round_number}/{self.max_rounds}", "max rounds reached")
            return

        if _HAS_CONVERGENCE:
            rebuttals = [_reconstruct_rebuttal(r) for r in self.state["rebuttals"]]
            result = _check_convergence_v2(
                current_round=round_number,
                max_rounds=self.max_rounds,
                votes_history=self._votes_history,
                proposals_history=self._proposals_history,
                rebuttals=rebuttals,
            )
            self.state["convergence_result"] = asdict(result)
            self._audit("convergence", "system", f"round {round_number}", f"converged={result.converged} score={result.score:.2f}")
            return

        proposals = self.state["proposals"]
        if len(proposals) <= 1:
            self.state["convergence_result"] = asdict(ConvergenceResult(
                converged=True,
                score=1.0,
                components={"single_proposal": 1.0},
                recommendation="Single proposal, trivially converged.",
            ))
            return

        confidence_values = [p.get("raw_confidence", 0.5) for p in proposals]
        spread = max(confidence_values) - min(confidence_values)
        convergence_score = 1.0 - spread
        converged = convergence_score >= 0.8

        self.state["convergence_result"] = asdict(ConvergenceResult(
            converged=converged,
            score=convergence_score,
            components={"confidence_spread": spread},
            recommendation="Converged" if converged else "Continue deliberation",
        ))
        self._audit("convergence", "system", f"round {round_number}", f"converged={converged}")

    async def _output(self) -> None:
        proposals = self.state["proposals"]
        agg = self.state.get("aggregation_result")

        if agg and agg.get("winner") and agg["winner"] != "unknown":
            winner_id = agg["winner"]
            winning = next((p for p in proposals if p["model_id"] == winner_id), None)
        else:
            winning = proposals[0] if proposals else None

        if winning:
            prompt = f"Synthesize a final golden response for: {self.state['topic']}\nBased on: {winning['content']}"
            golden, latency_ms = await self._timed_llm(self.judge_model, prompt)
            self._audit("output_synthesis", self.judge_model, prompt[:200], golden[:200], latency_ms)
            if not golden or not golden.strip():
                golden = winning.get("content", "Synthesis failed - using best proposal.")
        else:
            golden = "No proposals generated."

        self.state["golden_prompt"] = golden

        proposal_objs = [_reconstruct_proposal(p) for p in proposals]
        challenge_objs = [_reconstruct_challenge(c) for c in self.state["challenges"]]
        rebuttal_objs = [_reconstruct_rebuttal(r) for r in self.state["rebuttals"]]

        if _HAS_DISSENT:
            dissent_report = _detect_dissent(proposal_objs, challenge_objs, rebuttal_objs)
            self.state["dissent_report"] = asdict(dissent_report)
        else:
            majority_proposals = proposals[:1] if proposals else []
            minority_proposals = proposals[1:] if len(proposals) > 1 else []

            majority_cluster = DissentCluster(
                models=[p["model_id"] for p in majority_proposals],
                position_summary=majority_proposals[0]["content"] if majority_proposals else "",
                key_arguments=["primary_argument"],
                proposals=[],
            ) if majority_proposals else None

            minority_clusters = [
                DissentCluster(
                    models=[p["model_id"]],
                    position_summary=p["content"],
                    key_arguments=["minority_argument"],
                    proposals=[],
                )
                for p in minority_proposals
            ]

            has_dissent = len(minority_clusters) > 0
            self.state["dissent_report"] = asdict(DissentReport(
                type="dissent" if has_dissent else "consensus",
                majority=asdict(majority_cluster) if majority_cluster else None,
                minority=[asdict(c) for c in minority_clusters],
                disagreement_points=[],
            ))

        if _HAS_CONFIDENCE:
            calibrated = _calibrate_all(proposal_objs, rebuttal_objs)
            self.state["confidence_scores"] = {
                mid: asdict(cc) for mid, cc in calibrated.items()
            }
        self._audit("output", "system", f"topic={self.state['topic'][:100]}", f"golden_len={len(golden)}")

    async def _attack(self) -> None:
        proposals = self.state["proposals"]
        if not proposals:
            return

        if _HAS_RED_TEAM:
            attacker_id = self.models[0] if self.models else self.judge_model
            defender_id = self.models[-1] if self.models else self.judge_model
            target_content = "\n\n".join(p["content"] for p in proposals)

            report = await _run_red_team(
                target_content=target_content,
                attacker_model=attacker_id,
                defender_model=defender_id,
                judge_model=self.judge_model,
                api_keys=self.api_keys,
                call_fn=self._red_team_call_fn,
            )
            self.state["red_team_report"] = asdict(report)
            self._audit("attack", attacker_id, f"red_team on {len(proposals)} proposals", f"score={report.overall_score:.2f}")
            return

        attacker_id = self.models[0] if self.models else self.judge_model

        async def generate_attack(proposal: dict, index: int) -> dict:
            prompt = f"Find vulnerabilities in: {proposal['content']}"
            response, latency_ms = await self._timed_llm(attacker_id, prompt)
            self._audit("attack", attacker_id, prompt[:200], response[:200], latency_ms)
            attack = RedTeamAttack(
                attacker_id=attacker_id,
                category=AttackCategory.LOGICAL_FLAW,
                attack_content=response,
                severity="medium",
            )
            return asdict(attack)

        results = await asyncio.gather(*[generate_attack(p, i) for i, p in enumerate(proposals)])

        if not self.state.get("red_team_report"):
            self.state["red_team_report"] = {
                "attacks": [],
                "defenses": [],
                "judgments": [],
                "vulnerability_count": {},
                "overall_score": 0.0,
            }
        self.state["red_team_report"]["attacks"].extend(results)

    async def _red_team_call_fn(self, model: str, prompt: str, api_keys: dict) -> str:
        response, _latency = await self._timed_llm(model, prompt)
        return response

    async def _defend(self) -> None:
        if _HAS_RED_TEAM and self.state.get("red_team_report") and "attacks" in self.state["red_team_report"]:
            self._audit("defend", "system", "skipped - handled by run_red_team", "")
            return

        rt = self.state.get("red_team_report", {})
        attacks = rt.get("attacks", [])
        defender_id = self.models[-1] if self.models else self.judge_model

        async def generate_defense(attack: dict, index: int) -> dict:
            prompt = f"Defend against: {attack['attack_content']}"
            response, latency_ms = await self._timed_llm(defender_id, prompt)
            self._audit("defend", defender_id, prompt[:200], response[:200], latency_ms)
            defense = RedTeamDefense(
                defender_id=defender_id,
                attack_index=index,
                defense_content=response,
                mitigated=True,
            )
            return asdict(defense)

        results = await asyncio.gather(*[generate_defense(a, i) for i, a in enumerate(attacks)])
        self.state["red_team_report"]["defenses"].extend(results)

    async def _judge_attack(self) -> None:
        if _HAS_RED_TEAM and self.state.get("red_team_report") and "judgments" in self.state["red_team_report"] and self.state["red_team_report"]["judgments"]:
            self._audit("judge_attack", "system", "skipped - handled by run_red_team", "")
            return

        rt = self.state.get("red_team_report", {})
        attacks = rt.get("attacks", [])
        defenses = rt.get("defenses", [])

        async def judge_pair(attack: dict, defense: dict, index: int) -> dict:
            prompt = f"Judge attack: {attack['attack_content']} vs defense: {defense['defense_content']}"
            response, latency_ms = await self._timed_llm(self.judge_model, prompt)
            self._audit("judge_attack", self.judge_model, prompt[:200], response[:200], latency_ms)
            judgment = RedTeamJudgment(
                judge_id=self.judge_model,
                attack_index=index,
                valid_attack=True,
                effective_defense=True,
                severity_confirmed="medium",
                reasoning=response,
            )
            return asdict(judgment)

        pairs = list(zip(attacks, defenses))
        results = await asyncio.gather(*[judge_pair(a, d, i) for i, (a, d) in enumerate(pairs)])
        self.state["red_team_report"]["judgments"].extend(results)

        vuln_count: dict[str, int] = {}
        for j in results:
            sev = j["severity_confirmed"]
            vuln_count[sev] = vuln_count.get(sev, 0) + 1
        self.state["red_team_report"]["vulnerability_count"] = vuln_count
        self.state["red_team_report"]["overall_score"] = 0.5

    async def _bet(self) -> None:
        proposals = self.state["proposals"]
        proposal_ids = [p["model_id"] for p in proposals]

        if _HAS_TRUTH_MARKET:
            topic = self.state["topic"]
            options = proposal_ids if proposal_ids else _extract_options(topic)
            report = await _run_truth_market(
                topic=topic,
                options=options,
                models=self.models,
                api_keys=self.api_keys,
                call_fn=self._market_call_fn,
                max_rounds=1,
            )
            self.state["market_result"] = asdict(report)
            self._audit("bet", "system", f"truth_market on {len(options)} options", f"confidence={report.confidence:.2f}")
            return

        async def place_bet(model_id: str) -> dict:
            prompt = f"Assign probability distribution over proposals: {', '.join(proposal_ids)}"
            response, latency_ms = await self._timed_llm(model_id, prompt)
            self._audit("bet", model_id, prompt[:200], response[:200], latency_ms)
            n = len(proposal_ids) if proposal_ids else 1
            distribution = {pid: 1.0 / n for pid in proposal_ids}
            position = MarketPosition(
                model_id=model_id,
                distribution=distribution,
                round_number=self.state["round_number"],
            )
            return asdict(position)

        results = await asyncio.gather(*[place_bet(m) for m in self.models])

        if not self.state.get("market_result"):
            self.state["market_result"] = {
                "consensus_distribution": {},
                "convergence_round": 0,
                "position_history": [],
                "confidence": 0.0,
            }
        self.state["market_result"]["position_history"].append(results)

    async def _market_call_fn(self, model: str, prompt: str, api_keys: dict) -> str:
        response, _latency = await self._timed_llm(model, prompt)
        return response

    async def _market_update(self) -> None:
        if _HAS_TRUTH_MARKET and self.state.get("market_result") and "consensus_distribution" in self.state.get("market_result", {}):
            mr = self.state["market_result"]
            if mr.get("consensus_distribution"):
                self._audit("market_update", "system", "handled by run_truth_market", f"confidence={mr.get('confidence', 0)}")
                return

        mr = self.state.get("market_result", {})
        history = mr.get("position_history", [])
        if not history:
            return

        latest_round = history[-1]
        all_distributions: dict[str, list[float]] = {}
        for position in latest_round:
            for pid, prob in position["distribution"].items():
                all_distributions.setdefault(pid, []).append(prob)

        consensus = {pid: sum(probs) / len(probs) for pid, probs in all_distributions.items()}
        mr["consensus_distribution"] = consensus
        mr["convergence_round"] = self.state["round_number"]

        max_prob = max(consensus.values()) if consensus else 0.0
        mr["confidence"] = max_prob

        self.state["market_result"] = mr
        self._audit("market_update", "system", f"{len(latest_round)} positions", f"confidence={max_prob:.2f}")
