from __future__ import annotations

import asyncio
import json
import os
import sys
from typing import Any, Optional

CONSILIUM_API_URL = os.environ.get(
    "CONSILIUM_API_URL", "https://api.myconsilium.xyz"
).rstrip("/")
CONSILIUM_API_KEY = os.environ.get("CONSILIUM_API_KEY", "")


def _env_float(name: str, default: float) -> float:
    raw = os.environ.get(name)
    if not raw:
        return default
    try:
        value = float(raw)
    except ValueError:
        return default
    return value if value > 0 else default


DEFAULT_DELIBERATION_TIMEOUT = _env_float("CONSILIUM_DELIBERATION_TIMEOUT", 900.0)

DEFAULT_MODELS = ["gpt-5.4-mini", "claude-haiku-4-5-20251001"]

ALLOWED_MODES = frozenset(
    {"quick", "council", "deep", "blind", "redteam", "jury", "market", "auto"}
)


class ConsiliumError(Exception):
    """Raised for user-facing failures in MCP tool execution."""


def _safe_error_message(exc: BaseException) -> str:
    if isinstance(exc, ConsiliumError):
        return str(exc)
    import httpx

    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        if status in (401, 403):
            return "Authentication failed. Run `consilium login` or set CONSILIUM_API_KEY."
        if status == 404:
            return "Resource not found (404)."
        if status == 429:
            return "Rate limited by the Consilium API (429). Retry shortly."
        if status >= 500:
            return f"Consilium API error ({status}). Retry after a short wait."
        return f"HTTP {status}: {exc.response.text[:200]}"
    if isinstance(exc, httpx.ConnectError):
        return f"Cannot reach {CONSILIUM_API_URL}. Check network and CONSILIUM_API_URL."
    if isinstance(exc, httpx.TimeoutException):
        return "Request timed out. Increase CONSILIUM_DELIBERATION_TIMEOUT if debates run long."
    if isinstance(exc, TimeoutError):
        return str(exc) or "Operation timed out."
    return f"{type(exc).__name__}: {exc}"


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


async def _poll_deliberation(
    session_id: str,
    timeout_s: Optional[float] = None,
) -> dict[str, Any]:
    effective = timeout_s if timeout_s is not None else DEFAULT_DELIBERATION_TIMEOUT
    loop = asyncio.get_event_loop()
    deadline = loop.time() + effective
    while loop.time() < deadline:
        data = await _get_json(f"/api/v1/deliberation/{session_id}")
        st = data.get("status")
        if st in ("completed", "failed", "archived"):
            return data
        await asyncio.sleep(2)
    raise TimeoutError(
        f"Timed out waiting for deliberation {session_id} after {int(effective)}s "
        "(set CONSILIUM_DELIBERATION_TIMEOUT to raise the ceiling)"
    )


def _parse_sse_event(raw_block: str) -> Optional[dict[str, Any]]:
    data_lines = []
    event_name = None
    for line in raw_block.splitlines():
        if line.startswith("data:"):
            data_lines.append(line[5:].lstrip())
        elif line.startswith("event:"):
            event_name = line[6:].strip()
    if not data_lines:
        return None
    raw = "\n".join(data_lines)
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {"event": event_name or "message", "raw": raw}
    if isinstance(parsed, dict) and event_name and "event" not in parsed:
        parsed["event"] = event_name
    return parsed


_TERMINAL_EVENTS = frozenset({"done", "deliberation_complete", "error"})


async def _stream_deliberation(
    session_id: str,
    on_event: Optional[Any] = None,
    timeout_s: Optional[float] = None,
) -> dict[str, Any]:
    import httpx

    effective = timeout_s if timeout_s is not None else DEFAULT_DELIBERATION_TIMEOUT
    url = f"{CONSILIUM_API_URL}/api/v1/deliberation/{session_id}/stream"
    headers = {**_headers(), "Accept": "text/event-stream"}

    final_event: Optional[dict[str, Any]] = None
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(effective, read=effective)) as client:
            async with client.stream("GET", url, headers=headers) as response:
                response.raise_for_status()
                buffer = ""
                async for chunk in response.aiter_text():
                    buffer += chunk
                    while "\n\n" in buffer:
                        raw_block, buffer = buffer.split("\n\n", 1)
                        event = _parse_sse_event(raw_block)
                        if event is None:
                            continue
                        if on_event is not None:
                            maybe = on_event(event)
                            if asyncio.iscoroutine(maybe):
                                await maybe
                        event_type = event.get("event")
                        if event_type in _TERMINAL_EVENTS:
                            final_event = event
                            break
                    if final_event is not None:
                        break
    except httpx.HTTPStatusError as status_err:
        if status_err.response.status_code in (401, 403, 404):
            raise
        return await _poll_deliberation(session_id, timeout_s=effective)
    except httpx.HTTPError:
        return await _poll_deliberation(session_id, timeout_s=effective)

    if final_event is None:
        return await _poll_deliberation(session_id, timeout_s=30.0)

    final_snapshot = await _get_json(f"/api/v1/deliberation/{session_id}")
    if isinstance(final_snapshot, dict):
        return final_snapshot
    return final_event


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


