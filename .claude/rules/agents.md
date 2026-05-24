---
description: Rules for Python deliberation engine
globs: ["apps/agents/**/*.py"]
---

- All 8 deliberation modes must be in MODE_TRANSITIONS and MAX_ROUNDS_BY_MODE
- AUTO mode resolves via cost_router before execution — never hardcode to council
- JURY mode uses 5 evaluators (not 1)
- Use try/except with _HAS_* flags for optional module imports
- Test with: `cd apps/agents && python -c "import sys; sys.path.insert(0,'.'); ..."`
