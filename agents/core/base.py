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
    "sonnet": "claude-sonnet-4-5-20250929",
    "opus": "claude-opus-4-6-20250904",
}

TOOLS = [
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


_CLI_SENTRY_API = "agents.tools.sentry_api"
_CLI_VERCEL_API = "agents.tools.vercel_api"
_CLI_SONARQUBE_API = "agents.tools.sonarqube_api"
_CLI_DB_LOOKUP = "agents.tools.db_lookup"


def _tool_sentry_issues(d):
    return _run_cli(
        _CLI_SENTRY_API,
        "list-issues",
        "--query",
        d.get("query", "is:unresolved"),
        "--limit",
        str(d.get("limit", 10)),
    )


def _tool_sentry_stats(_):
    return _run_cli(_CLI_SENTRY_API, "stats")


def _tool_vercel_status(_):
    return _run_cli(_CLI_VERCEL_API, "latest")


def _tool_sonarqube_quality(_):
    return _run_cli(_CLI_SONARQUBE_API, "quality-gate")


def _tool_db_lookup(d):
    cmd_parts = d["command"].split()
    return _run_cli(_CLI_DB_LOOKUP, *cmd_parts)


_TOOL_HANDLERS = {
    "sentry_issues": _tool_sentry_issues,
    "sentry_stats": _tool_sentry_stats,
    "vercel_status": _tool_vercel_status,
    "sonarqube_quality": _tool_sonarqube_quality,
    "db_lookup": _tool_db_lookup,
}


def _execute_tool_bash(input_data):
    command = input_data.get("command", "")
    command = command.replace("python -m ", f"{sys.executable} -m ")
    command = command.replace("python3 -m ", f"{sys.executable} -m ")
    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_DIR)
    env["PYTHONIOENCODING"] = "utf-8"
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60,
            cwd=str(PROJECT_DIR),
            encoding="utf-8",
            errors="replace",
            env=env,
        )
        output = result.stdout
        if result.stderr:
            output += "\n" + result.stderr
        return output[:5000] if output else "(no output)"
    except subprocess.TimeoutExpired:
        return "Error: timed out"
    except Exception as e:
        return f"Error: {e}"


def _execute_tool(name, input_data):
    if name == "bash":
        return _execute_tool_bash(input_data)
    handler = _TOOL_HANDLERS.get(name)
    if handler:
        return handler(input_data)
    return f"Unknown tool: {name}"


def _anthropic_response_text_and_tools(response, logger):
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
    return text_parts, has_tool_use, tool_results


def _stream_apply_text_delta(delta_text, accumulated_text, on_chunk, last_chunk_time, throttle_interval):
    accumulated_text += delta_text
    now = time.time()
    if now - last_chunk_time >= throttle_interval:
        last_chunk_time = now
        try:
            on_chunk(accumulated_text)
        except Exception:
            pass
    return accumulated_text, last_chunk_time


def _consume_anthropic_stream_events(stream, on_chunk, last_chunk_time, throttle_interval):
    accumulated_text = ""
    for event in stream:
        if hasattr(event, "type") and event.type == "content_block_delta" and hasattr(event.delta, "text"):
            accumulated_text, last_chunk_time = _stream_apply_text_delta(
                event.delta.text, accumulated_text, on_chunk, last_chunk_time, throttle_interval
            )
    response = stream.get_final_message()
    return accumulated_text, last_chunk_time, response


def _emit_final_stream_chunk(final_text, on_chunk):
    try:
        on_chunk(final_text)
    except Exception:
        pass


def run_claude(prompt, system_prompt=None, model="haiku", _subagents=None, _allowed_tools=None, max_duration=None, max_retries=1):
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

    for _ in range(max_turns):
        if time.time() > deadline:
            return "Error: request timed out"

        response = client.messages.create(
            model=model_id,
            max_tokens=4096,
            system=system,
            tools=TOOLS,
            messages=messages,
        )

        text_parts, has_tool_use, tool_results = _anthropic_response_text_and_tools(response, logger)

        if not has_tool_use:
            return "\n".join(text_parts)

        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})

    return "\n".join(text_parts) if text_parts else "Error: max turns reached"


def run_claude_streaming(prompt, on_chunk, system_prompt=None, model="haiku", max_duration=None, max_retries=1):
    model = sanitize_model(model)
    logger = logging.getLogger("run_claude")

    if max_duration is None:
        max_duration = 300

    for attempt in range(max_retries + 1):
        try:
            result = _run_anthropic_streaming(prompt, on_chunk, system_prompt=system_prompt, model=model, max_duration=max_duration)
        except Exception as e:
            logger.exception("run_claude_streaming attempt %d failed", attempt + 1)
            result = f"Error: {e}"

        if not result.startswith("Error:") or attempt >= max_retries:
            return _cleanup_response(result)

        logger.warning("Attempt %d failed: %s. Retrying...", attempt + 1, result[:100])

    return _cleanup_response(result)


def _run_anthropic_streaming(prompt, on_chunk, system_prompt=None, model="haiku", max_duration=300):
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
    last_chunk_time = 0
    throttle_interval = 3

    for _ in range(max_turns):
        if time.time() > deadline:
            return "Error: request timed out"

        with client.messages.stream(
            model=model_id,
            max_tokens=4096,
            system=system,
            tools=TOOLS,
            messages=messages,
        ) as stream:
            _, last_chunk_time, response = _consume_anthropic_stream_events(
                stream, on_chunk, last_chunk_time, throttle_interval
            )

        text_parts, has_tool_use, tool_results = _anthropic_response_text_and_tools(response, logger)

        if not has_tool_use:
            final_text = "\n".join(text_parts)
            _emit_final_stream_chunk(final_text, on_chunk)
            return final_text

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
