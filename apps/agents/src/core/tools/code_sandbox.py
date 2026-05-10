import asyncio
import subprocess
import sys
from typing import Any

from src.features.agents.base_agent import ToolCall, ToolResult


class CodeSandboxTool:
    """Run a short Python snippet in a subprocess.

    NOTE: This subprocess executor provides NO real isolation; it uses the
    host Python interpreter. Hardening (containers, seccomp, WASM, etc.)
    is tracked separately and intentionally out of scope for this fix —
    callers must already gate untrusted input upstream.
    """

    def __init__(self, timeout_seconds: int = 30, max_output_chars: int = 4000) -> None:
        self._timeout = timeout_seconds
        self._max_output = max_output_chars

    def definition(self) -> dict[str, Any]:
        return {
            "name": "run_code",
            "description": "Execute Python code in a sandboxed subprocess and return stdout/stderr.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Python source to execute."},
                },
                "required": ["code"],
            },
        }

    def _run_sync(self, call_id: str, code: str) -> ToolResult:
        try:
            completed = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True,
                text=True,
                timeout=self._timeout,
            )
        except subprocess.TimeoutExpired:
            return ToolResult(
                call_id=call_id,
                content=f"Code execution timeout after {self._timeout}s",
                is_error=True,
            )
        except Exception as exc:
            return ToolResult(
                call_id=call_id,
                content=f"Sandbox error: {type(exc).__name__}: {exc}",
                is_error=True,
            )
        out = ((completed.stdout or "") + (completed.stderr or ""))[: self._max_output]
        return ToolResult(
            call_id=call_id,
            content=out or "(no output)",
            is_error=completed.returncode != 0,
        )

    async def execute(self, call: ToolCall) -> ToolResult:
        code = call.arguments.get("code", "")
        if not code:
            return ToolResult(
                call_id=call.call_id,
                content="Error: code must not be empty",
                is_error=True,
            )
        return await asyncio.to_thread(self._run_sync, call.call_id, code)
