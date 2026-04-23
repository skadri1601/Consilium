from __future__ import annotations

import asyncio
import json
import os
import sys
from typing import Any

CONSILIUM_API_URL = os.environ.get(
    "CONSILIUM_API_URL", "https://api.myconsilium.xyz"
).rstrip("/")
CONSILIUM_API_KEY = os.environ.get("CONSILIUM_API_KEY", "")

DEFAULT_MODELS = ["gpt-4o-mini", "claude-haiku-4-5-20251001"]

ALLOWED_MODES = frozenset(
    {"quick", "council", "deep", "blind", "redteam", "jury", "market", "auto"}
)


def _headers() -> dict[str, str]:
    h = {"Content-Type": "application/json"}
    if CONSILIUM_API_KEY:
        h["Authorization"] = f"Bearer {CONSILIUM_API_KEY}"
    return h


async def _post_json(path: str, body: dict[str, Any]) -> dict[str, Any]:
    try:
        import httpx
    except ImportError as e:
        raise RuntimeError("Install httpx: pip install httpx") from e

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(
            f"{CONSILIUM_API_URL}{path}",
            json=body,
            headers=_headers(),
        )
        r.raise_for_status()
        return r.json()


async def _get_json(path: str) -> Any:
    import httpx

    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.get(f"{CONSILIUM_API_URL}{path}", headers=_headers())
        r.raise_for_status()
        return r.json()


async def _post_empty(path: str) -> dict[str, Any]:
    import httpx

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(f"{CONSILIUM_API_URL}{path}", headers=_headers())
        r.raise_for_status()
        if r.status_code == 204 or not r.content:
            return {"ok": True}
        return r.json()


async def _poll_deliberation(session_id: str, timeout_s: float = 900.0) -> dict[str, Any]:
    loop = asyncio.get_event_loop()
    deadline = loop.time() + timeout_s
    while loop.time() < deadline:
        data = await _get_json(f"/api/v1/deliberation/{session_id}")
        st = data.get("status")
        if st in ("completed", "failed", "archived"):
            return data
        await asyncio.sleep(2)
    raise TimeoutError("Timed out waiting for deliberation to finish")


TOOLS = [
    {
        "name": "consilium_deliberate",
        "description": (
            "Run a Consilium deliberation via the hosted Nest API. "
            "Uses your CONSILIUM_API_KEY (CLI token). Returns the final session record."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "Topic to deliberate on"},
                "mode": {
                    "type": "string",
                    "description": "Deliberation mode",
                    "default": "council",
                    "enum": list(ALLOWED_MODES),
                },
                "models": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Model IDs (at least 2)",
                },
                "max_rounds": {
                    "type": "integer",
                    "description": "Maximum rounds",
                    "default": 5,
                },
                "context": {
                    "type": "object",
                    "description": "Optional structured context",
                },
                "files": {
                    "type": "array",
                    "description": "Optional file attachments to include as context",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "content": {"type": "string"},
                        },
                        "required": ["name", "content"],
                    },
                },
                "codebase_access": {
                    "type": "boolean",
                    "description": "Must be true to attach context or files",
                    "default": False,
                },
            },
            "required": ["topic"],
        },
    },
    {
        "name": "consilium_list_debates",
        "description": (
            "List the caller's recent debate sessions. Returns most recent first. "
            "Use this from Claude Desktop / Cursor to pick a debate to follow up on."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Max results (1-100, default 20)",
                    "default": 20,
                },
                "offset": {
                    "type": "integer",
                    "description": "Pagination offset",
                    "default": 0,
                },
                "search": {
                    "type": "string",
                    "description": "Filter by topic substring",
                },
            },
        },
    },
    {
        "name": "consilium_cancel_debate",
        "description": "Cancel an in-progress debate or deliberation by id.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "debate_id": {"type": "string", "description": "Debate or deliberation id"},
                "kind": {
                    "type": "string",
                    "description": "Which resource to cancel",
                    "enum": ["debate", "deliberation"],
                    "default": "debate",
                },
            },
            "required": ["debate_id"],
        },
    },
    {
        "name": "consilium_red_team",
        "description": "Run a red-team assessment via POST /deliberation/redteam.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "Content to assess"},
                "models": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["content"],
        },
    },
    {
        "name": "consilium_blind_eval",
        "description": "Run blind evaluation via POST /deliberation/blind.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string"},
                "responses": {"type": "object"},
                "models": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": ["topic", "responses"],
        },
    },
]


