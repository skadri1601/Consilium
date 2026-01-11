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
            "gpt-4": OpenAIAgent(),
            "claude": AnthropicAgent(),
            "gemini": GoogleAgent(),
            "groq": GroqAgent(),
            "xai": XAIAgent(),
        }

        self.agent_info = {
            "gpt-4": {
                "id": "gpt-4",
                "name": "GPT-4",
                "provider": "OpenAI",
                "model": "gpt-4-turbo",
                "description": "OpenAI's most capable model for complex tasks",
                "is_available": True
            },
            "claude": {
                "id": "claude",
                "name": "Claude 3",
                "provider": "Anthropic",
                "model": "claude-3-opus",
                "description": "Anthropic's advanced AI assistant",
                "is_available": True
            },
            "gemini": {
                "id": "gemini",
                "name": "Gemini 3.0 Flash",
                "provider": "Google",
                "model": "gemini-3-flash-preview",
                "description": "Google's latest experimental multimodal AI model",
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
                "name": "Grok",
                "provider": "X.AI",
                "model": "grok-beta",
                "description": "X.AI's Grok language model",
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
