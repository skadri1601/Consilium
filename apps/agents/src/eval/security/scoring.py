from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass

VERDICT_VULNERABLE = "vulnerable"
VERDICT_SAFE = "safe"
VERDICT_UNKNOWN = "unknown"

_VERDICT_RE = re.compile(r"VERDICT:\s*(VULNERABLE|SAFE)", re.IGNORECASE)
_CWE_RE = re.compile(r"CWE-\d+", re.IGNORECASE)


def parse_verdict(text: str) -> tuple[str, str | None]:
    if not text:
        return VERDICT_UNKNOWN, None
    match = _VERDICT_RE.search(text)
    verdict = VERDICT_UNKNOWN
    if match:
        verdict = VERDICT_VULNERABLE if match.group(1).lower() == "vulnerable" else VERDICT_SAFE
    else:
        lowered = text.lower()
        if "not vulnerable" in lowered or "no vulnerabilit" in lowered or "is safe" in lowered:
            verdict = VERDICT_SAFE
        elif "vulnerable" in lowered or "injection" in lowered:
            verdict = VERDICT_VULNERABLE
    cwe_match = _CWE_RE.search(text)
    cwe = cwe_match.group(0).upper() if cwe_match else None
    return verdict, cwe


def majority_verdict(values: list[str]) -> str:
    items = [value for value in values if value]
    if not items:
        return VERDICT_UNKNOWN
    return Counter(items).most_common(1)[0][0]


def cwe_match(predicted: str | None, expected: str | None) -> bool:
    if not predicted or not expected:
        return False
    return predicted.upper().replace(" ", "") == expected.upper().replace(" ", "")


@dataclass
class Metrics:
    n_cases: int
    pairwise_correct: int
    pairwise_correct_rate: float
    true_positive: int
    false_negative: int
    false_positive: int
    true_negative: int
    precision: float
    recall: float
    f1: float
    patched_fp_rate: float
    cwe_match_rate: float


def compute_metrics(records: list[dict]) -> Metrics:
    n_cases = len(records)
    pairwise = 0
    true_positive = 0
    false_negative = 0
    false_positive = 0
    true_negative = 0
    cwe_hits = 0
    for record in records:
        vuln_verdict = record["vuln_verdict"]
        patched_verdict = record["patched_verdict"]
        if vuln_verdict == VERDICT_VULNERABLE:
            true_positive += 1
            if cwe_match(record.get("predicted_cwe"), record.get("expected_cwe")):
                cwe_hits += 1
        else:
            false_negative += 1
        if patched_verdict == VERDICT_VULNERABLE:
            false_positive += 1
        else:
            true_negative += 1
        if vuln_verdict == VERDICT_VULNERABLE and patched_verdict == VERDICT_SAFE:
            pairwise += 1
    precision = true_positive / (true_positive + false_positive) if (true_positive + false_positive) else 0.0
    recall = true_positive / (true_positive + false_negative) if (true_positive + false_negative) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    patched_fp_rate = false_positive / (false_positive + true_negative) if (false_positive + true_negative) else 0.0
    cwe_match_rate = cwe_hits / true_positive if true_positive else 0.0
    return Metrics(
        n_cases=n_cases,
        pairwise_correct=pairwise,
        pairwise_correct_rate=pairwise / n_cases if n_cases else 0.0,
        true_positive=true_positive,
        false_negative=false_negative,
        false_positive=false_positive,
        true_negative=true_negative,
        precision=precision,
        recall=recall,
        f1=f1,
        patched_fp_rate=patched_fp_rate,
        cwe_match_rate=cwe_match_rate,
    )
