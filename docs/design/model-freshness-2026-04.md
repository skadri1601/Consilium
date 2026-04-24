# Model Freshness Audit — April 2026

This audit captures the gap between Consilium's hardcoded model defaults
and what the providers actually expose today. Findings inform the
catalog updates landing in this branch and follow-up adapter work.

## Provider state vs Consilium

| Provider | Consilium uses | Provider status (Apr 2026) | Action |
|---|---|---|---|
| **Anthropic** | `claude-3-5-haiku-latest` (default in `anthropic_agent.py`) | **Retired** Jan 5, 2026 | **Migrate** → `claude-haiku-4-5-20251001` |
| Anthropic | `claude-haiku-4-5-20251001` (default-models.ts) | Current | ✅ keep |
| Anthropic | `claude-sonnet-4-20250514` (catalog) | **Scheduled retirement** Jun 15, 2026 | **Migrate** → `claude-sonnet-4-6` |
| Anthropic | (missing) | `claude-opus-4-7` is the new platform default as of Apr 23, 2026 | **Add** to catalog |
| Anthropic | (missing) | `claude-sonnet-4-6`, `claude-opus-4-6` | **Add** to catalog |
| **OpenAI** | `gpt-4o-mini` (default in `openai_agent.py` + default-models.ts) | Removed from ChatGPT Feb 13, 2026; API still works but legacy | **Migrate** → `gpt-5.4-nano` or `gpt-5.4-mini` |
| OpenAI | `gpt-4o` (catalog) | Same — legacy in 2026 | **Migrate** → `gpt-5.4` |
| OpenAI | (missing) | `gpt-5.5`, `gpt-5.5-pro`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.4-nano` | **Add** to catalog |
| **Google** | `gemini-2.0-flash` (default in default-models.ts) | **Shutdown** Jun 1, 2026 | **Migrate** → `gemini-3.1-pro-preview` or a 3.x flash variant |
| Google | `gemini-1.5-pro` (catalog) | **Already shutdown** — returns 404 | **Remove immediately** |
| Google | `gemini-3-flash-preview` (default in `google_agent.py`) | Preview — fine for now | ✅ keep, monitor |
| Google | (missing) | `gemini-3.1-pro-preview` (current main text model), `gemini-3-pro-image-preview` | **Add** to catalog |
| **Groq** | `llama-3.1-8b-instant` (default in `groq_agent.py`) | Current production | ✅ keep |
| Groq | (missing in default-models.ts) | `llama-3.3-70b-versatile`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `groq/compound`, `groq/compound-mini` | **Add** to catalog (Consilium supports Groq via BYOK; should be in MODEL_CATALOG) |
| **xAI** | `grok-beta` (default in `xai_agent.py`) | Legacy | **Migrate** → `grok-4.20` (xAI's stated recommendation) |
| xAI | (missing in default-models.ts) | `grok-4.20`, `grok-4-1-fast-reasoning`, `grok-4-1-fast-non-reasoning`, `grok-code-fast-1` | **Add** to catalog |

## Severity

- 🚨 **`gemini-1.5-pro` is dead** — any code path that hits it returns 404. Highest priority remove.
- 🚨 **`gemini-2.0-flash` is the default text model** — shuts down Jun 1, 2026. Migration is non-optional.
- 🚨 **`claude-3-5-haiku-latest` (anthropic_agent default)** is already retired. New `AnthropicAgent()` instances without an explicit `model_id` will fail.
- ⚠️ **`claude-sonnet-4-20250514`** — 7-week runway to retirement.
- ⚠️ `gpt-4o*` and `grok-beta` — still functional but two generations behind. Cosmetic concern, not breakage.

## What this PR changes

1. `default-models.ts` — `DEFAULT_MODELS` and `MODEL_CATALOG` updated to current production IDs
2. Per-provider default `model_id` constructors updated where the existing default is dead or near-dead
3. New `consilium models --check` flag — surfaces deprecated models in the user's debate-history if any are detected (so heavy users get a heads-up)
4. Provider tool-use: adapter for **Anthropic only** lands here (its tool-use API is stable and well-documented). OpenAI / Google / Groq / xAI adapters are scaffolded with `NotImplementedError` and shipped behind `CONSILIUM_ENABLE_TOOL_USE` so the protocol can be exercised without breaking existing flows.

## Follow-up PRs (not in this PR)

- OpenAI tool-use adapter (`tool_calls` schema)
- Google Gemini tool-use adapter (`function_calls` schema)
- Groq tool-use adapter (OpenAI-compatible)
- xAI tool-use adapter (OpenAI-compatible)

Each can land independently against the protocol contract in
`docs/design/mcp-tool-protocol.md`.

## Sources

- [Anthropic — Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Anthropic — Model deprecations](https://docs.anthropic.com/en/docs/resources/model-deprecations)
- [OpenAI — Models](https://developers.openai.com/api/docs/models)
- [OpenAI — Introducing GPT-5.5](https://openai.com/index/introducing-gpt-5-5/)
- [Google — Gemini API models](https://ai.google.dev/gemini-api/docs/models)
- [Groq — Supported models](https://console.groq.com/docs/models)
- [Groq — Model deprecations](https://console.groq.com/docs/deprecations)
- [xAI — Models and Pricing](https://docs.x.ai/developers/models)
