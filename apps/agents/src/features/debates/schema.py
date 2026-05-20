from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class ApiKeys(BaseModel):
    openaiKey: Optional[str] = Field(None, alias="openai_key")
    anthropicKey: Optional[str] = Field(None, alias="anthropic_key")
    googleKey: Optional[str] = Field(None, alias="google_key")
    groqKey: Optional[str] = Field(None, alias="groq_key")
    xaiKey: Optional[str] = Field(None, alias="xai_key")

    class Config:
        populate_by_name = True


class DebateStartRequest(BaseModel):
    debate_id: Optional[str] = Field(None, description="Optional ID from API; if not set, one is generated")
    topic: str = Field(..., description="The debate topic or question")
    models: List[str] = Field(
        ...,
        description="List of model names to participate in the debate",
    )
    api_keys: ApiKeys = Field(..., description="API keys for LLM providers")
    system_prompt: Optional[str] = Field(
        None,
        description="Optional custom system prompt override for Round 1",
    )
    mode: str = Field(
        default="debate",
        description="Debate mode: 'debate' for multi-round, 'single' for one-shot",
    )
    round_count: int = Field(
        default=3,
        ge=1,
        le=5,
        description="Number of debate rounds (1-5)",
    )
    sub_agents: bool = Field(
        default=False,
        description="Enable sub-agent research phase before Round 1",
    )
    debate_source: str = Field(
        default="web",
        description="Source of the debate request: 'web', 'api', 'cli'",
    )
    project_context: Optional[dict] = Field(
        None,
        description="Codebase context metadata and files from CLI",
    )
    reasoning_effort: Optional[Literal["low", "medium", "high", "xhigh", "max"]] = Field(
        None,
        alias="reasoningEffort",
        description="Reasoning depth: low|medium|high|xhigh|max. Routed to provider-specific thinking controls.",
    )

    class Config:
        populate_by_name = True


class DebateStartResponse(BaseModel):
    debate_id: str = Field(..., description="Unique identifier for the debate")
    status: str = Field(default="processing", description="Current status of the debate")
