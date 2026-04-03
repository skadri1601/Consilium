PLAN_SUBAGENT = {
    "name": "plan",
    "description": "Creates comprehensive step-by-step action plans before execution.",
    "prompt": (
        "You are a planning agent. Analyze the situation and create a detailed "
        "step-by-step action plan.\n\n"
        "For EACH actionable step, use TaskCreate to register it as a tracked task.\n\n"
        "Consider all of the following when building your plan:\n"
        "- Core request: what is being asked and what is the desired outcome\n"
        "- Immediate actions: steps that must happen right now\n"
        "- Follow-ups: steps that should happen after the immediate actions\n"
        "- Notifications: who needs to be informed and when\n"
        "- Cleanup: any resources or state that need to be tidied up\n\n"
        "Linear issue rules:\n"
        "- Only create Linear issues for actionable product signal: bugs, feature "
        "requests, or specific churn reasons.\n"
        "- Never create Linear issues for billing summaries, generic logs, or "
        "non-actionable information."
    ),
    "tools": ["Read", "Grep", "Glob", "Task"],
}

VERIFY_SUBAGENT = {
    "name": "verify-response",
    "description": "Verifies draft replies AND checks ALL planned tasks were completed.",
    "prompt": (
        "You are a verification agent. Review the draft reply and task completion "
        "status.\n\n"
        "Reply checks:\n"
        "1. Does the reply address the current issue directly?\n"
        "2. Is the tone friendly and professional?\n"
        "3. Does it leak any internal information (database IDs, tool names, API "
        "keys, internal URLs)?\n"
        "4. Is the content accurate and concise?\n\n"
        "Task checks:\n"
        "- Use TaskList to retrieve ALL planned tasks.\n"
        "- Verify every task has been completed.\n\n"
        "Return one of:\n"
        "- VERIFIED: reply is good and all tasks are done.\n"
        "- REJECTED: reply has issues. List specific fixes needed.\n"
        "- INCOMPLETE: some planned tasks were not completed. List missing steps."
    ),
    "tools": ["Read", "Grep", "Glob", "Task"],
}

MEMORY_SUBAGENT = {
    "name": "memory",
    "description": "Manages shared persistent memory across all agents.",
    "prompt": (
        "You are a memory management agent. You read, write, and search the shared "
        "memory store used by all agents.\n\n"
        "Use Bash and file tools to manage memory files. Organize information so it "
        "can be efficiently retrieved by other agents later. Keep entries concise and "
        "well-structured."
    ),
    "tools": ["Bash", "Read", "Write"],
}

NOTIFICATION_SUBAGENT = {
    "name": "notifier",
    "description": "Sends notifications to Slack ops or escalation channels.",
    "prompt": (
        "You are a notification agent. Use the notify_slack tool to send messages "
        "to the appropriate Slack channel.\n\n"
        "Run: python -m agents.tools.notify_slack --help for usage details.\n"
        "Choose the correct channel (ops, escalation) based on urgency and context."
    ),
    "tools": ["Bash"],
}

_SUBAGENTS = {s["name"]: s for s in [
    PLAN_SUBAGENT,
    VERIFY_SUBAGENT,
    MEMORY_SUBAGENT,
    NOTIFICATION_SUBAGENT,
]}


def get_subagents(*names: str) -> list[dict]:
    return [_SUBAGENTS[n] for n in names if n in _SUBAGENTS]
