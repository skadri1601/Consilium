"""FastAPI router for debates endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
import sentry_sdk
from .service import DebatesService
from .schema import DebateStartRequest, DebateStartResponse
from ...shared.auth import require_api_key

router = APIRouter(
    prefix="/debates",
    tags=["debates"],
    dependencies=[Depends(require_api_key)],
)


def get_debates_service() -> DebatesService:
    """Dependency injection for DebatesService."""
    return DebatesService()


@router.post("/start", response_model=DebateStartResponse)
async def start_debate(
    request: DebateStartRequest,
    service: DebatesService = Depends(get_debates_service)
):
    """
    Start a new debate workflow.

    This endpoint creates a debate session and returns a debate ID
    that can be used to stream the debate progress.

    Args:
        request: Debate configuration with topic, models, and API keys
        service: Injected DebatesService instance

    Returns:
        DebateStartResponse with debate_id and status

    Raises:
        HTTPException: If debate creation fails
    """
    try:
        response = await service.start_debate(request)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start debate: {str(e)}"
        )


@router.get("/{debate_id}")
async def get_debate(
    debate_id: str,
    service: DebatesService = Depends(get_debates_service)
):
    """
    Get debate information by ID.

    Args:
        debate_id: The unique debate identifier
        service: Injected DebatesService instance

    Returns:
        Debate data dictionary

    Raises:
        HTTPException: If debate not found
    """
    debate = await service.get_debate(debate_id)
    if not debate:
        raise HTTPException(
            status_code=404,
            detail=f"Debate {debate_id} not found"
        )
    return debate


@router.get("/{debate_id}/stream")
async def stream_debate(
    debate_id: str,
    service: DebatesService = Depends(get_debates_service)
):
    """
    Stream debate progress in real-time using Server-Sent Events.

    Args:
        debate_id: The unique debate identifier
        service: Injected DebatesService instance

    Returns:
        StreamingResponse with SSE events

    Raises:
        HTTPException: If debate not found
    """
    debate = await service.get_debate(debate_id)
    if not debate:
        raise HTTPException(
            status_code=404,
            detail=f"Debate {debate_id} not found"
        )

    try:
        sentry_sdk.set_user({"id": debate.get("user_id", "unknown")})
    except Exception:
        pass

    return StreamingResponse(
        service.stream_debate(debate_id, debate),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/{debate_id}/events")
async def get_debate_events(debate_id: str, since_id: int = 0):
    from ...shared.database.redis import get_redis
    redis = await get_redis()
    if not redis:
        raise HTTPException(status_code=503, detail="Redis unavailable")
    try:
        events = await redis.lrange(f"debate:{debate_id}:events", since_id, -1)
        return {"events": events or [], "total": len(events or []), "since_id": since_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
