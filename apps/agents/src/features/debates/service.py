import json
import time
import traceback
import uuid
from typing import Optional, AsyncGenerator

import sentry_sdk

from .schema import DebateStartRequest, DebateStartResponse
from ...shared.database.redis import get_redis
from ...core.orchestrator import DebateOrchestrator, _set_runtime_context

_LOCAL_STORAGE: dict[str, dict] = {}

# BYOK API keys are kept in process memory only — never serialized to Redis or
# any disk store. Entries expire shortly after the debate is started to bound
# exposure if the stream is never initiated.
_EPHEMERAL_KEYS: dict[str, tuple[dict, float]] = {}
_EPHEMERAL_KEY_TTL_SECONDS = 10 * 60


def _prune_ephemeral_keys() -> None:
    now = time.time()
    expired = [k for k, (_, exp) in _EPHEMERAL_KEYS.items() if exp <= now]
    for k in expired:
        _EPHEMERAL_KEYS.pop(k, None)


class DebatesService:

    def __init__(self):
        self.redis = get_redis()

    async def start_debate(
        self,
        request: DebateStartRequest,
    ) -> DebateStartResponse:
        debate_id = request.debate_id or str(uuid.uuid4())

        sub_agents = request.sub_agents or request.mode == "deep"

        debate_data = {
            "debate_id": debate_id,
            "topic": request.topic,
            "models": request.models,
            "system_prompt": request.system_prompt,
            "mode": request.mode,
            "round_count": request.round_count,
            "sub_agents": sub_agents,
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

        _prune_ephemeral_keys()
        _EPHEMERAL_KEYS[debate_id] = (
            request.api_keys.model_dump(),
            time.time() + _EPHEMERAL_KEY_TTL_SECONDS,
        )

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

        _prune_ephemeral_keys()
        ephemeral = _EPHEMERAL_KEYS.pop(debate_id, None)
        if ephemeral is None:
            yield (
                "data: "
                + json.dumps(
                    {
                        "event": "error",
                        "error": "API keys unavailable or expired; restart the debate",
                    }
                )
                + "\n\n"
            )
            return
        api_keys_raw, _ = ephemeral
        round_count = debate_data.get("round_count", 3)
        system_prompt = debate_data.get("system_prompt")
        mode = debate_data.get("mode", "debate")

        sub_agents = debate_data.get("sub_agents", False)
        effective_rounds = 1 if mode == "single" else round_count

        scope = None
        try:
            scope = sentry_sdk.push_scope()
            scope.__enter__()
            scope.set_tag("debate_id", debate_id)
            scope.set_tag("mode", debate_data.get("mode", "council"))
            scope.set_context("debate", {
                "topic": debate_data.get("topic", "")[:200],
                "models": debate_data.get("models", []),
                "round_count": debate_data.get("round_count", 3),
            })
        except Exception:
            scope = None

        try:
            async for event in orchestrator.run_debate(
                debate_id=debate_id,
                topic=debate_data["topic"],
                model_ids=debate_data["models"],
                api_keys=api_keys_raw,
                round_count=effective_rounds,
                system_prompt=system_prompt,
                sub_agents=sub_agents,
            ):
                yield event
        except Exception as exc:
            try:
                _set_runtime_context()
                sentry_sdk.set_context("error_detail", {
                    "type": type(exc).__name__,
                    "message": str(exc),
                    "traceback": traceback.format_exc(),
                })
                sentry_sdk.capture_exception(exc)
            except Exception:
                pass
            yield f"data: {json.dumps({'event': 'error', 'error': str(exc)})}\n\n"
        finally:
            if scope:
                try:
                    scope.__exit__(None, None, None)
                except Exception:
                    pass
