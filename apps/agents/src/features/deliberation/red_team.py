from __future__ import annotations

import json
import re
from typing import Callable, Awaitable

from src.features.deliberation.types import (
    AttackCategory,
    RedTeamAttack,
    RedTeamDefense,
    RedTeamJudgment,
    RedTeamReport,
)

CATEGORY_INSTRUCTIONS: dict[AttackCategory, str] = {
    AttackCategory.LOGICAL_FLAW: (
        "Identify logical fallacies, circular reasoning, non-sequiturs, "
        "or invalid inferences in the content."
    ),
    AttackCategory.EDGE_CASE: (
        "Find edge cases, boundary conditions, or unusual inputs that "
        "the content fails to handle or consider."
    ),
    AttackCategory.SECURITY_VULN: (
        "Identify security vulnerabilities such as injection vectors, "
        "data leaks, privilege escalation, or insecure defaults."
    ),
    AttackCategory.BIAS_DETECTION: (
        "Detect biases including cultural, confirmation, selection, "
        "anchoring, or systematic skew in the analysis."
    ),
    AttackCategory.HALLUCINATION_PROBE: (
        "Probe for fabricated facts, invented citations, false statistics, "
        "or confidently stated misinformation."
    ),
    AttackCategory.PROMPT_INJECTION: (
        "Test for prompt injection vulnerabilities where adversarial input "
        "could override instructions or leak system prompts."
    ),
    AttackCategory.ROBUSTNESS_TEST: (
        "Test robustness against malformed input, unexpected formats, "
        "adversarial perturbations, or stress conditions."
    ),
    AttackCategory.CONSISTENCY_CHECK: (
        "Check for internal contradictions, inconsistent claims, "
        "or statements that conflict with each other."
    ),
}


def build_attack_prompt(target_content: str, category: AttackCategory) -> str:
    instruction = CATEGORY_INSTRUCTIONS[category]
    return (
        f"You are a red team attacker. Your goal is to find vulnerabilities "
        f"in the following content.\n\n"
        f"Category: {category.value}\n"
        f"Instructions: {instruction}\n\n"
        f"Target content:\n{target_content}\n\n"
        f"Respond with JSON only:\n"
        f'{{"category": "{category.value}", "attack_content": "<your attack>", '
        f'"severity": "<low|medium|high|critical>"}}'
    )


def build_defense_prompt(attack: RedTeamAttack, original_content: str) -> str:
    return (
        f"You are a defender. An attacker has found a potential vulnerability "
        f"in your content. Respond to the attack and mitigate it if possible.\n\n"
        f"Original content:\n{original_content}\n\n"
        f"Attack category: {attack.category.value}\n"
        f"Attack severity: {attack.severity}\n"
        f"Attack:\n{attack.attack_content}\n\n"
        f"Respond with JSON only:\n"
        f'{{"defense_content": "<your defense>", "mitigated": <true|false>}}'
    )


def build_judge_prompt(attack: RedTeamAttack, defense: RedTeamDefense) -> str:
    return (
        f"You are an impartial judge evaluating a red team exchange.\n\n"
        f"Attack category: {attack.category.value}\n"
        f"Attack severity claimed: {attack.severity}\n"
        f"Attack:\n{attack.attack_content}\n\n"
        f"Defense:\n{defense.defense_content}\n"
        f"Defense claims mitigated: {defense.mitigated}\n\n"
        f"Evaluate whether the attack is valid and the defense is effective.\n\n"
        f"Respond with JSON only:\n"
        f'{{"valid_attack": <true|false>, "effective_defense": <true|false>, '
        f'"severity_confirmed": "<low|medium|high|critical>", "reasoning": "<explanation>"}}'
    )


def parse_attack(raw: str) -> RedTeamAttack:
    data = _extract_json_obj(raw)
    if data and "attack_content" in data:
        severity = data.get("severity", "medium")
        if severity not in ("low", "medium", "high", "critical"):
            severity = "medium"
        category_str = data.get("category", "logical_flaw")
        try:
            category = AttackCategory(category_str)
        except ValueError:
            category = AttackCategory.LOGICAL_FLAW
        return RedTeamAttack(
            attacker_id="",
            category=category,
            attack_content=data["attack_content"],
            severity=severity,
        )
    return RedTeamAttack(
        attacker_id="",
        category=AttackCategory.LOGICAL_FLAW,
        attack_content=raw.strip(),
        severity="medium",
    )


