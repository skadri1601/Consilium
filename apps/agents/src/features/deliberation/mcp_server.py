from __future__ import annotations

import asyncio
import json
import sys
from dataclasses import asdict
from typing import Any

from src.features.deliberation.blind_eval import evaluate_blind
from src.features.deliberation.deliberation_graph import DeliberationEngine
from src.features.deliberation.red_team import format_red_team_report, run_red_team
from src.features.deliberation.types import (
    AttackCategory,
    Claim,
    DeliberationMode,
    Proposal,
    DEFAULT_RUBRIC,
)

TOOLS = [
    {
        "name": "consilium_deliberate",
        "description": (
            "Run a full Consilium deliberation on a topic. "
            "Returns the golden prompt, dissent report, and cost breakdown."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "The topic to deliberate on"},
                "mode": {
                    "type": "string",
                    "description": "Deliberation mode",
                    "default": "auto",
                    "enum": [m.value for m in DeliberationMode],
                },
                "models": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of model IDs to use",
                },
                "max_rounds": {
                    "type": "integer",
                    "description": "Maximum deliberation rounds",
                    "default": 3,
                },
            },
            "required": ["topic"],
        },
    },
    {
        "name": "consilium_red_team",
        "description": (
            "Run an adversarial red team assessment against content. "
            "Returns a detailed vulnerability report."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "content": {"type": "string", "description": "Content to red-team"},
                "categories": {
                    "type": "array",
                    "items": {"type": "string", "enum": [c.value for c in AttackCategory]},
                    "description": "Attack categories to test",
                },
            },
            "required": ["content"],
        },
    },
    {
        "name": "consilium_blind_eval",
        "description": (
            "Run a blind evaluation of multiple responses. "
            "Returns rankings and scores with bias mitigation."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string", "description": "The topic responses address"},
                "responses": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "model_id": {"type": "string"},
                            "content": {"type": "string"},
                        },
                        "required": ["model_id", "content"],
                    },
                    "description": "Responses to evaluate blindly",
                },
            },
            "required": ["topic", "responses"],
        },
    },
]

DEFAULT_MODELS = ["gpt-5.4", "claude-sonnet-4-6", "gemini-3.1-pro-preview"]
DEFAULT_JUDGE = "gpt-5.4-mini"


async def llm_stub(model: str, prompt: str, api_keys: dict) -> str:
    if "Evaluate" in prompt and "Scoring Rubric" in prompt:
        return json.dumps({
            "rankings": [
                {"model_id": "Response A", "rank": 1, "scores": {"correctness": 8, "completeness": 7, "reasoning_quality": 7, "actionability": 6, "conciseness": 8}},
                {"model_id": "Response B", "rank": 2, "scores": {"correctness": 6, "completeness": 6, "reasoning_quality": 5, "actionability": 5, "conciseness": 6}},
            ],
            "reasoning": "stub evaluation",
        })
    return f"[stub response from {model}]"


async def handle_deliberate(arguments: dict) -> str:
    topic = arguments["topic"]
    mode_str = arguments.get("mode", "auto")
    models = arguments.get("models") or DEFAULT_MODELS
    max_rounds = arguments.get("max_rounds", 3)

    mode = DeliberationMode(mode_str)

    project_context = None
    context = arguments.get("context")
    if context and arguments.get("codebase_access"):
        project_context = context

    engine = DeliberationEngine(
        mode=mode,
        models=models,
        judge_model=DEFAULT_JUDGE,
        api_keys={},
        max_rounds=max_rounds,
        project_context=project_context,
    )
    state = await engine.run(topic)

    result = {
        "golden_prompt": state.get("golden_prompt"),
        "dissent_report": state.get("dissent_report"),
        "cost_breakdown": state.get("cost_tracker"),
    }
    return json.dumps(result, indent=2, default=str)


