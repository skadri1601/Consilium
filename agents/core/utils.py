import json
import logging
import os
import re
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent.parent.parent

logger = logging.getLogger("agents.utils")


def sanitize_shell_arg(arg):
    """Sanitize shell arguments to prevent injection attacks."""
    if not isinstance(arg, str):
        return str(arg)

    # Remove or escape potentially dangerous characters
    # Allow alphanumeric, spaces, hyphens, underscores, dots, forward slashes, and common symbols
    sanitized = re.sub(r'[^\w\s\-._/()@:+=,]', '', str(arg))

    # Limit length to prevent buffer overflow type attacks
    return sanitized[:1000]


def run_tool(module, *args):
    """Run a tool with sanitized arguments to prevent injection attacks."""
    # Sanitize all arguments
    sanitized_args = [sanitize_shell_arg(arg) for arg in args]

    cmd = [sys.executable, "-m", module] + sanitized_args
    env = os.environ.copy()
    env["PYTHONPATH"] = str(PROJECT_DIR)
    env["PYTHONIOENCODING"] = "utf-8"
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=30,
            cwd=str(PROJECT_DIR), env=env, encoding="utf-8", errors="replace",
        )
        if result.returncode == 0 and result.stdout.strip():
            return safe_json_loads(result.stdout)
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning("Tool %s returned invalid JSON: %s", module, e)
    except Exception as e:
        logger.warning("Tool %s failed: %s", module, e)
    return None


def safe_json_loads(data, max_size=1024*1024):
    """Safely load JSON data with size limits and error handling."""
    if len(str(data)) > max_size:
        raise ValueError(f"JSON data too large: {len(str(data))} > {max_size}")

    try:
        return json.loads(data)
    except json.JSONDecodeError as e:
        logger.warning("Failed to parse JSON: %s", e)
        raise
