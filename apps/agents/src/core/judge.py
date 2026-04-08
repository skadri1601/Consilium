import json
import asyncio
import logging
from dataclasses import dataclass, field
from typing import AsyncGenerator, Any

from .judge_prompts import (
    CLAIM_EXTRACTION_PROMPT,
    CROSS_REFERENCE_PROMPT,
    DISPUTE_RESOLUTION_PROMPT,
    SYNTHESIS_PROMPT_WEB,
    SYNTHESIS_PROMPT_CLI,
    EMERGENCY_SYNTHESIS_PROMPT,
)
from .agent_factory import AgentFactory
from .anonymizer import Anonymizer, AnonymityMap
from .shared import FALLBACK_RESPONSE, _sse, REDIS_TTL
from ..shared.database.redis import get_redis
from ..shared.config.models import get_provider_for_model

logger = logging.getLogger(__name__)

CHEAP_MODELS = ["gpt-4o-mini", "gemini-2.0-flash", "claude-3-5-haiku-latest"]
STRONG_MODELS = ["claude-3-opus-latest", "gemini-2.5-pro", "gpt-4o"]

_CALL_TIMEOUT = 60
_MAX_RETRIES = 2
_RETRY_DELAYS = [2, 5]
_RETRY_DELAY_BETWEEN_STRATEGIES = 3


@dataclass
class JudgeResult:
    golden_prompt: str
    synthesis_method: str
    scores: dict[str, dict[str, float]]
    improvement_score: float
    claims_by_model: dict[str, list[dict]] = field(default_factory=dict)
    cross_reference: dict[str, Any] = field(default_factory=dict)
    disputes_resolved: list[dict] = field(default_factory=list)


def _pick_available_model(
    candidates: list[str],
    api_keys: dict[str, str | None],
    exclude_models: list[str] | None = None,
) -> str | None:
    exclude = set(exclude_models or [])
    for model_id in candidates:
        if model_id in exclude:
            continue
        provider = get_provider_for_model(model_id)
        if provider is None:
            continue
        key_map = {
            "openai": "openaiKey",
            "anthropic": "anthropicKey",
            "google": "googleKey",
            "groq": "groqKey",
            "xai": "xaiKey",
        }
        key_field = key_map.get(provider)
        if key_field and api_keys.get(key_field):
            return model_id
    return None


async def _call_model(
    model_id: str,
    api_keys: dict[str, str | None],
    prompt: str,
) -> str:
    last_exc: Exception | None = None
    for attempt in range(_MAX_RETRIES + 1):
        try:
            agent = AgentFactory.create(model_id, api_keys)
            response, _ = await asyncio.wait_for(
                agent.generate_response(prompt),
                timeout=_CALL_TIMEOUT,
            )
            return response
        except Exception as e:
            last_exc = e
            if attempt < _MAX_RETRIES:
                delay = _RETRY_DELAYS[attempt] if attempt < len(_RETRY_DELAYS) else _RETRY_DELAYS[-1]
                logger.warning("_call_model attempt %d failed (%s), retrying in %ds", attempt + 1, e, delay)
                await asyncio.sleep(delay)
    raise last_exc  # type: ignore[misc]


async def _stream_model(
    model_id: str,
    api_keys: dict[str, str | None],
    prompt: str,
) -> AsyncGenerator[str, None]:
    last_exc: Exception | None = None
    for attempt in range(_MAX_RETRIES + 1):
        try:
            agent = AgentFactory.create(model_id, api_keys)
            chunks_received = False
            async for chunk in agent.stream_response(prompt):
                chunks_received = True
                yield chunk
            if chunks_received:
                return
        except Exception as e:
            last_exc = e
            if attempt < _MAX_RETRIES:
                delay = _RETRY_DELAYS[attempt] if attempt < len(_RETRY_DELAYS) else _RETRY_DELAYS[-1]
                logger.warning("_stream_model attempt %d failed (%s), retrying in %ds", attempt + 1, e, delay)
                await asyncio.sleep(delay)
            else:
                raise
    if last_exc:
        raise last_exc


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass
    return {}


