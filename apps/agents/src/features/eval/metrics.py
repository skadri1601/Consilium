from __future__ import annotations

import re


def _tokenize(text: str) -> list[str]:
    return re.findall(r"\b\w+\b", text.lower())


def factual_overlap_score(predicted: str, expected: str) -> float:
    pred_tokens = _tokenize(predicted)
    exp_tokens = _tokenize(expected)
    if not pred_tokens or not exp_tokens:
        return 0.0
    pred_set = set(pred_tokens)
    exp_set = set(exp_tokens)
    common = pred_set & exp_set
    if not common:
        return 0.0
    precision = len(common) / len(pred_set)
    recall = len(common) / len(exp_set)
    return 2 * precision * recall / (precision + recall)


def reasoning_depth_score(text: str) -> float:
    tokens = _tokenize(text)
    if not tokens:
        return 0.0
    indicators = {
        "because", "therefore", "thus", "hence", "however",
        "although", "consider", "analyze", "evidence",
        "if", "when", "assuming",
        "first", "second", "third",
    }
    matches = sum(1 for t in tokens if t in indicators)
    density = matches / len(tokens)
    return min(1.0, density * 10)


def conciseness_score(text: str) -> float:
    tokens = _tokenize(text)
    if not tokens:
        return 0.0
    word_count = len(tokens)
    unique_ratio = len(set(tokens)) / word_count

    filler_words = {"well", "basically", "actually", "literally", "really", "very", "just"}
    filler_count = sum(1 for t in tokens if t in filler_words)
    lower_text = text.lower()
    multi_word_fillers = ["in order to", "it is worth noting"]
    for phrase in multi_word_fillers:
        occurrences = lower_text.count(phrase)
        if occurrences:
            filler_count += occurrences * len(phrase.split())
    filler_ratio = filler_count / word_count

    length_penalty = min(1.0, 200 / word_count)

    return unique_ratio * 0.4 + (1 - filler_ratio) * 0.3 + length_penalty * 0.3


def claim_citation_score(text: str) -> float:
    evidence_phrases = [
        "according to", "research shows", "data indicates",
        "study found", "evidence suggests", "based on",
        "analysis reveals", "results show",
    ]
    lower_text = text.lower()
    evidence_count = sum(1 for phrase in evidence_phrases if phrase in lower_text)
    sentences = [s.strip() for s in text.split(". ") if s.strip()]
    sentence_count = max(len(sentences), 1)
    return min(1.0, evidence_count / sentence_count)
