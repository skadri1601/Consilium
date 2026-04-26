import asyncio
import json
from typing import AsyncGenerator, List
from .schema import CouncilQuery, CouncilResponse, AgentResponse
from .council_agent import CouncilAgent
from ..agents.openai_agent import OpenAIAgent
from ..agents.anthropic_agent import AnthropicAgent
from ..agents.google_agent import GoogleAgent


class CouncilService:
    """Service for orchestrating multi-agent council queries."""

    def __init__(self):
        self.agents = {
            "openai": OpenAIAgent(),
            "claude": AnthropicAgent(),
            "gemini": GoogleAgent(),
        }
        self.council_agent = CouncilAgent()

    def get_available_agents(self) -> List[str]:
        """Return list of available agent identifiers."""
        return list(self.agents.keys())

    async def process_query(self, query: CouncilQuery) -> CouncilResponse:
        """Process a query through multiple agents and synthesize consensus."""
        agent_ids = query.agent_ids or list(self.agents.keys())

        # Query all selected agents in parallel
        tasks = []
        for agent_id in agent_ids:
            if agent_id in self.agents:
                tasks.append(self._query_agent(agent_id, query.query))

        responses = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions and build response list
        agent_responses = []
        for i, response in enumerate(responses):
            if isinstance(response, Exception):
                agent_responses.append(AgentResponse(
                    agent_id=agent_ids[i],
                    response=f"Error: {str(response)}",
                    tokens_used=0,
                    latency_ms=0
                ))
            else:
                agent_responses.append(response)

        # Generate consensus using council agent
        consensus = await self.council_agent.synthesize_consensus(
            query.query,
            agent_responses,
            api_keys=query.api_keys,
        )

        return CouncilResponse(
            query=query.query,
            agent_responses=agent_responses,
            consensus=consensus,
            session_id=query.session_id
        )

    async def process_query_stream(
        self, query: CouncilQuery
    ) -> AsyncGenerator[str, None]:
        """Process a query with streaming responses."""
        agent_ids = query.agent_ids or list(self.agents.keys())

        for agent_id in agent_ids:
            if agent_id in self.agents:
                yield f"event: agent_start\ndata: {json.dumps({'agent_id': agent_id})}\n\n"

                async for chunk in self.agents[agent_id].stream_response(query.query):
                    yield f"event: agent_chunk\ndata: {json.dumps({'agent_id': agent_id, 'chunk': chunk})}\n\n"

                yield f"event: agent_complete\ndata: {json.dumps({'agent_id': agent_id})}\n\n"

        yield f"event: done\ndata: {json.dumps({'status': 'complete'})}\n\n"

    async def _query_agent(self, agent_id: str, query: str) -> AgentResponse:
        """Query a single agent and return its response."""
        import time
        start_time = time.time()

        agent = self.agents[agent_id]
        response, tokens = await agent.generate_response(query)

        latency_ms = int((time.time() - start_time) * 1000)

        return AgentResponse(
            agent_id=agent_id,
            response=response,
            tokens_used=tokens,
            latency_ms=latency_ms
        )
