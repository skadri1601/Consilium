"""Unit tests for base agent class."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from src.features.agents.base_agent import BaseAgent


class TestAgent(BaseAgent):
    """Test implementation of BaseAgent."""

    def __init__(self):
        super().__init__(
            name="Test Agent",
            provider="Test",
            model="test-model",
            api_key_env_var="TEST_API_KEY",
        )

    async def generate_response(self, query: str):
        """Mock implementation."""
        return "Test response", 100

    async def stream_response(self, query: str):
        """Mock implementation."""
        yield "Test"
        yield " response"

    async def health_check(self) -> bool:
        """Mock implementation."""
        return True


class TestBaseAgent:
    """Test cases for BaseAgent."""

    def test_init(self):
        """Test agent initialization."""
        agent = TestAgent()
        assert agent.name == "Test Agent"
        assert agent.provider == "Test"
        assert agent.model == "test-model"

    def test_get_system_prompt(self):
        """Test system prompt generation."""
        agent = TestAgent()
        prompt = agent.get_system_prompt()
        assert isinstance(prompt, str)
        assert len(prompt) > 0

    @pytest.mark.asyncio
    async def test_generate_response(self):
        """Test response generation."""
        agent = TestAgent()
        response, tokens = await agent.generate_response("test query")
        assert response == "Test response"
        assert tokens == 100

    @pytest.mark.asyncio
    async def test_stream_response(self):
        """Test streaming response."""
        agent = TestAgent()
        chunks = []
        async for chunk in agent.stream_response("test query"):
            chunks.append(chunk)
        assert len(chunks) == 2
        assert "".join(chunks) == "Test response"

