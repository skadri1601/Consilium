from __future__ import annotations

from src.features.deliberation.types import (
    Claim,
    Proposal,
    Rebuttal,
    RebuttalType,
    CalibratedConfidence,
)


def compute_claim_stability(
    original_claims: list[Claim], post_challenge_claims: list[Claim]
) -> float:
    if not original_claims:
        return 1.0
    post_map = {c.id: c for c in post_challenge_claims}
    similarities = []
    for orig in original_claims:
        revised = post_map.get(orig.id)
        if revised is None:
            similarities.append(0.0)
            continue
        orig_words = set(orig.statement.lower().split())
        revised_words = set(revised.statement.lower().split())
        union = orig_words | revised_words
        if not union:
            similarities.append(1.0)
        else:
            similarities.append(len(orig_words & revised_words) / len(union))
    return sum(similarities) / len(similarities)


def compute_concession_rate(rebuttals: list[Rebuttal]) -> float:
    if not rebuttals:
        return 0.0
    return sum(1 for r in rebuttals if r.response_type == RebuttalType.CONCEDE) / len(rebuttals)


def compute_qualification_rate(rebuttals: list[Rebuttal]) -> float:
    if not rebuttals:
        return 0.0
    return sum(1 for r in rebuttals if r.response_type == RebuttalType.QUALIFY) / len(rebuttals)


def calibrate_confidence(
    model_id: str,
    original_proposal: Proposal,
    rebuttals: list[Rebuttal],
    revised_claims: list[Claim] | None = None,
) -> CalibratedConfidence:
    stability = compute_claim_stability(
        original_proposal.claims, revised_claims or original_proposal.claims
    )
    own_rebuttals = [r for r in rebuttals if r.defender_id == model_id]
    concession = compute_concession_rate(own_rebuttals)
    qualification = compute_qualification_rate(own_rebuttals)
    value = stability * (1 - concession) * (1 - 0.3 * qualification)
    value = max(0.0, min(1.0, value))
    return CalibratedConfidence(
        value=value, stability_score=stability, concession_rate=concession
    )


def calibrate_all(
    proposals: list[Proposal], rebuttals: list[Rebuttal]
) -> dict[str, CalibratedConfidence]:
    result: dict[str, CalibratedConfidence] = {}
    for proposal in proposals:
        result[proposal.model_id] = calibrate_confidence(
            proposal.model_id, proposal, rebuttals
        )
    return result
