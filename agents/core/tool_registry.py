import enum
import inspect
import typing
from dataclasses import dataclass, field
from difflib import SequenceMatcher


class PermissionLevel(enum.IntEnum):
    READ_ONLY = 1
    WORKSPACE_WRITE = 2
    DANGER = 3


PYTHON_TYPE_TO_JSON = {
    str: "string",
    int: "integer",
    float: "number",
    bool: "boolean",
    list: "array",
    dict: "object",
}


def _schema_from_signature(fn: typing.Callable) -> dict:
    sig = inspect.signature(fn)
    hints = typing.get_type_hints(fn)
    properties = {}
    required = []
    for param_name, param in sig.parameters.items():
        if param_name in ("self", "cls"):
            continue
        hint = hints.get(param_name, str)
        origin = typing.get_origin(hint)
        if origin is typing.Union:
            args = typing.get_args(hint)
            non_none = [a for a in args if a is not type(None)]
            hint = non_none[0] if non_none else str
        json_type = PYTHON_TYPE_TO_JSON.get(hint, "string")
        prop = {"type": json_type}
        if param.default is not inspect.Parameter.empty:
            prop["default"] = param.default
        else:
            required.append(param_name)
        properties[param_name] = prop
    schema = {"type": "object", "properties": properties}
    if required:
        schema["required"] = required
    return schema


@dataclass
class ToolSpec:
    name: str
    description: str
    input_schema: dict
    permission: PermissionLevel = PermissionLevel.READ_ONLY
    handler: typing.Optional[typing.Callable] = None
    source: str = "builtin"

    def to_api_dict(self) -> dict:
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }


TOOL_PERMISSION_MAP = {
    "bash": PermissionLevel.DANGER,
    "db_lookup": PermissionLevel.READ_ONLY,
    "search_email": PermissionLevel.READ_ONLY,
    "read_email": PermissionLevel.READ_ONLY,
    "email_thread": PermissionLevel.READ_ONLY,
    "unread_emails": PermissionLevel.READ_ONLY,
    "linear_search": PermissionLevel.READ_ONLY,
    "linear_get_issue": PermissionLevel.READ_ONLY,
    "linear_create_ticket": PermissionLevel.WORKSPACE_WRITE,
    "linear_transition": PermissionLevel.WORKSPACE_WRITE,
    "sentry_issues": PermissionLevel.READ_ONLY,
    "sentry_stats": PermissionLevel.READ_ONLY,
    "vercel_status": PermissionLevel.READ_ONLY,
    "sonarqube_quality": PermissionLevel.READ_ONLY,
    "github_prs": PermissionLevel.READ_ONLY,
}


class ToolRegistry:
    _instance: typing.Optional["ToolRegistry"] = None

    def __new__(cls) -> "ToolRegistry":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._tools = {}
        return cls._instance

    def register(self, spec: ToolSpec) -> None:
        if spec.name in self._tools:
            raise ValueError(f"Tool already registered: {spec.name}")
        self._tools[spec.name] = spec

    def get(self, name: str) -> typing.Optional[ToolSpec]:
        return self._tools.get(name)

    def list_tools(self, permission_filter: typing.Optional[PermissionLevel] = None) -> list[ToolSpec]:
        if permission_filter is None:
            return list(self._tools.values())
        return [t for t in self._tools.values() if t.permission <= permission_filter]

    def execute(self, name: str, input_dict: dict) -> str:
        spec = self._tools.get(name)
        if spec is None:
            return f"Unknown tool: {name}"
        if spec.handler is None:
            return f"No handler registered for tool: {name}"
        try:
            result = spec.handler(**input_dict)
            return str(result) if result is not None else ""
        except Exception as e:
            return f"Error executing {name}: {e}"

    def search(self, query: str) -> list[ToolSpec]:
        query_lower = query.lower()
        scored = []
        for spec in self._tools.values():
            name_ratio = SequenceMatcher(None, query_lower, spec.name.lower()).ratio()
            desc_ratio = SequenceMatcher(None, query_lower, spec.description.lower()).ratio()
            if query_lower in spec.name.lower():
                name_ratio = max(name_ratio, 0.8)
            if query_lower in spec.description.lower():
                desc_ratio = max(desc_ratio, 0.6)
            score = max(name_ratio, desc_ratio)
            if score > 0.3:
                scored.append((score, spec))
        scored.sort(key=lambda x: x[0], reverse=True)
        return [spec for _, spec in scored]

    def to_api_format(self) -> list[dict]:
        return [spec.to_api_dict() for spec in self._tools.values()]

    def reset(self) -> None:
        self._tools.clear()


def get_registry() -> ToolRegistry:
    return ToolRegistry()


def tool(
    name: str,
    description: str,
    permission: PermissionLevel = PermissionLevel.READ_ONLY,
    source: str = "builtin",
):
    def decorator(fn: typing.Callable) -> typing.Callable:
        input_schema = _schema_from_signature(fn)
        spec = ToolSpec(
            name=name,
            description=description,
            input_schema=input_schema,
            permission=permission,
            handler=fn,
            source=source,
        )
        get_registry().register(spec)
        return fn
    return decorator


def register_builtin_tools(tools_list: typing.Optional[list[dict]] = None) -> None:
    if tools_list is None:
        from agents.core.base import TOOLS
        tools_list = TOOLS

    registry = get_registry()
    for tool_dict in tools_list:
        tool_name = tool_dict["name"]
        if registry.get(tool_name) is not None:
            continue
        permission = TOOL_PERMISSION_MAP.get(tool_name, PermissionLevel.READ_ONLY)
        spec = ToolSpec(
            name=tool_name,
            description=tool_dict["description"],
            input_schema=tool_dict["input_schema"],
            permission=permission,
            handler=None,
            source="builtin",
        )
        registry.register(spec)


def check_permission(tool_name: str, current_level: PermissionLevel) -> bool:
    spec = get_registry().get(tool_name)
    if spec is None:
        return False
    return current_level >= spec.permission
