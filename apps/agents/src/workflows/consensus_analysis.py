"""Pure-function helpers for consensus analysis.

Provides lexical key-point extraction and pairwise Jaccard agreement
without any heavy NLP dependencies.
"""

from __future__ import annotations

import re
from collections import Counter
from itertools import combinations

STOPWORDS: frozenset[str] = frozenset({
    "a", "an", "the", "and", "or", "but", "if", "then", "else", "of", "at",
    "by", "for", "with", "about", "against", "between", "into", "through",
    "to", "from", "in", "on", "off", "over", "under", "is", "are", "was",
    "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "this", "that", "these", "those", "it", "its", "as", "so", "not",
})

_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")
_WORD_RE = re.compile(r"[a-zA-Z]+")


def _split_sentences(text: str) -> list[str]:
    if not text:
        return []
    parts = _SENTENCE_SPLIT.split(text.strip())
    return [p.strip(" \t\n\r.!?") for p in parts if p and p.strip()]


def _tokenize(text: str) -> list[str]:
    return [
        t.lower()
        for t in _WORD_RE.findall(text)
        if t.lower() not in STOPWORDS and len(t) > 1
    ]


def _content_token_set(text: str) -> set[str]:
    return set(_tokenize(text))


def _jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    union = a | b
    if not union:
        return 0.0
    return len(a & b) / len(union)


def extract_key_points(
    responses: list[str],
    top_n: int = 5,
    max_sentence_length: int = 300,
    diversity_lambda: float = 0.5,
) -> list[str]:
    """Extract up to ``top_n`` representative sentences via MMR-style selection.

    Sentences are scored by mean term-frequency of their non-stopword tokens
    across the union of responses. Selection greedily picks the highest-scored
    sentence, then penalises subsequent candidates by their max Jaccard
    overlap with already-picked sentences to encourage diversity.

    Complexity: O(S * T) tokenisation plus O(top_n * S) selection where S is
    total sentences and T is average sentence length in tokens.
    """
    if not responses or top_n <= 0:
        return []

    sentences: list[str] = []
    for resp in responses:
        if not isinstance(resp, str):
            continue
        sentences.extend(_split_sentences(resp))
    if not sentences:
        return []

    tokenized: list[list[str]] = [_tokenize(s) for s in sentences]
    tf: Counter[str] = Counter()
    for tokens in tokenized:
        tf.update(tokens)

    scored: list[tuple[float, int, set[str]]] = []
    for idx, tokens in enumerate(tokenized):
        if not tokens:
            continue
        score = sum(tf[t] for t in tokens) / len(tokens)
        scored.append((score, idx, set(tokens)))
    if not scored:
        return []

    scored.sort(key=lambda x: x[0], reverse=True)

    selected: list[tuple[int, set[str]]] = []
    picked_indices: set[int] = set()

    while scored and len(selected) < top_n:
        best_value = float("-inf")
        best_pos = -1
        for pos, (score, idx, tokens) in enumerate(scored):
            if idx in picked_indices:
                continue
            max_overlap = 0.0
            for _, picked_tokens in selected:
                overlap = _jaccard(tokens, picked_tokens)
                if overlap > max_overlap:
                    max_overlap = overlap
            mmr = (1.0 - diversity_lambda) * score - diversity_lambda * max_overlap * (
                scored[0][0] if scored else 1.0
            )
            if mmr > best_value:
                best_value = mmr
                best_pos = pos
        if best_pos < 0:
            break
        _, idx, tokens = scored.pop(best_pos)
        picked_indices.add(idx)
        selected.append((idx, tokens))

    selected.sort(key=lambda pair: pair[0])
    result: list[str] = []
    seen_normalised: set[str] = set()
    for idx, _ in selected:
        sentence = sentences[idx].strip()
        if len(sentence) > max_sentence_length:
            sentence = sentence[: max_sentence_length - 1].rstrip() + "..."
        if not sentence:
            continue
        key = sentence.lower()
        if key in seen_normalised:
            continue
        seen_normalised.add(key)
        result.append(sentence)
    return result


def compute_agreement(responses: list[str]) -> float:
    """Mean pairwise Jaccard similarity over content tokens.

    Returns 0.0 for fewer than two responses or when all token sets are empty.
    Result is clamped to ``[0.0, 1.0]``.

    Complexity: O(N^2 * T) where N is response count and T is average
    response length in tokens.
    """
    if not responses or len(responses) < 2:
        return 0.0

    token_sets: list[set[str]] = [
        _content_token_set(r) for r in responses if isinstance(r, str)
    ]
    if len(token_sets) < 2:
        return 0.0

    similarities: list[float] = [
        _jaccard(a, b) for a, b in combinations(token_sets, 2)
    ]
    if not similarities:
        return 0.0

    mean = sum(similarities) / len(similarities)
    if mean < 0.0:
        return 0.0
    if mean > 1.0:
        return 1.0
    return mean
