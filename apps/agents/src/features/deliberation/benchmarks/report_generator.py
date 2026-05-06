from __future__ import annotations

import argparse
import json
import os
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any

from .framework import BenchmarkResult


@dataclass
class CategoryBreakdown:
    category: str
    single_correct: int = 0
    single_total: int = 0
    deliberation_correct: int = 0
    deliberation_total: int = 0

    @property
    def single_accuracy(self) -> float:
        return self.single_correct / self.single_total if self.single_total else 0.0

    @property
    def deliberation_accuracy(self) -> float:
        return self.deliberation_correct / self.deliberation_total if self.deliberation_total else 0.0

    @property
    def improvement_pct(self) -> float:
        if self.single_accuracy > 0:
            return (self.deliberation_accuracy - self.single_accuracy) / self.single_accuracy * 100
        return 0.0


@dataclass
class CostAnalysis:
    total_cost_single: float
    total_cost_deliberation: float
    total_questions: int

    @property
    def cost_per_question_single(self) -> float:
        return self.total_cost_single / self.total_questions if self.total_questions else 0.0

    @property
    def cost_per_question_deliberation(self) -> float:
        return self.total_cost_deliberation / self.total_questions if self.total_questions else 0.0

    @property
    def cost_multiplier(self) -> float:
        return self.total_cost_deliberation / self.total_cost_single if self.total_cost_single > 0 else 0.0


@dataclass
class AggregateReport:
    results: list[BenchmarkResult]
    category_breakdowns: dict[str, list[CategoryBreakdown]] = field(default_factory=dict)
    cost_analysis: CostAnalysis | None = None
    generated_at: str = ""

    @property
    def headline_improvement(self) -> float:
        total_single = sum(r.single_model_score * r.num_questions for r in self.results)
        total_delib = sum(r.deliberation_score * r.num_questions for r in self.results)
        total_q = sum(r.num_questions for r in self.results)
        if total_q == 0:
            return 0.0
        avg_single = total_single / total_q
        avg_delib = total_delib / total_q
        if avg_single > 0:
            return (avg_delib - avg_single) / avg_single * 100
        return 0.0


def _compute_category_breakdowns(result: BenchmarkResult) -> list[CategoryBreakdown]:
    cats: dict[str, CategoryBreakdown] = {}
    for d in result.details:
        cat = d.get("category", "unknown")
        if cat not in cats:
            cats[cat] = CategoryBreakdown(category=cat)
        cb = cats[cat]
        cb.single_total += 1
        cb.deliberation_total += 1
        single = d.get("single")
        delib = d.get("deliberation")

        def _correct_flag(value: object) -> bool:
            if value is None:
                return False
            if hasattr(value, "correct"):
                return bool(getattr(value, "correct", False))
            if isinstance(value, dict):
                return bool(value.get("correct", False))
            return False

        single_correct = _correct_flag(single)
        delib_correct = _correct_flag(delib)
        if single_correct:
            cb.single_correct += 1
        if delib_correct:
            cb.deliberation_correct += 1
    return sorted(cats.values(), key=lambda c: c.category)


def _compute_cost_analysis(results: list[BenchmarkResult]) -> CostAnalysis:
    return CostAnalysis(
        total_cost_single=sum(r.cost_single for r in results),
        total_cost_deliberation=sum(r.cost_deliberation for r in results),
        total_questions=sum(r.num_questions for r in results),
    )


def build_aggregate_report(results: list[BenchmarkResult]) -> AggregateReport:
    from datetime import datetime, timezone

    category_breakdowns = {}
    for r in results:
        category_breakdowns[r.benchmark_name] = _compute_category_breakdowns(r)

    return AggregateReport(
        results=results,
        category_breakdowns=category_breakdowns,
        cost_analysis=_compute_cost_analysis(results),
        generated_at=datetime.now(timezone.utc).isoformat(),
    )