def _anonymize_responses(
    responses: list[dict[str, str]],
) -> tuple[list[dict[str, str]], dict[str, str], dict[str, str]]:
    model_ids = [r["model_id"] for r in responses]
    anon_map = AnonymityMap(model_ids)
    responses_dict = {r["model_id"]: r["text"] for r in responses}
    redis_stub = type("_Stub", (), {"set": staticmethod(lambda *a, **kw: None)})()
    anonymizer = Anonymizer(redis_stub)  # type: ignore[arg-type]
    anonymized_raw = anonymizer.anonymize_responses(anon_map, responses_dict, round_number=1)
    label_to_model: dict[str, str] = {}
    model_to_label: dict[str, str] = {}
    anonymized: list[dict[str, str]] = []
    for entry in anonymized_raw:
        label = entry["label"]
        model_id = entry["model_id"]
        label_to_model[label] = model_id
        model_to_label[model_id] = label
        anonymized.append({"label": label, "text": entry["text"]})
    return anonymized, label_to_model, model_to_label


async def extract_claims(
    question: str,
    anonymized_responses: list[dict[str, str]],
    cheap_model: str,
    api_keys: dict[str, str | None],
) -> dict[str, list[dict]]:
    tasks = []
    labels = []
    for entry in anonymized_responses:
        prompt = CLAIM_EXTRACTION_PROMPT.format(
            label=entry["label"],
            response=entry["text"],
            question=question,
        )
        tasks.append(_call_model(cheap_model, api_keys, prompt))
        labels.append(entry["label"])

    results = await asyncio.gather(*tasks, return_exceptions=True)

    claims_by_label: dict[str, list[dict]] = {}
    for label, result in zip(labels, results):
        if isinstance(result, Exception):
            logger.warning("Claim extraction failed for %s: %s", label, result)
            continue
        parsed = _parse_json_response(result)
        claims = parsed.get("claims", [])
        if claims:
            claims_by_label[label] = claims
    return claims_by_label


async def cross_reference_claims(
    claims_by_label: dict[str, list[dict]],
    cheap_model: str,
    api_keys: dict[str, str | None],
) -> dict[str, Any]:
    claims_text_parts = []
    all_labels = sorted(claims_by_label.keys())
    for label in all_labels:
        claims = claims_by_label[label]
        claims_formatted = "\n".join(
            f"  {c['id']}: {c['text']} [specificity={c.get('specificity', 'medium')}, "
            f"evidence={c.get('evidence', 'moderate')}]"
            for c in claims
        )
        claims_text_parts.append(f"{label}:\n{claims_formatted}")
    claims_text = "\n\n".join(claims_text_parts)

    label_a = all_labels[0] if len(all_labels) > 0 else "Response A"
    label_b = all_labels[1] if len(all_labels) > 1 else "Response B"

    prompt = CROSS_REFERENCE_PROMPT.format(
        claims_by_participant=claims_text,
        label_a=label_a,
        label_b=label_b,
    )
    try:
        result = await _call_model(cheap_model, api_keys, prompt)
    except Exception as e:
        logger.warning("Cross-reference failed after retries: %s", e)
        return {"agreements": [], "contradictions": [], "unique_claims": []}
    parsed = _parse_json_response(result)
    if not parsed:
        return {"agreements": [], "contradictions": [], "unique_claims": []}
    return parsed


async def resolve_disputes(
    question: str,
    contradictions: list[dict],
    claims_by_label: dict[str, list[dict]],
    cheap_model: str,
    api_keys: dict[str, str | None],
) -> list[dict]:
    if not contradictions:
        return []

    def _find_claim_text(ref: str) -> str:
        parts = ref.split(":")
        if len(parts) != 2:
            return ref
        label, cid = parts[0].strip(), parts[1].strip()
        for lbl, claims in claims_by_label.items():
            if lbl.strip() == label:
                for c in claims:
                    if c.get("id") == cid:
                        return c.get("text", ref)
        return ref

    tasks = []
    for contradiction in contradictions:
        claim_a_ref = contradiction.get("claim_a", "")
        claim_b_ref = contradiction.get("claim_b", "")
        label_a = claim_a_ref.split(":")[0].strip() if ":" in claim_a_ref else "Unknown"
        label_b = claim_b_ref.split(":")[0].strip() if ":" in claim_b_ref else "Unknown"
        prompt = DISPUTE_RESOLUTION_PROMPT.format(
            question=question,
            label_a=label_a,
            label_b=label_b,
            claim_a=_find_claim_text(claim_a_ref),
            claim_b=_find_claim_text(claim_b_ref),
            summary=contradiction.get("summary", ""),
        )
        tasks.append(_call_model(cheap_model, api_keys, prompt))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    resolutions = []
    for contradiction, result in zip(contradictions, results):
        if isinstance(result, Exception):
            logger.warning("Dispute resolution failed: %s", result)
            resolutions.append({
                "dispute": contradiction,
                "resolution": {"winner": "unresolved", "confidence": 0.0},
            })
            continue
        parsed = _parse_json_response(result)
        resolutions.append({
            "dispute": contradiction,
            "resolution": parsed if parsed else {"winner": "unresolved", "confidence": 0.0},
        })
    return resolutions


