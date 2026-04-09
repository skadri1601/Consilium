from ..types import (
    Rubric,
    RubricDimension,
    DeliberationMode,
)

TEMPLATE_NAME = "research_synthesis"
MODE = DeliberationMode.COUNCIL
DEFAULT_MODELS = 3
MAX_ROUNDS = 3

RUBRIC = Rubric(dimensions=[
    RubricDimension("accuracy", 0.30, "Factual correctness of all claims",
                    {1: "Major factual errors", 5: "Mostly accurate", 10: "Fully verified"}),
    RubricDimension("evidence_quality", 0.25, "Strength and relevance of supporting evidence",
                    {1: "No evidence", 5: "Some citations", 10: "Strong peer-reviewed sources"}),
    RubricDimension("completeness", 0.20, "Coverage of all relevant perspectives and findings",
                    {1: "Major gaps", 5: "Adequate coverage", 10: "Exhaustive"}),
    RubricDimension("bias_awareness", 0.15, "Recognition and mitigation of biases",
                    {1: "Unacknowledged bias", 5: "Some awareness", 10: "Systematic bias analysis"}),
    RubricDimension("citation_quality", 0.10, "Proper attribution and citation formatting",
                    {1: "No citations", 5: "Partial citations", 10: "Complete and verifiable"}),
])

SYSTEM_PROMPT = (
    "You are a research analyst. Provide citations for all claims. "
    "Flag uncertainties explicitly."
)


def build_template(topic: str) -> dict:
    return {
        "topic": topic,
        "mode": MODE.value,
        "rubric": RUBRIC,
        "system_prompts": {
            "default": SYSTEM_PROMPT,
        },
        "max_rounds": MAX_ROUNDS,
        "default_models": DEFAULT_MODELS,
    }
