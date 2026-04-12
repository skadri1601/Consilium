import asyncio
import json
import logging
import uuid
from enum import Enum
from typing import Any, AsyncGenerator, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.features.deliberation.deliberation_graph import DeliberationEngine
from src.features.deliberation.types import DeliberationMode

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/deliberation", tags=["deliberation"])

_deliberations: dict[str, dict[str, Any]] = {}


class DeliberationStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class StartDeliberationRequest(BaseModel):
    deliberation_id: Optional[str] = Field(None, description="Pre-assigned deliberation ID")
    topic: str = Field(..., description="The topic or question to deliberate on")
    models: list[str] = Field(..., description="List of model IDs to participate")
    mode: DeliberationMode = Field(DeliberationMode.COUNCIL, description="Deliberation mode")
    judge_model: str = Field("gpt-4o-mini", description="Model ID for the judge")
    api_keys: dict = Field(..., description="API keys for model providers")
    max_rounds: Optional[int] = Field(None, description="Maximum deliberation rounds")
    project_context: Optional[dict] = Field(None, description="Codebase context metadata and files")


class RedTeamRequest(BaseModel):
    deliberation_id: Optional[str] = Field(None, description="Pre-assigned deliberation ID")
    topic: str = Field(..., description="The topic to red-team")
    models: list[str] = Field(..., description="List of model IDs to participate")
    judge_model: str = Field("gpt-4o-mini", description="Model ID for the judge")
    api_keys: dict = Field(..., description="API keys for model providers")


class BlindEvalRequest(BaseModel):
    deliberation_id: Optional[str] = Field(None, description="Pre-assigned deliberation ID")
    topic: str = Field(..., description="The topic to evaluate blindly")
    models: list[str] = Field(..., description="List of model IDs to participate")
    judge_model: str = Field("gpt-4o-mini", description="Model ID for the judge")
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
    }


async def _run_deliberation(deliberation_id: str, engine: DeliberationEngine, topic: str) -> None:
    entry = _deliberations[deliberation_id]
    entry["status"] = DeliberationStatus.RUNNING
    try:
        state = await engine.run(topic)
        entry["state"] = dict(state)
        entry["status"] = DeliberationStatus.COMPLETED
    except Exception as e:
        logger.exception("Deliberation %s failed", deliberation_id)
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
    asyncio.create_task(_run_deliberation(deliberation_id, engine, request.topic))

    return DeliberationStartResponse(id=deliberation_id, status=DeliberationStatus.RUNNING)


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
    asyncio.create_task(_run_deliberation(deliberation_id, engine, request.topic))

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
    asyncio.create_task(_run_deliberation(deliberation_id, engine, request.topic))

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