def parse_defense(raw: str) -> RedTeamDefense:
    data = _extract_json_obj(raw)
    if data and "defense_content" in data:
        return RedTeamDefense(
            defender_id="",
            attack_index=0,
            defense_content=data["defense_content"],
            mitigated=bool(data.get("mitigated", False)),
        )
    return RedTeamDefense(
        defender_id="",
        attack_index=0,
        defense_content=raw.strip(),
        mitigated=False,
    )


def parse_judgment(raw: str) -> RedTeamJudgment:
    data = _extract_json_obj(raw)
    if data and "valid_attack" in data:
        severity = data.get("severity_confirmed", "medium")
        if severity not in ("low", "medium", "high", "critical"):
            severity = "medium"
        return RedTeamJudgment(
            judge_id="",
            attack_index=0,
            valid_attack=bool(data.get("valid_attack", False)),
            effective_defense=bool(data.get("effective_defense", False)),
            severity_confirmed=severity,
            reasoning=data.get("reasoning", ""),
        )
    return RedTeamJudgment(
        judge_id="",
        attack_index=0,
        valid_attack=False,
        effective_defense=False,
        severity_confirmed="medium",
        reasoning=raw.strip(),
    )


async def run_red_team(
    target_content: str,
    attacker_model: str,
    defender_model: str,
    judge_model: str,
    api_keys: dict,
    call_fn: Callable[..., Awaitable[str]],
    categories: list[AttackCategory] | None = None,
) -> RedTeamReport:
    if categories is None:
        categories = list(AttackCategory)

    attacks: list[RedTeamAttack] = []
    defenses: list[RedTeamDefense] = []
    judgments: list[RedTeamJudgment] = []

    for i, category in enumerate(categories):
        attack_prompt = build_attack_prompt(target_content, category)
        attack_raw = await call_fn(
            model=attacker_model, prompt=attack_prompt, api_keys=api_keys
        )
        attack = parse_attack(attack_raw)
        attack.attacker_id = attacker_model
        attack.category = category
        attacks.append(attack)

        defense_prompt = build_defense_prompt(attack, target_content)
        defense_raw = await call_fn(
            model=defender_model, prompt=defense_prompt, api_keys=api_keys
        )
        defense = parse_defense(defense_raw)
        defense.defender_id = defender_model
        defense.attack_index = i
        defenses.append(defense)

        judge_prompt = build_judge_prompt(attack, defense)
        judge_raw = await call_fn(
            model=judge_model, prompt=judge_prompt, api_keys=api_keys
        )
        judgment = parse_judgment(judge_raw)
        judgment.judge_id = judge_model
        judgment.attack_index = i
        judgments.append(judgment)

    vulnerability_count: dict[str, int] = {}
    valid_attacks = 0
    for j, judgment in enumerate(judgments):
        if judgment.valid_attack:
            valid_attacks += 1
            cat = attacks[j].category.value
            vulnerability_count[cat] = vulnerability_count.get(cat, 0) + 1

    total = len(categories)
    overall_score = 1.0 - (valid_attacks / total) if total > 0 else 1.0

    return RedTeamReport(
        attacks=attacks,
        defenses=defenses,
        judgments=judgments,
        vulnerability_count=vulnerability_count,
        overall_score=overall_score,
    )


def format_red_team_report(report: RedTeamReport) -> str:
    vuln_total = sum(report.vulnerability_count.values())
    lines = [
        "Red Team Assessment",
        f"Overall Score: {report.overall_score}/1.0",
        f"Vulnerabilities Found: {vuln_total}",
        "",
        "Details:",
    ]
    for i, (attack, defense, judgment) in enumerate(
        zip(report.attacks, report.defenses, report.judgments)
    ):
        lines.append(f"\n[{i + 1}] Category: {attack.category.value}")
        lines.append(f"    Severity: {attack.severity}")
        lines.append(f"    Attack: {attack.attack_content}")
        lines.append(f"    Defense: {defense.defense_content}")
        lines.append(f"    Valid Attack: {judgment.valid_attack}")
        lines.append(f"    Effective Defense: {judgment.effective_defense}")
        lines.append(f"    Reasoning: {judgment.reasoning}")
    return "\n".join(lines)


def _extract_json_obj(raw: str) -> dict | None:
    raw = raw.strip()
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return None
