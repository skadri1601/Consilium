"""Agent router for creating agent instances with custom API keys."""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel

from .openai_agent import OpenAIAgent
from .anthropic_agent import AnthropicAgent
from .google_agent import GoogleAgent
from .groq_agent import GroqAgent
from .base_agent import BaseAgent
from .service import AgentsService
from src.shared.config.models import get_provider_for_model

router = APIRouter(prefix="/agents", tags=["agents"])


def get_agent(model_id: str, api_keys: dict[str, str] | None = None) -> BaseAgent:
    """
    Get an agent instance for a given model ID.

    Args:
        model_id: The model ID (e.g., "gpt-5.4-mini", "claude-haiku-4-5-20251001")
        api_keys: Optional dictionary of provider -> API key mappings

    Returns:
        BaseAgent instance configured for the model
    """
    provider = get_provider_for_model(model_id)
    if not provider:
        raise ValueError(f"Unknown model: {model_id}")

    api_keys = api_keys or {}

    if provider == "openai":
        api_key = api_keys.get("openai") or api_keys.get("openaiKey")
        agent = OpenAIAgent(model_id=model_id, api_key=api_key)
    elif provider == "anthropic":
        api_key = api_keys.get("anthropic") or api_keys.get("anthropicKey")
        agent = AnthropicAgent(model_id=model_id, api_key=api_key)
    elif provider == "google":
        api_key = api_keys.get("google") or api_keys.get("googleKey")
        agent = GoogleAgent(model_id=model_id, api_key=api_key)
    elif provider == "groq":
        api_key = api_keys.get("groq") or api_keys.get("groqKey")
        agent = GroqAgent(model_id=model_id, api_key=api_key)
    else:
        raise ValueError(f"Unsupported provider: {provider}")

    return agent


def get_agents_service() -> AgentsService:
    """Dependency injection for AgentsService."""
    return AgentsService()


class AgentQuery(BaseModel):
    """Request model for querying an agent."""
    agent_id: str
    query: str
    user_id: str


@router.get("/", response_model=List[dict])
async def list_agents(service: AgentsService = Depends(get_agents_service)):
    """Get a list of all available agents."""
    return service.get_all_agents()


@router.get("/{agent_id}", response_model=dict)
async def get_agent_info(
    agent_id: str,
    service: AgentsService = Depends(get_agents_service)
):
    """Get information about a specific agent."""
    info = service.get_agent_info(agent_id)
    if not info:
        raise HTTPException(status_code=404, detail=f"Agent '{agent_id}' not found")
    return info


@router.post("/{agent_id}/query", response_model=dict)
async def query_agent(
    agent_id: str,
    query: AgentQuery,
    service: AgentsService = Depends(get_agents_service)
):
    """Query a specific agent."""
    try:
        result = await service.query_agent(agent_id, query.query, query.user_id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}/health", response_model=dict)
async def check_agent_health(
    agent_id: str,
    service: AgentsService = Depends(get_agents_service)
):
    """Check if an agent is healthy and responsive."""
    is_healthy = await service.check_agent_health(agent_id)
    return {
        "agent_id": agent_id,
        "healthy": is_healthy
    }
