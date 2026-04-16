import random

CONSTITUTION = [
    "Does this argument overstate certainty where evidence is limited?",
    "Are the premises actually well-established or assumed without justification?",
    "Does this argument consider alternative explanations for the evidence cited?",
    "Is this response relevant to the specific question asked, not a generalization?",
    "Does this argument acknowledge its own limitations and blind spots?",
    "Are there cherry-picked examples that ignore contradicting evidence?",
    "Is the logical chain from evidence to conclusion actually valid?",
    "Does this underweight recent evidence in favor of established views?",
    "Are technical claims accurate or oversimplified?",
    "Is this argument adversarially robust — would it hold under skeptical pressure?",
]

SELF_CRITIQUE_PROMPT = """Review your own argument below according to this principle:

PRINCIPLE: {principle}

YOUR ARGUMENT:
{argument}

Briefly: (1) Identify one specific weakness according to this principle. (2) If significant, provide a revised version. If your argument holds up well, say "HOLDS" and explain why.

Format:
WEAKNESS: [identified issue or "None significant"]
REVISED: [revised argument OR "HOLDS: [reason]"]"""


def get_random_principle() -> str:
    return random.choice(CONSTITUTION)