def score_claims(
    claims_by_label: dict[str, list[dict]],
    cross_ref: dict[str, Any],
    disputes_resolved: list[dict],
) -> dict[str, dict[str, float]]:
    scores: dict[str, dict[str, float]] = {}

    for label, claims in claims_by_label.items():
        if not claims:
            continue
        scores[label] = {
            "corroboration": 0.0,
            "dispute_survival": 0.0,
            "specificity": 0.0,
            "evidence": 0.0,
            "position_stability": 0.0,
            "total": 0.0,
        }

    agreements = cross_ref.get("agreements", [])
    contradictions = cross_ref.get("contradictions", [])

    agreement_counts: dict[str, int] = {label: 0 for label in scores}
    for ag in agreements:
        for key in ["claim_a", "claim_b"]:
            ref = ag.get(key, "")
            label = ref.split(":")[0].strip() if ":" in ref else ""
            if label in agreement_counts:
                agreement_counts[label] += 1

    max_agreements = max(agreement_counts.values()) if agreement_counts else 1
    for label in scores:
        raw = agreement_counts.get(label, 0)
        scores[label]["corroboration"] = (raw / max_agreements) if max_agreements > 0 else 0.0

    dispute_wins: dict[str, int] = {label: 0 for label in scores}
    dispute_losses: dict[str, int] = {label: 0 for label in scores}
    for resolution in disputes_resolved:
        winner = resolution.get("resolution", {}).get("winner", "")
        dispute = resolution.get("dispute", {})
        for key in ["claim_a", "claim_b"]:
            ref = dispute.get(key, "")
            label = ref.split(":")[0].strip() if ":" in ref else ""
            if label in scores:
                if winner == label or winner == "conditional":
                    dispute_wins[label] += 1
                elif winner != "unresolved":
                    dispute_losses[label] += 1

    for label in scores:
        total_disputes = dispute_wins.get(label, 0) + dispute_losses.get(label, 0)
        if total_disputes > 0:
            scores[label]["dispute_survival"] = dispute_wins[label] / total_disputes
        else:
            scores[label]["dispute_survival"] = 1.0

    specificity_map = {"high": 1.0, "medium": 0.6, "low": 0.2}
    evidence_map = {"strong": 1.0, "moderate": 0.6, "weak": 0.2}

    for label, claims in claims_by_label.items():
        if label not in scores or not claims:
            continue
        spec_total = sum(
            specificity_map.get(c.get("specificity", "medium"), 0.6) for c in claims
        )
        scores[label]["specificity"] = spec_total / len(claims)

        ev_total = sum(
            evidence_map.get(c.get("evidence", "moderate"), 0.6) for c in claims
        )
        scores[label]["evidence"] = ev_total / len(claims)

    for label in scores:
        scores[label]["position_stability"] = 1.0

    weights = {
        "corroboration": 0.25,
        "dispute_survival": 0.25,
        "specificity": 0.20,
        "evidence": 0.15,
        "position_stability": 0.15,
    }

    for label in scores:
        total = sum(
            scores[label][dim] * w for dim, w in weights.items()
        )
        scores[label]["total"] = round(total, 4)

    return scores


