"""
LangGraph debate workflow for multi-agent consensus generation.

This workflow orchestrates multiple AI agents to debate a topic through
multiple rounds, then synthesizes a Golden Prompt from their consensus.
"""

import asyncio
from typing import TypedDict, Annotated, AsyncGenerator
from langgraph.graph import StateGraph, END

from ..features.agents.router import get_agent
from ..shared.config.models import calculate_cost


class DebateState(TypedDict):
    """State passed between nodes in the debate workflow."""

    topic: str
    selected_models: list[str]
    round_number: int
    agent_responses: dict[str, list[str]]  # model_id -> list of responses per round
    critiques: dict[str, str]  # model_id -> critique of others
    synthesis_context: str
    golden_prompt: str | None
    total_cost: float
    api_keys: dict[str, str]  # provider -> api_key


class DebateWorkflow:
    """
    LangGraph workflow for multi-agent debate.

    Flow:
    1. Round 1: All agents respond in parallel
    2. Critique: Each agent critiques others' responses
    3. Round 2: Agents refine their responses based on critiques
    4. Synthesis: Generate Golden Prompt from all responses
    """

    def __init__(self, models: list[str], api_keys: dict[str, str]):
        """
        Initialize debate workflow.

        Args:
            models: List of model IDs to use (e.g., ["gpt-4o-mini", "claude-3-5-haiku-latest"])
            api_keys: Dictionary mapping provider to API key
        """
        self.models = models
        self.api_keys = api_keys
        self.graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph state graph."""
        workflow = StateGraph(DebateState)

        # Add nodes
        workflow.add_node("round1_parallel", self.round1_parallel)
        workflow.add_node("critique", self.generate_critiques)
        workflow.add_node("round2_refine", self.round2_refine)
        workflow.add_node("synthesize", self.synthesize_golden_prompt)

        # Set edges
        workflow.set_entry_point("round1_parallel")
        workflow.add_edge("round1_parallel", "critique")
        workflow.add_edge("critique", "round2_refine")
        workflow.add_edge("round2_refine", "synthesize")
        workflow.add_edge("synthesize", END)

        return workflow.compile()

    async def round1_parallel(self, state: DebateState) -> DebateState:
        """Round 1: All agents respond in parallel."""
        state["round_number"] = 1
        state["agent_responses"] = {}

        tasks = []
        for model_id in state["selected_models"]:
            task = self._query_agent(model_id, state["topic"], state["api_keys"])
            tasks.append((model_id, task))

        results = await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)

        for (model_id, _), result in zip(tasks, results):
            if isinstance(result, Exception):
                state["agent_responses"][model_id] = [f"Error: {str(result)}"]
            else:
                response, tokens, cost = result
                state["agent_responses"][model_id] = [response]
                state["total_cost"] += cost

        return state

    async def generate_critiques(self, state: DebateState) -> DebateState:
        """Generate critiques where each agent reviews others' responses."""
        state["critiques"] = {}

        # Build context of all responses
        responses_text = "\n\n".join(
            [
                f"**{model_id}**:\n{responses[0]}"
                for model_id, responses in state["agent_responses"].items()
            ]
        )

        critique_prompt = f"""You are participating in a multi-agent debate. Below are the initial responses from all agents:

{responses_text}

Please provide a critique:
1. What are the strengths of each response?
2. What are potential weaknesses or missing points?
3. What should be improved or clarified?

Be constructive and specific."""

        tasks = []
        for model_id in state["selected_models"]:
            task = self._query_agent(model_id, critique_prompt, state["api_keys"])
            tasks.append((model_id, task))

        results = await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)

        for (model_id, _), result in zip(tasks, results):
            if isinstance(result, Exception):
                state["critiques"][model_id] = f"Error generating critique: {str(result)}"
            else:
                critique, tokens, cost = result
                state["critiques"][model_id] = critique
                state["total_cost"] += cost

        return state

    async def round2_refine(self, state: DebateState) -> DebateState:
        """Round 2: Agents refine their responses based on critiques."""
        state["round_number"] = 2

        # Build critique context
        critiques_text = "\n\n".join(
            [
                f"**Critique from {model_id}**:\n{critique}"
                for model_id, critique in state["critiques"].items()
            ]
        )

        tasks = []
        for model_id in state["selected_models"]:
            original_response = state["agent_responses"][model_id][0]
            refine_prompt = f"""Based on the critiques below, refine your original response:

**Your original response:**
{original_response}

**Critiques from other agents:**
{critiques_text}

Please provide a refined response that addresses the critiques while maintaining your core insights."""

            task = self._query_agent(model_id, refine_prompt, state["api_keys"])
            tasks.append((model_id, task))

        results = await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)

        for (model_id, _), result in zip(tasks, results):
            if isinstance(result, Exception):
                state["agent_responses"][model_id].append(f"Error: {str(result)}")
            else:
                refined_response, tokens, cost = result
                state["agent_responses"][model_id].append(refined_response)
                state["total_cost"] += cost

        return state

    async def synthesize_golden_prompt(self, state: DebateState) -> DebateState:
        """Synthesize Golden Prompt from all agent responses."""
        # Use the first model for synthesis (or could use a premium model)
        synthesis_model = state["selected_models"][0]

        # Build comprehensive context
        all_responses = []
        for model_id, responses in state["agent_responses"].items():
            all_responses.append(f"**{model_id} - Round 1:**\n{responses[0]}")
            if len(responses) > 1:
                all_responses.append(f"**{model_id} - Round 2 (Refined):**\n{responses[1]}")

        synthesis_prompt = f"""You are synthesizing a "Golden Prompt" from a multi-agent debate.

**Original Topic:**
{state["topic"]}

**All Agent Responses:**
{chr(10).join(all_responses)}

**Your task:**
Create a single, optimized prompt that:
1. Incorporates the best insights from all agents
2. Resolves any conflicts or contradictions
3. Is clear, specific, and actionable
4. Is formatted for use with AI coding tools like Cursor or GitHub Copilot

Output ONLY the Golden Prompt, no additional commentary."""

        try:
            response, tokens, cost = await self._query_agent(
                synthesis_model, synthesis_prompt, state["api_keys"]
            )
            state["golden_prompt"] = response.strip()
            state["total_cost"] += cost
            state["synthesis_context"] = synthesis_prompt
        except Exception as e:
            state["golden_prompt"] = f"Error during synthesis: {str(e)}"

        return state

    async def _query_agent(
        self, model_id: str, query: str, api_keys: dict[str, str]
    ) -> tuple[str, int, float]:
        """
        Query a single agent and return response, tokens, and cost.

        Returns:
            Tuple of (response_text, tokens_used, cost)
        """
        agent = get_agent(model_id, api_keys)
        response, tokens = await agent.generate_response(query)

        # Estimate cost (we don't have exact input/output split, so estimate 50/50)
        estimated_input = tokens // 2
        estimated_output = tokens - estimated_input
        cost = calculate_cost(model_id, estimated_input, estimated_output)

        return response, tokens, cost

    async def run(
        self, topic: str, api_keys: dict[str, str] | None = None
    ) -> dict:
        """
        Execute the debate workflow.

        Args:
            topic: The debate topic/prompt
            api_keys: Optional API keys (uses from state if not provided)

        Returns:
            Final state dictionary with golden_prompt and metadata
        """
        initial_state: DebateState = {
            "topic": topic,
            "selected_models": self.models,
            "round_number": 0,
            "agent_responses": {},
            "critiques": {},
            "synthesis_context": "",
            "golden_prompt": None,
            "total_cost": 0.0,
            "api_keys": api_keys or self.api_keys,
        }

        result = await self.graph.ainvoke(initial_state)
        return result

    async def stream(
        self, topic: str, api_keys: dict[str, str] | None = None
    ) -> AsyncGenerator[dict, None]:
        """
        Stream the debate workflow execution.

        Yields:
            State updates as the workflow progresses
        """
        initial_state: DebateState = {
            "topic": topic,
            "selected_models": self.models,
            "round_number": 0,
            "agent_responses": {},
            "critiques": {},
            "synthesis_context": "",
            "golden_prompt": None,
            "total_cost": 0.0,
            "api_keys": api_keys or self.api_keys,
        }

        async for state in self.graph.astream(initial_state):
            yield state

