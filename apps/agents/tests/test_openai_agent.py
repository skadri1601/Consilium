"""Unit tests for OpenAI agent."""

from unittest.mock import AsyncMock, patch

import pytest

from src.features.agents.base_agent import LLMProviderError
from src.features.agents.openai_agent import OpenAIAgent


class TestOpenAIAgent:
    """Test cases for OpenAIAgent."""

    @pytest.fixture
    def agent(self):
        """Create agent instance."""
        with patch.dict("os.environ", {"OPENAI_API_KEY": "sk-test-key"}):
            return OpenAIAgent(model_id="gpt-5.4-mini", api_key="sk-test-key")

    @pytest.mark.asyncio
    @patch("openai.AsyncOpenAI")
    async def test_generate_response_success(self, mock_openai_class, agent):
        """Test successful response generation."""
        mock_client = AsyncMock()
        mock_openai_class.return_value = mock_client

        mock_response = AsyncMock()
        mock_response.choices = [AsyncMock()]
        mock_response.choices[0].message.content = "Test response"
        mock_response.usage.total_tokens = 150
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)

        response, tokens = await agent.generate_response("test query")

        assert response == "Test response"
        assert tokens == 150
        mock_client.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    @patch("openai.AsyncOpenAI")
    async def test_generate_response_error(self, mock_openai_class, agent):
        """Test error handling."""
        mock_client = AsyncMock()
        mock_openai_class.return_value = mock_client
        mock_client.chat.completions.create = AsyncMock(
            side_effect=Exception("API Error")
        )

        with pytest.raises(LLMProviderError) as exc_info:
            await agent.generate_response("test query")

        assert exc_info.value.original_error.args[0] == "API Error"

    @pytest.mark.asyncio
    @patch("openai.AsyncOpenAI")
    async def test_stream_response(self, mock_openai_class, agent):
        """Test streaming response."""
        mock_client = AsyncMock()
        mock_openai_class.return_value = mock_client

        mock_chunk1 = AsyncMock()
        mock_chunk1.choices = [AsyncMock()]
        mock_chunk1.choices[0].delta.content = "Hello"

        mock_chunk2 = AsyncMock()
        mock_chunk2.choices = [AsyncMock()]
        mock_chunk2.choices[0].delta.content = " World"

        async def mock_stream():
            yield mock_chunk1
            yield mock_chunk2

        mock_client.chat.completions.create = AsyncMock(return_value=mock_stream())

        chunks = []
        async for chunk in agent.stream_response("test query"):
            chunks.append(chunk)

        assert len(chunks) == 2
        assert "".join(chunks) == "Hello World"

    @pytest.mark.asyncio
    @patch("openai.AsyncOpenAI")
    async def test_health_check_success(self, mock_openai_class, agent):
        """Test successful health check."""
        mock_client = AsyncMock()
        mock_openai_class.return_value = mock_client
        mock_client.models.list = AsyncMock()

        result = await agent.health_check()

        assert result is True

    @pytest.mark.asyncio
    async def test_health_check_no_key(self):
        """Test health check without API key."""
        agent = OpenAIAgent(model_id="gpt-5.4-mini", api_key=None)
        result = await agent.health_check()
        assert result is False

