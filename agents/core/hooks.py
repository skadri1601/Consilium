import logging
import re
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Callable, Optional

logger = logging.getLogger(__name__)


class HookEvent(Enum):
    PRE_TOOL = "pre_tool"
    POST_TOOL = "post_tool"
    POST_TOOL_FAILURE = "post_tool_failure"
    PRE_MODEL_CALL = "pre_model_call"
    POST_MODEL_CALL = "post_model_call"


@dataclass
class HookResult:
    allow: bool = True
    messages: list = field(default_factory=list)
    modified_input: Optional[dict] = None


@dataclass
class Hook:
    event: HookEvent
    name: str
    callback: Callable


DANGEROUS_PATTERNS = [
    re.compile(r"\brm\s+-rf\b"),
    re.compile(r"\bsudo\b"),
    re.compile(r"\bmkfs\b"),
    re.compile(r"\bdd\s+if="),
    re.compile(r"\b:()\{\s*:\|:\&\s*\};:"),
    re.compile(r"\bchmod\s+-R\s+777\b"),
    re.compile(r"\b>\s*/dev/sd"),
    re.compile(r"\bformat\s+[a-zA-Z]:"),
]


def _log_tool_calls(context: dict) -> HookResult:
    from agents.core.telemetry import get_tracer
    tool_name = context.get("tool_name", "unknown")
    duration_ms = context.get("duration_ms", 0)
    success = context.get("success", True)
    get_tracer().trace_tool(tool_name, duration_ms, success)
    return HookResult(allow=True, messages=[f"Logged tool call: {tool_name}"])


def _block_dangerous_bash(context: dict) -> HookResult:
    tool_name = context.get("tool_name", "")
    if tool_name != "bash":
        return HookResult(allow=True)
    command = context.get("input", {}).get("command", "")
    for pattern in DANGEROUS_PATTERNS:
        if pattern.search(command):
            return HookResult(
                allow=False,
                messages=[f"Blocked dangerous bash command matching: {pattern.pattern}"],
            )
    return HookResult(allow=True)


def _track_model_usage(context: dict) -> HookResult:
    from agents.core.telemetry import get_tracer
    model = context.get("model", "unknown")
    duration_ms = context.get("duration_ms", 0)
    tokens = context.get("tokens", 0)
    get_tracer().trace_model(model, duration_ms, tokens)
    return HookResult(allow=True, messages=[f"Tracked model usage: {model}"])


class HookRunner:
    def __init__(self):
        self._hooks: dict[HookEvent, list[Hook]] = {event: [] for event in HookEvent}
        self._register_builtins()

    def _register_builtins(self):
        self.register(Hook(event=HookEvent.POST_TOOL, name="log_tool_calls", callback=_log_tool_calls))
        self.register(Hook(event=HookEvent.PRE_TOOL, name="block_dangerous_bash", callback=_block_dangerous_bash))
        self.register(Hook(event=HookEvent.POST_MODEL_CALL, name="track_model_usage", callback=_track_model_usage))

    def register(self, hook: Hook) -> None:
        self._hooks[hook.event].append(hook)

    def run_hooks(self, event: HookEvent, context: dict) -> HookResult:
        combined = HookResult(allow=True)
        for hook in self._hooks[event]:
            try:
                result = hook.callback(context)
            except Exception:
                logger.exception("Hook %s raised an exception", hook.name)
                continue
            combined.messages.extend(result.messages)
            if result.modified_input is not None:
                combined.modified_input = result.modified_input
            if not result.allow:
                combined.allow = False
                return combined
        return combined
