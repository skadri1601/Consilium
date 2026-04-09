from ..types import (
    Rubric,
    RubricDimension,
    DeliberationMode,
)

TEMPLATE_NAME = "risk_assessment"
MODE = DeliberationMode.JURY
DEFAULT_MODELS = 5
MAX_ROUNDS = 3
MANDATORY_DISSENT = True

RUBRIC = Rubric(dimensions=[
    RubricDimension("risk_identification", 0.25, "Completeness of identified risks",
                    {1: "Critical risks missed", 5: "Major risks found", 10: "Exhaustive identification"}),
    RubricDimension("likelihood_assessment", 0.20, "Accuracy of probability estimates",
                    {1: "No quantification", 5: "Rough estimates", 10: "Data-driven probabilities"}),
    RubricDimension("impact_analysis", 0.20, "Depth of consequence analysis",
                    {1: "No impact analysis", 5: "Basic impact noted", 10: "Full cascading impact map"}),
    RubricDimension("mitigation_quality", 0.20, "Effectiveness of proposed mitigations",
                    {1: "No mitigations", 5: "Generic mitigations", 10: "Targeted actionable plans"}),
    RubricDimension("compliance", 0.15, "Alignment with regulatory and policy requirements",
                    {1: "Non-compliant", 5: "Partially addressed", 10: "Full regulatory coverage"}),
])

SYSTEM_PROMPT = (
    "You are a risk analyst. Identify ALL risks, rate likelihood and impact, "
    "propose mitigations."
)


def build_template(scenario: str) -> dict:
    return {
        "topic": scenario,
        "mode": MODE.value,
        "rubric": RUBRIC,
        "mandatory_dissent": MANDATORY_DISSENT,
        "system_prompts": {
            "default": SYSTEM_PROMPT,
        },
        "max_rounds": MAX_ROUNDS,
        "default_models": DEFAULT_MODELS,
    }
