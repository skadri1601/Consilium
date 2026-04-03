"""Unit tests for multi-agent LangGraph workflow."""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from src.workflows.multi_agent import MultiAgentWorkflow, AgentState


class TestMultiAgentWorkflow:
    """Test cases for MultiAgentWorkflow."""

    def test_init(self):
        """Test workflow initialization."""
        workflow = MultiAgentWorkflow()
        assert workflow.graph is not None

    @pytest.mark.asyncio
    async def test_distribute_query_success(self):
        """Test successful query distribution to all agents."""
        workflow = MultiAgentWorkflow()

        initial_state: AgentState = {
            "query": "What is 2+2?",
            "agent_responses": [],
            "consensus": "",
            "metadata": {}
        }

        # Mock agent responses
        with patch('src.features.agents.openai_agent.OpenAIAgent') as MockOpenAI, \
             patch('src.features.agents.anthropic_agent.AnthropicAgent') as MockAnthropic, \
             patch('src.features.agents.google_agent.GoogleAgent') as MockGoogle:

            # Setup mocks
            mock_openai = MockOpenAI.return_value
            mock_openai.generate_response = AsyncMock(return_value=("GPT response: 4", 100))

            mock_anthropic = MockAnthropic.return_value
            mock_anthropic.generate_response = AsyncMock(return_value=("Claude response: 4", 120))

            mock_google = MockGoogle.return_value
            mock_google.generate_response = AsyncMock(return_value=("Gemini response: 4", 110))

            # Execute node
            result = await workflow.distribute_query(initial_state)

            # Verify state
            assert "agent_responses" in result
            assert len(result["agent_responses"]) == 3

            # Verify all agents were called
            assert all(r["success"] for r in result["agent_responses"])

            # Check agent IDs
            agent_ids = {r["agent_id"] for r in result["agent_responses"]}
            assert agent_ids == {"gpt-4o-mini", "claude-3-5-haiku", "gemini-2.0-flash"}

    @pytest.mark.asyncio
    async def test_distribute_query_with_errors(self):
        """Test query distribution when some agents fail."""
        workflow = MultiAgentWorkflow()

        initial_state: AgentState = {
            "query": "Test query",
            "agent_responses": [],
            "consensus": "",
            "metadata": {}
        }

        with patch('src.features.agents.openai_agent.OpenAIAgent') as MockOpenAI, \
             patch('src.features.agents.anthropic_agent.AnthropicAgent') as MockAnthropic, \
             patch('src.features.agents.google_agent.GoogleAgent') as MockGoogle:

            # Mock success for one agent, error for others
            mock_openai = MockOpenAI.return_value
            mock_openai.generate_response = AsyncMock(return_value=("Success", 100))

            mock_anthropic = MockAnthropic.return_value
            mock_anthropic.generate_response = AsyncMock(
                side_effect=Exception("API Error")
            )

            mock_google = MockGoogle.return_value
            mock_google.generate_response = AsyncMock(
                side_effect=Exception("Rate limit")
            )

            result = await workflow.distribute_query(initial_state)

            # Should have all 3 responses (some with errors)
            assert len(result["agent_responses"]) == 3

            # Check success/failure split
            successful = [r for r in result["agent_responses"] if r["success"]]
            failed = [r for r in result["agent_responses"] if not r["success"]]

            assert len(successful) == 1
            assert len(failed) == 2

            # Verify error messages are included
            assert any("Error" in r["content"] for r in failed)

    @pytest.mark.asyncio
    async def test_aggregate_responses(self):
        """Test response aggregation and metrics calculation."""
        workflow = MultiAgentWorkflow()

        state_with_responses: AgentState = {
            "query": "Test query",
            "agent_responses": [
                {
                    "agent_id": "gpt-4o-mini",
                    "content": "This is a detailed response about testing",
                    "tokens": 100,
                    "success": True
                },
                {
                    "agent_id": "claude-3-5-haiku",
                    "content": "Another detailed response covering testing concepts",
                    "tokens": 120,
                    "success": True
                },
                {
                    "agent_id": "gemini-2.0-flash",
                    "content": "Error: API failed",
                    "tokens": 0,
                    "success": False
                }
            ],
            "consensus": "",
            "metadata": {}
        }

        result = await workflow.aggregate_responses(state_with_responses)

        # Check metadata was populated
        assert "metadata" in result
        metadata = result["metadata"]

        # Verify metrics
        assert "avg_response_length" in metadata
        assert "common_themes" in metadata
        assert "total_tokens" in metadata
        assert "success_rate" in metadata
        assert "agent_count" in metadata

        # Check calculated values
        assert metadata["total_tokens"] == 220
        assert metadata["success_rate"] == 2/3  # 2 successful out of 3
        assert metadata["agent_count"] == 3
        assert isinstance(metadata["common_themes"], list)
        assert metadata["avg_response_length"] > 0

    @pytest.mark.asyncio
    async def test_aggregate_responses_all_failures(self):
        """Test aggregation when all agents fail."""
        workflow = MultiAgentWorkflow()

        state_with_failures: AgentState = {
            "query": "Test query",
            "agent_responses": [
                {"agent_id": "gpt-4o-mini", "content": "Error", "tokens": 0, "success": False},
                {"agent_id": "claude-3-5-haiku", "content": "Error", "tokens": 0, "success": False},
            ],
            "consensus": "",
            "metadata": {}
        }

        result = await workflow.aggregate_responses(state_with_failures)

        metadata = result["metadata"]
        assert metadata["success_rate"] == 0.0
        assert metadata["total_tokens"] == 0
        assert metadata["avg_response_length"] == 0

    @pytest.mark.asyncio
    async def test_generate_consensus(self):
        """Test consensus generation from agent responses."""
        workflow = MultiAgentWorkflow()

        state_with_responses: AgentState = {
            "query": "What is AI?",
            "agent_responses": [
                {
                    "agent_id": "gpt-4o-mini",
                    "content": "AI is artificial intelligence.",
                    "tokens": 50,
                    "success": True
                },
                {
                    "agent_id": "claude-3-5-haiku",
                    "content": "AI refers to machine intelligence.",
                    "tokens": 60,
                    "success": True
                }
            ],
            "consensus": "",
            "metadata": {}
        }

        with patch('src.workflows.consensus.ConsensusWorkflow') as MockConsensus:
            mock_consensus = MockConsensus.return_value
            mock_consensus.synthesize = AsyncMock(
                return_value="Consensus: AI is artificial intelligence and machine learning."
            )

            result = await workflow.generate_consensus(state_with_responses)

            # Verify consensus was generated
            assert "consensus" in result
            assert result["consensus"] == "Consensus: AI is artificial intelligence and machine learning."

            # Verify synthesize was called with correct arguments
            mock_consensus.synthesize.assert_called_once()
            call_args = mock_consensus.synthesize.call_args
            assert call_args[0][0] == "What is AI?"  # query
            assert len(call_args[0][1]) == 2  # formatted responses

    @pytest.mark.asyncio
    async def test_generate_consensus_filters_failures(self):
        """Test that consensus generation only uses successful responses."""
        workflow = MultiAgentWorkflow()

        state_mixed: AgentState = {
            "query": "Test",
            "agent_responses": [
                {"agent_id": "gpt-4o-mini", "content": "Success", "success": True},
                {"agent_id": "claude-3-5-haiku", "content": "Error", "success": False},
            ],
            "consensus": "",
            "metadata": {}
        }

        with patch('src.workflows.consensus.ConsensusWorkflow') as MockConsensus:
            mock_consensus = MockConsensus.return_value
            mock_consensus.synthesize = AsyncMock(return_value="Consensus")

            result = await workflow.generate_consensus(state_mixed)

            # Should only pass successful responses
            call_args = mock_consensus.synthesize.call_args
            formatted_responses = call_args[0][1]
            assert len(formatted_responses) == 1
            assert formatted_responses[0]["agent_id"] == "gpt-4o-mini"

    @pytest.mark.asyncio
    async def test_full_workflow_run(self):
        """Test complete workflow execution end-to-end."""
        workflow = MultiAgentWorkflow()

        with patch('src.features.agents.openai_agent.OpenAIAgent') as MockOpenAI, \
             patch('src.features.agents.anthropic_agent.AnthropicAgent') as MockAnthropic, \
             patch('src.features.agents.google_agent.GoogleAgent') as MockGoogle, \
             patch('src.workflows.consensus.ConsensusWorkflow') as MockConsensus:

            # Setup agent mocks
            for mock_agent_cls in [MockOpenAI, MockAnthropic, MockGoogle]:
                mock_agent = mock_agent_cls.return_value
                mock_agent.generate_response = AsyncMock(
                    return_value=("Test response", 100)
                )

            # Setup consensus mock
            mock_consensus = MockConsensus.return_value
            mock_consensus.synthesize = AsyncMock(
                return_value="Final consensus response"
            )

            # Execute workflow
            result = await workflow.run(
                query="What is the meaning of life?",
                metadata={"user_id": "test-user"}
            )

            # Verify complete state
            assert "query" in result
            assert "agent_responses" in result
            assert "consensus" in result
            assert "metadata" in result

            # Verify query preserved
            assert result["query"] == "What is the meaning of life?"

            # Verify all agents responded
            assert len(result["agent_responses"]) == 3

            # Verify consensus generated
            assert result["consensus"] == "Final consensus response"

            # Verify metadata preserved and enriched
            assert result["metadata"]["user_id"] == "test-user"
            assert "total_tokens" in result["metadata"]

    @pytest.mark.asyncio
    async def test_workflow_run_without_metadata(self):
        """Test workflow run with default metadata."""
        workflow = MultiAgentWorkflow()

        with patch('src.features.agents.openai_agent.OpenAIAgent') as MockOpenAI, \
             patch('src.features.agents.anthropic_agent.AnthropicAgent') as MockAnthropic, \
             patch('src.features.agents.google_agent.GoogleAgent') as MockGoogle, \
             patch('src.workflows.consensus.ConsensusWorkflow') as MockConsensus:

            # Setup mocks
            for mock_agent_cls in [MockOpenAI, MockAnthropic, MockGoogle]:
                mock_agent = mock_agent_cls.return_value
                mock_agent.generate_response = AsyncMock(return_value=("Response", 50))

            mock_consensus = MockConsensus.return_value
            mock_consensus.synthesize = AsyncMock(return_value="Consensus")

            # Run without metadata
            result = await workflow.run("Test query")

            # Should have default empty metadata dict (then populated)
            assert "metadata" in result
            assert isinstance(result["metadata"], dict)


class TestAgentState:
    """Test AgentState TypedDict."""

    def test_agent_state_structure(self):
        """Test AgentState has correct structure."""
        state: AgentState = {
            "query": "test",
            "agent_responses": [],
            "consensus": "",
            "metadata": {}
        }

        assert "query" in state
        assert "agent_responses" in state
        assert "consensus" in state
        assert "metadata" in state