def generate_markdown_report(report: AggregateReport) -> str:
    lines: list[str] = []

    lines.append("# Consilium Benchmark Report")
    lines.append("")
    lines.append(f"**Generated:** {report.generated_at}")
    lines.append("")

    lines.append("## Executive Summary")
    lines.append("")
    lines.append(
        f"Deliberation improves accuracy by **{report.headline_improvement:+.1f}%** "
        f"across {sum(r.num_questions for r in report.results)} questions "
        f"in {len(report.results)} benchmark(s)."
    )
    lines.append("")

    lines.append("## Benchmark Comparison")
    lines.append("")
    lines.append("| Benchmark | Questions | Single Model | Deliberation | Improvement |")
    lines.append("|-----------|-----------|-------------|-------------|-------------|")
    for r in report.results:
        lines.append(
            f"| {r.benchmark_name} | {r.num_questions} "
            f"| {r.single_model_score:.1%} | {r.deliberation_score:.1%} "
            f"| {r.improvement_pct:+.1f}% |"
        )
    lines.append("")

    for r in report.results:
        breakdowns = report.category_breakdowns.get(r.benchmark_name, [])
        if not breakdowns:
            continue
        lines.append(f"## {r.benchmark_name} - Category Breakdown")
        lines.append("")
        lines.append("| Category | Single | Deliberation | Improvement |")
        lines.append("|----------|--------|-------------|-------------|")
        for cb in breakdowns:
            lines.append(
                f"| {cb.category} "
                f"| {cb.single_accuracy:.1%} ({cb.single_correct}/{cb.single_total}) "
                f"| {cb.deliberation_accuracy:.1%} ({cb.deliberation_correct}/{cb.deliberation_total}) "
                f"| {cb.improvement_pct:+.1f}% |"
            )
        lines.append("")

    if report.cost_analysis:
        ca = report.cost_analysis
        lines.append("## Cost Analysis")
        lines.append("")
        lines.append("| Metric | Single Model | Deliberation |")
        lines.append("|--------|-------------|-------------|")
        lines.append(f"| Total Cost | ${ca.total_cost_single:.4f} | ${ca.total_cost_deliberation:.4f} |")
        lines.append(f"| Cost per Question | ${ca.cost_per_question_single:.4f} | ${ca.cost_per_question_deliberation:.4f} |")
        lines.append(f"| Cost Multiplier | 1.0x | {ca.cost_multiplier:.1f}x |")
        lines.append("")

    return "\n".join(lines)


def generate_json_data(report: AggregateReport) -> dict[str, Any]:
    benchmarks = []
    for r in report.results:
        breakdowns = report.category_breakdowns.get(r.benchmark_name, [])
        benchmarks.append({
            "name": r.benchmark_name,
            "num_questions": r.num_questions,
            "single_model_score": r.single_model_score,
            "deliberation_score": r.deliberation_score,
            "improvement_pct": r.improvement_pct,
            "cost_single": r.cost_single,
            "cost_deliberation": r.cost_deliberation,
            "categories": [
                {
                    "category": cb.category,
                    "single_accuracy": cb.single_accuracy,
                    "deliberation_accuracy": cb.deliberation_accuracy,
                    "improvement_pct": cb.improvement_pct,
                    "single_correct": cb.single_correct,
                    "single_total": cb.single_total,
                    "deliberation_correct": cb.deliberation_correct,
                    "deliberation_total": cb.deliberation_total,
                }
                for cb in breakdowns
            ],
        })

    cost = report.cost_analysis
    cost_data = {}
    if cost:
        cost_data = {
            "total_cost_single": cost.total_cost_single,
            "total_cost_deliberation": cost.total_cost_deliberation,
            "total_questions": cost.total_questions,
            "cost_per_question_single": cost.cost_per_question_single,
            "cost_per_question_deliberation": cost.cost_per_question_deliberation,
            "cost_multiplier": cost.cost_multiplier,
        }

    return {
        "generated_at": report.generated_at,
        "headline_improvement_pct": report.headline_improvement,
        "benchmarks": benchmarks,
        "cost_analysis": cost_data,
    }


def load_results_from_dir(results_dir: str) -> list[BenchmarkResult]:
    results = []
    path = Path(results_dir)
    for file in sorted(path.glob("*.json")):
        with open(file) as f:
            data = json.load(f)
        if not isinstance(data, dict) or "benchmark_name" not in data:
            continue
        results.append(BenchmarkResult(
            benchmark_name=data["benchmark_name"],
            single_model_score=float(data["single_model_score"] or 0),
            deliberation_score=float(data["deliberation_score"] or 0),
            improvement_pct=float(data["improvement_pct"] or 0),
            num_questions=int(data["num_questions"] or 0),
            cost_single=float(data["cost_single"] or 0),
            cost_deliberation=float(data["cost_deliberation"] or 0),
            details=data.get("details", []),
        ))
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate aggregate benchmark report")
    parser.add_argument("--results-dir", required=True, help="Directory containing benchmark result JSON files")
    parser.add_argument("--output", required=True, help="Output markdown file path")
    parser.add_argument("--json-output", default=None, help="Output JSON file path")
    args = parser.parse_args()

    results = load_results_from_dir(args.results_dir)
    report = build_aggregate_report(results)

    md = generate_markdown_report(report)
    with open(args.output, "w") as f:
        f.write(md)

    json_path = args.json_output or args.output.replace(".md", ".json")
    json_data = generate_json_data(report)
    with open(json_path, "w") as f:
        json.dump(json_data, f, indent=2)


if __name__ == "__main__":
    main()
