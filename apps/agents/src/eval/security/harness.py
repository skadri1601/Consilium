from __future__ import annotations

import argparse
import asyncio
import json
from dataclasses import asdict
from pathlib import Path

from src.eval.security.dataset import SecurityCase, load_cases
from src.eval.security.runners import (
    ConfigResult,
    ModelCall,
    run_council,
    run_redteam,
    run_self_consistency,
    run_single,
)
from src.eval.security.scoring import compute_metrics, majority_verdict
from src.features.deliberation.deliberation_graph import _call_model_via_factory, llm_call_stub

CONFIGS = ("single", "self_consistency", "council", "redteam")


async def _run_once(
    config: str,
    code: str,
    language: str,
    model_call: ModelCall,
    llm_fn: ModelCall | None,
    model_id: str,
    models: list[str],
    judge_model: str,
    samples: int,
    api_keys: dict,
) -> ConfigResult:
    if config == "single":
        return await run_single(model_call, model_id, code, language, api_keys)
    if config == "self_consistency":
        return await run_self_consistency(model_call, model_id, code, language, api_keys, samples)
    if config == "council":
        return await run_council(code, language, api_keys, models, judge_model, llm_fn)
    if config == "redteam":
        return await run_redteam(code, language, api_keys, models, judge_model, llm_fn)
    raise ValueError(f"Unknown config: {config}")


async def _run_with_repeats(
    config: str,
    code: str,
    language: str,
    model_call: ModelCall,
    llm_fn: ModelCall | None,
    model_id: str,
    models: list[str],
    judge_model: str,
    samples: int,
    runs: int,
    api_keys: dict,
) -> ConfigResult:
    results = []
    for _ in range(runs):
        results.append(
            await _run_once(
                config, code, language, model_call, llm_fn, model_id, models, judge_model, samples, api_keys
            )
        )
    verdict = majority_verdict([result.verdict for result in results])
    cost = sum(result.cost for result in results)
    tokens_in = sum(result.tokens_in for result in results)
    tokens_out = sum(result.tokens_out for result in results)
    calls = sum(result.n_calls for result in results)
    predicted_cwe = next(
        (result.predicted_cwe for result in results if result.verdict == verdict and result.predicted_cwe),
        None,
    )
    return ConfigResult(
        config=config,
        verdict=verdict,
        predicted_cwe=predicted_cwe,
        reasoning=results[0].reasoning,
        cost=cost,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        n_calls=calls,
    )


async def evaluate(
    cases: list[SecurityCase],
    configs: list[str],
    model_call: ModelCall,
    llm_fn: ModelCall | None,
    model_id: str,
    models: list[str],
    judge_model: str,
    samples: int = 3,
    runs: int = 1,
    api_keys: dict | None = None,
) -> dict:
    api_keys = api_keys or {}
    report: dict = {"configs": {}, "per_case": {}}
    for config in configs:
        records = []
        details = []
        total_cost = 0.0
        total_calls = 0
        for case in cases:
            vuln_result = await _run_with_repeats(
                config, case.vulnerable_code, case.language, model_call, llm_fn,
                model_id, models, judge_model, samples, runs, api_keys,
            )
            patched_result = await _run_with_repeats(
                config, case.patched_code, case.language, model_call, llm_fn,
                model_id, models, judge_model, samples, runs, api_keys,
            )
            records.append(
                {
                    "vuln_verdict": vuln_result.verdict,
                    "patched_verdict": patched_result.verdict,
                    "expected_cwe": case.cwe,
                    "predicted_cwe": vuln_result.predicted_cwe,
                }
            )
            details.append(
                {
                    "case_id": case.case_id,
                    "cwe": case.cwe,
                    "vuln_verdict": vuln_result.verdict,
                    "patched_verdict": patched_result.verdict,
                    "predicted_cwe": vuln_result.predicted_cwe,
                }
            )
            total_cost += vuln_result.cost + patched_result.cost
            total_calls += vuln_result.n_calls + patched_result.n_calls
        metrics = compute_metrics(records)
        reviews = max(1, 2 * len(cases))
        report["configs"][config] = {
            "metrics": asdict(metrics),
            "total_cost": total_cost,
            "total_calls": total_calls,
            "reviews": reviews,
            "avg_calls_per_review": total_calls / reviews,
        }
        report["per_case"][config] = details
    return report


