from ..types import (
    Rubric,
    RubricDimension,
    DeliberationMode,
)

TEMPLATE_NAME = "finance"
MODE = DeliberationMode.JURY
DEFAULT_MODELS = 3
MAX_ROUNDS = 3
MANDATORY_DISSENT = True

RUBRIC = Rubric(dimensions=[
    RubricDimension("quantitative_rigor", 0.30, "Numerical accuracy and proper use of risk metrics (VaR, CVaR, Sharpe, etc.)",
                    {1: "No quantification", 5: "Basic metrics present", 10: "Rigorous data-driven analysis with validated models"}),
    RubricDimension("regulatory_alignment", 0.25, "Compliance with applicable frameworks (Basel III, SOX, Dodd-Frank, MiFID II)",
                    {1: "No regulatory consideration", 5: "Key frameworks referenced", 10: "Full multi-jurisdictional compliance mapping"}),
    RubricDimension("risk_coverage", 0.20, "Completeness across risk categories (market, credit, operational, liquidity)",
                    {1: "Single risk type only", 5: "Major categories covered", 10: "Exhaustive cross-category analysis with correlations"}),
    RubricDimension("scenario_analysis", 0.15, "Quality and depth of stress testing scenarios",
                    {1: "No scenarios", 5: "Standard stress tests", 10: "Multi-factor tail-risk scenarios with historical parallels"}),
    RubricDimension("actionability", 0.10, "Implementable risk mitigation steps and hedging strategies",
                    {1: "Abstract recommendations", 5: "General action items", 10: "Specific implementable strategies with timelines"}),
])

SYSTEM_PROMPT = (
    "You are a senior financial risk analyst conducting a multi-dimensional risk assessment. "
    "Evaluate the subject across four risk categories: market risk, credit risk, operational risk, and liquidity risk. "
    "For each category, provide quantitative metrics where applicable (VaR, CVaR, expected shortfall, probability of default, LGD, LCR, NSFR). "
    "Check compliance against relevant regulatory frameworks: Basel III capital and liquidity requirements, "
    "SOX internal controls, Dodd-Frank systemic risk provisions, and MiFID II transparency obligations. "
    "Run stress testing scenarios including historical crisis parallels, hypothetical adverse conditions, and reverse stress tests. "
    "Structure your output as: risk rating, risk breakdown by category, compliance status per framework, "
    "stress test results, dissent report on areas of disagreement, and prioritized recommendations. "
    "Preserve minority opinions as they may represent regulatory-mandated alternative viewpoints."
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
