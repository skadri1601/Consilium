"""Tests for agents feature."""

import pytest
from unittest.mock import AsyncMock, patch


class TestAgentsRouter:
    """Tests for agents router endpoints."""

    def test_list_agents(self, client):
        """Test listing all agents."""
        response = client.get("/api/v1/agents/")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

    def test_get_agent_info(self, client):
        """Test getting specific agent info."""
        response = client.get("/api/v1/agents/openai")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "openai"

    def test_get_agent_not_found(self, client):
        """Test 404 for unknown agent."""
        response = client.get("/api/v1/agents/unknown-agent")
        assert response.status_code == 404


class TestOpenAIAgent:
    """Tests for OpenAI agent."""

    @pytest.mark.asyncio
    async def test_generate_response(self, mock_openai_response):
        """Test response generation."""
        # TODO: Mock OpenAI client and test
        pass

    @pytest.mark.asyncio
    async def test_stream_response(self):
        """Test streaming response."""
        # TODO: Mock OpenAI streaming and test
        pass


class TestAnthropicAgent:
    """Tests for Anthropic agent."""

    @pytest.mark.asyncio
    async def test_generate_response(self, mock_anthropic_response):
        """Test response generation."""
        # TODO: Mock Anthropic client and test
        pass


class TestGoogleAgent:
    """Tests for Google Gemini agent."""

    @pytest.mark.asyncio
    async def test_generate_response(self):
        """Test response generation."""
        # TODO: Mock Google client and test
        pass
