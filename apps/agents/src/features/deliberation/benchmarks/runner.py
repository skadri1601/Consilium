from __future__ import annotations
import argparse
import asyncio
import json
import os
import sys
import time
from dataclasses import asdict
from typing import Any

from src.features.deliberation.benchmarks.framework import (
    BenchmarkQuestion,
    BenchmarkResult,
    SingleResult,
    DeliberationResult,
    run_benchmark,
    format_benchmark_report,
)
from src.features.deliberation.benchmarks.datasets import (
    load_mmlu_sample,
    load_truthfulqa_sample,
    load_humaneval_sample,
)
from src.features.deliberation.deliberation_graph import (
    DeliberationEngine,
    _call_model_via_factory,
)
from src.features.deliberation.types import DeliberationMode

DATASET_LOADERS: dict[str, Any] = {
    "mmlu": load_mmlu_sample,
    "truthfulqa": load_truthfulqa_sample,
    "humaneval": load_humaneval_sample,
}

DEFAULT_TIMEOUT = 120


def _resolve_api_keys() -> dict[str, str]:
    keys: dict[str, str] = {}
    for key in [
        "OPENAI_API_KEY",
        "ANTHROPIC_API_KEY",
        "GOOGLE_API_KEY",
        "GROQ_API_KEY",
        "XAI_API_KEY",
    ]:
        val = os.environ.get(key)
        if val:
            keys[key] = val
    return keys


async def _single_call(
    model: str,
    prompt: str,
    api_keys: dict[str, str],
    timeout: int = DEFAULT_TIMEOUT,
) -> dict[str, Any]:
    t0 = time.monotonic()
    try:
        response = await asyncio.wait_for(
            _call_model_via_factory(model, prompt, api_keys),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        return {"answer": "", "cost": 0.0, "error": "timeout"}
    except Exception as exc:
        return {"answer": "", "cost": 0.0, "error": str(exc)}
    elapsed = time.monotonic() - t0
    est_tokens = len(prompt.split()) + len(response.split())
    est_cost = est_tokens * 0.003 / 1000
    return {"answer": response, "cost": est_cost, "latency_s": elapsed}


async def _deliberation_call(
    model: str,
    prompt: str,
    api_keys: dict[str, str],
    mode: str,
    models: list[str],
    timeout: int = DEFAULT_TIMEOUT,
) -> dict[str, Any]:
    try:
        delib_mode = DeliberationMode(mode)
    except ValueError:
        delib_mode = DeliberationMode.COUNCIL

    judge = models[0]
    engine = DeliberationEngine(
        mode=delib_mode,
        models=models,
        judge_model=judge,
        api_keys=api_keys,
    )

    try:
        state = await asyncio.wait_for(
            engine.run(prompt),
            timeout=timeout,
        )
    except asyncio.TimeoutError:
        print(f"[WARN] Deliberation timeout for: {prompt[:60]}", file=sys.stderr)
        return {"answer": "", "cost": 0.0, "votes": {}, "rounds_used": 0, "error": "timeout"}
    except Exception as exc:
        print(f"[WARN] Deliberation error for: {prompt[:60]} -> {exc}", file=sys.stderr)
        return {"answer": "", "cost": 0.0, "votes": {}, "rounds_used": 0, "error": str(exc)}

    answer = state.get("golden_prompt", "") or ""
    cost_data = state.get("cost_tracker", {})
    total_cost = cost_data.get("total_cost", 0.0)
    rounds_used = state.get("round_number", 1)

    votes: dict[str, str] = {}
    for v in state.get("votes", []):
        voter = v.get("voter_id", "")
        ballot = v.get("ballot", {})
        choices = ballot.get("ranked_choices", [])
        if voter and choices:
            votes[voter] = choices[0]

    return {
        "answer": answer,
        "cost": total_cost,
        "votes": votes,
        "rounds_used": rounds_used,
    }


async def benchmark_call_fn(
    model: str,
    prompt: str,
    api_keys: dict[str, str],
    mode: str = "single",
    models: list[str] | None = None,
    timeout: int = DEFAULT_TIMEOUT,
) -> dict[str, Any]:
    if mode == "single":
        return await _single_call(model, prompt, api_keys, timeout=timeout)
    return await _deliberation_call(
        model, prompt, api_keys, mode, models or [model], timeout=timeout,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run deliberation benchmarks")
    parser.add_argument("--benchmark", choices=list(DATASET_LOADERS.keys()), required=True)
    parser.add_argument("--models", type=str, required=True, help="Comma-separated model IDs")
    parser.add_argument("--mode", type=str, default="council")
    parser.add_argument("--n", type=int, default=None, help="Number of questions")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT, help="Per-question timeout in seconds")
    parser.add_argument("--output", type=str, default=None, help="Path to save JSON results")
    return parser.parse_args()


def _serialize_result(result: BenchmarkResult) -> dict[str, Any]:
    details = []
    for d in result.details:
        entry: dict[str, Any] = {"category": d["category"]}
        s = d["single"]
        entry["single"] = {
            "question": s.question,
            "model_answer": s.model_answer,
            "correct": s.correct,
            "model_id": s.model_id,
        }
        dl = d["deliberation"]
        entry["deliberation"] = {
            "question": dl.question,
            "golden_prompt_answer": dl.golden_prompt_answer,
            "correct": dl.correct,
            "votes": dl.votes,
            "rounds_used": dl.rounds_used,
        }
        details.append(entry)

    return {
        "benchmark_name": result.benchmark_name,
        "single_model_score": result.single_model_score,
        "deliberation_score": result.deliberation_score,
        "improvement_pct": result.improvement_pct,
        "num_questions": result.num_questions,
        "cost_single": result.cost_single,
        "cost_deliberation": result.cost_deliberation,
        "details": details,
    }


def main() -> None:
    args = parse_args()
    models = [m.strip() for m in args.models.split(",")]

    loader = DATASET_LOADERS[args.benchmark]
    questions: list[BenchmarkQuestion] = loader(args.n) if args.n else loader()

    api_keys = _resolve_api_keys()
    if not api_keys:
        print("Error: No API keys found in environment variables", file=sys.stderr)
        sys.exit(1)

    async def _call_fn(
        model: str,
        prompt: str,
        api_keys: dict[str, str],
        mode: str = "single",
        models: list[str] | None = None,
    ) -> dict[str, Any]:
        return await benchmark_call_fn(
            model, prompt, api_keys, mode, models, timeout=args.timeout,
        )

    result = asyncio.run(
        run_benchmark(
            name=args.benchmark,
            questions=questions,
            models=models,
            api_keys=api_keys,
            call_fn=_call_fn,
            mode=args.mode,
        )
    )

    print(format_benchmark_report(result))

    if args.output:
        serialized = _serialize_result(result)
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(serialized, f, indent=2)
        print(f"\nResults saved to {args.output}")


if __name__ == "__main__":
    main()
