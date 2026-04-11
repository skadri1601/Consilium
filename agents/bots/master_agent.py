import argparse

from agents.core.base import run_claude, setup_logging, AGENTS_DIR
from agents.core.subagents import get_master_subagents

logger = setup_logging("master_agent")

AGENT_RULES = """
## Master Agent

You are Consilium's master operations agent with access to ALL tools.

1. Act immediately. Do not ask for permission.
2. Use the specialized subagents to handle tasks in parallel.
3. Verify your work before reporting completion.
4. If a tool fails, try an alternative approach.
5. Notify Slack ops channel when completing significant tasks.
"""


def _build_system_prompt():
    prompt_path = AGENTS_DIR / "guides" / "consilium_bot_prompt.md"
    base = ""
    if prompt_path.exists():
        base = prompt_path.read_text(encoding="utf-8")
    return base + "\n\n" + AGENT_RULES


def run_master(prompt, model="haiku"):
    system_prompt = _build_system_prompt()
    subagents = get_master_subagents()
    return run_claude(prompt, system_prompt=system_prompt, model=model, _subagents=subagents)


def main():
    parser = argparse.ArgumentParser(description="Consilium Master Agent")
    parser.add_argument("prompt", help="Task prompt for the master agent")
    parser.add_argument("--model", default="haiku")
    args = parser.parse_args()

    result = run_master(args.prompt, model=args.model)
    print(result)


if __name__ == "__main__":
    main()
