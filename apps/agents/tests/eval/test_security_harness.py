from __future__ import annotations

from src.eval.security.dataset import SEED_CASES, SecurityCase, load_cases
from src.eval.security.harness import evaluate
from src.eval.security.runners import (
    run_council,
    run_redteam,
    run_self_consistency,
    run_single,
)
from src.eval.security.scoring import (
    VERDICT_SAFE,
    VERDICT_UNKNOWN,
    VERDICT_VULNERABLE,
    compute_metrics,
    parse_verdict,
)


def make_oracle_fake():
    async def fake(model_id: str, prompt: str, api_keys: dict) -> str:
        if "MARK_VULN" in prompt:
            return "Review.\nVERDICT: VULNERABLE\nCWE: CWE-89\nREASONING: injection."
        if "MARK_SAFE" in prompt:
            return "Review.\nVERDICT: SAFE\nCWE: NONE\nREASONING: parameterized."
        return "Review.\nVERDICT: SAFE\nCWE: NONE\nREASONING: nothing found."

    return fake


def smoke_cases() -> list[SecurityCase]:
    return [
        SecurityCase("smoke-1", "CWE-89", "python", "q = MARK_VULN", "q = MARK_SAFE", "r"),
        SecurityCase("smoke-2", "CWE-79", "javascript", "el = MARK_VULN", "el = MARK_SAFE", "r"),
    ]


def test_parse_verdict_structured():
    assert parse_verdict("VERDICT: VULNERABLE\nCWE: CWE-89") == (VERDICT_VULNERABLE, "CWE-89")
    assert parse_verdict("VERDICT: SAFE\nCWE: NONE") == (VERDICT_SAFE, None)
    assert parse_verdict("") == (VERDICT_UNKNOWN, None)


def test_compute_metrics_exact():
    records = [
        {"vuln_verdict": "vulnerable", "patched_verdict": "safe", "expected_cwe": "CWE-89", "predicted_cwe": "CWE-89"},
        {"vuln_verdict": "vulnerable", "patched_verdict": "vulnerable", "expected_cwe": "CWE-79", "predicted_cwe": "CWE-79"},
        {"vuln_verdict": "safe", "patched_verdict": "safe", "expected_cwe": "CWE-22", "predicted_cwe": None},
        {"vuln_verdict": "vulnerable", "patched_verdict": "safe", "expected_cwe": "CWE-78", "predicted_cwe": "CWE-1"},
    ]
    metrics = compute_metrics(records)
    assert metrics.n_cases == 4
    assert metrics.true_positive == 3
    assert metrics.false_negative == 1
    assert metrics.false_positive == 1
    assert metrics.true_negative == 3
    assert metrics.pairwise_correct == 2
    assert abs(metrics.precision - 0.75) < 1e-9
    assert abs(metrics.recall - 0.75) < 1e-9
    assert abs(metrics.patched_fp_rate - 0.25) < 1e-9
    assert abs(metrics.cwe_match_rate - (2 / 3)) < 1e-9


async def test_single_oracle_is_perfect():
    fake = make_oracle_fake()
    vuln = await run_single(fake, "m", "q = MARK_VULN", "python", {})
    patched = await run_single(fake, "m", "q = MARK_SAFE", "python", {})
    assert vuln.verdict == VERDICT_VULNERABLE
    assert vuln.predicted_cwe == "CWE-89"
    assert patched.verdict == VERDICT_SAFE


async def test_self_consistency_majority():
    fake = make_oracle_fake()
    result = await run_self_consistency(fake, "m", "q = MARK_VULN", "python", {}, samples=3)
    assert result.verdict == VERDICT_VULNERABLE
    assert result.n_calls == 3


async def test_evaluate_single_and_sc_perfect_with_oracle():
    fake = make_oracle_fake()
    report = await evaluate(
        cases=smoke_cases(),
        configs=["single", "self_consistency"],
        model_call=fake,
        llm_fn=fake,
        model_id="m",
        models=["m1", "m2"],
        judge_model="j",
        samples=3,
        runs=1,
    )
    for config in ("single", "self_consistency"):
        metrics = report["configs"][config]["metrics"]
        assert metrics["pairwise_correct_rate"] == 1.0
        assert metrics["patched_fp_rate"] == 0.0


async def test_council_executes_end_to_end():
    fake = make_oracle_fake()
    result = await run_council("q = MARK_VULN", "python", {}, ["m1", "m2"], "j", llm_fn=fake)
    assert result.verdict in (VERDICT_VULNERABLE, VERDICT_SAFE, VERDICT_UNKNOWN)
    assert result.cost >= 0.0


async def test_redteam_executes_end_to_end():
    fake = make_oracle_fake()
    result = await run_redteam("q = MARK_VULN", "python", {}, ["m1", "m2"], "j", llm_fn=fake)
    assert result.verdict in (VERDICT_VULNERABLE, VERDICT_SAFE, VERDICT_UNKNOWN)
    assert result.cost >= 0.0


def test_seed_cases_loadable():
    assert load_cases(None) == SEED_CASES
    assert len(SEED_CASES) >= 5
