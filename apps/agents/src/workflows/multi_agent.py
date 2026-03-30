"""
Multi-agent workflow using LangGraph.

This workflow orchestrates multiple AI agents to collaborate on queries,
enabling parallel processing and response aggregation.
"""

import asyncio
import uuid
from typing import TypedDict, Annotated, Sequence
from operator import add
from collections import Counter
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver


class AgentState(TypedDict):
    """State passed between nodes in the workflow."""
    query: str
    agent_responses: Annotated[Sequence[dict], add]
    consensus: str
    metadata: dict


class MultiAgentWorkflow:
    """
    LangGraph workflow for multi-agent collaboration.

    This workflow:
    1. Receives a query
    2. Distributes it to multiple agents in parallel
    3. Collects and aggregates responses
    4. Generates a consensus summary
    """

    def __init__(self):
        self.graph = None
        self._setup_graph()

    def _setup_graph(self):
        """Set up the LangGraph state graph."""
        workflow = StateGraph(AgentState)

        # Add nodes
        workflow.add_node("distribute", self.distribute_query)
        workflow.add_node("aggregate", self.aggregate_responses)
        workflow.add_node("synthesize", self.generate_consensus)

        # Define edges
        workflow.set_entry_point("distribute")
        workflow.add_edge("distribute", "aggregate")
        workflow.add_edge("aggregate", "synthesize")
        workflow.add_edge("synthesize", END)

        # Compile with memory for state persistence
        memory = MemorySaver()
        self.graph = workflow.compile(checkpointer=memory)

    async def distribute_query(self, state: AgentState) -> AgentState:
        """
        Distribute query to all agents in parallel.

        This node imports available agents and queries them concurrently,
        collecting responses and handling errors gracefully.
        """
        from ..features.agents.openai_agent import OpenAIAgent
        from ..features.agents.anthropic_agent import AnthropicAgent
        from ..features.agents.google_agent import GoogleAgent

        # Initialize agents
        agents = {
            "gpt-4o-mini": OpenAIAgent(),
            "claude-3-5-haiku": AnthropicAgent(),
            "gemini-2.0-flash": GoogleAgent()
        }

        # Query agents in parallel
        tasks = [
            agent.generate_response(state["query"])
            for agent in agents.values()
        ]

        responses = await asyncio.gather(*tasks, return_exceptions=True)

        # Format responses
        agent_responses = []
        for (agent_id, agent), response in zip(agents.items(), responses):
            if isinstance(response, Exception):
                agent_responses.append({
                    "agent_id": agent_id,
                    "content": f"Error: {str(response)}",
                    "tokens": 0,
                    "success": False
                })
            else:
                content, tokens = response
                agent_responses.append({
                    "agent_id": agent_id,
                    "content": content,
                    "tokens": tokens,
                    "success": True
                })

        return {"agent_responses": agent_responses}

    async def aggregate_responses(self, state: AgentState) -> AgentState:
        """
        Aggregate and analyze responses from all agents.

        This node calculates metrics and extracts common themes
        to inform consensus generation.
        """
        responses = state["agent_responses"]

        # Calculate response metrics
        successful_responses = [r for r in responses if r.get("success", False)]

        if not successful_responses:
            metadata = state.get("metadata", {})
            metadata.update({
                "avg_response_length": 0,
                "common_themes": [],
                "total_tokens": 0,
                "success_rate": 0.0
            })
            return {"metadata": metadata}

        # Calculate average response length
        response_lengths = [len(r["content"]) for r in successful_responses]
        avg_length = sum(response_lengths) / len(response_lengths)

        # Extract common themes (simple keyword extraction)
        all_words = []
        for r in successful_responses:
            words = r["content"].lower().split()
            # Filter for meaningful words (length > 4)
            all_words.extend([w for w in words if len(w) > 4])

        # Get top 10 most common themes
        common_themes = [word for word, count in Counter(all_words).most_common(10)]

        # Calculate total tokens
        total_tokens = sum(r.get("tokens", 0) for r in responses)

        # Calculate success rate
        success_rate = len(successful_responses) / len(responses) if responses else 0

        # Update metadata
        metadata = state.get("metadata", {})
        metadata.update({
            "avg_response_length": avg_length,
            "common_themes": common_themes,
            "total_tokens": total_tokens,
            "success_rate": success_rate,
            "agent_count": len(responses)
        })

        return {"metadata": metadata}

    async def generate_consensus(self, state: AgentState) -> AgentState:
        """
        Generate consensus from agent responses.

        This node uses the ConsensusWorkflow to synthesize
        a final response from all agent contributions.
        """
        from ..workflows.consensus import ConsensusWorkflow

        consensus_workflow = ConsensusWorkflow()

        # Transform responses to the format expected by ConsensusWorkflow
        formatted_responses = [
            {
                "agent_id": r["agent_id"],
                "response": r["content"]
            }
            for r in state["agent_responses"]
            if r.get("success", False)
        ]

        consensus = await consensus_workflow.synthesize(
            state["query"],
            formatted_responses
        )

        return {"consensus": consensus}

    async def run(self, query: str, metadata: dict = None) -> dict:
        """
        Execute the multi-agent workflow.

        Args:
            query: The query to process
            metadata: Optional metadata to include in state

        Returns:
            Final state including consensus and all agent responses
        """
        initial_state: AgentState = {
            "query": query,
            "agent_responses": [],
            "consensus": "",
            "metadata": metadata or {}
        }

        if self.graph:
            config = {"configurable": {"thread_id": str(uuid.uuid4())}}
            result = await self.graph.ainvoke(initial_state, config=config)
            return result

        # Fallback without LangGraph (shouldn't happen after initialization)
        return initial_state
