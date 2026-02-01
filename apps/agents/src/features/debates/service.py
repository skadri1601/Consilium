"""Service layer for debates feature."""

import json
import uuid
import asyncio
from typing import Optional, AsyncGenerator
from .schema import DebateStartRequest, DebateStartResponse
from ...shared.database.redis import get_redis

# Shared in-memory storage for local development when Redis is unavailable
# This persists across service instances
_LOCAL_STORAGE: dict = {}


class DebatesService:
    """Service for managing debate workflows."""

    def __init__(self):
        self.redis = get_redis()

    async def start_debate(
        self,
        request: DebateStartRequest
    ) -> DebateStartResponse:
        """
        Start a new debate workflow.

        This creates a debate session, stores it in Redis,
        and returns the debate ID for streaming.

        Args:
            request: The debate start request with topic, models, and API keys

        Returns:
            DebateStartResponse with debate_id and status
        """
        # Use API-provided ID if present (so stream URL matches); otherwise generate
        debate_id = request.debate_id or str(uuid.uuid4())

        # Prepare debate data for storage
        debate_data = {
            "debate_id": debate_id,
            "topic": request.topic,
            "models": request.models,
            "api_keys": request.api_keys.model_dump(),
            "status": "pending"
        }

        # Store debate in Redis with 1 hour expiration
        # If Redis is not available, use local storage
        redis_success = await self.redis.set(
            f"debate:{debate_id}",
            json.dumps(debate_data),
            ex=3600  # 1 hour TTL
        )

        # Fallback to local storage if Redis fails
        if not redis_success:
            _LOCAL_STORAGE[f"debate:{debate_id}"] = debate_data

        return DebateStartResponse(
            debate_id=debate_id,
            status="processing"
        )

    async def get_debate(self, debate_id: str) -> Optional[dict]:
        """
        Retrieve debate data from Redis or local storage.

        Args:
            debate_id: The unique debate identifier

        Returns:
            Debate data dictionary or None if not found
        """
        # Try Redis first
        data = await self.redis.get(f"debate:{debate_id}")
        if data:
            return json.loads(data)

        # Fallback to local storage
        key = f"debate:{debate_id}"
        if key in _LOCAL_STORAGE:
            return _LOCAL_STORAGE[key]

        return None

    async def stream_debate(
        self,
        debate_id: str,
        debate_data: dict
    ) -> AsyncGenerator[str, None]:
        """
        Stream debate progress using Server-Sent Events.

        This is a simple implementation that simulates the debate workflow.
        In production, this would integrate with the actual multi-agent workflow.

        Args:
            debate_id: The unique debate identifier
            debate_data: The debate configuration

        Yields:
            SSE formatted event strings
        """
        try:
            # Send initial event
            yield f"event: debate_start\ndata: {json.dumps({'debate_id': debate_id, 'topic': debate_data['topic']})}\n\n"
            await asyncio.sleep(0.1)

            # Simulate agent responses
            models = debate_data.get('models', [])
            for i, model in enumerate(models):
                # Agent start event
                yield f"event: agent_start\ndata: {json.dumps({'agent': model, 'index': i})}\n\n"
                await asyncio.sleep(0.5)

                # Simulated agent response chunks
                response_text = f"This is a simulated response from {model} about: {debate_data['topic']}"
                for chunk in response_text.split():
                    yield f"event: agent_chunk\ndata: {json.dumps({'agent': model, 'chunk': chunk + ' '})}\n\n"
                    await asyncio.sleep(0.1)

                # Agent complete event
                yield f"event: agent_complete\ndata: {json.dumps({'agent': model, 'response': response_text})}\n\n"
                await asyncio.sleep(0.3)

            # Send consensus/golden prompt
            consensus = f"Golden Prompt: Based on the debate about '{debate_data['topic']}', here is the synthesized recommendation."
            yield f"event: consensus\ndata: {json.dumps({'consensus': consensus})}\n\n"
            await asyncio.sleep(0.2)

            # Send completion event
            yield f"event: done\ndata: {json.dumps({'status': 'completed'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"
