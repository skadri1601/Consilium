from ..types import (
    Rubric,
    RubricDimension,
    DeliberationMode,
)

TEMPLATE_NAME = "healthcare"
MODE = DeliberationMode.COUNCIL
DEFAULT_MODELS = 3
MAX_ROUNDS = 3
REQUIRE_DISSENT = True
REQUIRE_CITATIONS = True

RUBRIC = Rubric(dimensions=[
    RubricDimension("evidence_quality", 0.30, "Strength of cited medical literature and clinical guidelines",
                    {1: "No citations", 5: "Some references", 10: "Peer-reviewed sources and current guidelines"}),
    RubricDimension("diagnostic_accuracy", 0.25, "Consistency with presented symptoms and patient history",
                    {1: "Contradicts findings", 5: "Partially consistent", 10: "Fully consistent with all data"}),
    RubricDimension("safety_considerations", 0.20, "Assessment of false negative risk and urgent conditions",
                    {1: "Dangerous omissions", 5: "Common conditions covered", 10: "Red flags and emergencies addressed"}),
    RubricDimension("completeness", 0.15, "Breadth of differential diagnosis coverage",
                    {1: "Single diagnosis only", 5: "Major differentials listed", 10: "Exhaustive differential with reasoning"}),
    RubricDimension("actionability", 0.10, "Clarity of recommended next steps and workup",
                    {1: "No next steps", 5: "Generic recommendations", 10: "Specific targeted workup plan"}),
])

SYSTEM_PROMPT = (
    "You are a clinical reasoning specialist participating in a diagnostic deliberation. "
    "Cite medical literature and clinical guidelines for all diagnostic claims. "
    "Never suppress minority diagnoses — flag all disagreements explicitly. "
    "Structure your response as: primary diagnosis, differential list with confidence levels, "
    "supporting evidence, safety considerations, and recommended next steps."
)


def build_template(clinical_presentation: str) -> dict:
    return {
        "topic": clinical_presentation,
        "mode": MODE.value,
        "rubric": RUBRIC,
        "require_dissent": REQUIRE_DISSENT,
        "require_citations": REQUIRE_CITATIONS,
        "system_prompts": {
            "default": SYSTEM_PROMPT,
        },
        "max_rounds": MAX_ROUNDS,
        "default_models": DEFAULT_MODELS,
    }
