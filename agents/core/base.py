import json
import logging
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent
AGENTS_DIR = Path(__file__).resolve().parent.parent
CLAUDE_CLI = shutil.which("claude") or shutil.which("claude.cmd") or "claude"


def setup_logging(name):
    logging.basicConfig(
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        level=logging.INFO,
    )
    return logging.getLogger(name)


def run_claude(prompt, system_prompt=None, model="haiku", subagents=None, allowed_tools=None, max_duration=None, max_retries=1):
    logger = logging.getLogger("run_claude")

    if max_duration is None:
        max_duration = 120

    for attempt in range(max_retries + 1):
        result = _run_claude_once(
            prompt, system_prompt=system_prompt, model=model,
            subagents=subagents, allowed_tools=allowed_tools, max_duration=max_duration,
        )

        if not result.startswith("Error:") or attempt >= max_retries:
            return _cleanup_response(result)

        logger.warning("Attempt %d failed: %s. Retrying...", attempt + 1, result[:100])
        if len(prompt) > 2000:
            prompt = prompt[-2000:]

    return _cleanup_response(result)


def _cleanup_response(text):
    if not text:
        return ""
    text = text.strip()
    if text.startswith("```") and text.endswith("```"):
        text = text[3:-3].strip()
    return text


def _run_claude_once(prompt, system_prompt=None, model="haiku", subagents=None, allowed_tools=None, max_duration=None):
    logger = logging.getLogger("run_claude")

    cmd = [CLAUDE_CLI, "-p", "--model", model, "--verbose", "--output-format", "stream-json", "--bare"]

    if allowed_tools:
        cmd.extend(["--allowed-tools", ",".join(allowed_tools)])

    temp_files = []

    try:
        if system_prompt:
            cmd.extend(["--system-prompt", system_prompt])

        if subagents:
            agents_dict = {}
            for a in subagents:
                agents_dict[a["name"]] = {"description": a["description"], "prompt": a["prompt"]}
            agents_json = json.dumps(agents_dict)
            cmd.extend(["--agents", agents_json])

        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            shell=(os.name == "nt"),
        )

        proc.stdin.write(prompt)
        proc.stdin.close()

        result_text = ""
        deadline = time.time() + max_duration if max_duration else None

        for line in proc.stdout:
            if deadline and time.time() > deadline:
                proc.kill()
                logger.warning("Process killed due to timeout (%ss)", max_duration)
                return "Error: request timed out after %ds" % max_duration

            line = line.strip()
            if not line:
                continue

            try:
                event = json.loads(line)
            except json.JSONDecodeError:
                continue

            if event.get("type") == "result":
                result_text = event.get("result", "")
            elif event.get("type") == "assistant" and "message" in event:
                msg = event["message"]
                if isinstance(msg, dict):
                    for block in msg.get("content", []):
                        if isinstance(block, dict) and block.get("type") == "text":
                            result_text = block["text"]

        proc.wait(timeout=10)

        stderr_output = proc.stderr.read()
        if proc.returncode and proc.returncode != 0:
            logger.error("claude exited with code %s: %s", proc.returncode, stderr_output[:500])
            if not result_text:
                return "Error: claude exited with code %s" % proc.returncode

        return result_text

    except subprocess.TimeoutExpired:
        proc.kill()
        return "Error: process did not exit cleanly"

    except Exception as e:
        logger.exception("run_claude failed")
        return "Error: %s" % e

    finally:
        for f in temp_files:
            try:
                Path(f).unlink()
            except OSError:
                pass


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
