"""Unit tests for base agent class."""

from typing import Optional

import pytest

from src.features.agents.base_agent import BaseAgent


class StubAgent(BaseAgent):
    """Concrete stub for BaseAgent tests."""

    def __init__(self):
        super().__init__(
            name="Test Agent",
            provider="Test",
            model="test-model",
            api_key_env_var="TEST_STUB_AGENT_API_KEY",
        )

    async def generate_response(self, query: str, system_prompt: Optional[str] = None):
        """Mock implementation."""
        return "Test response", 100

    def stream_response(self, query: str, system_prompt: Optional[str] = None):
        """Mock implementation."""

        async def _gen():
            yield "Test"
            yield " response"

        return _gen()

    async def health_check(self) -> bool:
        """Mock implementation."""
        return True


class TestBaseAgent:
    """Test cases for BaseAgent."""

    @pytest.fixture(autouse=True)
    def _stub_api_key(self, monkeypatch):
        monkeypatch.setenv("TEST_STUB_AGENT_API_KEY", "test-key")

    def test_init(self):
        """Test agent initialization."""
        agent = StubAgent()
        assert agent.name == "Test Agent"
        assert agent.provider == "Test"
        assert agent.model == "test-model"

    def test_get_system_prompt(self):
        """Test system prompt generation."""
        agent = StubAgent()
        prompt = agent.get_system_prompt()
        assert isinstance(prompt, str)
        assert len(prompt) > 0

    @pytest.mark.asyncio
    async def test_generate_response(self):
        """Test response generation."""
        agent = StubAgent()
        response, tokens = await agent.generate_response("test query")
        assert response == "Test response"
        assert tokens == 100

    @pytest.mark.asyncio
    async def test_stream_response(self):
        """Test streaming response."""
        agent = StubAgent()
        chunks = []
        async for chunk in agent.stream_response("test query"):
            chunks.append(chunk)
        assert len(chunks) == 2
        assert "".join(chunks) == "Test response"
