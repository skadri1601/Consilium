"""Unit tests for debate workflow."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from src.workflows.debate_workflow import DebateWorkflow, DebateState


class TestDebateWorkflow:
    """Test cases for DebateWorkflow."""

    @pytest.fixture
    def workflow(self):
        """Create workflow instance."""
        return DebateWorkflow(
            models=["gpt-4o-mini", "claude-3-5-haiku-latest", "gemini-2.0-flash"],
            api_keys={
                "openaiKey": "sk-test",
                "anthropicKey": "sk-ant-test",
                "googleKey": "google-test",
            },
        )

    @pytest.fixture
    def mock_state(self):
        """Create mock debate state."""
        return {
            "topic": "Test topic",
            "selected_models": ["gpt-4o-mini", "claude-3-5-haiku-latest"],
            "api_keys": {
                "openaiKey": "sk-test",
                "anthropicKey": "sk-ant-test",
            },
            "round_number": 1,
            "agent_responses": {},
            "critiques": {},
            "golden_prompt": None,
            "total_cost": 0.0,
        }

    @pytest.mark.asyncio
    @patch("src.workflows.debate_workflow.get_agent")
    async def test_query_agent(self, mock_get_agent, workflow, mock_state):
        """Test querying a single agent."""
        mock_agent = AsyncMock()
        mock_agent.generate_response = AsyncMock(return_value=("Response", 100))
        mock_get_agent.return_value = mock_agent

        response, tokens, cost = await workflow._query_agent(
            "gpt-4o-mini",
            "test query",
            mock_state["api_keys"]
        )

        assert response == "Response"
        assert tokens == 100
        assert cost >= 0
        mock_get_agent.assert_called_once()

    @pytest.mark.asyncio
    async def test_run_workflow(self, workflow):
        """Test running the full workflow."""
        api_keys = {
            "openaiKey": "sk-test",
            "anthropicKey": "sk-ant-test",
        }

        with patch.object(workflow, "_query_agent") as mock_query:
            mock_query.return_value = ("Test response", 100, 0.001)

            result = await workflow.run("Test topic", api_keys)

            assert "golden_prompt" in result
            assert result["topic"] == "Test topic"
            assert result["total_cost"] >= 0

