import random
import re
import math
from typing import Callable, Dict, List
from .types import Proposal, Evaluation

FINGERPRINT_PHRASES = [
    r"I'd be happy to",
    r"I'd be glad to",
    r"Certainly!",
    r"Sure!",
    r"Of course!",
    r"Great question!",
    r"Here's what I think",
    r"Let me help",
    r"I can help with that",
    r"As an AI",
    r"As a large language model",
    r"As an AI language model",
]

def strip_identity(text: str) -> str:
    for phrase in FINGERPRINT_PHRASES:
        text = re.sub(re.escape(phrase), '', text, flags=re.IGNORECASE)
    text = re.sub(r'(?i)(gpt-3|gpt-4|gpt-4o|claude|gemini|llama|mistral|anthropic|openai|google)', '[REDACTED]', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def generate_orderings(items: List[Proposal], k: int = 3) -> List[List[Proposal]]:
    n = len(items)
    if n == 0:
        return []
    import math
    max_perms = math.factorial(n)
    k = min(k, max_perms)
    seen = set()
    orderings = []
    attempts = 0
    while len(orderings) < k and attempts < k * 10:
        shuffled = list(items)
        random.shuffle(shuffled)
        key = tuple(id(x) for x in shuffled)
        if key not in seen:
            seen.add(key)
            orderings.append(shuffled)
        attempts += 1
    return orderings

def normalize_for_verbosity(score: float, token_count: int) -> float:
    """Normalizes a score by penalizing excessive verbosity."""
    if token_count <= 0:
        return score
    # Normalize by dividing by log10 of token_count so longer answers don't dominate linearly
    penalty = math.log10(max(10, token_count))
    return score / penalty

def run_blind_evaluation(
    proposals: List[Proposal],
    judge_id: str,
    judge_func: Callable[[List[Proposal]], Dict[str, float]],
    k: int = 3
) -> Dict[str, float]:
    """
    Runs double-blind evaluation on proposals.
    """
    if not proposals:
        return {}

    # 1. Judge != debater validation
    debater_ids = {p.model_id for p in proposals}
    if judge_id in debater_ids:
        raise ValueError(f"Judge {judge_id} cannot be a participant in the deliberation.")

    # 2. Strip identity and fingerprints
    anonymized_proposals = []
    for p in proposals:
        p_copy = Proposal(
            model_id=p.model_id, # Keep model_id internal for scoring mapping
            content=strip_identity(p.content),
            reasoning_chain=p.reasoning_chain,
            claims=p.claims,
            raw_confidence=p.raw_confidence,
            token_count=p.token_count,
            latency_ms=p.latency_ms,
            cost=p.cost
        )
        anonymized_proposals.append(p_copy)

    # 3. Generate K orderings
    orderings = generate_orderings(anonymized_proposals, k)

    # 4. Evaluate each ordering and average scores
    cumulative_scores = {p.model_id: 0.0 for p in proposals}
    
    for ordering in orderings:
        # Evaluate this ordering
        scores = judge_func(ordering)
        for p in ordering:
            cumulative_scores[p.model_id] += scores.get(p.model_id, 0.0)

    # Calculate averages
    averaged_scores = {
        model_id: total / k for model_id, total in cumulative_scores.items()
    }

    # 5. Normalize for verbosity
    final_scores = {}
    for p in anonymized_proposals:
        # Use a default token count if 0 based on content length
        tc = p.token_count if p.token_count > 0 else len(p.content.split())
        final_scores[p.model_id] = normalize_for_verbosity(averaged_scores[p.model_id], tc)

    return final_scores


def anonymize_proposals(proposals):
    mapping = {}
    labels = [chr(65 + i) for i in range(len(proposals))]
    anon = []
    for i, p in enumerate(proposals):
        label = f"Response {labels[i]}"
        mapping[label] = p.model_id
        anon.append(Proposal(
            model_id=label,
            content=strip_identity(p.content),
            reasoning_chain=[strip_identity(s) for s in p.reasoning_chain],
            claims=p.claims,
            raw_confidence=p.raw_confidence,
            token_count=p.token_count,
            latency_ms=p.latency_ms,
            cost=p.cost,
        ))
    return anon, mapping


evaluate_blind = run_blind_evaluation
normalize_verbosity = normalize_for_verbosity


def build_eval_prompt(proposals, rubric, ordering):
    lines = [f"Evaluate the following {len(proposals)} responses in the order presented.\n"]
    for i, model_id in enumerate(ordering):
        p = next((p for p in proposals if p.model_id == model_id), None)
        if p:
            lines.append(f"### {p.model_id}\n{p.content[:2000]}\n")
    lines.append(f"\nScoring Rubric:\n{rubric.to_prompt()}")
    lines.append("\nReturn JSON: {rankings: [{model_id, rank, scores: {dimension: score}}], reasoning}")
    return "\n".join(lines)


def validate_judge_not_debater(judge_model, debater_models):
    if judge_model in debater_models:
        raise ValueError(f"Judge {judge_model} cannot be a debater")
    return True
