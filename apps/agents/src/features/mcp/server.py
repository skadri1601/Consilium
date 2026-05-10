from __future__ import annotations
import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

CONSILIUM_API_URL = os.getenv("CONSILIUM_API_URL", "https://api.myconsilium.xyz")


def create_mcp_server():
    from mcp.server import Server
    from mcp.types import Tool, TextContent

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
                "topic": f"VALIDATE THIS REASONING AND PROPOSED ACTION:\n\nReasoning: {reasoning}\n\nProposed Action: {action}\n\nContext: {context}\n\nShould this action proceed? Identify any flaws, risks, or missing considerations.",
                "mode": "redteam",
            }
            name = "deliberate"

        if name == "score_risk":
            proposal = arguments.get("proposal", "")
            context = arguments.get("context", "")
            arguments = {
                "topic": f"RISK ASSESSMENT:\n\nProposal: {proposal}\n\nContext: {context}\n\nIdentify all risks, vulnerabilities, and failure modes. Rate severity.",
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
                "topic": f"BLIND EVALUATION:\n\nOriginal prompt: {prompt_text}\n\nResponses to rank:\n{resp_text}",
                "mode": "blind",
            })
        else:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]

    return server


async def _run_deliberation(args: dict[str, Any]) -> list:
    from mcp.types import TextContent

    topic = args.get("topic", "")
    mode = args.get("mode", "council")
    rounds = args.get("rounds", 3)

    result_text = (
        f"[Consilium Deliberation]\n"
        f"Mode: {mode}\n"
        f"Topic: {topic[:200]}...\n"
        f"Rounds: {rounds}\n\n"
        f"To run a real deliberation, ensure CONSILIUM_API_URL is set and the API is running.\n"
        f"This is a stub response. The full implementation connects to {CONSILIUM_API_URL}/api/v1/debates/start"
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
            if resp.status_code == 200:
                debate_id = resp.json().get("debateId", "unknown")
                golden_prompt = ""
                cost_info = {}

                async with client.stream("GET", f"{CONSILIUM_API_URL}/api/v1/debates/{debate_id}/stream") as stream:
                    async for line in stream.aiter_lines():
                        if line.startswith("data: "):
                            try:
                                data = json.loads(line[6:])
                                if data.get("event") == "consensus":
                                    golden_prompt = data.get("golden_prompt", "")
                                elif data.get("event") == "cost_update":
                                    cost_info = data
                            except json.JSONDecodeError:
                                pass

                result_text = golden_prompt or "Deliberation completed but no consensus reached."
                if cost_info:
                    result_text += f"\n\n---\nCost: ${cost_info.get('total_cost', 0):.4f} | Tokens: {cost_info.get('total_tokens', 0)}"
    except ImportError:
        pass
    except Exception as exc:
        logger.debug("API call failed (using stub): %s", exc)

    return [TextContent(type="text", text=result_text)]