def _validate_models(raw: Any) -> list[str]:
    if raw is None:
        return list(DEFAULT_MODELS)
    if not isinstance(raw, list):
        raise ConsiliumError("models must be a list of model IDs")
    cleaned = [m for m in raw if isinstance(m, str) and m.strip()]
    if not cleaned:
        raise ConsiliumError("models must contain at least one non-empty string")
    return cleaned


def _require_sid(created: dict[str, Any], endpoint: str) -> str:
    sid = created.get("id")
    if not sid:
        raise ConsiliumError(f"{endpoint} did not return a session id (got keys: {sorted(created.keys())})")
    return str(sid)


async def handle_deliberate(arguments: dict[str, Any], progress_sink: Optional[Any] = None) -> str:
    if not arguments.get("topic"):
        raise ConsiliumError("topic is required")
    mode = arguments.get("mode", "council")
    if mode not in ALLOWED_MODES:
        mode = "council"
    body: dict[str, Any] = {
        "topic": arguments["topic"],
        "mode": mode,
        "models": _validate_models(arguments.get("models")),
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
    sid = _require_sid(created, "/api/v1/deliberation")
    final = await _stream_deliberation(sid, on_event=progress_sink)
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


async def handle_red_team(arguments: dict[str, Any], progress_sink: Optional[Any] = None) -> str:
    if not arguments.get("content"):
        raise ConsiliumError("content is required")
    topic = str(arguments["content"])[:2000]
    body = {
        "topic": topic,
        "models": _validate_models(arguments.get("models")),
        "debateSource": "mcp",
    }
    created = await _post_json("/api/v1/deliberation/redteam", body)
    sid = _require_sid(created, "/api/v1/deliberation/redteam")
    final = await _stream_deliberation(sid, on_event=progress_sink)
    return json.dumps(final, indent=2, default=str)


async def handle_blind_eval(arguments: dict[str, Any], progress_sink: Optional[Any] = None) -> str:
    if not arguments.get("topic"):
        raise ConsiliumError("topic is required")
    if arguments.get("responses") is None:
        raise ConsiliumError("responses is required")
    body = {
        "topic": arguments["topic"],
        "models": _validate_models(arguments.get("models")),
        "responses": arguments["responses"],
        "debateSource": "mcp",
    }
    created = await _post_json("/api/v1/deliberation/blind", body)
    sid = _require_sid(created, "/api/v1/deliberation/blind")
    final = await _stream_deliberation(sid, on_event=progress_sink)
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

    def _make_progress_sink() -> Optional[Any]:
        try:
            ctx = _server.request_context
        except LookupError:
            return None
        meta = getattr(ctx, "meta", None) or {}
        token = meta.get("progressToken") if isinstance(meta, dict) else None
        if token is None:
            return None
        session = getattr(ctx, "session", None)
        send = getattr(session, "send_progress_notification", None)
        if send is None:
            return None

        async def _sink(event: dict[str, Any]) -> None:
            try:
                message = event.get("event") or "progress"
                await send(progress_token=token, progress=0, total=None, message=message)
            except Exception:
                pass

        return _sink

    _STREAMING_TOOLS = frozenset({"consilium_deliberate", "consilium_red_team", "consilium_blind_eval"})

    @_server.call_tool()
    async def _call_tool(name: str, arguments: dict) -> list[TextContent]:
        handler = TOOL_HANDLERS.get(name)
        if not handler:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
        try:
            if name in _STREAMING_TOOLS:
                result = await handler(arguments, progress_sink=_make_progress_sink())
            else:
                result = await handler(arguments)
            return [TextContent(type="text", text=result)]
        except Exception as e:
            return [TextContent(type="text", text=_safe_error_message(e))]

    HAS_MCP = True

except ImportError:
    HAS_MCP = False
    _server = None


_STREAMING_TOOL_NAMES = frozenset(
    {"consilium_deliberate", "consilium_red_team", "consilium_blind_eval"}
)


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
            # Streaming tools accept an optional progress_sink as second
            # positional. The stdio fallback has no MCP progress channel,
            # so we pass None — the handlers will still complete and
            # return their final result, just without intermediate
            # progress notifications.
            if name in _STREAMING_TOOL_NAMES:
                result = await handler(arguments, None)
            else:
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
                "error": {"code": -32000, "message": _safe_error_message(e)},
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


def _preflight_auth_check() -> None:
    """Warn loudly on stderr if CONSILIUM_API_KEY is missing/empty.

    Without this, the user sees a confusing 401 only on the first tool
    invocation (which can be minutes after `consilium-mcp` was spawned
    by Claude Desktop / Cursor / etc.). Surfacing the misconfiguration
    at startup makes the failure mode self-explanatory.
    """
    if not CONSILIUM_API_KEY:
        sys.stderr.write(
            "[consilium-mcp] CONSILIUM_API_KEY is not set; every tool call will "
            "401 against the Consilium API. Run `consilium login` to issue a "
            "token and set it in your MCP host config (env: CONSILIUM_API_KEY).\n"
        )
        sys.stderr.flush()


def main() -> None:
    _preflight_auth_check()
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
