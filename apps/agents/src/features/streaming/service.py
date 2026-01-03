import json
from typing import AsyncGenerator, List, Optional
from ..agents import OpenAIAgent, AnthropicAgent, GoogleAgent


class StreamingService:
    """Service for handling streaming responses from AI agents."""

    def __init__(self):
        self.agents = {
            "gpt-4": OpenAIAgent(),
            "claude": AnthropicAgent(),
            "gemini": GoogleAgent(),
        }

    async def stream_multi_agent(
        self,
        query: str,
        agent_ids: Optional[List[str]] = None,
        user_id: str = "",
        session_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream responses from multiple agents sequentially."""
        agent_ids = agent_ids or list(self.agents.keys())

        # Send initial event
        yield self._format_sse("start", {
            "agents": agent_ids,
            "session_id": session_id
        })

        for agent_id in agent_ids:
            if agent_id not in self.agents:
                yield self._format_sse("error", {
                    "agent_id": agent_id,
                    "message": f"Agent {agent_id} not found"
                })
                continue

            # Signal agent start
            yield self._format_sse("agent_start", {"agent_id": agent_id})

            agent = self.agents[agent_id]
            full_response = ""

            try:
                async for chunk in agent.stream_response(query):
                    full_response += chunk
                    yield self._format_sse("chunk", {
                        "agent_id": agent_id,
                        "content": chunk
                    })

                # Signal agent complete
                yield self._format_sse("agent_complete", {
                    "agent_id": agent_id,
                    "full_response": full_response
                })

            except Exception as e:
                yield self._format_sse("error", {
                    "agent_id": agent_id,
                    "message": str(e)
                })

        # Send completion event
        yield self._format_sse("complete", {"status": "done"})

    async def stream_single_agent(
        self,
        agent_id: str,
        query: str,
        user_id: str
    ) -> AsyncGenerator[str, None]:
        """Stream response from a single agent."""
        if agent_id not in self.agents:
            yield self._format_sse("error", {
                "message": f"Agent {agent_id} not found"
            })
            return

        yield self._format_sse("start", {"agent_id": agent_id})

        agent = self.agents[agent_id]

        try:
            async for chunk in agent.stream_response(query):
                yield self._format_sse("chunk", {"content": chunk})

            yield self._format_sse("complete", {"status": "done"})

        except Exception as e:
            yield self._format_sse("error", {"message": str(e)})

    def _format_sse(self, event: str, data: dict) -> str:
        """Format data as Server-Sent Events."""
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"
