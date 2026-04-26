import asyncio
import json
import logging
import re
import uuid
from enum import Enum
from typing import Any, AsyncGenerator, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.features.deliberation.deliberation_graph import DeliberationEngine
from src.features.deliberation.types import DeliberationMode

logger = logging.getLogger(__name__)


_LOG_INJECTION_PATTERN = re.compile(r"[\r\n\t\x00-\x1f]")


def _safe_log_value(value: object, *, max_length: int = 64) -> str:
    """Strip control chars + truncate so user input can't forge log lines.

    Mitigates pythonsecurity:S5145 (log injection) for any user-supplied
    string that flows into a log call.
    """
    text = str(value)
    return _LOG_INJECTION_PATTERN.sub("_", text)[:max_length]

router = APIRouter(prefix="/deliberation", tags=["deliberation"])

_deliberations: dict[str, dict[str, Any]] = {}


class DeliberationStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ToolSchema(BaseModel):
    qualifiedName: str = Field(..., description="<server>.<tool> name")
    description: Optional[str] = None
    inputSchema: dict = Field(default_factory=dict)


class ToolBudget(BaseModel):
    maxCallsPerTurn: Optional[int] = 5
    maxTotalCalls: Optional[int] = 50
    perCallTimeoutMs: Optional[int] = 30000


class ToolResultContent(BaseModel):
    type: str
    text: Optional[str] = None
    data: Optional[str] = None
    mimeType: Optional[str] = None


class ToolResult(BaseModel):
    content: list[ToolResultContent]
    isError: Optional[bool] = False


class ToolResultRequest(BaseModel):
    callId: str
    result: ToolResult


class StartDeliberationRequest(BaseModel):
    deliberation_id: Optional[str] = Field(None, description="Pre-assigned deliberation ID")
    topic: str = Field(..., description="The topic or question to deliberate on")
    models: list[str] = Field(..., description="List of model IDs to participate")
    mode: DeliberationMode = Field(DeliberationMode.COUNCIL, description="Deliberation mode")
    judge_model: str = Field("gpt-5.4-mini", description="Model ID for the judge")
    api_keys: dict = Field(..., description="API keys for model providers")
    max_rounds: Optional[int] = Field(None, description="Maximum deliberation rounds")
    project_context: Optional[dict] = Field(None, description="Codebase context metadata and files")
    tools: Optional[list[ToolSchema]] = Field(None, description="MCP tool schemas exposed by the caller")
    tool_budget: Optional[ToolBudget] = Field(None, description="Tool-call limits for this deliberation")


class RedTeamRequest(BaseModel):
    deliberation_id: Optional[str] = Field(None, description="Pre-assigned deliberation ID")
    topic: str = Field(..., description="The topic to red-team")
    models: list[str] = Field(..., description="List of model IDs to participate")
    judge_model: str = Field("gpt-5.4-mini", description="Model ID for the judge")
    api_keys: dict = Field(..., description="API keys for model providers")


class BlindEvalRequest(BaseModel):
    deliberation_id: Optional[str] = Field(None, description="Pre-assigned deliberation ID")
    topic: str = Field(..., description="The topic to evaluate blindly")
    models: list[str] = Field(..., description="List of model IDs to participate")
    judge_model: str = Field("gpt-5.4-mini", description="Model ID for the judge")
    api_keys: dict = Field(..., description="API keys for model providers")


class DeliberationStartResponse(BaseModel):
    id: str = Field(..., description="Deliberation session ID")
    status: DeliberationStatus = Field(..., description="Current status")


class DeliberationStatusResponse(BaseModel):
    id: str
    status: DeliberationStatus
    mode: str
    topic: str
    round_number: int = 0
    max_rounds: int = 0


class DeliberationResultResponse(BaseModel):
    id: str
    status: DeliberationStatus
    state: Optional[dict] = None
    error: Optional[str] = None


