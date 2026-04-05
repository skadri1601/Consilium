import json
import logging
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
AGENTS_DIR = Path(__file__).resolve().parent.parent

MODEL_MAP = {
    "haiku": "claude-haiku-4-5-20251001",
    "sonnet": "claude-sonnet-4-5-20250514",
    "opus": "claude-opus-4-6-20250904",
}

TOOLS = [
    {
        "name": "search_email",
        "description": "Search emails by sender name, subject, or keyword. Returns matching emails with sender, subject, date, and preview.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query. Examples: 'from:ayush', 'from:john', 'subject:invoice', or plain text like 'meeting'"},
                "limit": {"type": "integer", "description": "Max results (default 10)", "default": 10},
            },
            "required": ["query"],
        },
    },
    {
        "name": "read_email",
        "description": "Read the full content of a specific email by its UID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "uid": {"type": "string", "description": "The email UID from search results"},
            },
            "required": ["uid"],
        },
    },
    {
        "name": "email_thread",
        "description": "Get the full email conversation thread for a given email UID.",
        "input_schema": {
            "type": "object",
            "properties": {
                "uid": {"type": "string", "description": "The email UID to get the thread for"},
            },
            "required": ["uid"],
        },
    },
    {
        "name": "unread_emails",
        "description": "List unread emails in the inbox.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Max results (default 10)", "default": 10},
            },
        },
    },
    {
        "name": "linear_create_ticket",
        "description": "Create a new Linear ticket/issue.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {"type": "string", "description": "Ticket title"},
                "description": {"type": "string", "description": "Ticket description", "default": ""},
            },
            "required": ["title"],
        },
    },
    {
        "name": "linear_search",
        "description": "Search Linear issues by keyword.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"},
                "limit": {"type": "integer", "default": 10},
            },
            "required": ["query"],
        },
    },
    {
        "name": "linear_get_issue",
        "description": "Get details of a Linear issue by identifier (e.g. MYC-42).",
        "input_schema": {
            "type": "object",
            "properties": {
                "identifier": {"type": "string", "description": "Issue identifier like MYC-42"},
            },
            "required": ["identifier"],
        },
    },
    {
        "name": "linear_transition",
        "description": "Change the status of a Linear issue.",
        "input_schema": {
            "type": "object",
            "properties": {
                "identifier": {"type": "string", "description": "Issue identifier like MYC-42"},
                "state": {"type": "string", "description": "Target state name, e.g. 'In Progress', 'Done', 'In Review'"},
            },
            "required": ["identifier", "state"],
        },
    },
    {
        "name": "sentry_issues",
        "description": "List unresolved Sentry errors/issues.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "default": "is:unresolved"},
                "limit": {"type": "integer", "default": 10},
            },
        },
    },
    {
        "name": "sentry_stats",
        "description": "Get Sentry error statistics overview.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "vercel_status",
        "description": "Get the latest Vercel deployment status.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "sonarqube_quality",
        "description": "Get SonarQube quality gate status and metrics.",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "github_prs",
        "description": "List open GitHub pull requests.",
        "input_schema": {
            "type": "object",
            "properties": {
                "state": {"type": "string", "default": "open"},
                "limit": {"type": "integer", "default": 10},
            },
        },
    },
    {
        "name": "db_lookup",
        "description": "Look up a user, debate, or platform stats from the Consilium database.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "One of: 'user --email X', 'debate --id X', 'stats'"},
            },
            "required": ["command"],
        },
    },
    {
        "name": "bash",
        "description": "Run any shell command. Use for tasks not covered by other tools.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {"type": "string", "description": "Shell command to execute"},
            },
            "required": ["command"],
        },
    },
]

ALLOWED_MODELS = {"haiku", "sonnet"}
DEFAULT_FALLBACK_MODEL = "haiku"


def sanitize_model(model):
    if not model or model.lower() not in ALLOWED_MODELS:
        return DEFAULT_FALLBACK_MODEL
    return model.lower()


def setup_logging(name):
    logging.basicConfig(
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        level=logging.INFO,
    )
    return logging.getLogger(name)


def _run_cli(module, *args):
    cmd = [sys.executable, "-m", module] + list(args)
    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_DIR)
    env["PYTHONIOENCODING"] = "utf-8"
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30,
            cwd=str(PROJECT_DIR), encoding="utf-8", errors="replace", env=env,
        )
        output = result.stdout
        if result.stderr and result.returncode != 0:
            output += "\n" + result.stderr
        return output[:5000] if output else "(no output)"
    except subprocess.TimeoutExpired:
        return "Error: timed out"
    except Exception as e:
        return f"Error: {e}"


