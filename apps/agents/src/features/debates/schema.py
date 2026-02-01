"""Pydantic schemas for debates feature."""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional


class ApiKeys(BaseModel):
    """API keys for LLM providers."""
    openaiKey: Optional[str] = Field(None, alias="openai_key")
    anthropicKey: Optional[str] = Field(None, alias="anthropic_key")
    googleKey: Optional[str] = Field(None, alias="google_key")
    groqKey: Optional[str] = Field(None, alias="groq_key")
    xaiKey: Optional[str] = Field(None, alias="xai_key")

    class Config:
        populate_by_name = True


class DebateStartRequest(BaseModel):
    """Request schema for starting a debate."""
    debate_id: Optional[str] = Field(None, description="Optional ID from API; if not set, one is generated")
    topic: str = Field(..., description="The debate topic or question")
    models: List[str] = Field(
        ...,
        description="List of model names to participate in the debate"
    )
    api_keys: ApiKeys = Field(..., description="API keys for LLM providers")


class DebateStartResponse(BaseModel):
    """Response schema for debate start."""
    debate_id: str = Field(..., description="Unique identifier for the debate")
    status: str = Field(default="processing", description="Current status of the debate")