def _store_deliberation(deliberation_id: str, status: DeliberationStatus, engine: DeliberationEngine, topic: str) -> None:
    _deliberations[deliberation_id] = {
        "id": deliberation_id,
        "status": status,
        "engine": engine,
        "topic": topic,
        "events": [],
        "state": None,
        "error": None,
        "tools": [],
        "tool_budget": None,
        "tool_results": {},
        "tool_waiters": {},
        "tool_call_count": 0,
        "task": None,
    }


def _spawn_run_task(deliberation_id: str, engine: DeliberationEngine, topic: str) -> asyncio.Task:
    """Schedule _run_deliberation and KEEP the task reference.

    Without this, asyncio.create_task() returns a value that's only held
    by the event loop's weak set; the GC can collect it before the
    coroutine completes, dropping the in-flight deliberation
    (python:S6912 — task GC).
    """
    task = asyncio.create_task(_run_deliberation(deliberation_id, engine, topic))
    entry = _deliberations.get(deliberation_id)
    if entry is not None:
        entry["task"] = task
    return task


async def await_tool_result(
    deliberation_id: str,
    call_id: str,
    timeout_ms: int = 30000,
) -> Optional[dict]:
    entry = _deliberations.get(deliberation_id)
    if entry is None:
        return None
    if call_id in entry["tool_results"]:
        return entry["tool_results"].pop(call_id)
    future: asyncio.Future = asyncio.get_event_loop().create_future()
    entry["tool_waiters"][call_id] = future
    try:
        result = await asyncio.wait_for(future, timeout=timeout_ms / 1000)
        return result
    except asyncio.TimeoutError:
        entry["tool_waiters"].pop(call_id, None)
        return None


def record_tool_result(deliberation_id: str, call_id: str, result: dict) -> bool:
    entry = _deliberations.get(deliberation_id)
    if entry is None:
        return False
    waiter = entry["tool_waiters"].pop(call_id, None)
    if waiter is not None and not waiter.done():
        waiter.set_result(result)
    else:
        entry["tool_results"][call_id] = result
    return True


async def _run_deliberation(deliberation_id: str, engine: DeliberationEngine, topic: str) -> None:
    entry = _deliberations[deliberation_id]
    entry["status"] = DeliberationStatus.RUNNING
    try:
        state = await engine.run(topic)
        entry["state"] = dict(state)
        entry["status"] = DeliberationStatus.COMPLETED
    except Exception as e:
        # deliberation_id originates from the request body; sanitize before
        # logging to neutralize CR/LF / control-char log injection
        # (pythonsecurity:S5145).
        logger.exception("Deliberation %s failed", _safe_log_value(deliberation_id))
        entry["error"] = str(e)
        entry["status"] = DeliberationStatus.FAILED


def _make_sse_handler(deliberation_id: str):
    def handler(event_type: str, data: Any) -> None:
        entry = _deliberations.get(deliberation_id)
        if entry is not None:
            entry["events"].append({"event": event_type, "data": data})
    return handler


@router.post("/start", response_model=DeliberationStartResponse)
async def start_deliberation(request: StartDeliberationRequest):
    deliberation_id = request.deliberation_id or str(uuid.uuid4())
    sse_handler = _make_sse_handler(deliberation_id)

    engine = DeliberationEngine(
        mode=request.mode,
        models=request.models,
        judge_model=request.judge_model,
        api_keys=request.api_keys,
        max_rounds=request.max_rounds,
        sse_handler=sse_handler,
        project_context=request.project_context,
    )

    _store_deliberation(deliberation_id, DeliberationStatus.PENDING, engine, request.topic)
    if request.tools:
        _deliberations[deliberation_id]["tools"] = [t.model_dump() for t in request.tools]
        _deliberations[deliberation_id]["tool_budget"] = (
            request.tool_budget.model_dump() if request.tool_budget else None
        )
        sse_handler(
            "routing:tools_available",
            {"toolCount": len(request.tools), "names": [t.qualifiedName for t in request.tools]},
        )
    _spawn_run_task(deliberation_id, engine, request.topic)

    return DeliberationStartResponse(id=deliberation_id, status=DeliberationStatus.RUNNING)


