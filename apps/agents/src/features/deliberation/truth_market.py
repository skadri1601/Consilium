from __future__ import annotations

import json
import math
import re
from typing import Any, Callable, Awaitable

from src.features.deliberation.types import (
    MarketPosition,
    MarketResult,
)


def build_initial_bet_prompt(topic: str, options: list[str]) -> str:
    options_str = ", ".join(f'"{o}"' for o in options)
    dist_example = ", ".join(f'"{o}": <probability>' for o in options)
    return (
        f"You are participating in a prediction market on the following topic:\n\n"
        f"{topic}\n\n"
        f"The possible options are: {options_str}\n\n"
        f"Assign a probability distribution across these options. "
        f"Probabilities must sum to 1.0.\n\n"
        f"Respond with ONLY valid JSON in this exact format:\n"
        f'{{"distribution": {{{dist_example}}}, '
        f'"reasoning": "<your reasoning>"}}'
    )


def build_update_prompt(
    topic: str,
    options: list[str],
    own_position: MarketPosition,
    others_positions: list[MarketPosition],
) -> str:
    own_dist = json.dumps(own_position.distribution)
    others_summary = "\n".join(
        f"- {p.model_id}: {json.dumps(p.distribution)}"
        for p in others_positions
    )
    options_str = ", ".join(f'"{o}"' for o in options)
    dist_example = ", ".join(f'"{o}": <probability>' for o in options)
    return (
        f"You are participating in a prediction market on the following topic:\n\n"
        f"{topic}\n\n"
        f"The possible options are: {options_str}\n\n"
        f"Your current distribution: {own_dist}\n\n"
        f"Other participants' distributions:\n{others_summary}\n\n"
        f"Based on the evidence from other participants, update your probability distribution. "
        f"Probabilities must sum to 1.0.\n\n"
        f"Respond with ONLY valid JSON in this exact format:\n"
        f'{{"distribution": {{{dist_example}}}, '
        f'"reasoning": "<your reasoning>"}}'
    )


def parse_distribution(raw: str, options: list[str]) -> dict[str, float]:
    try:
        match = re.search(r"\{.*\}", raw, re.DOTALL)
        if match:
            parsed = json.loads(match.group())
            dist = parsed.get("distribution", parsed)
            if all(o in dist for o in options):
                values = {o: float(dist[o]) for o in options}
                total = sum(values.values())
                if total > 0:
                    return {o: v / total for o, v in values.items()}
    except (json.JSONDecodeError, ValueError, TypeError, KeyError):
        pass
    uniform = 1.0 / len(options)
    return {o: uniform for o in options}


def log_opinion_pool(positions: list[MarketPosition]) -> dict[str, float]:
    if not positions:
        return {}
    options = list(positions[0].distribution.keys())
    result: dict[str, float] = {}
    for option in options:
        log_sum = 0.0
        for pos in positions:
            p = pos.distribution.get(option, 1e-10)
            p = max(p, 1e-10)
            log_sum += math.log(p)
        result[option] = math.exp(log_sum / len(positions))
    total = sum(result.values())
    if total > 0:
        result = {o: v / total for o, v in result.items()}
    return result


def check_market_convergence(
    history: list[list[MarketPosition]],
    threshold: float = 0.05,
) -> bool:
    if len(history) < 2:
        return False
    prev_agg = log_opinion_pool(history[-2])
    curr_agg = log_opinion_pool(history[-1])
    if not prev_agg or not curr_agg:
        return False
    max_diff = max(
        abs(curr_agg.get(o, 0) - prev_agg.get(o, 0))
        for o in set(prev_agg.keys()) | set(curr_agg.keys())
    )
    return max_diff < threshold


async def run_truth_market(
    topic: str,
    options: list[str],
    models: list[str],
    api_keys: dict,
    call_fn: Callable[..., Awaitable[str]],
    max_rounds: int = 5,
) -> MarketResult:
    position_history: list[list[MarketPosition]] = []

    round_positions: list[MarketPosition] = []
    for model in models:
        prompt = build_initial_bet_prompt(topic, options)
        raw = await call_fn(model=model, prompt=prompt, api_keys=api_keys)
        dist = parse_distribution(raw, options)
        round_positions.append(MarketPosition(
            model_id=model,
            distribution=dist,
            round_number=0,
        ))
    position_history.append(round_positions)

    convergence_round = max_rounds
    for round_num in range(1, max_rounds + 1):
        round_positions = []
        prev_positions = position_history[-1]
        for model in models:
            own = next(p for p in prev_positions if p.model_id == model)
            others = [p for p in prev_positions if p.model_id != model]
            prompt = build_update_prompt(topic, options, own, others)
            raw = await call_fn(model=model, prompt=prompt, api_keys=api_keys)
            dist = parse_distribution(raw, options)
            round_positions.append(MarketPosition(
                model_id=model,
                distribution=dist,
                round_number=round_num,
            ))
        position_history.append(round_positions)

        if check_market_convergence(position_history):
            convergence_round = round_num
            break

    final_agg = log_opinion_pool(position_history[-1])
    max_prob = max(final_agg.values()) if final_agg else 0.0

    return MarketResult(
        consensus_distribution=final_agg,
        convergence_round=convergence_round,
        position_history=position_history,
        confidence=max_prob,
    )


def extract_options(topic: str) -> list[str]:
    pattern = r"(?:should\s+(?:we|I|you)\s+)?(.+?)\s+or\s+(.+?)[\?\.\!]?\s*$"
    match = re.search(pattern, topic, re.IGNORECASE)
    if match:
        a = match.group(1).strip().rstrip("?,.")
        b = match.group(2).strip().rstrip("?,.")
        if a and b:
            return [a, b]
    return ["Option A", "Option B", "Option C"]
