from __future__ import annotations

import asyncio
import json
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, AsyncGenerator, Optional

from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse

from src.features.deliberation.mcp_server import TOOLS, TOOL_HANDLERS
from src.shared.config import settings

router = APIRouter(tags=["mcp"])

SERVER_INFO = {
    "name": "consilium",
    "version": "0.2.0",
}

CAPABILITIES = {
    "tools": {"listChanged": False},
}


@dataclass
class MCPSession:
    session_id: str
    created_at: float = field(default_factory=time.time)
    last_accessed: float = field(default_factory=time.time)
    initialized: bool = False


_sessions: dict[str, MCPSession] = {}
_cleanup_task: Optional[asyncio.Task] = None

SESSION_TTL_SECONDS = 1800


async def _cleanup_expired_sessions() -> None:
    while True:
        await asyncio.sleep(300)
        now = time.time()
        expired = [
            sid for sid, s in _sessions.items()
            if now - s.last_accessed > SESSION_TTL_SECONDS
        ]
        for sid in expired:
            _sessions.pop(sid, None)


def _ensure_cleanup_running() -> None:
    global _cleanup_task
    if _cleanup_task is None or _cleanup_task.done():
        _cleanup_task = asyncio.create_task(_cleanup_expired_sessions())


def _verify_api_key(authorization: Optional[str]) -> None:
    if not settings.consilium_api_key:
        return
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization format")
    if parts[1] != settings.consilium_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")


def _get_or_create_session(session_id: Optional[str]) -> tuple[MCPSession, bool]:
    if session_id and session_id in _sessions:
        session = _sessions[session_id]
        session.last_accessed = time.time()
        return session, False
    new_id = session_id or str(uuid.uuid4())
    session = MCPSession(session_id=new_id)
    _sessions[new_id] = session
    return session, True


def _jsonrpc_response(req_id: Any, result: Any) -> dict:
    return {"jsonrpc": "2.0", "id": req_id, "result": result}


def _jsonrpc_error(req_id: Any, code: int, message: str) -> dict:
    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": code, "message": message}}


async def _handle_initialize(req_id: Any, session: MCPSession) -> dict:
    session.initialized = True
    return _jsonrpc_response(req_id, {
        "protocolVersion": "2025-03-26",
        "serverInfo": SERVER_INFO,
        "capabilities": CAPABILITIES,
    })


async def _handle_tools_list(req_id: Any) -> dict:
    return _jsonrpc_response(req_id, {"tools": TOOLS})


async def _stream_tool_call(req_id: Any, name: str, arguments: dict) -> AsyncGenerator[str, None]:
    handler = TOOL_HANDLERS.get(name)
    if not handler:
        error = _jsonrpc_error(req_id, -32601, f"Unknown tool: {name}")
        yield f"event: message\ndata: {json.dumps(error)}\n\n"
        return

    yield f"event: message\ndata: {json.dumps({'jsonrpc': '2.0', 'method': 'notifications/progress', 'params': {'token': str(req_id), 'message': f'Running {name}...'}})}\n\n"

    try:
        result_text = await handler(arguments)
        response = _jsonrpc_response(req_id, {
            "content": [{"type": "text", "text": result_text}],
        })
        yield f"event: message\ndata: {json.dumps(response, default=str)}\n\n"
    except Exception as e:
        error = _jsonrpc_error(req_id, -32000, str(e))
        yield f"event: message\ndata: {json.dumps(error)}\n\n"


async def _handle_request(body: dict, session: MCPSession) -> Any:
    req_id = body.get("id")
    method = body.get("method", "")
    params = body.get("params", {})

    if method == "initialize":
        return await _handle_initialize(req_id, session)

    if method == "notifications/initialized":
        return None

    if method == "tools/list":
        return await _handle_tools_list(req_id)

    if method == "tools/call":
        name = params.get("name", "")
        arguments = params.get("arguments", {})
        return ("stream", req_id, name, arguments)

    if method == "ping":
        return _jsonrpc_response(req_id, {})

    return _jsonrpc_error(req_id, -32601, f"Unknown method: {method}")


@router.post("/mcp")
async def mcp_post(
    request: Request,
    authorization: Optional[str] = Header(None),
    mcp_session_id: Optional[str] = Header(None, alias="Mcp-Session-Id"),
):
    _ensure_cleanup_running()
    _verify_api_key(authorization)

    session, is_new = _get_or_create_session(mcp_session_id)

    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            content=_jsonrpc_error(None, -32700, "Parse error"),
            status_code=400,
            headers={"Mcp-Session-Id": session.session_id},
        )

    result = await _handle_request(body, session)

    headers = {"Mcp-Session-Id": session.session_id}

    if result is None:
        return JSONResponse(content={}, status_code=202, headers=headers)

    if isinstance(result, tuple) and result[0] == "stream":
        _, req_id, name, arguments = result
        return StreamingResponse(
            _stream_tool_call(req_id, name, arguments),
            media_type="text/event-stream",
            headers={
                **headers,
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    return JSONResponse(content=result, headers=headers)


@router.get("/mcp")
async def mcp_get(
    authorization: Optional[str] = Header(None),
    mcp_session_id: Optional[str] = Header(None, alias="Mcp-Session-Id"),
):
    _verify_api_key(authorization)

    if not mcp_session_id or mcp_session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found")

    return StreamingResponse(
        _empty_stream(),
        media_type="text/event-stream",
        headers={
            "Mcp-Session-Id": mcp_session_id,
            "Cache-Control": "no-cache",
        },
    )


async def _empty_stream() -> AsyncGenerator[str, None]:
    while True:
        yield ": keepalive\n\n"
        await asyncio.sleep(30)


@router.delete("/mcp")
async def mcp_delete(
    authorization: Optional[str] = Header(None),
    mcp_session_id: Optional[str] = Header(None, alias="Mcp-Session-Id"),
):
    _verify_api_key(authorization)

    if mcp_session_id:
        _sessions.pop(mcp_session_id, None)

    return JSONResponse(content={}, status_code=200)
