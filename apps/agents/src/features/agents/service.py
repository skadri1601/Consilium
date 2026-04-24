import time
from typing import List, Optional
from .base_agent import BaseAgent
from .openai_agent import OpenAIAgent
from .anthropic_agent import AnthropicAgent
from .google_agent import GoogleAgent
from .groq_agent import GroqAgent
from .xai_agent import XAIAgent


class AgentsService:
    """Service for managing and querying AI agents."""

    def __init__(self):
        self.agents: dict[str, BaseAgent] = {
            "openai": OpenAIAgent(),
            "claude": AnthropicAgent(),
            "gemini": GoogleAgent(),
            "groq": GroqAgent(),
            "xai": XAIAgent(),
        }

        self.agent_info = {
            "openai": {
                "id": "openai",
                "name": "GPT-5.4",
                "provider": "OpenAI",
                "model": "gpt-5.4-mini",
                "description": "OpenAI's GPT-5.4 family",
                "is_available": True
            },
            "claude": {
                "id": "claude",
                "name": "Claude Haiku 4.5",
                "provider": "Anthropic",
                "model": "claude-haiku-4-5-20251001",
                "description": "Anthropic's Claude Haiku 4.5",
                "is_available": True
            },
            "gemini": {
                "id": "gemini",
                "name": "Gemini 3 Flash",
                "provider": "Google",
                "model": "gemini-3-flash-preview",
                "description": "Google's Gemini 3.x multimodal model",
                "is_available": True
            },
            "groq": {
                "id": "groq",
                "name": "Groq Llama 3.1",
                "provider": "Groq",
                "model": "llama-3.1-8b-instant",
                "description": "Groq's fast inference models",
                "is_available": True
            },
            "xai": {
                "id": "xai",
                "name": "Grok 4.20",
                "provider": "X.AI",
                "model": "grok-4.20",
                "description": "X.AI's Grok 4.20",
                "is_available": True
            },
        }

    def get_all_agents(self) -> List[dict]:
        """Get information about all available agents."""
        return list(self.agent_info.values())

    def get_agent_info(self, agent_id: str) -> Optional[dict]:
        """Get information about a specific agent."""
        return self.agent_info.get(agent_id)

    async def query_agent(
        self,
        agent_id: str,
        query: str,
        user_id: str
    ) -> dict:
        """Query a specific agent and return the response."""
        if agent_id not in self.agents:
            raise ValueError(f"Agent '{agent_id}' not found")

        agent = self.agents[agent_id]
        start_time = time.time()

        response, tokens = await agent.generate_response(query)
        latency_ms = int((time.time() - start_time) * 1000)

        return {
            "agent_id": agent_id,
            "response": response,
            "tokens_used": tokens,
            "latency_ms": latency_ms
        }

    async def check_agent_health(self, agent_id: str) -> bool:
        """Check if an agent is healthy and responsive."""
        if agent_id not in self.agents:
            return False

        try:
            agent = self.agents[agent_id]
            await agent.health_check()
            return True
        except Exception:
            return False