def render_markdown(report: dict) -> str:
    lines = [
        "# Security-review deliberation eval",
        "",
        "| Config | Pairwise-correct | Precision | Recall | F1 | Patched FP | Total $ | Calls/review | Cost x vs single |",
        "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    single_cost = report["configs"].get("single", {}).get("total_cost", 0.0)
    for config, data in report["configs"].items():
        metrics = data["metrics"]
        cost_multiple = ""
        if single_cost > 0:
            cost_multiple = f"{data['total_cost'] / single_cost:.2f}x"
        lines.append(
            "| {config} | {pc:.0%} | {prec:.0%} | {rec:.0%} | {f1:.2f} | {fp:.0%} | ${cost:.4f} | {cpr:.1f} | {mult} |".format(
                config=config,
                pc=metrics["pairwise_correct_rate"],
                prec=metrics["precision"],
                rec=metrics["recall"],
                f1=metrics["f1"],
                fp=metrics["patched_fp_rate"],
                cost=data["total_cost"],
                cpr=data["avg_calls_per_review"],
                mult=cost_multiple,
            )
        )
    return "\n".join(lines) + "\n"


def _write_report(report: dict, output: str) -> None:
    Path(output + ".json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    Path(output + ".md").write_text(render_markdown(report), encoding="utf-8")


def _has_any_key() -> bool:
    try:
        from src.shared.config import settings

        return any(
            [
                getattr(settings, "openai_api_key", None),
                getattr(settings, "anthropic_api_key", None),
                getattr(settings, "google_api_key", None),
                getattr(settings, "groq_api_key", None),
                getattr(settings, "xai_api_key", None),
            ]
        )
    except Exception:
        return False


def main() -> None:
    parser = argparse.ArgumentParser(description="Security-review deliberation eval")
    parser.add_argument("--config", action="append", choices=CONFIGS)
    parser.add_argument("--model", default="claude-haiku-4-5-20251001")
    parser.add_argument("--models", default="gpt-5.4-mini,claude-haiku-4-5-20251001")
    parser.add_argument("--judge-model", default="gpt-5.4-mini")
    parser.add_argument("--samples", type=int, default=3)
    parser.add_argument("--runs", type=int, default=1)
    parser.add_argument("--dataset", default=None)
    parser.add_argument("--max-cases", type=int, default=0)
    parser.add_argument("--output", default="eval_security_report")
    parser.add_argument("--allow-stub", action="store_true")
    args = parser.parse_args()

    has_key = _has_any_key()
    if not has_key and not args.allow_stub:
        print("No provider API keys found in settings/.env.local.")
        print("Real model calls would fall back to stub responses and metrics would be meaningless.")
        print("Add a key to .env.local, or pass --allow-stub to exercise the wiring only.")
        raise SystemExit(2)

    if has_key:
        model_call = _call_model_via_factory
        llm_fn = None
    else:
        model_call = llm_call_stub
        llm_fn = llm_call_stub

    cases = load_cases(args.dataset)
    if args.max_cases:
        cases = cases[: args.max_cases]
    configs = args.config or list(CONFIGS)
    models = [model.strip() for model in args.models.split(",") if model.strip()]

    report = asyncio.run(
        evaluate(
            cases=cases,
            configs=configs,
            model_call=model_call,
            llm_fn=llm_fn,
            model_id=args.model,
            models=models,
            judge_model=args.judge_model,
            samples=args.samples,
            runs=args.runs,
        )
    )
    _write_report(report, args.output)
    print(render_markdown(report))


if __name__ == "__main__":
    main()
