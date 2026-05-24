---
description: Python deliberation engine rules — MANDATORY conventions
globs: ["apps/agents/**/*.py"]
---

HARD RULES:

- All 8 deliberation modes must be in MODE_TRANSITIONS and MAX_ROUNDS_BY_MODE.
- AUTO mode resolves via cost_router before execution — never hardcode to council.
- JURY mode uses 5 evaluators (not 1).
- Use try/except with _HAS_* flags for optional module imports.
- Test with: `cd apps/agents && uv run pytest tests/deliberation/ -x`
- **Never reference Poetry** — this project uses uv (`uv sync`, `uv run`).
- **Never reference LangGraph or LangChain** — uses custom async state machine.
- **Never add comments to Python code** — use descriptive names instead.
