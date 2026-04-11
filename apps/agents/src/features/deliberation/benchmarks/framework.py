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
class ModeScore:
    mode: str
    score: float
    cost: float
    correct_count: int
    improvement_pct: float


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
    mode_scores: list[ModeScore] = field(default_factory=list)


import re


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _extract_code_block(text: str) -> str | None:
    m = re.search(r"```(?:\w+)?\s*\n(.*?)```", text, re.DOTALL)
    if m:
        return m.group(1).strip()
    return None


def _extract_short_answer(text: str) -> str:
    t = text.strip()
    for pattern in [
        r"(?:the answer is|answer is|answer:)\s*[\"']?(.+?)[\"']?(?:\.|,|\n|$)",
        r"(?:result is|equals?|=)\s*[\"']?(.+?)[\"']?(?:\.|,|\n|$)",
        r"^\*\*(.+?)\*\*",
        r"^#+\s*(.+?)$",
    ]:
        m = re.search(pattern, t, re.IGNORECASE | re.MULTILINE)
        if m:
            return m.group(1).strip()
    return t


def _extract_answer(response: str, expected: str) -> str:
    if not response:
        return ""

    norm_expected = _normalize(expected)

    if norm_expected in ("yes", "no"):
        first_word = re.match(r"\s*(\w+)", response)
        if first_word and first_word.group(1).lower() in ("yes", "no"):
            return first_word.group(1).lower()

    code = _extract_code_block(response)
    if code is not None:
        expected_code = _extract_code_block(expected)
        if expected_code is not None:
            return code
        norm_code = _normalize(code)
        if norm_expected in norm_code:
            return code

    short = _extract_short_answer(response)
    if short != response.strip():
        return short

    if len(norm_expected) < 20:
        first_sentence = re.split(r"[.\n]", response)[0]
        if norm_expected in _normalize(first_sentence):
            return first_sentence.strip()

        for line in response.split("\n"):
            if norm_expected in _normalize(line):
                return line.strip()

    return response.strip()


def _normalize_code(code: str) -> str:
    lines = []
    for line in code.strip().splitlines():
        stripped = line.strip()
        if stripped and not stripped.startswith("#"):
            lines.append(re.sub(r"\s+", " ", stripped))
    return "\n".join(lines)


def _check_correct(model_answer: str, correct_answer: str) -> bool:
    if not model_answer or not correct_answer:
        return False

    norm_correct = _normalize(correct_answer)
    norm_answer = _normalize(model_answer)

    if norm_correct == norm_answer:
        return True

    if norm_correct in norm_answer:
        return True

    if norm_correct in ("yes", "no"):
        first_word = re.match(r"\s*(\w+)", model_answer.lower())
        if first_word and first_word.group(1) == norm_correct:
            return True
        negatives = ["no,", "no.", "no ", "that's not", "this is not",
                      "is not true", "incorrect", "not correct", "false"]
        positives = ["yes,", "yes.", "yes ", "that's correct", "this is true",
                      "indeed", "correct", "that is true", "absolutely", "certainly"]
        if norm_correct == "no" and any(w in norm_answer[:150] for w in negatives):
            if not any(w in norm_answer[:150] for w in positives[:3]):
                return True
        if norm_correct == "yes" and any(w in norm_answer[:150] for w in positives):
            if not any(w in norm_answer[:150] for w in negatives[:3]):
                return True
        return False

    expected_code = _extract_code_block(correct_answer)
    response_code = _extract_code_block(model_answer)
    if expected_code is not None and response_code is not None:
        if _normalize_code(expected_code) == _normalize_code(response_code):
            return True
        if _normalize(expected_code) in _normalize(response_code):
            return True
    if expected_code is not None and response_code is None:
        if _normalize(expected_code) in norm_answer:
            return True
    if expected_code is None and response_code is not None:
        if norm_correct in _normalize(response_code):
            return True

    extracted = _extract_answer(model_answer, correct_answer)
    norm_extracted = _normalize(extracted)
    if norm_correct == norm_extracted:
        return True
    if norm_correct in norm_extracted:
        return True

    short = _normalize(_extract_short_answer(model_answer))
    if norm_correct in short or norm_correct == short:
        return True

    if len(norm_correct) < 20:
        first_sentence = re.split(r"[.\n]", norm_answer)[0]
        if norm_correct in first_sentence:
            return True

        words = re.split(r"\W+", norm_answer)
        correct_words = re.split(r"\W+", norm_correct)
        if all(cw in words for cw in correct_words if cw):
            return True

        if re.search(r"(?:^|\b)" + re.escape(norm_correct) + r"(?:\b|$)", norm_answer):
            return True

    if re.fullmatch(r"[\d\w\.\+\-\*/\^]+", norm_correct.replace(" ", "")):
        clean_correct = norm_correct.replace(" ", "")
        clean_answer = norm_answer.replace(" ", "")
        if clean_correct in clean_answer:
            return True

    correct_words_set = set(norm_correct.split())
    if len(correct_words_set) <= 3 and len(correct_words_set) > 0:
        first_line = norm_answer.split("\n")[0]
        if correct_words_set.issubset(set(re.split(r"\W+", first_line))):
            return True

    return False


