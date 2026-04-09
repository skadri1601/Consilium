from ..types import (
    Rubric,
    RubricDimension,
    AttackCategory,
    DeliberationMode,
)

TEMPLATE_NAME = "code_review"
MODE = DeliberationMode.REDTEAM
DEFAULT_MODELS = 3
MAX_ROUNDS = 2

RUBRIC = Rubric(dimensions=[
    RubricDimension("security", 0.30, "Absence of vulnerabilities, injection points, and unsafe patterns",
                    {1: "Critical vulnerabilities", 5: "Minor issues", 10: "No vulnerabilities found"}),
    RubricDimension("correctness", 0.25, "Logic correctness and absence of bugs",
                    {1: "Broken logic", 5: "Edge cases missed", 10: "Provably correct"}),
    RubricDimension("performance", 0.20, "Efficiency of algorithms and resource usage",
                    {1: "Severe bottlenecks", 5: "Acceptable", 10: "Optimal"}),
    RubricDimension("maintainability", 0.15, "Readability, modularity, and ease of change",
                    {1: "Unmaintainable", 5: "Adequate structure", 10: "Exemplary design"}),
    RubricDimension("style", 0.10, "Adherence to project conventions and idioms",
                    {1: "Inconsistent", 5: "Mostly consistent", 10: "Perfect adherence"}),
])

ATTACK_CATEGORIES = [
    AttackCategory.SECURITY_VULN,
    AttackCategory.LOGICAL_FLAW,
    AttackCategory.EDGE_CASE,
    AttackCategory.ROBUSTNESS_TEST,
]

ATTACKER_SYSTEM_PROMPT = (
    "You are a security-focused code reviewer acting as a red team attacker. "
    "Your goal is to find security vulnerabilities, race conditions, injection attacks, "
    "and resource leaks in the provided code. Be thorough and adversarial. "
    "For each issue found, describe the attack vector, potential impact, and a proof-of-concept scenario."
)

DEFENDER_SYSTEM_PROMPT = (
    "You are a code author defending your implementation against security concerns. "
    "For each reported issue, either explain why the code is safe with concrete evidence, "
    "or acknowledge the vulnerability and propose a specific fix with corrected code."
)


def build_template(code: str) -> dict:
    return {
        "topic": f"Code review:\n```\n{code}\n```",
        "mode": MODE.value,
        "rubric": RUBRIC,
        "attack_categories": ATTACK_CATEGORIES,
        "system_prompts": {
            "attacker": ATTACKER_SYSTEM_PROMPT,
            "defender": DEFENDER_SYSTEM_PROMPT,
        },
        "max_rounds": MAX_ROUNDS,
        "default_models": DEFAULT_MODELS,
    }
