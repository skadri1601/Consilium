from pathlib import Path
from typing import Any

from src.features.agents.base_agent import ToolCall, ToolResult


class FileReaderTool:
    def __init__(
        self, allowed_roots: list[str] | None = None, max_file_size: int = 100_000
    ) -> None:
        self._allowed_roots = (
            [Path(r).resolve() for r in allowed_roots] if allowed_roots else None
        )
        self._max_file_size = max_file_size

    def definition(self) -> dict[str, Any]:
        return {
            "name": "read_file",
            "description": "Read the contents of a file with line numbers",
            "input_schema": {
                "type": "object",
                "properties": {
                    "path": {"type": "string"},
                    "start_line": {"type": "integer", "default": 1},
                    "end_line": {"type": "integer", "default": 200},
                },
                "required": ["path"],
            },
        }

    def _is_path_allowed(self, resolved_path: Path) -> bool:
        if self._allowed_roots is None:
            return True
        return any(resolved_path.is_relative_to(root) for root in self._allowed_roots)

    async def execute(self, call: ToolCall) -> ToolResult:
        file_path = call.arguments.get("path", "")
        if not file_path:
            return ToolResult(
                call_id=call.call_id,
                content="Error: path must not be empty",
                is_error=True,
            )

        try:
            resolved_path = Path(file_path).resolve()
        except OSError as exc:
            return ToolResult(
                call_id=call.call_id,
                content=f"Error: cannot resolve path: {exc}",
                is_error=True,
            )

        if not self._is_path_allowed(resolved_path):
            return ToolResult(
                call_id=call.call_id,
                content=f"Error: path not allowed: {file_path}",
                is_error=True,
            )

        if not resolved_path.is_file():
            return ToolResult(
                call_id=call.call_id,
                content=f"Error: not a file: {file_path}",
                is_error=True,
            )

        try:
            size = resolved_path.stat().st_size
        except OSError as exc:
            return ToolResult(
                call_id=call.call_id,
                content=f"Error: cannot stat file: {exc}",
                is_error=True,
            )

        if size > self._max_file_size:
            return ToolResult(
                call_id=call.call_id,
                content=f"Error: file too large ({size} bytes, max {self._max_file_size})",
                is_error=True,
            )

        start_line = call.arguments.get("start_line", 1)
        end_line = call.arguments.get("end_line", 200)

        try:
            text = resolved_path.read_text(encoding="utf-8", errors="replace")
        except OSError as exc:
            return ToolResult(
                call_id=call.call_id,
                content=f"Error reading file: {exc}",
                is_error=True,
            )

        lines = text.splitlines()
        selected = lines[max(0, start_line - 1) : end_line]
        numbered = [
            f"{i}: {line}" for i, line in enumerate(selected, start=max(1, start_line))
        ]

        return ToolResult(
            call_id=call.call_id,
            content="\n".join(numbered) if numbered else "(empty file)",
        )
