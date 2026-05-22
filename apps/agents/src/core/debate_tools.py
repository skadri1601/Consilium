import enum
from dataclasses import dataclass
from typing import Any


class ToolPermission(enum.IntEnum):
    READ_ONLY = 1
    EXECUTE = 2
    WRITE = 3


@dataclass
class RegisteredTool:
    name: str
    description: str
    input_schema: dict[str, Any]
    permission: ToolPermission = ToolPermission.READ_ONLY

    def to_llm_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }


class DebateToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, RegisteredTool] = {}

    def register(
        self,
        name: str,
        description: str,
        input_schema: dict[str, Any],
        permission: ToolPermission = ToolPermission.READ_ONLY,
    ) -> RegisteredTool:
        if name in self._tools:
            raise ValueError(f"Tool '{name}' is already registered")
        tool = RegisteredTool(
            name=name,
            description=description,
            input_schema=input_schema,
            permission=permission,
        )
        self._tools[name] = tool
        return tool

    def get(self, name: str) -> RegisteredTool | None:
        return self._tools.get(name)

    def list_tools(self, max_permission: ToolPermission = ToolPermission.WRITE) -> list[RegisteredTool]:
        return [t for t in self._tools.values() if t.permission <= max_permission]

    def to_llm_format(self, max_permission: ToolPermission = ToolPermission.WRITE) -> list[dict[str, Any]]:
        return [t.to_llm_dict() for t in self.list_tools(max_permission)]
