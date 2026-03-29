ROUND_1_SYSTEM = (
    "You are an expert AI assistant participating in a structured debate. "
    "This is Round 1: Independent Analysis. You have NOT seen any other responses. "
    "Provide your own thorough, well-reasoned answer to the user's question. "
    "Be specific, cite reasoning, and structure your response clearly. "
    "Do not hedge excessively — commit to your analysis."
)

ROUND_2_SYSTEM = (
    "You are an expert AI assistant participating in a structured debate. "
    "This is Round 2: Critique & Refinement. Below you will see anonymized responses "
    "from Round 1 (labeled Response A, Response B, etc.). You do NOT know which response is yours. "
    "Analyze all responses critically: identify strengths, weaknesses, gaps, and errors. "
    "Then provide your REVISED answer incorporating the best insights from all responses. "
    "Clearly state where you agree, disagree, and why."
)

ROUND_3_SYSTEM = (
    "You are an expert AI assistant participating in a structured debate. "
    "This is Round 3: Final Convergence. Below you will see the Round 2 critiques "
    "(labeled Critic A, Critic B, etc.) along with the original Round 1 responses. "
    "Synthesize everything into your FINAL answer. Focus on areas of consensus and "
    "resolve remaining disagreements with clear reasoning. This is your last chance "
    "to refine your position."
)

JUDGE_SYSTEM = (
    "You are an impartial judge synthesizing a multi-round AI debate into a single "
    "definitive answer. You have access to all rounds of discussion. "
    "Your task is to produce the GOLDEN PROMPT — the single best, most accurate, "
    "and most comprehensive answer to the original question. "
    "Weigh arguments by quality of reasoning, not by frequency. "
    "Resolve conflicts explicitly. Structure your answer clearly. "
    "Do NOT mention the debate process, models, or rounds — just deliver the answer."
)

CONVERGENCE_CHECK_SYSTEM = (
    "You are analyzing whether a set of debate responses have converged on a consensus. "
    "Respond with ONLY 'CONVERGED' if all responses substantially agree on key points, "
    "or 'DIVERGENT' if there are meaningful disagreements that warrant further discussion. "
    "Do not explain your reasoning."
)


def build_round_2_user_prompt(topic: str, round_1_responses: list[dict[str, str]]) -> str:
    sections = [f"Original Question: {topic}\n\n--- Round 1 Responses ---\n"]
    for entry in round_1_responses:
        sections.append(f"{entry['label']}:\n{entry['text']}\n")
    sections.append(
        "\nProvide your critique of ALL responses above, then give your REVISED answer."
    )
    return "\n".join(sections)


def build_round_3_user_prompt(
    topic: str,
    round_1_responses: list[dict[str, str]],
    round_2_responses: list[dict[str, str]],
) -> str:
    sections = [f"Original Question: {topic}\n\n--- Round 1 Responses ---\n"]
    for entry in round_1_responses:
        sections.append(f"{entry['label']}:\n{entry['text']}\n")
    sections.append("\n--- Round 2 Critiques ---\n")
    for entry in round_2_responses:
        sections.append(f"{entry['label']}:\n{entry['text']}\n")
    sections.append(
        "\nSynthesize everything above into your FINAL answer."
    )
    return "\n".join(sections)


SIMPLIFIED_JUDGE_SYSTEM = (
    "Merge these responses into a single best answer. "
    "Cite which response contributed each part."
)


MAX_JUDGE_CHARS = 24000
ROUND_3_CHAR_LIMIT = 2000
ROUND_EARLY_CHAR_LIMIT = 500
SIMPLIFIED_RESPONSE_CHAR_LIMIT = 3000


def _truncate_for_judge(
    round_1_responses: list[dict[str, str]],
    round_2_responses: list[dict[str, str]],
    round_3_responses: list[dict[str, str]],
) -> tuple[list[dict[str, str]], list[dict[str, str]], list[dict[str, str]]]:
    trunc_r1 = [
        {**e, "text": e["text"][:ROUND_EARLY_CHAR_LIMIT]} for e in round_1_responses
    ]
    trunc_r2 = [
        {**e, "text": e["text"][:ROUND_EARLY_CHAR_LIMIT]} for e in round_2_responses
    ]
    trunc_r3 = [
        {**e, "text": e["text"][:ROUND_3_CHAR_LIMIT]} for e in round_3_responses
    ]

    total = sum(len(e["text"]) for e in trunc_r1 + trunc_r2 + trunc_r3)
    if total <= MAX_JUDGE_CHARS:
        return trunc_r1, trunc_r2, trunc_r3

    trunc_r3_only = [
        {**e, "text": e["text"][:ROUND_3_CHAR_LIMIT]} for e in round_3_responses
    ]
    return [], [], trunc_r3_only


def build_judge_user_prompt(
    topic: str,
    round_1_responses: list[dict[str, str]],
    round_2_responses: list[dict[str, str]],
    round_3_responses: list[dict[str, str]],
) -> str:
    r1, r2, r3 = _truncate_for_judge(
        round_1_responses, round_2_responses, round_3_responses,
    )
    sections = [f"Original Question: {topic}\n"]
    if r1:
        sections.append("\n--- Round 1 Responses ---\n")
        for entry in r1:
            sections.append(f"{entry['label']}:\n{entry['text']}\n")
    if r2:
        sections.append("\n--- Round 2 Critiques ---\n")
        for entry in r2:
            sections.append(f"{entry['label']}:\n{entry['text']}\n")
    if r3:
        sections.append("\n--- Round 3 Final Answers ---\n")
        for entry in r3:
            sections.append(f"{entry['label']}:\n{entry['text']}\n")
    sections.append(
        "\nProduce the single best, definitive answer to the original question."
    )
    return "\n".join(sections)


def build_simplified_judge_prompt(
    topic: str,
    round_3_responses: list[dict[str, str]],
) -> str:
    sections = [f"Original Question: {topic}\n\n"]
    for entry in round_3_responses:
        truncated = entry["text"][:SIMPLIFIED_RESPONSE_CHAR_LIMIT]
        sections.append(f"{entry['label']}:\n{truncated}\n\n")
    return "\n".join(sections)


def build_convergence_prompt(responses: list[dict[str, str]]) -> str:
    sections = ["Analyze these responses for consensus:\n"]
    for entry in responses:
        sections.append(f"{entry['label']}:\n{entry['text']}\n")
    return "\n".join(sections)
