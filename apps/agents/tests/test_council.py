"""Tests for the CouncilAgent."""

import pytest
from unittest.mock import AsyncMock, patch

from src.agents.council import CouncilAgent


@pytest.fixture
def council_agent():
    """Create a council agent for testing."""
    with patch("src.agents.council.settings") as mock_settings:
        mock_settings.openai_api_key = "test-key"
        mock_settings.anthropic_api_key = ""
        mock_settings.google_api_key = ""
        yield CouncilAgent()


class TestCouncilAgent:
    """Test cases for CouncilAgent."""

    def test_initialization(self, council_agent):
        """Test council agent initialization."""
        assert council_agent is not None
        assert isinstance(council_agent.agents, dict)

    def test_get_available_agents(self, council_agent):
        """Test getting available agents."""
        agents = council_agent.get_available_agents()
        assert isinstance(agents, list)

    @pytest.mark.asyncio
    async def test_query_no_agents(self, council_agent):
        """Test query with no available agents."""
        result = await council_agent.query(
            query="Test query",
            agent_ids=["nonexistent-agent"],
            mode="visible",
        )

        assert "error" in result
        assert result["responses"] == []

    @pytest.mark.asyncio
    async def test_query_structure(self, council_agent):
        """Test query response structure."""
        # Mock the agent invoke method
        with patch.object(
            council_agent.agents.get("gpt-4o-mini", AsyncMock()),
            "invoke",
            new_callable=AsyncMock,
        ) as mock_invoke:
            mock_invoke.return_value = {
                "agent_id": "gpt-4o-mini",
                "content": "Test response",
                "success": True,
            }

            # This will work if gpt-4o-mini is in agents
            if "gpt-4o-mini" in council_agent.agents:
                result = await council_agent.query(
                    query="Test query",
                    agent_ids=["gpt-4o-mini"],
                    mode="visible",
                )

                assert "session_id" in result
                assert "query" in result
                assert "responses" in result
