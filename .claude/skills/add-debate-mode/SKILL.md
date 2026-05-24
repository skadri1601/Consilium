---
name: add-debate-mode
description: Step-by-step procedure for adding a new deliberation/debate mode to Consilium, wired across the agents engine, shared types, and CLI. Use when the user asks to add, create, or wire up a new debate mode (e.g. "add a 'tournament' mode").
---

# Add a Debate Mode

Consilium has 8 modes (quick, council, deep, blind, redteam, jury, market, auto). Adding a new one means touching these files **in order** — each layer depends on the previous.

## 1. State machine — `apps/agents/src/features/deliberation/deliberation_graph.py`
Define the new mode's phase flow. Existing flows for reference:
- `quick`: PROPOSAL → EVALUATION → OUTPUT (1 round)
- `council`: PROPOSAL → CHALLENGE → REBUTTAL → EVALUATION → VOTING → AGGREGATION → CONVERGENCE → OUTPUT (3 rounds)
- `redteam`: PROPOSAL → ATTACK → DEFEND → JUDGE_ATTACK → OUTPUT (4 rounds)

Add the mode + its phases to the enums in `types.py` (all deliberation types live there — never duplicate). Wire cost/convergence: `_estimate_cost()` and the convergence threshold (council 0.85; deep is higher) live in this file.

## 2. Prompt template — `apps/agents/src/features/deliberation/templates/registry.py`
Add the prompt template(s) for the new phases, following the existing `registry.py` pattern.

## 3. Test — `apps/agents/tests/deliberation/`
Add a mode test. Run it with:
```
cd apps/agents && uv run pytest tests/deliberation/ -x
```

## 4. TS enum — `packages/shared/src/debates/debate-mode.ts`
Add the mode to the shared enum (single source of truth). Rebuild shared:
```
pnpm --filter @consilium/shared build
```

## 5. CLI flag — `packages/cli/src/commands/debate.ts`
Expose `--mode <newmode>` and any mode-specific judge config (see `packages/cli/src/utils/cli-judge.ts` → `getJudgeConfig()`).

## Rules
- Judge must be a non-participant model in blind-style modes.
- Model IDs must exist in `apps/agents/src/shared/config/models.py` (MODEL_ALIASES or AVAILABLE_MODELS).
- Verify end to end: `pnpm type-check` + the deliberation test + a CLI smoke run (`pnpm consilium debate "test" --mode <newmode>`).
