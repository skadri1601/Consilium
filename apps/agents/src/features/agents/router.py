from fastapi import APIRouter, HTTPException, Depends
from typing import List
from .service import AgentsService
from pydantic import BaseModel

router = APIRouter(prefix="/agents", tags=["agents"])


class AgentInfo(BaseModel):
    id: str
    name: str
    provider: str
    model: str
    description: str
    is_available: bool


class AgentQueryRequest(BaseModel):
    agent_id: str
    query: str
    user_id: str


class AgentQueryResponse(BaseModel):
    agent_id: str
    response: str
    tokens_used: int
    latency_ms: int


def get_agents_service() -> AgentsService:
    return AgentsService()


@router.get("/", response_model=List[AgentInfo])
async def list_agents(
    service: AgentsService = Depends(get_agents_service)
) -> List[AgentInfo]:
    """List all available AI agents."""
    return service.get_all_agents()


@router.get("/{agent_id}", response_model=AgentInfo)
async def get_agent(
    agent_id: str,
    service: AgentsService = Depends(get_agents_service)
) -> AgentInfo:
    """Get information about a specific agent."""
    agent = service.get_agent_info(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.post("/query", response_model=AgentQueryResponse)
async def query_agent(
    request: AgentQueryRequest,
    service: AgentsService = Depends(get_agents_service)
) -> AgentQueryResponse:
    """Query a specific agent directly."""
    try:
        response = await service.query_agent(
            agent_id=request.agent_id,
            query=request.query,
            user_id=request.user_id
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}/health")
async def check_agent_health(
    agent_id: str,
    service: AgentsService = Depends(get_agents_service)
) -> dict:
    """Check the health status of a specific agent."""
    is_healthy = await service.check_agent_health(agent_id)
    return {"agent_id": agent_id, "healthy": is_healthy}