def _execute_tool(name, input_data):
    logger = logging.getLogger("tool")
    if name == "search_email":
        return _run_cli("agents.tools.email_imap", "search", "--query", input_data["query"], "--limit", str(input_data.get("limit", 10)))
    elif name == "read_email":
        return _run_cli("agents.tools.email_imap", "read", "--uid", input_data["uid"])
    elif name == "email_thread":
        return _run_cli("agents.tools.email_imap", "thread", "--uid", input_data["uid"])
    elif name == "unread_emails":
        return _run_cli("agents.tools.email_imap", "unread", "--limit", str(input_data.get("limit", 10)))
    elif name == "linear_create_ticket":
        args = ["create", "--title", input_data["title"], "--description", input_data.get("description", "")]
        return _run_cli("agents.tools.linear_api", *args)
    elif name == "linear_search":
        return _run_cli("agents.tools.linear_api", "search", input_data["query"], "--limit", str(input_data.get("limit", 10)))
    elif name == "linear_get_issue":
        return _run_cli("agents.tools.linear_api", "get", "--identifier", input_data["identifier"])
    elif name == "linear_transition":
        return _run_cli("agents.tools.linear_api", "transition", "--identifier", input_data["identifier"], "--state", input_data["state"])
    elif name == "sentry_issues":
        return _run_cli("agents.tools.sentry_api", "list-issues", "--query", input_data.get("query", "is:unresolved"), "--limit", str(input_data.get("limit", 10)))
    elif name == "sentry_stats":
        return _run_cli("agents.tools.sentry_api", "stats")
    elif name == "vercel_status":
        return _run_cli("agents.tools.vercel_api", "latest")
    elif name == "sonarqube_quality":
        return _run_cli("agents.tools.sonarqube_api", "quality-gate")
    elif name == "github_prs":
        return _run_cli("agents.tools.github_api", "list-prs", "--state", input_data.get("state", "open"), "--limit", str(input_data.get("limit", 10)))
    elif name == "db_lookup":
        cmd_parts = input_data["command"].split()
        return _run_cli("agents.tools.db_lookup", *cmd_parts)
    elif name == "bash":
        command = input_data.get("command", "")
        command = command.replace("python -m ", f"{sys.executable} -m ")
        command = command.replace("python3 -m ", f"{sys.executable} -m ")
        env = os.environ.copy()
        env["PYTHONPATH"] = str(PROJECT_DIR)
        env["PYTHONIOENCODING"] = "utf-8"
        try:
            result = subprocess.run(
                command, shell=True, capture_output=True, text=True,
                timeout=60, cwd=str(PROJECT_DIR), encoding="utf-8", errors="replace", env=env,
            )
            output = result.stdout
            if result.stderr:
                output += "\n" + result.stderr
            return output[:5000] if output else "(no output)"
        except subprocess.TimeoutExpired:
            return "Error: timed out"
        except Exception as e:
            return f"Error: {e}"
    return f"Unknown tool: {name}"


def run_claude(prompt, system_prompt=None, model="haiku", subagents=None, allowed_tools=None, max_duration=None, max_retries=1):
    model = sanitize_model(model)
    logger = logging.getLogger("run_claude")

    if max_duration is None:
        max_duration = 300

    for attempt in range(max_retries + 1):
        try:
            result = _run_anthropic(prompt, system_prompt=system_prompt, model=model, max_duration=max_duration)
        except Exception as e:
            logger.exception("run_claude attempt %d failed", attempt + 1)
            result = f"Error: {e}"

        if not result.startswith("Error:") or attempt >= max_retries:
            return _cleanup_response(result)

        logger.warning("Attempt %d failed: %s. Retrying...", attempt + 1, result[:100])

    return _cleanup_response(result)


def _run_anthropic(prompt, system_prompt=None, model="haiku", max_duration=300):
    from agents.config import ANTHROPIC_API_KEY
    import anthropic

    logger = logging.getLogger("run_claude")

    if not ANTHROPIC_API_KEY:
        return "Error: ANTHROPIC_API_KEY not configured"

    model_id = MODEL_MAP.get(model, model)
    client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    messages = [{"role": "user", "content": prompt}]
    system = system_prompt or ""

    max_turns = 15
    deadline = time.time() + max_duration

    for turn in range(max_turns):
        if time.time() > deadline:
            return "Error: request timed out"

        response = client.messages.create(
            model=model_id,
            max_tokens=4096,
            system=system,
            tools=TOOLS,
            messages=messages,
        )

        has_tool_use = False
        text_parts = []
        tool_results = []

        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)
            elif block.type == "tool_use":
                has_tool_use = True
                logger.info("Tool call: %s(%s)", block.name, json.dumps(block.input)[:100])
                result = _execute_tool(block.name, block.input)
                logger.info("Tool result: %s", result[:200])
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": result,
                })

        if not has_tool_use:
            return "\n".join(text_parts)

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

    return "\n".join(text_parts) if text_parts else "Error: max turns reached"


def _cleanup_response(text):
    if not text:
        return ""
    text = text.strip()
    if text.startswith("```") and text.endswith("```"):
        text = text[3:-3].strip()
    return text


def build_base_prompt(role_description, agent_rules):
    sections = [role_description]

    personality_path = AGENTS_DIR / "guides" / "personality.md"
    if personality_path.exists():
        sections.append("## Personality\n" + personality_path.read_text(encoding="utf-8"))

    instructions_path = AGENTS_DIR / "memory" / "instructions.md"
    if instructions_path.exists():
        sections.append("## Live Instructions (ALWAYS follow these)\n" + instructions_path.read_text(encoding="utf-8"))

    guide_path = AGENTS_DIR / "guides" / "guide.md"
    if guide_path.exists():
        sections.append("## Internal Knowledge Base\n" + guide_path.read_text(encoding="utf-8"))

    try:
        from agents.core.registry import format_tools_for_prompt
        tools_text = format_tools_for_prompt()
        if tools_text:
            sections.append("## Available CLI Tools\n" + tools_text)
    except Exception:
        pass

    sections.append(f"Working directory: {PROJECT_DIR}")
    sections.append(agent_rules)

    return "\n\n".join(sections)


def run_continuous(process_fn, poll_interval=300, name="agent"):
    logger = setup_logging(name)
    shutdown = False

    def handle_signal(signum, frame):
        nonlocal shutdown
        logger.info("%s shutting down", name)
        shutdown = True

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    logger.info("%s started", name)

    while not shutdown:
        logger.info("%s polling...", name)
        try:
            process_fn()
        except Exception:
            logger.exception("Error in %s process_fn", name)

        for _ in range(poll_interval):
            if shutdown:
                break
            time.sleep(1)