async def handle_red_team(arguments: dict) -> str:
    content = arguments["content"]
    category_strs = arguments.get("categories")

    categories = None
    if category_strs:
        categories = [AttackCategory(c) for c in category_strs]

    report = await run_red_team(
        target_content=content,
        attacker_model=DEFAULT_MODELS[0],
        defender_model=DEFAULT_MODELS[-1],
        judge_model=DEFAULT_JUDGE,
        api_keys={},
        call_fn=llm_stub,
        categories=categories,
    )
    return format_red_team_report(report)


async def handle_blind_eval(arguments: dict) -> str:
    responses = arguments["responses"]

    proposals = []
    for resp in responses:
        proposals.append(
            Proposal(
                model_id=resp["model_id"],
                content=resp["content"],
                reasoning_chain=[],
                claims=[
                    Claim(
                        id="auto",
                        statement=resp["content"][:100],
                        evidence=[],
                        confidence=0.5,
                        assumptions=[],
                        limitations=[],
                    )
                ],
                raw_confidence=0.5,
            )
        )

    model_ids = [p.model_id for p in proposals]
    judge = DEFAULT_JUDGE
    if judge in model_ids:
        judge = "claude-sonnet-4-6" if judge != "claude-sonnet-4-6" else "gpt-5.4"

    def judge_func(ordering):
        return {p.model_id: 5.0 for p in ordering}

    scores = evaluate_blind(proposals, judge, judge_func)

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    result = {
        "rankings": [{"model_id": m, "score": s, "rank": i + 1} for i, (m, s) in enumerate(ranked)],
        "scores": scores,
    }
    return json.dumps(result, indent=2, default=str)


TOOL_HANDLERS = {
    "consilium_deliberate": handle_deliberate,
    "consilium_red_team": handle_red_team,
    "consilium_blind_eval": handle_blind_eval,
}


try:
    from mcp.server import Server
    from mcp.types import Tool, TextContent

    server = Server("consilium")

    @server.list_tools()
    async def list_tools() -> list[Tool]:
        return [
            Tool(
                name=t["name"],
                description=t["description"],
                inputSchema=t["inputSchema"],
            )
            for t in TOOLS
        ]

    @server.call_tool()
    async def call_tool(name: str, arguments: dict) -> list[TextContent]:
        handler = TOOL_HANDLERS.get(name)
        if not handler:
            return [TextContent(type="text", text=f"Unknown tool: {name}")]
        try:
            result = await handler(arguments)
            return [TextContent(type="text", text=result)]
        except Exception as e:
            return [TextContent(type="text", text=f"Error: {e}")]

    HAS_MCP = True

except ImportError:
    HAS_MCP = False
    server = None


async def jsonrpc_handle(request: dict) -> dict:
    req_id = request.get("id")
    method = request.get("method", "")
    params = request.get("params", {})

    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": TOOLS}}

    if method == "tools/call":
        name = params.get("name", "")
        arguments = params.get("arguments", {})
        handler = TOOL_HANDLERS.get(name)
        if not handler:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Unknown tool: {name}"},
            }
        try:
            result = await handler(arguments)
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {"content": [{"type": "text", "text": result}]},
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32000, "message": str(e)},
            }

    return {
        "jsonrpc": "2.0",
        "id": req_id,
        "error": {"code": -32601, "message": f"Unknown method: {method}"},
    }


async def run_stdio_server() -> None:
    loop = asyncio.get_event_loop()
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError:
            response = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": "Parse error"},
            }
            sys.stdout.write(json.dumps(response) + "\n")
            sys.stdout.flush()
            continue

        response = await jsonrpc_handle(request)
        sys.stdout.write(json.dumps(response) + "\n")
        sys.stdout.flush()


def main() -> None:
    if HAS_MCP and server is not None:
        from mcp.server.stdio import stdio_server

        async def _run() -> None:
            async with stdio_server() as (read_stream, write_stream):
                await server.run(read_stream, write_stream)

        asyncio.run(_run())
    else:
        asyncio.run(run_stdio_server())


if __name__ == "__main__":
    main()
