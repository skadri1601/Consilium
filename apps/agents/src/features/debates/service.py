import json
import uuid
from typing import Optional, AsyncGenerator
from .schema import DebateStartRequest, DebateStartResponse
from ...shared.database.redis import get_redis
from ...core.orchestrator import DebateOrchestrator

_LOCAL_STORAGE: dict[str, dict] = {}


class DebatesService:

    def __init__(self):
        self.redis = get_redis()

    async def start_debate(
        self,
        request: DebateStartRequest,
    ) -> DebateStartResponse:
        debate_id = request.debate_id or str(uuid.uuid4())

        debate_data = {
            "debate_id": debate_id,
            "topic": request.topic,
            "models": request.models,
            "api_keys": request.api_keys.model_dump(),
            "system_prompt": request.system_prompt,
            "mode": request.mode,
            "round_count": request.round_count,
            "debate_source": request.debate_source,
            "status": "pending",
        }

        redis_success = await self.redis.set(
            f"debate:{debate_id}",
            json.dumps(debate_data),
            ex=3600,
        )

        if not redis_success:
            _LOCAL_STORAGE[f"debate:{debate_id}"] = debate_data

        return DebateStartResponse(
            debate_id=debate_id,
            status="processing",
        )

    async def get_debate(self, debate_id: str) -> Optional[dict]:
        data = await self.redis.get(f"debate:{debate_id}")
        if data:
            return json.loads(data)

        key = f"debate:{debate_id}"
        if key in _LOCAL_STORAGE:
            return _LOCAL_STORAGE[key]

        return None

    async def stream_debate(
        self,
        debate_id: str,
        debate_data: dict,
    ) -> AsyncGenerator[str, None]:
        orchestrator = DebateOrchestrator(self.redis)

        api_keys_raw = debate_data.get("api_keys", {})
        round_count = debate_data.get("round_count", 3)
        system_prompt = debate_data.get("system_prompt")
        mode = debate_data.get("mode", "debate")

        effective_rounds = 1 if mode == "single" else round_count

        try:
            async for event in orchestrator.run_debate(
                debate_id=debate_id,
                topic=debate_data["topic"],
                model_ids=debate_data["models"],
                api_keys=api_keys_raw,
                round_count=effective_rounds,
                system_prompt=system_prompt,
            ):
                yield event
        except Exception as exc:
            yield f"data: {json.dumps({'event': 'error', 'error': str(exc)})}\n\n"