async def synthesize_golden_prompt(
    question: str,
    claims_by_label: dict[str, list[dict]],
    cross_ref: dict[str, Any],
    disputes_resolved: list[dict],
    model_scores: dict[str, dict[str, float]],
    label_to_model: dict[str, str],
    strong_model: str,
    api_keys: dict[str, str | None],
    mode: str = "web",
) -> AsyncGenerator[str, None]:
    scored_parts = []
    for label in sorted(model_scores.keys(), key=lambda l: model_scores[l]["total"], reverse=True):
        claims = claims_by_label.get(label, [])
        score = model_scores[label]["total"]
        claims_text = "\n".join(f"  - [{c.get('id')}] {c.get('text')}" for c in claims)
        scored_parts.append(f"{label} (score: {score}):\n{claims_text}")

    if disputes_resolved:
        scored_parts.append("\nResolved disputes:")
        for res in disputes_resolved:
            resolution = res.get("resolution", {})
            scored_parts.append(
                f"  - Winner: {resolution.get('winner', 'N/A')} | "
                f"{resolution.get('resolution', 'N/A')}"
            )

    scored_data = "\n\n".join(scored_parts)
    label_mapping = "\n".join(
        f"  {label} = {model_id}" for label, model_id in label_to_model.items()
    )

    template = SYNTHESIS_PROMPT_WEB if mode == "web" else SYNTHESIS_PROMPT_CLI
    prompt = template.format(
        question=question,
        scored_data=scored_data,
        label_mapping=label_mapping,
    )

    async for chunk in _stream_model(strong_model, api_keys, prompt):
        yield chunk


def _de_anonymize(text: str, label_to_model: dict[str, str]) -> str:
    result = text
    for label, model_id in label_to_model.items():
        result = result.replace(label, model_id)
    return result


def _compute_improvement_score(
    model_scores: dict[str, dict[str, float]],
) -> float:
    if not model_scores:
        return 0.0
    totals = [s["total"] for s in model_scores.values()]
    best_individual = max(totals)
    avg = sum(totals) / len(totals)
    spread = best_individual - avg
    improvement = min(1.0, best_individual + (spread * 0.5))
    return round(improvement, 4)


async def run_judge_pipeline(
    question: str,
    responses: list[dict[str, str]],
    api_keys: dict[str, str | None],
) -> tuple[str, dict[str, dict[str, float]]] | None:
    debate_models = [r["model_id"] for r in responses]
    try:
        cheap_model = _pick_available_model(CHEAP_MODELS, api_keys, exclude_models=debate_models)
        if cheap_model is None:
            cheap_model = _pick_available_model(CHEAP_MODELS, api_keys)
        if cheap_model is None:
            return None

        strong_model = _pick_available_model(STRONG_MODELS, api_keys, exclude_models=debate_models)
        if strong_model is None:
            strong_model = _pick_available_model(STRONG_MODELS, api_keys)
        if strong_model is None:
            strong_model = cheap_model

        anonymized, label_to_model, _ = _anonymize_responses(responses)

        claims_by_label = await extract_claims(question, anonymized, cheap_model, api_keys)
        if not claims_by_label:
            return None

        cross_ref = await cross_reference_claims(claims_by_label, cheap_model, api_keys)

        disputes_resolved = await resolve_disputes(
            question,
            cross_ref.get("contradictions", []),
            claims_by_label,
            cheap_model,
            api_keys,
        )

        model_scores = score_claims(claims_by_label, cross_ref, disputes_resolved)

        golden_chunks: list[str] = []
        async for chunk in synthesize_golden_prompt(
            question,
            claims_by_label,
            cross_ref,
            disputes_resolved,
            model_scores,
            label_to_model,
            strong_model,
            api_keys,
        ):
            golden_chunks.append(chunk)

        raw_golden = "".join(golden_chunks)
        consensus_text = _de_anonymize(raw_golden, label_to_model)

        scores_dict: dict[str, dict[str, float]] = {}
        for label, score_data in model_scores.items():
            real_model = label_to_model.get(label, label)
            scores_dict[real_model] = score_data

        return consensus_text, scores_dict
    except Exception:
        logger.exception("run_judge_pipeline failed")
        return None


