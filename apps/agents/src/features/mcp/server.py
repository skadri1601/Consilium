from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from typing import Any

logger = logging.getLogger(__name__)

CONSILIUM_API_URL = os.getenv("CONSILIUM_API_URL", "https://api.myconsilium.xyz")

_DEFAULT_MCP_MODELS = [
    "gpt-5.4-mini",
    "claude-haiku-4-5-20251001",
    "gemini-3-flash-preview",
]


def _agents_base_url() -> str | None:
    raw = os.getenv("CONSILIUM_AGENTS_URL")
    if raw is None or not str(raw).strip():
        return None
    return str(raw).strip().rstrip("/")


def _resolve_models(args: dict[str, Any]) -> list[str]:
    models = args.get("models")
    if isinstance(models, list) and len(models) > 0:
        return [str(m) for m in models]
    env_models = os.getenv("CONSILIUM_MCP_DELIBERATION_MODELS", "").strip()
    if env_models:
        return [p.strip() for p in env_models.split(",") if p.strip()]
    return list(_DEFAULT_MCP_MODELS)


def _project_context_payload(args: dict[str, Any]) -> dict[str, Any] | None:
    pc: dict[str, Any] | None = None
    raw = args.get("project_context")
    if isinstance(raw, str) and raw.strip():
        pc = {"summary": raw}
    elif isinstance(raw, dict):
        pc = dict(raw)
    persona = args.get("persona")
    if persona:
        pc = pc or {}
        pc["mcp_persona"] = persona
    return pc


async def _try_agents_risk_score(arguments: dict[str, Any]) -> list | None:
    from mcp.types import TextContent

    base = _agents_base_url()
    if not base:
        return None
    try:
        import httpx

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{base}/api/v1/risk/score",
                json={
                    "proposal": arguments.get("proposal", ""),
                    "context": arguments.get("context"),
                },
            )
            if resp.status_code != 200:
                return None
            body = resp.json()
            text = json.dumps(body, indent=2)
            return [TextContent(type="text", text=f"[Consilium risk score]\n{text}")]
    except Exception as exc:
        logger.debug("Agents risk score unavailable: %s", exc)
        return None


async def _run_deliberation_via_agents(args: dict[str, Any]) -> str | None:
    base = _agents_base_url()
    if not base:
        return None

    topic = args.get("topic", "")
    mode = args.get("mode", "council")
    rounds_raw = args.get("rounds", 3)
    try:
        rounds = int(rounds_raw)
    except (TypeError, ValueError):
        rounds = 3
    rounds = max(1, min(5, rounds))

    payload: dict[str, Any] = {
        "topic": topic,
        "models": _resolve_models(args),
        "mode": mode,
        "judge_model": os.getenv("CONSILIUM_MCP_JUDGE_MODEL", "gpt-5.4-mini"),
        "api_keys": {},
        "max_rounds": rounds,
    }
    pc = _project_context_payload(args)
    if pc:
        payload["project_context"] = pc

    try:
        import httpx

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(600.0, connect=10.0),
        ) as client:
            start = await client.post(
                f"{base}/api/v1/deliberation/start",
                json=payload,
            )
            if start.status_code != 200:
                logger.warning(
                    "Agents deliberation start failed status=%s body=%s",
                    start.status_code,
                    start.text[:400],
                )
                return None
            deliberation_id = start.json().get("id")
            if not deliberation_id:
                return None

            deadline = time.monotonic() + float(os.getenv("CONSILIUM_MCP_DELIBERATION_TIMEOUT_SEC", "600"))
            while time.monotonic() < deadline:
                await asyncio.sleep(0.35)
                res = await client.get(
                    f"{base}/api/v1/deliberation/{deliberation_id}/result",
                )
                if res.status_code != 200:
                    continue
                body = res.json()
                status = body.get("status")
                if status == "failed":
                    err = body.get("error") or "unknown error"
                    return f"Deliberation failed: {err}"
                if status == "completed":
                    state = body.get("state") or {}
                    gp = state.get("golden_prompt") or ""
                    return gp or "Deliberation completed with no consensus text in state."
            logger.warning("Agents deliberation timed out id=%s", deliberation_id)
            return None
    except Exception as exc:
        logger.warning("Agents deliberation path failed: %s", exc)
        return None


