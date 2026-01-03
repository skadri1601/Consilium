from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from typing import List
from .service import CouncilService
from .schema import CouncilQuery, CouncilResponse

router = APIRouter(prefix="/council", tags=["council"])

def get_council_service() -> CouncilService:
    return CouncilService()


@router.post("/query", response_model=CouncilResponse)
async def query_council(
    query: CouncilQuery,
    service: CouncilService = Depends(get_council_service)
):
    """Submit a query to the AI council for collaborative response."""
    try:
        response = await service.process_query(query)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query/stream")
async def query_council_stream(
    query: CouncilQuery,
    service: CouncilService = Depends(get_council_service)
):
    """Submit a query to the AI council with streaming responses."""
    return StreamingResponse(
        service.process_query_stream(query),
        media_type="text/event-stream"
    )


@router.get("/agents")
async def list_available_agents(
    service: CouncilService = Depends(get_council_service)
) -> List[str]:
    """List all available AI agents."""
    return service.get_available_agents()
