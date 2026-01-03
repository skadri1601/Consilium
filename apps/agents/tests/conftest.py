"""Pytest configuration and fixtures."""

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def mock_openai_response():
    """Mock response from OpenAI API."""
    return {
        "choices": [
            {
                "message": {
                    "content": "This is a test response from GPT-4."
                }
            }
        ],
        "usage": {
            "total_tokens": 100
        }
    }


@pytest.fixture
def mock_anthropic_response():
    """Mock response from Anthropic API."""
    return {
        "content": [
            {
                "text": "This is a test response from Claude."
            }
        ],
        "usage": {
            "input_tokens": 50,
            "output_tokens": 50
        }
    }


@pytest.fixture
def sample_query():
    """Sample query for testing."""
    return {
        "query": "What is the meaning of life?",
        "agent_ids": ["gpt-4", "claude"],
        "user_id": "test-user",
        "tenant_id": "test-tenant"
    }
