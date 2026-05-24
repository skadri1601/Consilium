---
description: Architecture understanding — use subagents for exploration
globs: ["**"]
---

HARD RULES:

- **Use 6-10 parallel subagents** for any task touching multiple areas of the codebase (per Multi-Agent Task Protocol in AGENTS.md). 2-3 is NOT acceptable.
- When exploring unfamiliar code areas, use `Explore` subagents — don't manually read dozens of files in the main context.
- The codebase uses: Next.js 16 (web), NestJS 11 (API), FastAPI with custom async state machine (agents). NOT LangGraph.
- Python uses `uv` (not poetry). TypeScript uses `pnpm` + Turborepo.
- 7 LLM providers: Anthropic, OpenAI, Google, Groq, xAI, Moonshot, OpenRouter.
- 8 deliberation modes: quick, council, deep, blind, redteam, jury, market, auto.
