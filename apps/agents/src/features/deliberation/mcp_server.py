from __future__ import annotations

import asyncio
import json
import sys

from src.features.deliberation.deliberation_graph import (
    DeliberationEngine,
    _call_model_via_factory,
)
from src.features.deliberation.red_team import format_red_team_report, run_red_team
from src.features.deliberation.types import (
    AttackCategory,
    DeliberationMode,
)

TOOLS = [
    {
        "name": "consilium_deliberate",
        "description": (
            "Run a full Consilium deliberation on a topic. "
            "Returns the golden prompt, dissent report, and cost breakdown."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "The topic to deliberate on"},
                "mode": {
                    "type": "string",
                    "description": "Deliberation mode",
                    "default": "auto",
                    "enum": [m.value for m in DeliberationMode],
                },
                "models": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of model IDs to use",
                },
                "max_rounds": {
                    "type": "integer",
                    "description": "Maximum deliberation rounds",
                    "default": 3,
                },
            },
            "required": ["topic"],
        },
    },
    {
        "name": "consilium_red_team",
        "description": (
            "Run an adversarial red team assessment against content. "
            "Returns a detailed vulnerability report."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "Content to red-team"},
                "categories": {
                    "type": "array",
                    "items": {"type": "string", "enum": [c.value for c in AttackCategory]},
                    "description": "Attack categories to test",
                },
            },
            "required": ["content"],
        },
    },
    {
        "name": "consilium_blind_eval",
        "description": (
            "DEPRECATED in the in-engine MCP server: returns a structured error directing "
            "callers to the published consilium-mcp (PyPI) which routes to the API's "
            "/api/v1/deliberation/blind endpoint and runs the full engine. The in-engine "
            "path cannot run an async LLM-backed judge synchronously."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "The topic responses address"},
                "responses": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "model_id": {"type": "string"},
                            "content": {"type": "string"},
                        },
                        "required": ["model_id", "content"],
                    },
                    "description": "Responses to evaluate blindly",
                },
            },
            "required": ["topic", "responses"],
        },
    },
]

DEFAULT_MODELS = ["gpt-5.4", "claude-sonnet-4-6", "gemini-3.1-pro-preview"]
DEFAULT_JUDGE = "gpt-5.4-mini"


async def handle_deliberate(arguments: dict) -> str:
    topic = arguments["topic"]
    mode_str = arguments.get("mode", "auto")
    models = arguments.get("models") or DEFAULT_MODELS
    max_rounds = arguments.get("max_rounds", 3)

    mode = DeliberationMode(mode_str)

    project_context = None
    context = arguments.get("context")
    if context and arguments.get("codebase_access"):
        project_context = context

    engine = DeliberationEngine(
        mode=mode,
        models=models,
        judge_model=DEFAULT_JUDGE,
        api_keys={},
        max_rounds=max_rounds,
        project_context=project_context,
    )
    state = await engine.run(topic)

    result = {
        "golden_prompt": state.get("golden_prompt"),
        "dissent_report": state.get("dissent_report"),
        "cost_breakdown": state.get("cost_tracker"),
    }
    return json.dumps(result, indent=2, default=str)


async def handle_red_team(arguments: dict) -> str:
    content = arguments["content"]
    category_strs = arguments.get("categories")

    categories = None
    if category_strs:
        categories = [AttackCategory(c) for c in category_strs]

    # Real LLM calls via AgentFactory; api_keys={} falls back to free-tier
    # env vars (CONSILIUM_FREE_TIER_GROQ_KEY / CONSILIUM_FREE_TIER_OPENROUTER_KEY)
    # if no provider keys are configured.
    report = await run_red_team(
        target_content=content,
        attacker_model=DEFAULT_MODELS[0],
        defender_model=DEFAULT_MODELS[-1],
        judge_model=DEFAULT_JUDGE,
        api_keys={},
        call_fn=_call_model_via_factory,
        categories=categories,
    )
    return format_red_team_report(report)


async def handle_blind_eval(arguments: dict) -> str:
    # The in-engine MCP server is intended for development and the
    # mcp_http router; the production path for ranking pre-existing
    # responses is the published consilium-mcp (PyPI) which POSTs to
    # /api/v1/deliberation/blind and runs the full deliberation engine.
    #
    # The previous in-engine implementation called a synchronous
    # judge_func that returned flat 5.0 scores for every model — i.e.
    # it produced ranking output that looked plausible but contained
    # no real evaluation. We refuse here so callers don't accidentally
    # ship results derived from a no-op judge.
    return json.dumps(
        {
            "error": "blind_eval is not supported in the in-engine MCP server.",
            "reason": (
                "This entry point cannot run an LLM-backed judge synchronously; "
                "the prior implementation returned flat 5.0 scores."
            ),
            "use_instead": (
                "Install `pip install consilium`, then run `consilium-mcp` (the published "
                "MCP server). It posts to /api/v1/deliberation/blind where the full engine "
                "performs the blind evaluation."
            ),
            "topic": arguments.get("topic", ""),
            "responses_received": len(arguments.get("responses") or []),
        },
        indent=2,
        default=str,
    )


TOOL_HANDLERS = {
    "consilium_deliberate": handle_deliberate,
    "consilium_red_team": handle_red_team,
    "consilium_blind_eval": handle_blind_eval,
}


try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent

    server = Server("consilium")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return [
            Tool(
                name=t["name"],
                description=t["description"],
                inputSchema=t["inputSchema"],
            )
            for t in TOOLS
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        handler = TOOL_HANDLERS.get(name)
        if not handler:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
        try:
            result = await handler(arguments)
            return [TextContent(type="text", text=result)]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {e}")]

    HAS_MCP = True

except ImportError:
    HAS_MCP = False
    server = None


async def jsonrpc_handle(request: dict) -> dict:
    req_id = request.get("id")
    method = request.get("method", "")
    params = request.get("params", {})

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        name = params.get("name", "")
        arguments = params.get("arguments", {})
        handler = TOOL_HANDLERS.get(name)
        if not handler:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Unknown tool: {name}"},
            }
        try:
            result = await handler(arguments)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": result}]},
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32000, "message": str(e)},
            }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Unknown method: {method}"},
    }


async def run_stdio_server() -> None:
    loop = asyncio.get_event_loop()
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError:
            response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": "Parse error"},
            }
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
            continue

        response = await jsonrpc_handle(request)
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()


def main() -> None:
    if HAS_MCP and server is not None:
        from mcp.server.stdio import stdio_server

        async def _run() -> None:
            async with stdio_server() as (read_stream, write_stream):
                await server.run(read_stream, write_stream)

        asyncio.run(_run())
    else:
        asyncio.run(run_stdio_server())


if __name__ == "__main__":
    main()
