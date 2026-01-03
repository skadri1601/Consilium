from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from .service import StreamingService

router = APIRouter(prefix="/stream", tags=["streaming"])


class StreamRequest(BaseModel):
    query: str
    agent_ids: Optional[List[str]] = None
    user_id: str
    session_id: Optional[str] = None


def get_streaming_service() -> StreamingService:
    return StreamingService()


@router.post("/council")
async def stream_council_response(
    request: StreamRequest,
    service: StreamingService = Depends(get_streaming_service)
):
    """Stream responses from multiple agents in real-time."""
    return StreamingResponse(
        service.stream_multi_agent(
            query=request.query,
            agent_ids=request.agent_ids,
            user_id=request.user_id,
            session_id=request.session_id
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/agent/{agent_id}")
async def stream_single_agent(
    agent_id: str,
    request: StreamRequest,
    service: StreamingService = Depends(get_streaming_service)
):
    """Stream response from a single agent."""
    return StreamingResponse(
        service.stream_single_agent(
            agent_id=agent_id,
            query=request.query,
            user_id=request.user_id
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
