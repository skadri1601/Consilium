from __future__ import annotations

import asyncio
import json
import os
import sys
from typing import Any

CONSILIUM_API_URL = os.environ.get("CONSILIUM_API_URL", "http://localhost:8000")
CONSILIUM_API_KEY = os.environ.get("CONSILIUM_API_KEY", "")

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
                    "default": "council",
                    "enum": [
                        "council", "adversarial", "confidence_weighted",
                        "red_team", "delphi", "swarm", "dialectic", "auto",
                    ],
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
                "context": {
                    "type": "object",
                    "description": "Project context for codebase-aware deliberation",
                    "properties": {
                        "files": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "name": {"type": "string"},
                                    "content": {"type": "string"},
                                },
                            },
                            "description": "Source files to include as context",
                        },
                        "projectType": {"type": "string"},
                        "language": {"type": "string"},
                        "framework": {"type": "string"},
                        "integrations": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                    },
                },
                "codebase_access": {
                    "type": "boolean",
                    "description": "Explicitly enable codebase context. Must be true to send file contents.",
                    "default": False,
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
                    "items": {"type": "string"},
                    "description": "Attack categories to test",
                },
            },
            "required": ["content"],
        },
    },
    {
        "name": "consilium_blind_eval",
        "description": (
            "Run a blind evaluation of multiple responses. "
            "Returns rankings and scores with bias mitigation."
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


async def _call_api(endpoint: str, payload: dict[str, Any]) -> dict[str, Any]:
    try:
        import httpx
    except ImportError:
        raise RuntimeError("httpx is required: pip install consilium")

    headers: dict[str, str] = {"Content-Type": "application/json"}
    if CONSILIUM_API_KEY:
        headers["Authorization"] = f"Bearer {CONSILIUM_API_KEY}"

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            f"{CONSILIUM_API_URL}{endpoint}",
            json=payload,
            headers=headers,
        )
        resp.raise_for_status()
        return resp.json()


async def handle_deliberate(arguments: dict[str, Any]) -> str:
    payload: dict[str, Any] = {
        "topic": arguments["topic"],
        "mode": arguments.get("mode", "council"),
        "models": arguments.get("models"),
        "max_rounds": arguments.get("max_rounds", 3),
    }
    context = arguments.get("context")
    if context and arguments.get("codebase_access"):
        payload["project_context"] = context
    result = await _call_api("/v1/deliberate", payload)
    return json.dumps(result, indent=2, default=str)


async def handle_red_team(arguments: dict[str, Any]) -> str:
    result = await _call_api("/v1/red-team", {
        "content": arguments["content"],
        "categories": arguments.get("categories"),
    })
    return json.dumps(result, indent=2, default=str)


async def handle_blind_eval(arguments: dict[str, Any]) -> str:
    result = await _call_api("/v1/blind-eval", {
        "topic": arguments["topic"],
        "responses": arguments["responses"],
    })
    return json.dumps(result, indent=2, default=str)


TOOL_HANDLERS = {
    "consilium_deliberate": handle_deliberate,
    "consilium_red_team": handle_red_team,
    "consilium_blind_eval": handle_blind_eval,
}


try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent

    _server = Server("consilium")

    @_server.list_tools()
    async def _list_tools() -> list[Tool]:
        return [
            Tool(
                name=t["name"],
                description=t["description"],
                inputSchema=t["inputSchema"],
            )
            for t in TOOLS
        ]

    @_server.call_tool()
    async def _call_tool(name: str, arguments: dict) -> list[TextContent]:
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
    _server = None


async def _jsonrpc_handle(request: dict) -> dict:
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


async def _run_stdio_fallback() -> None:
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

        response = await _jsonrpc_handle(request)
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()


def main() -> None:
    if HAS_MCP and _server is not None:
        from mcp.server.stdio import stdio_server

        async def _run() -> None:
            async with stdio_server() as (read_stream, write_stream):
                await _server.run(read_stream, write_stream)

        asyncio.run(_run())
    else:
        asyncio.run(_run_stdio_fallback())


if __name__ == "__main__":
    main()
