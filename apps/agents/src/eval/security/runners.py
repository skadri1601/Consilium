from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field

from src.eval.security.scoring import (
    VERDICT_SAFE,
    VERDICT_UNKNOWN,
    VERDICT_VULNERABLE,
    majority_verdict,
    parse_verdict,
)
from src.features.agents.base_agent import LLMProviderError
from src.features.deliberation.deliberation_graph import (
    DeliberationEngine,
    _estimate_cost,
)
from src.features.deliberation.types import DeliberationMode

ModelCall = Callable[[str, str, dict], Awaitable[str]]


@dataclass
class ConfigResult:
    config: str
    verdict: str
    predicted_cwe: str | None
    reasoning: str
    cost: float
    tokens_in: int
    tokens_out: int
    n_calls: int
    raw: dict = field(default_factory=dict)


def build_review_prompt(code: str, language: str) -> str:
    return (
        "You are a senior application security reviewer. Analyze the following "
        f"{language} code for security vulnerabilities.\n\n"
        "Code:\n```\n" + code + "\n```\n\n"
        "Decide whether this code contains a real, exploitable security "
        "vulnerability. Finish your answer with exactly three lines:\n"
        "VERDICT: VULNERABLE or SAFE\n"
        "CWE: a CWE identifier like CWE-89, or NONE\n"
        "REASONING: one sentence\n"
    )


def _estimate_call(model_id: str, prompt: str, response: str) -> tuple[int, int, float]:
    tokens_in = len(prompt.split())
    tokens_out = len(response.split())
    return tokens_in, tokens_out, _estimate_cost(model_id, tokens_in, tokens_out)


async def _safe_call(model_call: ModelCall, model_id: str, prompt: str, api_keys: dict) -> str:
    try:
        return await model_call(model_id, prompt, api_keys)
    except LLMProviderError:
        return ""


def _count_llm_calls(state: dict) -> int:
    audit = state.get("audit_trail", [])
    return sum(1 for entry in audit if entry.get("model_id") not in (None, "", "system"))


def verdict_from_redteam(report: dict) -> tuple[str, str | None]:
    judgments = report.get("judgments", [])
    attacks = report.get("attacks", [])
    if not judgments:
        return VERDICT_UNKNOWN, None
    security_confirmed = False
    for judgment in judgments:
        if not judgment.get("valid_attack"):
            continue
        index = judgment.get("attack_index", -1)
        category = attacks[index].get("category") if 0 <= index < len(attacks) else None
        category_value = getattr(category, "value", category)
        if category_value == "security_vuln":
            security_confirmed = True
    return (VERDICT_VULNERABLE if security_confirmed else VERDICT_SAFE), None


async def run_single(
    model_call: ModelCall,
    model_id: str,
    code: str,
    language: str,
    api_keys: dict,
) -> ConfigResult:
    prompt = build_review_prompt(code, language)
    response = await _safe_call(model_call, model_id, prompt, api_keys)
    verdict, cwe = parse_verdict(response)
    tokens_in, tokens_out, cost = _estimate_call(model_id, prompt, response)
    return ConfigResult(
        config="single",
        verdict=verdict,
        predicted_cwe=cwe,
        reasoning=response[:500],
        cost=cost,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        n_calls=1,
        raw={"response": response},
    )


async def run_self_consistency(
    model_call: ModelCall,
    model_id: str,
    code: str,
    language: str,
    api_keys: dict,
    samples: int = 3,
) -> ConfigResult:
    prompt = build_review_prompt(code, language)
    verdicts: list[str] = []
    cwes: list[str] = []
    total_cost = 0.0
    total_in = 0
    total_out = 0
    last_response = ""
    for _ in range(samples):
        response = await _safe_call(model_call, model_id, prompt, api_keys)
        verdict, cwe = parse_verdict(response)
        verdicts.append(verdict)
        if cwe:
            cwes.append(cwe)
        tokens_in, tokens_out, cost = _estimate_call(model_id, prompt, response)
        total_in += tokens_in
        total_out += tokens_out
        total_cost += cost
        last_response = response
    consensus = majority_verdict(verdicts)
    consensus_cwe = majority_verdict(cwes) if cwes else None
    if consensus_cwe == VERDICT_UNKNOWN:
        consensus_cwe = None
    return ConfigResult(
        config="self_consistency",
        verdict=consensus,
        predicted_cwe=consensus_cwe,
        reasoning=last_response[:500],
        cost=total_cost,
        tokens_in=total_in,
        tokens_out=total_out,
        n_calls=samples,
        raw={"verdicts": verdicts},
    )


async def run_council(
    code: str,
    language: str,
    api_keys: dict,
    models: list[str],
    judge_model: str,
    llm_fn: ModelCall | None = None,
    max_rounds: int = 2,
) -> ConfigResult:
    prompt = build_review_prompt(code, language)
    engine = DeliberationEngine(
        mode=DeliberationMode.COUNCIL,
        models=models,
        judge_model=judge_model,
        api_keys=api_keys,
        max_rounds=max_rounds,
        llm_fn=llm_fn,
    )
    state = await engine.run(prompt)
    golden = state.get("golden_prompt") or ""
    verdict, cwe = parse_verdict(golden)
    cost_tracker = state.get("cost_tracker", {})
    return ConfigResult(
        config="council",
        verdict=verdict,
        predicted_cwe=cwe,
        reasoning=golden[:500],
        cost=cost_tracker.get("total_cost", 0.0),
        tokens_in=cost_tracker.get("tokens_in", 0),
        tokens_out=cost_tracker.get("tokens_out", 0),
        n_calls=_count_llm_calls(state),
        raw={"golden_prompt": golden},
    )


async def run_redteam(
    code: str,
    language: str,
    api_keys: dict,
    models: list[str],
    judge_model: str,
    llm_fn: ModelCall | None = None,
) -> ConfigResult:
    prompt = build_review_prompt(code, language)
    engine = DeliberationEngine(
        mode=DeliberationMode.REDTEAM,
        models=models,
        judge_model=judge_model,
        api_keys=api_keys,
        llm_fn=llm_fn,
    )
    state = await engine.run(prompt)
    report = state.get("red_team_report") or {}
    verdict, cwe = verdict_from_redteam(report)
    if verdict == VERDICT_UNKNOWN:
        fallback_verdict, fallback_cwe = parse_verdict(state.get("golden_prompt") or "")
        verdict = fallback_verdict
        cwe = cwe or fallback_cwe
    cost_tracker = state.get("cost_tracker", {})
    return ConfigResult(
        config="redteam",
        verdict=verdict,
        predicted_cwe=cwe,
        reasoning=(state.get("golden_prompt") or "")[:500],
        cost=cost_tracker.get("total_cost", 0.0),
        tokens_in=cost_tracker.get("tokens_in", 0),
        tokens_out=cost_tracker.get("tokens_out", 0),
        n_calls=_count_llm_calls(state),
        raw={"red_team_report": report},
    )