async def _persist_judge_result(debate_id: str, result: JudgeResult) -> None:
    redis = get_redis()
    await redis.set(
        f"judge_result:{debate_id}",
        json.dumps({
            "golden_prompt": result.golden_prompt,
            "synthesis_method": result.synthesis_method,
            "scores": result.scores,
            "improvement_score": result.improvement_score,
        }),
        ex=REDIS_TTL,
    )


async def _run_full_pipeline(
    question: str,
    responses: list[dict[str, str]],
    debate_models: list[str],
    api_keys: dict[str, str | None],
    debate_id: str,
    mode: str = "web",
) -> AsyncGenerator[str, None]:
    cheap_model = _pick_available_model(CHEAP_MODELS, api_keys, exclude_models=debate_models)
    if cheap_model is None:
        cheap_model = _pick_available_model(CHEAP_MODELS, api_keys)
    if cheap_model is None:
        raise RuntimeError("No cheap model available for judge phases 1-3")

    strong_model = _pick_available_model(STRONG_MODELS, api_keys, exclude_models=debate_models)
    if strong_model is None:
        strong_model = _pick_available_model(STRONG_MODELS, api_keys)
    if strong_model is None:
        strong_model = cheap_model

    anonymized, label_to_model, model_to_label = _anonymize_responses(responses)

    yield _sse("judge:extracting", {
        "debate_id": debate_id,
        "phase": 1,
        "model": cheap_model,
    })
    claims_by_label = await extract_claims(question, anonymized, cheap_model, api_keys)

    if not claims_by_label:
        raise RuntimeError("Claim extraction produced no results")

    yield _sse("judge:cross-ref", {
        "debate_id": debate_id,
        "phase": 2,
        "participants": list(claims_by_label.keys()),
    })
    cross_ref = await cross_reference_claims(claims_by_label, cheap_model, api_keys)

    yield _sse("judge:disputes", {
        "debate_id": debate_id,
        "phase": 3,
        "contradiction_count": len(cross_ref.get("contradictions", [])),
    })
    disputes_resolved = await resolve_disputes(
        question,
        cross_ref.get("contradictions", []),
        claims_by_label,
        cheap_model,
        api_keys,
    )

    yield _sse("judge:scoring", {
        "debate_id": debate_id,
        "phase": 4,
    })
    model_scores = score_claims(claims_by_label, cross_ref, disputes_resolved)

    scores_with_models = {}
    for label, score_data in model_scores.items():
        real_model = label_to_model.get(label, label)
        scores_with_models[real_model] = score_data

    yield _sse("judge:scoring_complete", {
        "debate_id": debate_id,
        "scores": scores_with_models,
    })

    yield _sse("judge:synthesizing", {
        "debate_id": debate_id,
        "phase": 5,
        "model": strong_model,
    })

    golden_chunks: list[str] = []
    async for chunk in synthesize_golden_prompt(
        question,
        claims_by_label,
        cross_ref,
        disputes_resolved,
        model_scores,
        label_to_model,
        strong_model,
        api_keys,
        mode,
    ):
        golden_chunks.append(chunk)
        yield _sse("judge:chunk", {
            "debate_id": debate_id,
            "content": chunk,
        })

    raw_golden = "".join(golden_chunks)
    final_golden = _de_anonymize(raw_golden, label_to_model)
    improvement = _compute_improvement_score(model_scores)

    result = JudgeResult(
        golden_prompt=final_golden,
        synthesis_method="full_pipeline",
        scores=scores_with_models,
        improvement_score=improvement,
        claims_by_model={
            label_to_model.get(l, l): c for l, c in claims_by_label.items()
        },
        cross_reference=cross_ref,
        disputes_resolved=disputes_resolved,
    )

    await _persist_judge_result(debate_id, result)

    yield _sse("judge:complete", {
        "debate_id": debate_id,
        "synthesis_method": result.synthesis_method,
        "improvement_score": result.improvement_score,
        "scores": result.scores,
        "golden_prompt": result.golden_prompt,
    })


