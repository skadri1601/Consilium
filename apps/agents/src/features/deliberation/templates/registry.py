from . import code_review, finance, healthcare, legal, research_synthesis, risk_assessment

TEMPLATES = {
    code_review.TEMPLATE_NAME: code_review,
    finance.TEMPLATE_NAME: finance,
    healthcare.TEMPLATE_NAME: healthcare,
    legal.TEMPLATE_NAME: legal,
    research_synthesis.TEMPLATE_NAME: research_synthesis,
    risk_assessment.TEMPLATE_NAME: risk_assessment,
}

DESCRIPTIONS = {
    "code_review": "Red-team code review focusing on security, correctness, and performance",
    "finance": "Multi-model financial risk assessment with regulatory compliance and mandatory dissent",
    "healthcare": "Council-based diagnostic deliberation with citation and dissent requirements",
    "legal": "Dialectical contract review with risk vs acceptability advocates",
    "research_synthesis": "Council-based research synthesis with citation requirements",
    "risk_assessment": "Jury-based risk assessment with mandatory dissent reporting",
}


def get_template(name: str) -> dict:
    if name not in TEMPLATES:
        raise ValueError(f"Unknown template: {name}. Available: {list(TEMPLATES.keys())}")
    return TEMPLATES[name]


def list_templates() -> list[dict[str, str]]:
    return [
        {"name": name, "description": DESCRIPTIONS[name]}
        for name in TEMPLATES
    ]
