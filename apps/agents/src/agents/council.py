"""Multi-agent council for collaborative problem-solving."""

import asyncio
from typing import Dict, List, Optional, Any
from uuid import uuid4

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI

from src.config import settings
from src.agents.base import BaseAgent


class OpenAIAgent(BaseAgent):
    """OpenAI-based agent."""

    def _create_llm(self) -> Any:
        return ChatOpenAI(
            model=self.model_id,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )


class AnthropicAgent(BaseAgent):
    """Anthropic-based agent."""

    def _create_llm(self) -> Any:
        return ChatAnthropic(
            model=self.model_id,
            api_key=settings.anthropic_api_key,
            temperature=0.7,
        )


class GoogleAgent(BaseAgent):
    """Google-based agent."""

    def _create_llm(self) -> Any:
        return ChatGoogleGenerativeAI(
            model=self.model_id,
            google_api_key=settings.google_api_key,
            temperature=0.7,
        )


# Agent registry
AGENT_REGISTRY: Dict[str, Dict] = {
    "gpt-4o-mini": {
        "class": OpenAIAgent,
        "name": "GPT-4o-mini",
        "provider": "openai",
        "model_id": "gpt-4o-mini",
    },
    "claude-3-5-haiku": {
        "class": AnthropicAgent,
        "name": "Claude 3.5 Haiku",
        "provider": "anthropic",
        "model_id": "claude-3-5-haiku-20241022",
    },
    "gemini-2.0-flash": {
        "class": GoogleAgent,
        "name": "Gemini 2.0 Flash",
        "provider": "google",
        "model_id": "gemini-2.0-flash-exp",
    },
}


class CouncilAgent:
    """Multi-agent council that orchestrates multiple AI models."""

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {}
        self._initialize_agents()

    def _initialize_agents(self):
        """Initialize available agents based on API keys."""
        for agent_id, config in AGENT_REGISTRY.items():
            # Check if API key is available
            provider = config["provider"]
            api_key_map = {
                "openai": settings.openai_api_key,
                "anthropic": settings.anthropic_api_key,
                "google": settings.google_api_key,
            }

            if api_key_map.get(provider):
                agent_class = config["class"]
                self.agents[agent_id] = agent_class(
                    agent_id=agent_id,
                    name=config["name"],
                    provider=provider,
                    model_id=config["model_id"],
                )

    async def query(
        self,
        query: str,
        agent_ids: List[str],
        mode: str = "visible",
    ) -> Dict:
        """Query multiple agents and collect responses."""
        session_id = str(uuid4())

        # Filter to available agents
        available_agents = [
            self.agents[aid] for aid in agent_ids if aid in self.agents
        ]

        if not available_agents:
            return {
                "session_id": session_id,
                "query": query,
                "responses": [],
                "error": "No available agents found",
            }

        # Query all agents in parallel
        tasks = [agent.invoke(query) for agent in available_agents]
        responses = await asyncio.gather(*tasks, return_exceptions=True)

        # Process responses
        processed_responses = []
        for response in responses:
            if isinstance(response, Exception):
                processed_responses.append({
                    "error": str(response),
                    "success": False,
                })
            else:
                processed_responses.append(response)

        # Calculate consensus if multiple successful responses
        successful_responses = [r for r in processed_responses if r.get("success")]
        consensus_score = self._calculate_consensus(successful_responses) if len(successful_responses) > 1 else None

        return {
            "session_id": session_id,
            "query": query,
            "mode": mode,
            "responses": processed_responses,
            "consensus_score": consensus_score,
            "total_agents": len(agent_ids),
            "successful_agents": len(successful_responses),
        }

    def _calculate_consensus(self, responses: List[Dict]) -> Optional[float]:
        """Calculate consensus score between responses."""
        # TODO: Implement semantic similarity using embeddings
        # For now, return a placeholder
        if len(responses) < 2:
            return None

        # Placeholder: return random score between 0.5 and 1.0
        import random
        return round(random.uniform(0.5, 1.0), 2)

    def get_available_agents(self) -> List[Dict]:
        """Get list of available agents."""
        return [
            {
                "id": agent.agent_id,
                "name": agent.name,
                "provider": agent.provider,
            }
            for agent in self.agents.values()
        ]
