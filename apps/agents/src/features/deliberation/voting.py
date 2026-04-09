from __future__ import annotations
from typing import Optional
from collections import defaultdict

from src.features.deliberation.types import RankedBallot, AggregationResult


def _build_pairwise_matrix(
    ballots: list[RankedBallot], candidates: list[str]
) -> dict[str, dict[str, float]]:
    matrix: dict[str, dict[str, float]] = {
        a: {b: 0.0 for b in candidates} for a in candidates
    }
    for ballot in ballots:
        for i, a in enumerate(ballot.ranked_choices):
            for b in ballot.ranked_choices[i + 1 :]:
                matrix[a][b] += ballot.confidence_weight
    return matrix


def _detect_cycle(locked: dict[str, set[str]], new_edge: tuple[str, str]) -> bool:
    src, dst = new_edge
    visited: set[str] = set()
    stack = [dst]
    while stack:
        node = stack.pop()
        if node == src:
            return True
        if node in visited:
            continue
        visited.add(node)
        stack.extend(locked.get(node, set()))
    return False


def condorcet(ballots: list[RankedBallot]) -> Optional[str]:
    candidates = sorted({c for b in ballots for c in b.ranked_choices})
    if not candidates:
        return None
    matrix = _build_pairwise_matrix(ballots, candidates)
    for a in candidates:
        if all(matrix[a][b] > matrix[b][a] for b in candidates if b != a):
            return a
    return None


def borda_count(
    ballots: list[RankedBallot], confidence_weighted: bool = True
) -> dict[str, float]:
    scores: dict[str, float] = defaultdict(float)
    for ballot in ballots:
        n = len(ballot.ranked_choices)
        for rank, candidate in enumerate(ballot.ranked_choices):
            points = (n - 1) - rank
            weight = ballot.confidence_weight if confidence_weighted else 1.0
            scores[candidate] += points * weight
    return dict(scores)


def ranked_pairs(ballots: list[RankedBallot]) -> str:
    candidates = sorted({c for b in ballots for c in b.ranked_choices})
    matrix = _build_pairwise_matrix(ballots, candidates)

    pairs: list[tuple[str, str, float]] = []
    for a in candidates:
        for b in candidates:
            if a != b and matrix[a][b] > matrix[b][a]:
                pairs.append((a, b, matrix[a][b] - matrix[b][a]))

    pairs.sort(key=lambda x: x[2], reverse=True)

    locked: dict[str, set[str]] = defaultdict(set)
    for src, dst, _ in pairs:
        if not _detect_cycle(locked, (src, dst)):
            locked[src].add(dst)

    has_incoming = set()
    for src in locked:
        for dst in locked[src]:
            has_incoming.add(dst)

    for c in candidates:
        if c not in has_incoming:
            return c

    return candidates[0]


def copeland(ballots: list[RankedBallot]) -> dict[str, float]:
    candidates = sorted({c for b in ballots for c in b.ranked_choices})
    matrix = _build_pairwise_matrix(ballots, candidates)
    scores: dict[str, float] = {}
    for a in candidates:
        score = 0.0
        for b in candidates:
            if a == b:
                continue
            if matrix[a][b] > matrix[b][a]:
                score += 1.0
            elif matrix[a][b] < matrix[b][a]:
                score -= 1.0
        scores[a] = score
    return scores


def aggregate_votes(ballots: list[RankedBallot]) -> AggregationResult:
    borda = borda_count(ballots, confidence_weighted=True)
    full_ranking = sorted(borda, key=lambda c: borda[c], reverse=True)

    winner = condorcet(ballots)
    if winner is not None:
        return AggregationResult(
            winner=winner,
            full_ranking=full_ranking,
            method="condorcet",
            confident=True,
            scores=borda,
        )

    rp_winner = ranked_pairs(ballots)
    return AggregationResult(
        winner=rp_winner,
        full_ranking=full_ranking,
        method="ranked_pairs",
        confident=False,
        scores=borda,
    )