async def _run_deliberation_via_nest(args: dict[str, Any]) -> str:
    topic = args.get("topic", "")
    mode = args.get("mode", "council")
    rounds = args.get("rounds", 3)

    result_text = (
        f"[Consilium Deliberation]\n"
        f"Mode: {mode}\n"
        f"Topic: {topic[:200]}...\n"
        f"Rounds: {rounds}\n\n"
        f"Connect CONSILIUM_AGENTS_URL for local deliberation, or ensure CONSILIUM_API_URL "
        f"is set and the API is running.\n"
        f"Nest path: {CONSILIUM_API_URL}/api/v1/debates/start"
    )

    try:
        import httpx

        async with httpx.AsyncClient(timeout=120.0) as client:
            payload = {
                "topic": topic,
                "mode": mode,
                "models": args.get("models", []),
                "roundCount": rounds,
            }
            if args.get("persona"):
                payload["systemPrompt"] = args["persona"]

            resp = await client.post(f"{CONSILIUM_API_URL}/api/v1/debates/start", json=payload)
            if resp.status_code != 200:
                logger.error(
                    "Consilium debate start failed (status=%s): %s",
                    resp.status_code,
                    resp.text[:500],
                )
                resp.raise_for_status()
            debate_id = resp.json().get("debateId", "unknown")
            golden_prompt = ""
            cost_info: dict[str, Any] = {}

            async with client.stream(
                "GET",
                f"{CONSILIUM_API_URL}/api/v1/debates/{debate_id}/stream",
            ) as stream:
                async for line in stream.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            data = json.loads(line[6:])
                            if data.get("event") == "consensus":
                                golden_prompt = data.get("golden_prompt", "") or golden_prompt
                            elif data.get("event") == "cost_update":
                                cost_info = data
                        except json.JSONDecodeError:
                            pass

            result_text = golden_prompt or "Deliberation completed but no consensus reached."
            if cost_info:
                result_text += (
                    f"\n\n---\nCost: ${cost_info.get('total_cost', 0):.4f} | "
                    f"Tokens: {cost_info.get('total_tokens', 0)}"
                )
    except ImportError:
        logger.warning("httpx not installed; falling back to MCP stub response")
    except Exception as exc:
        try:
            import httpx as _httpx

            if isinstance(exc, _httpx.HTTPStatusError | _httpx.RequestError | _httpx.TimeoutException):
                logger.warning("Consilium API call failed (%s): %s", type(exc).__name__, exc)
            else:
                logger.error("Unexpected error calling Consilium API", exc_info=True)
        except ImportError:
            logger.error("Unexpected error calling Consilium API", exc_info=True)

    return result_text


async def _run_deliberation(args: dict[str, Any]) -> list:
    from mcp.types import TextContent

    via_agents = await _run_deliberation_via_agents(args)
    if via_agents is not None:
        return [TextContent(type="text", text=via_agents)]
    text = await _run_deliberation_via_nest(args)
    return [TextContent(type="text", text=text)]


def create_mcp_server():
    from mcp.server import Server
    from mcp.types import TextContent, Tool

    from .tools import get_tool_definitions

    server = Server("consilium")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        definitions = get_tool_definitions()
        return [
            Tool(name=d["name"], description=d["description"], inputSchema=d["inputSchema"])
            for d in definitions
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict[str, Any]) -> list[TextContent]:
        if name == "quick_consensus":
            arguments = {"topic": arguments.get("question", ""), "mode": "quick", "rounds": 1}
            name = "deliberate"

        if name == "validate":
            reasoning = arguments.get("reasoning", "")
            action = arguments.get("proposed_action", "")
            context = arguments.get("context", "")
            arguments = {
                "topic": (
                    f"VALIDATE THIS REASONING AND PROPOSED ACTION:\n\nReasoning: {reasoning}\n\n"
                    f"Proposed Action: {action}\n\nContext: {context}\n\n"
                    f"Should this action proceed? Identify any flaws, risks, or missing considerations."
                ),
                "mode": "redteam",
            }
            name = "deliberate"

        if name == "score_risk":
            risk_out = await _try_agents_risk_score(arguments)
            if risk_out is not None:
                return risk_out
            proposal = arguments.get("proposal", "")
            context = arguments.get("context", "")
            arguments = {
                "topic": (
                    f"RISK ASSESSMENT:\n\nProposal: {proposal}\n\nContext: {context}\n\n"
                    f"Identify all risks, vulnerabilities, and failure modes. Rate severity."
                ),
                "mode": "redteam",
            }
            name = "deliberate"

        if name == "deliberate":
            return await _run_deliberation(arguments)
        elif name == "redteam":
            target = arguments.get("target", "")
            focus = arguments.get("focus", "all")
            return await _run_deliberation({
                "topic": f"RED-TEAM THIS:\n\n{target}\n\nFocus: {focus}",
                "mode": "redteam",
            })
        elif name == "blind_eval":
            prompt_text = arguments.get("prompt", "")
            responses = arguments.get("responses", [])
            resp_text = "\n\n".join(f"[Response {i+1}]: {r}" for i, r in enumerate(responses))
            return await _run_deliberation({
                "topic": (
                    f"BLIND EVALUATION:\n\nOriginal prompt: {prompt_text}\n\n"
                    f"Responses to rank:\n{resp_text}"
                ),
                "mode": "blind",
            })
        else:
            from mcp.types import TextContent

            return [TextContent(type="text", text=f"Unknown tool: {name}")]

    return server
