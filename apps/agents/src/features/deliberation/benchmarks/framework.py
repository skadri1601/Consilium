from __future__ import annotations
from dataclasses import dataclass, field
from typing import Any, Callable, Awaitable


@dataclass
class BenchmarkQuestion:
    question: str
    correct_answer: str
    category: str


@dataclass
class SingleResult:
    question: str
    model_answer: str
    correct: bool
    model_id: str


@dataclass
class DeliberationResult:
    question: str
    golden_prompt_answer: str
    correct: bool
    votes: dict[str, str]
    rounds_used: int


@dataclass
class BenchmarkResult:
    benchmark_name: str
    single_model_score: float
    deliberation_score: float
    improvement_pct: float
    num_questions: int
    cost_single: float
    cost_deliberation: float
    details: list[dict[str, Any]] = field(default_factory=list)


import re


def _normalize(text: str) -> str:
    return text.strip().lower()


def _extract_short_answer(text: str) -> str:
    t = text.strip()
    for pattern in [
        r"(?:the answer is|answer:)\s*(.+?)(?:\.|$)",
        r"^\*\*(.+?)\*\*",
        r"^#+\s*(.+?)$",
    ]:
        m = re.search(pattern, t, re.IGNORECASE | re.MULTILINE)
        if m:
            return m.group(1).strip()
    return t


def _check_correct(model_answer: str, correct_answer: str) -> bool:
    norm_correct = _normalize(correct_answer)
    norm_answer = _normalize(model_answer)
    if norm_correct in norm_answer:
        return True
    short = _normalize(_extract_short_answer(model_answer))
    if norm_correct in short:
        return True
    correct_words = set(norm_correct.split())
    if len(correct_words) <= 3:
        first_line = norm_answer.split("\n")[0]
        if correct_words.issubset(set(re.split(r"\W+", first_line))):
            return True
    if norm_correct in ("yes", "no"):
        first_words = norm_answer[:50].split()
        if first_words and _normalize(first_words[0]).rstrip(".,!") == norm_correct:
            return True
        if norm_correct == "no" and any(
            w in norm_answer[:100] for w in ["no,", "no.", "no ", "that's not", "this is not", "is not true", "incorrect"]
        ):
            return True
        if norm_correct == "yes" and any(
            w in norm_answer[:100] for w in ["yes,", "yes.", "yes ", "that's correct", "this is true", "indeed"]
        ):
            return True
    return False


async def run_benchmark(
    name: str,
    questions: list[BenchmarkQuestion],
    models: list[str],
    api_keys: dict[str, str],
    call_fn: Callable[..., Awaitable[dict[str, Any]]],
    mode: str = "council",
) -> BenchmarkResult:
    single_correct = 0
    delib_correct = 0
    cost_single = 0.0
    cost_delib = 0.0
    details: list[dict[str, Any]] = []

    primary_model = models[0]

    for q in questions:
        single_resp = await call_fn(
            model=primary_model,
            prompt=q.question,
            api_keys=api_keys,
            mode="single",
        )
        single_answer = single_resp.get("answer", "")
        single_is_correct = _check_correct(single_answer, q.correct_answer)
        if single_is_correct:
            single_correct += 1
        cost_single += single_resp.get("cost", 0.0)

        delib_resp = await call_fn(
            model=primary_model,
            prompt=q.question,
            api_keys=api_keys,
            mode=mode,
            models=models,
        )
        delib_answer = delib_resp.get("answer", "")
        delib_is_correct = _check_correct(delib_answer, q.correct_answer)
        if delib_is_correct:
            delib_correct += 1
        cost_delib += delib_resp.get("cost", 0.0)

        votes = delib_resp.get("votes", {})
        rounds_used = delib_resp.get("rounds_used", 1)

        details.append({
            "single": SingleResult(
                question=q.question,
                model_answer=single_answer,
                correct=single_is_correct,
                model_id=primary_model,
            ),
            "deliberation": DeliberationResult(
                question=q.question,
                golden_prompt_answer=delib_answer,
                correct=delib_is_correct,
                votes=votes,
                rounds_used=rounds_used,
            ),
            "category": q.category,
        })

    n = len(questions)
    single_score = single_correct / n if n else 0.0
    delib_score = delib_correct / n if n else 0.0
    improvement = ((delib_score - single_score) / single_score * 100) if single_score > 0 else 0.0

    return BenchmarkResult(
        benchmark_name=name,
        single_model_score=single_score,
        deliberation_score=delib_score,
        improvement_pct=improvement,
        num_questions=n,
        cost_single=cost_single,
        cost_deliberation=cost_delib,
        details=details,
    )


def format_benchmark_report(result: BenchmarkResult) -> str:
    lines = [
        f"# Benchmark Report: {result.benchmark_name}",
        "",
        "| Metric | Single Model | Deliberation |",
        "|--------|-------------|-------------|",
        f"| Accuracy | {result.single_model_score:.1%} | {result.deliberation_score:.1%} |",
        f"| Cost | ${result.cost_single:.4f} | ${result.cost_deliberation:.4f} |",
        f"| Questions | {result.num_questions} | {result.num_questions} |",
        "",
        f"**Improvement: {result.improvement_pct:+.1f}%**",
        "",
    ]

    if result.details:
        lines.append("## Per-Question Results")
        lines.append("")
        lines.append("| # | Category | Single | Deliberation | Rounds |")
        lines.append("|---|----------|--------|-------------|--------|")
        for i, d in enumerate(result.details, 1):
            s = d["single"]
            dl = d["deliberation"]
            s_mark = "pass" if s.correct else "fail"
            d_mark = "pass" if dl.correct else "fail"
            lines.append(f"| {i} | {d['category']} | {s_mark} | {d_mark} | {dl.rounds_used} |")

    return "\n".join(lines)