async def run_benchmark(
    name: str,
    questions: list[BenchmarkQuestion],
    models: list[str],
    api_keys: dict[str, str],
    call_fn: Callable[..., Awaitable[dict[str, Any]]],
    mode: str = "council",
    modes: list[str] | None = None,
) -> BenchmarkResult:
    resolved_modes = modes if modes else [mode]

    single_correct = 0
    cost_single = 0.0
    details: list[dict[str, Any]] = []

    mode_correct: dict[str, int] = {m: 0 for m in resolved_modes}
    mode_cost: dict[str, float] = {m: 0.0 for m in resolved_modes}

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

        detail_entry: dict[str, Any] = {
            "single": SingleResult(
                question=q.question,
                model_answer=single_answer,
                correct=single_is_correct,
                model_id=primary_model,
            ),
            "category": q.category,
        }

        for m in resolved_modes:
            delib_resp = await call_fn(
                model=primary_model,
                prompt=q.question,
                api_keys=api_keys,
                mode=m,
                models=models,
            )
            delib_answer = delib_resp.get("answer", "")
            delib_is_correct = _check_correct(delib_answer, q.correct_answer)
            if delib_is_correct:
                mode_correct[m] += 1
            mode_cost[m] += delib_resp.get("cost", 0.0)

            votes = delib_resp.get("votes", {})
            rounds_used = delib_resp.get("rounds_used", 1)

            detail_entry[f"deliberation_{m}"] = DeliberationResult(
                question=q.question,
                golden_prompt_answer=delib_answer,
                correct=delib_is_correct,
                votes=votes,
                rounds_used=rounds_used,
            )

        if len(resolved_modes) == 1:
            detail_entry["deliberation"] = detail_entry[f"deliberation_{resolved_modes[0]}"]

        details.append(detail_entry)

    n = len(questions)
    single_score = single_correct / n if n else 0.0

    primary_mode = resolved_modes[0]
    delib_score = mode_correct[primary_mode] / n if n else 0.0
    improvement = ((delib_score - single_score) / single_score * 100) if single_score > 0 else 0.0

    total_delib_cost = sum(mode_cost.values())

    mode_scores = []
    for m in resolved_modes:
        m_score = mode_correct[m] / n if n else 0.0
        m_improvement = ((m_score - single_score) / single_score * 100) if single_score > 0 else 0.0
        mode_scores.append(ModeScore(
            mode=m,
            score=m_score,
            cost=mode_cost[m],
            correct_count=mode_correct[m],
            improvement_pct=m_improvement,
        ))

    return BenchmarkResult(
        benchmark_name=name,
        single_model_score=single_score,
        deliberation_score=delib_score,
        improvement_pct=improvement,
        num_questions=n,
        cost_single=cost_single,
        cost_deliberation=total_delib_cost,
        details=details,
        mode_scores=mode_scores,
    )


def format_benchmark_report(result: BenchmarkResult) -> str:
    if result.mode_scores and len(result.mode_scores) > 1:
        mode_headers = " | ".join(ms.mode for ms in result.mode_scores)
        mode_sep = " | ".join("---" for _ in result.mode_scores)
        mode_acc = " | ".join(f"{ms.score:.1%}" for ms in result.mode_scores)
        mode_cost = " | ".join(f"${ms.cost:.4f}" for ms in result.mode_scores)
        mode_impr = " | ".join(f"{ms.improvement_pct:+.1f}%" for ms in result.mode_scores)

        lines = [
            f"# Benchmark Report: {result.benchmark_name}",
            "",
            f"| Metric | Single Model | {mode_headers} |",
            f"|--------|-------------|{mode_sep}|",
            f"| Accuracy | {result.single_model_score:.1%} | {mode_acc} |",
            f"| Cost | ${result.cost_single:.4f} | {mode_cost} |",
            f"| Questions | {result.num_questions} | {' | '.join(str(result.num_questions) for _ in result.mode_scores)} |",
            "",
            f"**Improvement vs single: {mode_impr}**",
            "",
        ]

        if result.details:
            lines.append("## Per-Question Results")
            lines.append("")
            detail_mode_headers = " | ".join(f"{ms.mode}" for ms in result.mode_scores)
            detail_mode_sep = " | ".join("---" for _ in result.mode_scores)
            lines.append(f"| # | Category | Single | {detail_mode_headers} |")
            lines.append(f"|---|----------|--------|{detail_mode_sep}|")
            for i, d in enumerate(result.details, 1):
                s = d["single"]
                s_mark = "pass" if s.correct else "fail"
                mode_marks = []
                for ms in result.mode_scores:
                    dl = d.get(f"deliberation_{ms.mode}")
                    if dl:
                        mode_marks.append("pass" if dl.correct else "fail")
                    else:
                        mode_marks.append("-")
                lines.append(f"| {i} | {d['category']} | {s_mark} | {' | '.join(mode_marks)} |")
    else:
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
                dl = d.get("deliberation")
                if dl:
                    s_mark = "pass" if s.correct else "fail"
                    d_mark = "pass" if dl.correct else "fail"
                    lines.append(f"| {i} | {d['category']} | {s_mark} | {d_mark} | {dl.rounds_used} |")

    return "\n".join(lines)
