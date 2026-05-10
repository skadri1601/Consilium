import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

from src.features.agents.base_agent import ToolCall, ToolResult


class CodeSandboxTool:
    def __init__(self, timeout_seconds: int = 30, max_output_chars: int = 4000) -> None:
        self._timeout = timeout_seconds
        self._max_output = max_output_chars

    def definition(self) -> dict[str, Any]:
        return {
            "name": "run_code",
            "description": "Execute code in a sandboxed environment",
            "input_schema": {
                "type": "object",
                "properties": {
                    "code": {"type": "string"},
                    "language": {"type": "string"},
                },
                "required": ["code", "language"],
            },
        }

    async def execute(self, call: ToolCall) -> ToolResult:
        code = call.arguments.get("code", "")
        if not code:
            return ToolResult(
                call_id=call.call_id,
                content="Error: code must not be empty",
                is_error=True,
            )

        tmp = None
        try:
            tmp = tempfile.NamedTemporaryFile(
                mode="w", suffix=".py", delete=False, encoding="utf-8"
            )
            tmp.write(code)
            tmp.flush()
            tmp.close()

            try:
                result = subprocess.run(
                    [sys.executable, tmp.name],
                    capture_output=True,
                    timeout=self._timeout,
                    text=True,
                )
            except subprocess.TimeoutExpired:
                return ToolResult(
                    call_id=call.call_id,
                    content=f"Code execution timeout after {self._timeout}s",
                    is_error=True,
                )

            output = ""
            if result.stdout:
                output += result.stdout
            if result.stderr:
                output += result.stderr
            output = output[: self._max_output]

            return ToolResult(
                call_id=call.call_id,
                content=output or "(no output)",
                is_error=result.returncode != 0,
            )
        except subprocess.TimeoutExpired:
            return ToolResult(
                call_id=call.call_id,
                content=f"Code execution timeout after {self._timeout}s",
                is_error=True,
            )
        except Exception as exc:
            return ToolResult(
                call_id=call.call_id,
                content=f"Sandbox error: {exc}",
                is_error=True,
            )
        finally:
            if tmp:
                try:
                    Path(tmp.name).unlink(missing_ok=True)
                except OSError:
                    pass
