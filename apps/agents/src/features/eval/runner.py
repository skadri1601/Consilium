from __future__ import annotations

import asyncio
import json
import time
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field

from src.features.eval.dataset import EvalCase, EvalDataset
from src.features.eval.metrics import (
    claim_citation_score,
    conciseness_score,
    factual_overlap_score,
    reasoning_depth_score,
)

DeliberateFn = Callable[[str, str], Awaitable[str]]


@dataclass
class EvalResult:
    case_id: str
    topic: str
    predicted: str
    expected: str
    factual_overlap: float
    reasoning_depth: float
    conciseness: float
    claim_citation: float
    composite_score: float
    latency_ms: int
    mode: str = "council"


@dataclass
class EvalReport:
    dataset_name: str
    mode: str
    num_cases: int
    avg_composite: float
    avg_factual_overlap: float
    avg_reasoning_depth: float
    avg_conciseness: float
    avg_claim_citation: float
    results: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "dataset_name": self.dataset_name,
            "mode": self.mode,
            "num_cases": self.num_cases,
            "avg_composite": self.avg_composite,
            "avg_factual_overlap": self.avg_factual_overlap,
            "avg_reasoning_depth": self.avg_reasoning_depth,
            "avg_conciseness": self.avg_conciseness,
            "avg_claim_citation": self.avg_claim_citation,
            "results": self.results,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


class EvalRunner:
    def __init__(
        self,
        deliberate_fn: DeliberateFn,
        mode: str = "council",
        concurrency: int = 3,
    ):
        self._deliberate_fn = deliberate_fn
        self._mode = mode
        self._semaphore = asyncio.Semaphore(concurrency)

    async def _eval_single(self, case: EvalCase) -> EvalResult:
        start = time.monotonic()
        predicted = await self._deliberate_fn(case.topic, self._mode)
        elapsed_ms = int((time.monotonic() - start) * 1000)

        fo = factual_overlap_score(predicted, case.expected_answer)
        rd = reasoning_depth_score(predicted)
        cs = conciseness_score(predicted)
        cc = claim_citation_score(predicted)
        composite = fo * 0.4 + rd * 0.25 + cs * 0.15 + cc * 0.20

        return EvalResult(
            case_id=case.id,
            topic=case.topic,
            predicted=predicted,
            expected=case.expected_answer,
            factual_overlap=fo,
            reasoning_depth=rd,
            conciseness=cs,
            claim_citation=cc,
            composite_score=composite,
            latency_ms=elapsed_ms,
            mode=self._mode,
        )

    async def run(self, dataset: EvalDataset) -> list[EvalResult]:
        async def _bounded(case: EvalCase) -> EvalResult:
            async with self._semaphore:
                return await self._eval_single(case)

        tasks = [asyncio.create_task(_bounded(c)) for c in dataset.cases]
        return list(await asyncio.gather(*tasks))

    async def run_report(self, dataset: EvalDataset) -> EvalReport:
        results = await self.run(dataset)
        n = len(results)
        if n == 0:
            return EvalReport(
                dataset_name=dataset.name,
                mode=self._mode,
                num_cases=0,
                avg_composite=0.0,
                avg_factual_overlap=0.0,
                avg_reasoning_depth=0.0,
                avg_conciseness=0.0,
                avg_claim_citation=0.0,
            )
        return EvalReport(
            dataset_name=dataset.name,
            mode=self._mode,
            num_cases=n,
            avg_composite=sum(r.composite_score for r in results) / n,
            avg_factual_overlap=sum(r.factual_overlap for r in results) / n,
            avg_reasoning_depth=sum(r.reasoning_depth for r in results) / n,
            avg_conciseness=sum(r.conciseness for r in results) / n,
            avg_claim_citation=sum(r.claim_citation for r in results) / n,
            results=[
                {
                    "case_id": r.case_id,
                    "composite_score": r.composite_score,
                    "factual_overlap": r.factual_overlap,
                    "reasoning_depth": r.reasoning_depth,
                    "conciseness": r.conciseness,
                    "claim_citation": r.claim_citation,
                    "latency_ms": r.latency_ms,
                }
                for r in results
            ],
        )
