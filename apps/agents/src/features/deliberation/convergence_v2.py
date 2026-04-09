from __future__ import annotations

from itertools import combinations

from src.features.deliberation.types import (
    ConvergenceResult,
    Proposal,
    Rebuttal,
    RebuttalType,
    Vote,
)


def kendall_tau(ranking_a: list[str], ranking_b: list[str]) -> float:
    all_items = list(dict.fromkeys(ranking_a + ranking_b))
    rank_a = {item: i for i, item in enumerate(ranking_a)}
    rank_b = {item: i for i, item in enumerate(ranking_b)}

    for item in all_items:
        if item not in rank_a:
            rank_a[item] = len(ranking_a)
        if item not in rank_b:
            rank_b[item] = len(ranking_b)

    pairs = list(combinations(all_items, 2))
    if not pairs:
        return 1.0

    concordant = 0
    discordant = 0
    for i, j in pairs:
        a_diff = rank_a[i] - rank_a[j]
        b_diff = rank_b[i] - rank_b[j]
        if a_diff * b_diff > 0:
            concordant += 1
        elif a_diff * b_diff < 0:
            discordant += 1

    total = len(pairs)
    raw = (concordant - discordant) / total
    return (raw + 1.0) / 2.0


def compute_ranking_similarity(votes_round_a: list[Vote], votes_round_b: list[Vote]) -> float:
    rankings_a = [v.ballot.ranked_choices for v in votes_round_a]
    rankings_b = [v.ballot.ranked_choices for v in votes_round_b]

    if not rankings_a or not rankings_b:
        return 0.0

    combined_a: dict[str, int] = {}
    for ranking in rankings_a:
        for pos, item in enumerate(ranking):
            combined_a[item] = combined_a.get(item, 0) + pos

    combined_b: dict[str, int] = {}
    for ranking in rankings_b:
        for pos, item in enumerate(ranking):
            combined_b[item] = combined_b.get(item, 0) + pos

    sorted_a = sorted(combined_a.keys(), key=lambda x: combined_a[x])
    sorted_b = sorted(combined_b.keys(), key=lambda x: combined_b[x])

    return kendall_tau(sorted_a, sorted_b)


def compute_proposal_similarity(proposals_a: list[Proposal], proposals_b: list[Proposal]) -> float:
    if not proposals_a or not proposals_b:
        return 0.0

    similarities = []
    for pa in proposals_a:
        for pb in proposals_b:
            words_a = set(pa.content.lower().split())
            words_b = set(pb.content.lower().split())
            union = words_a | words_b
            if not union:
                similarities.append(1.0)
            else:
                similarities.append(len(words_a & words_b) / len(union))

    return sum(similarities) / len(similarities)


def compute_concession_rate(rebuttals: list[Rebuttal]) -> float:
    if not rebuttals:
        return 0.0

    concessions = sum(
        1 for r in rebuttals
        if r.response_type in (RebuttalType.CONCEDE, RebuttalType.QUALIFY)
    )
    return concessions / len(rebuttals)


def check_convergence(
    current_round: int,
    max_rounds: int,
    votes_history: list[list[Vote]],
    proposals_history: list[list[Proposal]],
    rebuttals: list[Rebuttal],
    threshold: float = 0.85,
) -> ConvergenceResult:
    if current_round >= max_rounds:
        return ConvergenceResult(
            converged=True,
            score=1.0,
            components={},
            recommendation="max_rounds_reached",
        )

    if current_round < 2:
        return ConvergenceResult(
            converged=False,
            score=0.0,
            components={},
            recommendation="need_more_rounds",
        )

    ranking_sim = compute_ranking_similarity(votes_history[-2], votes_history[-1])
    proposal_sim = compute_proposal_similarity(proposals_history[-2], proposals_history[-1])
    concession = compute_concession_rate(rebuttals)

    score = 0.4 * ranking_sim + 0.35 * proposal_sim + 0.25 * concession

    converged = score >= threshold

    return ConvergenceResult(
        converged=converged,
        score=score,
        components={
            "ranking_similarity": ranking_sim,
            "proposal_similarity": proposal_sim,
            "concession_rate": concession,
        },
        recommendation="converged" if converged else "continue",
    )
