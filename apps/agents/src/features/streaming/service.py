import json
from typing import AsyncGenerator, List, Optional

from ..agents.openai_agent import OpenAIAgent
from ..agents.anthropic_agent import AnthropicAgent
from ..agents.google_agent import GoogleAgent
from ..agents.base_agent import BaseAgent
from ...core.agent_factory import AgentFactory


class StreamingService:

    def __init__(self):
        self._default_agents = {
            "gpt-4o-mini": "gpt-4o-mini",
            "claude-haiku": "claude-haiku-4-5-20251001",
            "gemini-flash": "gemini-2.0-flash",
        }

    def _get_agent(self, agent_id: str, api_keys: dict | None = None) -> BaseAgent:
        model_id = self._default_agents.get(agent_id, agent_id)
        return AgentFactory.create(model_id, api_keys or {})

    async def stream_multi_agent(
        self,
        query: str,
        agent_ids: Optional[List[str]] = None,
        user_id: str = "",
        session_id: Optional[str] = None,
        api_keys: dict | None = None,
    ) -> AsyncGenerator[str, None]:
        agent_ids = agent_ids or list(self._default_agents.keys())

        yield self._format_sse("start", {
            "agents": agent_ids,
            "session_id": session_id,
        })

        for agent_id in agent_ids:
            yield self._format_sse("agent_start", {"agent_id": agent_id})

            try:
                agent = self._get_agent(agent_id, api_keys)
                response, tokens = await agent.generate_response(query)
                yield self._format_sse("agent_complete", {
                    "agent_id": agent_id,
                    "full_response": response,
                    "tokens": tokens,
                })
            except Exception as e:
                yield self._format_sse("error", {
                    "agent_id": agent_id,
                    "message": str(e),
                })

        yield self._format_sse("complete", {"status": "done"})

    async def stream_single_agent(
        self,
        agent_id: str,
        query: str,
        user_id: str,
        api_keys: dict | None = None,
    ) -> AsyncGenerator[str, None]:
        yield self._format_sse("start", {"agent_id": agent_id})

        try:
            agent = self._get_agent(agent_id, api_keys)
            response, tokens = await agent.generate_response(query)
            yield self._format_sse("chunk", {"content": response})
            yield self._format_sse("complete", {"status": "done"})
        except Exception as e:
            yield self._format_sse("error", {"message": str(e)})

    def _format_sse(self, event: str, data: dict) -> str:
        payload = {**data, "event": event}
        return f"event: {event}\ndata: {json.dumps(payload)}\n\n"
