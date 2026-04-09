from ..types import (
    Rubric,
    RubricDimension,
    DeliberationMode,
)

TEMPLATE_NAME = "legal"
MODE = DeliberationMode.BLIND
DEFAULT_MODELS = 2
MAX_ROUNDS = 3
MANDATORY_DISSENT = True

RUBRIC = Rubric(dimensions=[
    RubricDimension("legal_accuracy", 0.30, "Correct interpretation of applicable law and regulation",
                    {1: "Misinterprets statute", 5: "Generally correct", 10: "Precise legal analysis with precedent"}),
    RubricDimension("risk_identification", 0.25, "Completeness of contractual and regulatory risk coverage",
                    {1: "Critical risks missed", 5: "Major risks identified", 10: "Exhaustive risk mapping"}),
    RubricDimension("regulatory_compliance", 0.20, "Alignment with GDPR, SOX, HIPAA, and other applicable regulations",
                    {1: "Non-compliant", 5: "Partial compliance noted", 10: "Full regulatory gap analysis"}),
    RubricDimension("practicality", 0.15, "Implementable and actionable recommendations",
                    {1: "Theoretical only", 5: "Some actionable items", 10: "Ready-to-implement revisions"}),
    RubricDimension("clarity", 0.10, "Unambiguous language and clear communication",
                    {1: "Vague and ambiguous", 5: "Mostly clear", 10: "Precise and unambiguous"}),
])

RISK_ADVOCATE_PROMPT = (
    "You are a legal risk advocate performing a dialectical contract review. "
    "Your role is to argue that clauses present unacceptable risk. "
    "For each clause, provide: a risk rating (low/medium/high/critical), "
    "specific legal risks and exposure, regulatory compliance gaps (cite GDPR, SOX, HIPAA where applicable), "
    "relevant legal precedents supporting your risk assessment, "
    "and any ambiguous language that could be exploited. "
    "Structure your analysis clause-by-clause with a final risk summary."
)

ACCEPTABILITY_ADVOCATE_PROMPT = (
    "You are a legal acceptability advocate performing a dialectical contract review. "
    "Your role is to argue that clauses are acceptable and within standard practice. "
    "For each clause, provide: why the risk is manageable or mitigated, "
    "regulatory compliance justifications (cite GDPR, SOX, HIPAA where applicable), "
    "relevant legal precedents supporting acceptability, "
    "and counterarguments to ambiguity concerns with proposed clarifying language. "
    "Structure your analysis clause-by-clause with recommended revisions where warranted."
)


def build_template(contract_text: str) -> dict:
    return {
        "topic": (
            f"Dialectical contract review — one advocate argues risk, "
            f"the other argues acceptability.\n\n"
            f"Contract text:\n```\n{contract_text}\n```\n\n"
            f"Required output structure:\n"
            f"1. Risk Summary (overall risk profile)\n"
            f"2. Clause-by-Clause Analysis (risk rating per clause: low/medium/high/critical)\n"
            f"3. Regulatory Compliance Gaps (GDPR, SOX, HIPAA)\n"
            f"4. Recommended Revisions (specific language changes)\n"
            f"5. Dissent on Disputed Clauses (where advocates disagree)"
        ),
        "mode": MODE.value,
        "rubric": RUBRIC,
        "mandatory_dissent": MANDATORY_DISSENT,
        "system_prompts": {
            "risk_advocate": RISK_ADVOCATE_PROMPT,
            "acceptability_advocate": ACCEPTABILITY_ADVOCATE_PROMPT,
        },
        "max_rounds": MAX_ROUNDS,
        "default_models": DEFAULT_MODELS,
    }
