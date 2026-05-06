"""Tests for session compaction."""

import pytest

from src.core.compaction import (
    Compactor,
    RoundRecord,
    estimate_tokens,
    total_chars,
)


def _round(n: int, *, response_size: int = 200, models: int = 2) -> RoundRecord:
    return RoundRecord(
        round_number=n,
        description=f"Round {n} description",
        responses={f"model-{i}": "x" * response_size for i in range(models)},
    )


def test_estimate_tokens_lower_bound():
    assert estimate_tokens("") == 1
    assert estimate_tokens("abcd") == 1
    assert estimate_tokens("a" * 4000) == 1000


def test_total_chars_sums_descriptions_and_responses():
    rounds = [_round(1, response_size=100, models=2), _round(2, response_size=50, models=1)]
    assert total_chars(rounds) == 100 * 2 + len("Round 1 description") + 50 + len("Round 2 description")


def test_should_compact_threshold():
    c = Compactor(max_chars=500)
    assert c.should_compact([_round(1, response_size=400, models=2)])
    assert not c.should_compact([_round(1, response_size=50, models=1)])


def test_compact_drops_head_keeps_tail_and_emits_summary():
    c = Compactor(max_chars=500, per_response_chars=80)
    rounds = [_round(i, response_size=400, models=3) for i in range(1, 5)]
    result = c.compact(rounds, keep_last=1)
    assert result.kept_rounds == (4,)
    assert result.dropped_rounds == (1, 2, 3)
    assert "compacted" in result.continuation.lower()
    assert "Round 1" in result.continuation


def test_compact_per_response_truncation_uses_ellipsis():
    c = Compactor(max_chars=10_000, per_response_chars=40)
    rounds = [_round(1, response_size=400, models=1), _round(2, response_size=400, models=1)]
    result = c.compact(rounds, keep_last=1)
    assert "…" in result.continuation


def test_compact_keep_last_geq_len_returns_all_rounds_summary():
    c = Compactor(max_chars=10_000)
    rounds = [_round(1), _round(2)]
    result = c.compact(rounds, keep_last=5)
    assert result.dropped_rounds == ()
    assert result.kept_rounds == (1, 2)


def test_compact_negative_keep_last_rejected():
    c = Compactor()
    with pytest.raises(ValueError):
        c.compact([_round(1)], keep_last=-1)


def test_compact_second_pass_trims_when_budget_still_exceeded():
    c = Compactor(max_chars=300, per_response_chars=600)
    rounds = [_round(i, response_size=400, models=4) for i in range(1, 4)]
    result = c.compact(rounds, keep_last=1)
    assert result.chars_after <= c.max_chars + 200


def test_compaction_ratio_reflects_size_reduction():
    c = Compactor(max_chars=200, per_response_chars=40)
    rounds = [_round(i, response_size=400, models=3) for i in range(1, 4)]
    result = c.compact(rounds, keep_last=1)
    assert result.ratio < 1.0
    assert result.chars_before > result.chars_after
