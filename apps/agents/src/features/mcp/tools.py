from __future__ import annotations

from typing import Any


def get_tool_definitions() -> list[dict[str, Any]]:
    return [
        {
            "name": "deliberate",
            "description": (
                "Run a multi-model AI deliberation on a topic. "
                "Multiple AI models debate, critique each other, and synthesize a consensus. "
                "Supports 8 modes: quick, council, deep, blind, redteam, jury, market, auto."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "The question or topic to deliberate on"},
                    "mode": {
                        "type": "string",
                        "enum": ["quick", "council", "deep", "blind", "redteam", "jury", "market", "auto"],
                        "default": "council",
                        "description": (
                            "Deliberation mode. quick: single-pass; council: 3 models x 3 rounds with "
                            "challenge/rebuttal; deep: 5 rounds with stricter convergence; blind: identity-stripped "
                            "evaluation; redteam: adversarial attack/defend/judge; jury: panel judges; "
                            "market: probabilistic consensus; auto: route by topic complexity."
                        ),
                    },
                    "models": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 1,
                        "maxItems": 10,
                        "description": "Model IDs to use (1-10).",
                    },
                    "rounds": {
                        "type": "integer",
                        "minimum": 1,
                        "maximum": 5,
                        "default": 3,
                        "description": "Number of deliberation rounds (1-5).",
                    },
                    "persona": {"type": "string", "description": "Custom system prompt for agents"},
                    "project_context": {"type": "string", "description": "Project context to ground the debate"},
                },
                "required": ["topic"],
            },
        },
        {
            "name": "quick_consensus",
            "description": "Fast single-round multi-model vote. Best for quick decisions needing multi-model validation.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "question": {"type": "string", "description": "The question to get consensus on"},
                },
                "required": ["question"],
            },
        },
        {
            "name": "redteam",
            "description": "Red-team a proposal, idea, or code. Returns vulnerability report with severity ratings.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "target": {"type": "string", "description": "The proposal or code to red-team"},
                    "focus": {
                        "type": "string",
                        "enum": ["security", "logic", "bias", "robustness", "all"],
                        "default": "all",
                        "description": (
                            "Which attack surface to emphasize. security: vulnerabilities and threats; "
                            "logic: reasoning flaws and inconsistencies; bias: fairness and discrimination; "
                            "robustness: edge cases and failure modes; all: every category."
                        ),
                    },
                },
                "required": ["target"],
            },
        },
        {
            "name": "blind_eval",
            "description": "Evaluate multiple responses anonymously. Returns unbiased ranking.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "prompt": {"type": "string", "description": "The original prompt"},
                    "responses": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 2,
                        "description": "Responses to evaluate (at least 2 required for comparison).",
                    },
                },
                "required": ["prompt", "responses"],
            },
        },
        {
            "name": "validate",
            "description": (
                "Validate an agent's reasoning before it acts. "
                "Runs adversarial multi-model review and returns a verdict with confidence score. "
                "Use this before high-stakes decisions to prevent errors."
            ),
            "inputSchema": {
                "type": "object",
                "properties": {
                    "reasoning": {"type": "string", "description": "The agent's reasoning to validate"},
                    "proposed_action": {"type": "string", "description": "What the agent plans to do"},
                    "context": {"type": "string", "description": "Additional context about the situation"},
                },
                "required": ["reasoning", "proposed_action"],
            },
        },
        {
            "name": "score_risk",
            "description": "Multi-model risk assessment of a proposed action. Returns risk score, vulnerabilities, and mitigations.",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "proposal": {"type": "string", "description": "The proposed action to assess"},
                    "context": {"type": "string", "description": "Context about the environment"},
                },
                "required": ["proposal"],
            },
        },
    ]