async def _run_emergency_synthesis(
    question: str,
    responses: list[dict[str, str]],
    api_keys: dict[str, str | None],
    debate_id: str,
) -> AsyncGenerator[str, None]:
    anonymized, label_to_model, _ = _anonymize_responses(responses)

    emergency_model = _pick_available_model(CHEAP_MODELS + STRONG_MODELS, api_keys)
    if emergency_model is None:
        raise RuntimeError("No model available for emergency synthesis")

    yield _sse("judge:synthesizing", {
        "debate_id": debate_id,
        "phase": "emergency",
        "model": emergency_model,
    })

    responses_text = "\n\n".join(
        f"{entry['label']}:\n{entry['text']}" for entry in anonymized
    )
    label_mapping = ", ".join(
        f"{label}={model_id}" for label, model_id in label_to_model.items()
    )
    prompt = EMERGENCY_SYNTHESIS_PROMPT.format(
        question=question,
        responses=responses_text,
        label_mapping=label_mapping,
    )

    golden_chunks: list[str] = []
    async for chunk in _stream_model(emergency_model, api_keys, prompt):
        golden_chunks.append(chunk)
        yield _sse("judge:chunk", {
            "debate_id": debate_id,
            "content": chunk,
        })

    raw_golden = "".join(golden_chunks)
    final_golden = _de_anonymize(raw_golden, label_to_model)

    result = JudgeResult(
        golden_prompt=final_golden,
        synthesis_method="emergency",
        scores={},
        improvement_score=0.0,
    )

    await _persist_judge_result(debate_id, result)

    yield _sse("judge:complete", {
        "debate_id": debate_id,
        "synthesis_method": "emergency",
        "improvement_score": 0.0,
        "scores": {},
        "golden_prompt": final_golden,
    })


async def _run_best_individual(
    responses: list[dict[str, str]],
    debate_id: str,
) -> AsyncGenerator[str, None]:
    best = max(responses, key=lambda r: len(r.get("text", "")))

    result = JudgeResult(
        golden_prompt=best["text"],
        synthesis_method="best_individual",
        scores={best["model_id"]: {"total": 1.0}},
        improvement_score=0.0,
    )

    await _persist_judge_result(debate_id, result)

    yield _sse("judge:complete", {
        "debate_id": debate_id,
        "synthesis_method": "best_individual",
        "improvement_score": 0.0,
        "scores": result.scores,
        "golden_prompt": result.golden_prompt,
    })


async def run_judge_with_fallback(
    question: str,
    responses: list[dict[str, str]],
    debate_models: list[str],
    api_keys: dict[str, str | None],
    debate_id: str,
    mode: str = "web",
) -> AsyncGenerator[str, None]:
    if not responses:
        yield _sse("judge:error", {
            "debate_id": debate_id,
            "error": "No responses to judge",
        })
        return

    if len(responses) == 1:
        async for event in _run_best_individual(responses, debate_id):
            yield event
        return

    attempts = [
        ("full_pipeline", 0),
        ("full_pipeline", 1),
        ("emergency", 0),
        ("best_individual", 0),
    ]

    for strategy, attempt_num in attempts:
        try:
            if strategy == "full_pipeline":
                if attempt_num > 0:
                    await asyncio.sleep(_RETRY_DELAY_BETWEEN_STRATEGIES)
                yield _sse("judge:attempt", {
                    "debate_id": debate_id,
                    "strategy": strategy,
                    "attempt": attempt_num + 1,
                })
                async for event in _run_full_pipeline(
                    question, responses, debate_models, api_keys, debate_id, mode,
                ):
                    yield event
                return

            elif strategy == "emergency":
                yield _sse("judge:fallback", {
                    "debate_id": debate_id,
                    "strategy": "emergency",
                })
                async for event in _run_emergency_synthesis(
                    question, responses, api_keys, debate_id,
                ):
                    yield event
                return

            elif strategy == "best_individual":
                yield _sse("judge:fallback", {
                    "debate_id": debate_id,
                    "strategy": "best_individual",
                })
                async for event in _run_best_individual(responses, debate_id):
                    yield event
                return

        except Exception as e:
            logger.error(
                "Judge %s attempt %d failed: %s", strategy, attempt_num + 1, e
            )
            yield _sse("judge:error", {
                "debate_id": debate_id,
                "strategy": strategy,
                "attempt": attempt_num + 1,
                "error": str(e),
                "retrying": strategy != "best_individual",
            })

    yield _sse("judge:fatal", {
        "debate_id": debate_id,
        "error": "All judge strategies exhausted",
    })
