from pydantic import BaseModel, Field
from typing import List, Optional


class CouncilQuery(BaseModel):
    """Schema for council query request."""
    query: str = Field(..., description="The question or prompt for the council")
    agent_ids: Optional[List[str]] = Field(
        None,
        description="Specific agents to query. If None, all agents are used."
    )
    session_id: Optional[str] = Field(
        None,
        description="Session ID for tracking conversation history"
    )
    user_id: str = Field(..., description="User ID for authentication")
    tenant_id: str = Field(..., description="Tenant ID for multi-tenancy")


class AgentResponse(BaseModel):
    """Schema for individual agent response."""
    agent_id: str = Field(..., description="Identifier of the responding agent")
    response: str = Field(..., description="The agent's response text")
    tokens_used: int = Field(0, description="Number of tokens consumed")
    latency_ms: int = Field(0, description="Response latency in milliseconds")
    confidence: Optional[float] = Field(
        None,
        description="Agent's confidence score (0-1)"
    )


class CouncilResponse(BaseModel):
    """Schema for council response."""
    query: str = Field(..., description="The original query")
    agent_responses: List[AgentResponse] = Field(
        ...,
        description="Individual responses from each agent"
    )
    consensus: str = Field(..., description="Synthesized consensus response")
    session_id: Optional[str] = Field(None, description="Session ID")
    total_tokens: Optional[int] = Field(
        None,
        description="Total tokens used across all agents"
    )
    total_cost: Optional[float] = Field(
        None,
        description="Total cost in USD"
    )
