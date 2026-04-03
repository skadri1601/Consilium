import argparse

from agents.core.base import run_claude, build_base_prompt, setup_logging
from agents.core.subagents import get_subagents

logger = setup_logging("master_agent")

AGENT_RULES = """
## Master Agent Rules

You have access to ALL internal tools and can handle any task delegated to you.

1. Try hard to solve issues autonomously before escalating to humans.
2. You can invoke other agents (email, github listener) if needed.
3. You have full access to the Consilium codebase for investigation and fixes.
4. For complex multi-step tasks, break them down and execute systematically.
5. Always verify your work before reporting completion.
6. Notify the ops Slack channel when completing significant tasks.
"""


def _build_system_prompt():
    return build_base_prompt(
        role_description="You are Consilium's master operations agent. You have access to ALL internal tools and can handle any task.",
        agent_rules=AGENT_RULES,
    )


def run_master(prompt, model="sonnet"):
    system_prompt = _build_system_prompt()
    subagents = get_subagents("memory", "notifier")
    return run_claude(prompt, system_prompt=system_prompt, model=model, subagents=subagents)


def main():
    parser = argparse.ArgumentParser(description="Consilium Master Agent")
    parser.add_argument("prompt", help="Task prompt for the master agent")
    parser.add_argument("--model", default="sonnet")
    args = parser.parse_args()

    result = run_master(args.prompt, model=args.model)
    print(result)


if __name__ == "__main__":
    main()
