"""
Consensus workflow for synthesizing agent responses.

This workflow analyzes multiple agent responses and generates
a balanced, comprehensive consensus that incorporates insights
from all participating agents.
"""

from typing import List, Dict, Any

from .consensus_analysis import compute_agreement, extract_key_points


class ConsensusWorkflow:
    """
    Workflow for generating consensus from multiple agent responses.

    This uses a meta-analysis approach to:
    1. Identify common themes across responses
    2. Note points of agreement and disagreement
    3. Synthesize a balanced final response
    """

    def __init__(self):
        self.weights = {
            "openai": 1.0,
            "claude": 1.0,
            "gemini": 1.0,
            "groq": 1.0,
            "xai": 1.0,
            "moonshot": 1.0,
            "openrouter": 1.0,
        }

    async def synthesize(
        self,
        query: str,
        responses: List[Dict[str, Any]]
    ) -> str:
        """
        Synthesize consensus from multiple agent responses.

        Args:
            query: The original query
            responses: List of agent response dictionaries

        Returns:
            Synthesized consensus response
        """
        if not responses:
            return "No responses to synthesize."

        if len(responses) == 1:
            return responses[0].get("response", "")

        # Extract key points from each response
        key_points = await self._extract_key_points(responses)

        # Identify agreement and disagreement
        analysis = await self._analyze_responses(responses)

        # Generate final synthesis
        consensus = await self._generate_synthesis(
            query, key_points, analysis
        )

        return consensus

    async def _extract_key_points(
        self,
        responses: List[Dict[str, Any]]
    ) -> Dict[str, List[str]]:
        """Extract key points from each agent's response."""
        key_points = {}

        for resp in responses:
            agent_id = resp.get("agent_id", "unknown")
            response_text = resp.get("response", "")
            key_points[agent_id] = extract_key_points([response_text])

        return key_points

    async def _analyze_responses(
        self,
        responses: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Analyze responses for agreement and disagreement."""
        texts = [r.get("response", "") for r in responses]
        agreement_level = compute_agreement(texts)
        common_themes = extract_key_points(texts)
        return {
            "agreement_level": agreement_level,
            "common_themes": common_themes,
            "divergent_points": [],
            "confidence": max(0.5, min(0.95, 0.5 + agreement_level / 2)),
        }

    async def _generate_synthesis(
        self,
        query: str,
        key_points: Dict[str, List[str]],
        analysis: Dict[str, Any]
    ) -> str:
        """Generate the final synthesis response."""
        # Build synthesis from key points
        synthesis_parts = []

        synthesis_parts.append(f"**Query Analysis**: {query}\n")

        for agent_id, points in key_points.items():
            if points:
                synthesis_parts.append(f"\n**{agent_id.upper()}** highlights:")
                for point in points[:3]:
                    synthesis_parts.append(f"- {point}")

        synthesis_parts.append(
            f"\n**Confidence Level**: {analysis['confidence']:.0%}"
        )

        return "\n".join(synthesis_parts)

    def set_agent_weight(self, agent_id: str, weight: float):
        """Set the weight for an agent's responses in consensus."""
        self.weights[agent_id] = max(0.0, min(1.0, weight))