@router.post("/{deliberation_id}/tool-results", status_code=204)
async def post_tool_result(deliberation_id: str, request: ToolResultRequest):
    if deliberation_id not in _deliberations:
        raise HTTPException(status_code=404, detail=f"deliberation {deliberation_id} not found")
    ok = record_tool_result(
        deliberation_id,
        request.callId,
        request.result.model_dump(),
    )
    if not ok:
        raise HTTPException(status_code=404, detail="deliberation not found")
    return None


@router.post("/red-team", response_model=DeliberationStartResponse)
async def start_red_team(request: RedTeamRequest):
    deliberation_id = request.deliberation_id or str(uuid.uuid4())
    sse_handler = _make_sse_handler(deliberation_id)

    engine = DeliberationEngine(
        mode=DeliberationMode.REDTEAM,
        models=request.models,
        judge_model=request.judge_model,
        api_keys=request.api_keys,
        sse_handler=sse_handler,
    )

    _store_deliberation(deliberation_id, DeliberationStatus.PENDING, engine, request.topic)
    _spawn_run_task(deliberation_id, engine, request.topic)

    return DeliberationStartResponse(id=deliberation_id, status=DeliberationStatus.RUNNING)


@router.post("/blind-eval", response_model=DeliberationStartResponse)
async def start_blind_eval(request: BlindEvalRequest):
    deliberation_id = request.deliberation_id or str(uuid.uuid4())
    sse_handler = _make_sse_handler(deliberation_id)

    engine = DeliberationEngine(
        mode=DeliberationMode.BLIND,
        models=request.models,
        judge_model=request.judge_model,
        api_keys=request.api_keys,
        sse_handler=sse_handler,
    )

    _store_deliberation(deliberation_id, DeliberationStatus.PENDING, engine, request.topic)
    _spawn_run_task(deliberation_id, engine, request.topic)

    return DeliberationStartResponse(id=deliberation_id, status=DeliberationStatus.RUNNING)


async def _event_stream(deliberation_id: str) -> AsyncGenerator[str, None]:
    entry = _deliberations.get(deliberation_id)
    if entry is None:
        yield f"event: error\ndata: {json.dumps({'error': 'not_found'})}\n\n"
        return

    sent_index = 0
    while True:
        events = entry["events"]
        while sent_index < len(events):
            evt = events[sent_index]
            payload = json.dumps(evt["data"], default=str)
            yield f"event: {evt['event']}\ndata: {payload}\n\n"
            sent_index += 1

        if entry["status"] in (DeliberationStatus.COMPLETED, DeliberationStatus.FAILED):
            final = {"status": entry["status"].value}
            if entry["error"]:
                final["error"] = entry["error"]
            yield f"event: done\ndata: {json.dumps(final)}\n\n"
            return

        await asyncio.sleep(0.1)


@router.get("/{deliberation_id}/stream")
async def stream_deliberation(deliberation_id: str):
    if deliberation_id not in _deliberations:
        raise HTTPException(status_code=404, detail="Deliberation not found")

    return StreamingResponse(
        _event_stream(deliberation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{deliberation_id}/status", response_model=DeliberationStatusResponse)
async def get_deliberation_status(deliberation_id: str):
    entry = _deliberations.get(deliberation_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Deliberation not found")

    engine: DeliberationEngine = entry["engine"]
    return DeliberationStatusResponse(
        id=deliberation_id,
        status=entry["status"],
        mode=engine.mode,
        topic=entry["topic"],
        round_number=engine.state.get("round_number", 0),
        max_rounds=engine.max_rounds,
    )


@router.get("/{deliberation_id}/result", response_model=DeliberationResultResponse)
async def get_deliberation_result(deliberation_id: str):
    entry = _deliberations.get(deliberation_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Deliberation not found")

    return DeliberationResultResponse(
        id=deliberation_id,
        status=entry["status"],
        state=entry["state"],
        error=entry["error"],
    )
