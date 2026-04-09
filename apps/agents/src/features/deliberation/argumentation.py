from __future__ import annotations

import json
import re
import uuid
from typing import Optional

from src.features.deliberation.types import (
    Claim,
    Challenge,
    ChallengeType,
    Proposal,
    Rebuttal,
    RebuttalType,
)


def generate_claim_id(model_id: str, index: int) -> str:
    return f"{model_id[:8]}_claim_{index}"


def extract_json(text: str) -> dict:
    fence_match = re.search(r"```(?:json)?\s*\n?(.*?)\n?\s*```", text, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    brace_match = re.search(r"(\{.*\})", text, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group(1))
        except json.JSONDecodeError:
            pass

    bracket_match = re.search(r"(\[.*\])", text, re.DOTALL)
    if bracket_match:
        try:
            return json.loads(bracket_match.group(1))
        except json.JSONDecodeError:
            pass

    raise ValueError("No valid JSON found in text")


def build_proposal_prompt(
    topic: str,
    mode: str,
    round_number: int,
    previous_proposals: Optional[list[Proposal]] = None,
) -> str:
    base = (
        f"Analyze this topic: {topic}\n\n"
        f"Deliberation mode: {mode}\n"
        f"Round: {round_number}\n\n"
        "Provide your response as JSON with fields: "
        "content, reasoning_chain (list of steps), "
        "claims (list of {{id, statement, evidence, confidence, assumptions, limitations}}), "
        "raw_confidence (0-1)"
    )

    if round_number > 1 and previous_proposals:
        base += "\n\nPrevious proposals for cross-reference:\n"
        for p in previous_proposals:
            base += f"\n--- {p.model_id} ---\n{p.content}\n"
            for c in p.claims:
                base += f"  Claim [{c.id}]: {c.statement} (confidence: {c.confidence})\n"

    return base


def build_challenge_prompt(proposal: Proposal, challenger_claims: list[Claim]) -> str:
    claims_text = "\n".join(
        f"  [{c.id}] {c.statement} (confidence: {c.confidence}, "
        f"evidence: {c.evidence}, assumptions: {c.assumptions}, "
        f"limitations: {c.limitations})"
        for c in proposal.claims
    )

    challenger_text = "\n".join(
        f"  [{c.id}] {c.statement}" for c in challenger_claims
    )

    return (
        f"Examine this proposal's claims:\n\n"
        f"Proposal by {proposal.model_id}:\n{proposal.content}\n\n"
        f"Claims:\n{claims_text}\n\n"
        f"Your own claims for reference:\n{challenger_text}\n\n"
        "For each weak claim, generate a challenge as JSON array of objects with fields: "
        "target_claim_id, challenge_type (one of: factual_error, missing_evidence, "
        "flawed_reasoning, better_alternative, edge_case, assumption_violation), "
        "argument, counter_evidence"
    )


def build_rebuttal_prompt(challenge: Challenge, original_proposal: Proposal) -> str:
    return (
        f"Respond to this challenge against your proposal.\n\n"
        f"Your original proposal:\n{original_proposal.content}\n\n"
        f"Challenge from {challenge.challenger_id}:\n"
        f"  Target claim: {challenge.target_claim_id}\n"
        f"  Type: {challenge.challenge_type.value}\n"
        f"  Argument: {challenge.argument}\n"
        f"  Counter evidence: {challenge.counter_evidence}\n\n"
        "Respond as JSON with fields: "
        "response_type (concede/refute/qualify/redirect), "
        "argument, revised_claim (if concede/qualify, include {{id, statement, evidence, "
        "confidence, assumptions, limitations}})"
    )


def parse_proposal(raw_text: str, model_id: str = "unknown") -> Proposal:
    try:
        data = extract_json(raw_text)
        if isinstance(data, list):
            data = data[0] if data else {}

        claims = []
        for i, c in enumerate(data.get("claims", [])):
            claims.append(Claim(
                id=c.get("id", generate_claim_id(model_id, i)),
                statement=c.get("statement", ""),
                evidence=c.get("evidence", []),
                confidence=float(c.get("confidence", 0.5)),
                assumptions=c.get("assumptions", []),
                limitations=c.get("limitations", []),
            ))

        return Proposal(
            model_id=model_id,
            content=data.get("content", ""),
            reasoning_chain=data.get("reasoning_chain", []),
            claims=claims,
            raw_confidence=float(data.get("raw_confidence", 0.5)),
        )
    except (ValueError, KeyError, IndexError, TypeError):
        return Proposal(
            model_id=model_id,
            content=raw_text,
            reasoning_chain=[],
            claims=[Claim(
                id=generate_claim_id(model_id, 0),
                statement=raw_text[:200],
                evidence=[],
                confidence=0.5,
                assumptions=[],
                limitations=["Auto-generated from unparseable response"],
            )],
            raw_confidence=0.5,
        )


def parse_challenges(raw_text: str, challenger_id: str = "unknown", target_model_id: str = "unknown") -> list[Challenge]:
    try:
        data = extract_json(raw_text)
        if isinstance(data, dict):
            data = [data]

        challenges = []
        for item in data:
            challenges.append(Challenge(
                challenger_id=challenger_id,
                target_model_id=target_model_id,
                target_claim_id=item.get("target_claim_id", ""),
                challenge_type=ChallengeType(item.get("challenge_type", "factual_error")),
                argument=item.get("argument", ""),
                counter_evidence=item.get("counter_evidence", []),
            ))
        return challenges
    except (ValueError, KeyError, IndexError, TypeError):
        return []


def parse_rebuttals(raw_text: str, defender_id: str = "unknown", challenge_id: str = "") -> list[Rebuttal]:
    try:
        data = extract_json(raw_text)
        if isinstance(data, dict):
            data = [data]

        rebuttals = []
        for item in data:
            revised = None
            if item.get("revised_claim"):
                rc = item["revised_claim"]
                revised = Claim(
                    id=rc.get("id", ""),
                    statement=rc.get("statement", ""),
                    evidence=rc.get("evidence", []),
                    confidence=float(rc.get("confidence", 0.5)),
                    assumptions=rc.get("assumptions", []),
                    limitations=rc.get("limitations", []),
                )

            rebuttals.append(Rebuttal(
                defender_id=defender_id,
                challenge_id=challenge_id,
                response_type=RebuttalType(item.get("response_type", "refute")),
                argument=item.get("argument", ""),
                revised_claim=revised,
            ))
        return rebuttals
    except (ValueError, KeyError, IndexError, TypeError):
        return []