async def handle_deliberate(arguments: dict[str, Any]) -> str:
    mode = arguments.get("mode", "council")
    if mode not in ALLOWED_MODES:
        mode = "council"
    body: dict[str, Any] = {
        "topic": arguments["topic"],
        "mode": mode,
        "models": arguments.get("models") or list(DEFAULT_MODELS),
        "maxRounds": int(arguments.get("max_rounds", 5)),
        "debateSource": "mcp",
    }
    codebase_access = bool(arguments.get("codebase_access"))
    ctx = arguments.get("context")
    if ctx and codebase_access:
        body["projectContext"] = ctx
    files = arguments.get("files")
    if files and codebase_access:
        body.setdefault("context", {})
        body["context"]["files"] = files
    created = await _post_json("/api/v1/deliberation", body)
    sid = created.get("id")
    if not sid:
        return json.dumps(created, indent=2, default=str)
    final = await _poll_deliberation(str(sid))
    return json.dumps(final, indent=2, default=str)


async def handle_list_debates(arguments: dict[str, Any]) -> str:
    limit = arguments.get("limit", 20)
    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 20
    limit = max(1, min(limit, 100))

    offset = arguments.get("offset", 0)
    try:
        offset = int(offset)
    except (TypeError, ValueError):
        offset = 0
    offset = max(0, offset)

    params = [f"limit={limit}", f"offset={offset}"]
    search = arguments.get("search")
    if search:
        from urllib.parse import quote

        params.append(f"search={quote(str(search))}")
    path = f"/api/v1/debates?{'&'.join(params)}"
    data = await _get_json(path)
    if isinstance(data, dict) and "items" in data:
        data = data["items"]
    return json.dumps(data, indent=2, default=str)


async def handle_cancel_debate(arguments: dict[str, Any]) -> str:
    debate_id = str(arguments["debate_id"])
    kind = arguments.get("kind", "debate")
    path = (
        f"/api/v1/deliberation/{debate_id}/cancel"
        if kind == "deliberation"
        else f"/api/v1/debates/{debate_id}/cancel"
    )
    result = await _post_empty(path)
    return json.dumps({"cancelled": debate_id, "kind": kind, "result": result}, indent=2, default=str)


async def handle_red_team(arguments: dict[str, Any]) -> str:
    topic = str(arguments["content"])[:2000]
    body = {
        "topic": topic,
        "models": arguments.get("models") or list(DEFAULT_MODELS),
        "debateSource": "mcp",
    }
    created = await _post_json("/api/v1/deliberation/redteam", body)
    sid = created.get("id")
    if not sid:
        return json.dumps(created, indent=2, default=str)
    final = await _poll_deliberation(str(sid))
    return json.dumps(final, indent=2, default=str)


async def handle_blind_eval(arguments: dict[str, Any]) -> str:
    body = {
        "topic": arguments["topic"],
        "models": arguments.get("models") or list(DEFAULT_MODELS),
        "responses": arguments["responses"],
        "debateSource": "mcp",
    }
    created = await _post_json("/api/v1/deliberation/blind", body)
    sid = created.get("id")
    if not sid:
        return json.dumps(created, indent=2, default=str)
    final = await _poll_deliberation(str(sid))
    return json.dumps(final, indent=2, default=str)


TOOL_HANDLERS = {
    "consilium_deliberate": handle_deliberate,
    "consilium_red_team": handle_red_team,
    "consilium_blind_eval": handle_blind_eval,
    "consilium_list_debates": handle_list_debates,
    "consilium_cancel_debate": handle_cancel_debate,
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
