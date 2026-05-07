# Model Freshness Audit - April 25, 2026

This audit captures the live state of every model Consilium ships against the providers' current production catalogs. Each row is verified against the provider's own model documentation page (URL in the Sources section). Findings drive the catalog updates committed alongside this doc.

## Provider state vs Consilium

### Anthropic - verified at platform.claude.com/docs

| Model             | Consilium catalog              | Provider status (Apr 25 2026)                | Action                                |
| ----------------- | ------------------------------ | -------------------------------------------- | ------------------------------------- |
| Claude Opus 4.7   | `claude-opus-4-7` ✅           | **Current default**, GA since 2026-04-23     | keep                                  |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` ✅         | Current                                      | keep                                  |
| Claude Opus 4.6   | `claude-opus-4-6` ✅           | Current (legacy section, still callable)     | keep                                  |
| Claude Haiku 4.5  | `claude-haiku-4-5-20251001` ✅ | Current; alias `claude-haiku-4-5` also valid | keep                                  |
| Claude Sonnet 4   | (alias only)                   | **DEPRECATED - retires Jun 15, 2026**        | already aliased → `claude-sonnet-4-6` |
| Claude Opus 4     | (alias only)                   | **DEPRECATED - retires Jun 15, 2026**        | already aliased → `claude-opus-4-6`   |

### OpenAI - verified at developers.openai.com/api/docs/models

| Model        | Consilium catalog | Provider status (Apr 25 2026)                | Action |
| ------------ | ----------------- | -------------------------------------------- | ------ |
| GPT-5.5 Pro  | `gpt-5.5-pro` ✅  | Current (snapshot `gpt-5.5-pro-2026-04-23`)  | keep   |
| GPT-5.5      | `gpt-5.5` ✅      | Current (snapshot `gpt-5.5-2026-04-23`)      | keep   |
| GPT-5.4      | `gpt-5.4` ✅      | Current (snapshot `gpt-5.4-2026-03-05`)      | keep   |
| GPT-5.4 mini | `gpt-5.4-mini` ✅ | Current (snapshot `gpt-5.4-mini-2026-03-17`) | keep   |
| GPT-5.4 nano | `gpt-5.4-nano` ✅ | Current                                      | keep   |

### Google Gemini - verified at ai.google.dev/gemini-api/docs/deprecations

| Model                 | Consilium catalog                  | Provider status (Apr 25 2026)                     | Action                                            |
| --------------------- | ---------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| Gemini 3.1 Pro        | `gemini-3.1-pro-preview` ✅        | Current (replaces retired `gemini-3-pro-preview`) | keep                                              |
| Gemini 3 Flash        | `gemini-3-flash-preview` ✅        | Current; not in deprecation list                  | keep                                              |
| Gemini 3.1 Flash-Lite | `gemini-3.1-flash-lite-preview` ✅ | Current (replacement target for 2.5-flash-lite)   | keep                                              |
| Gemini 3 Pro Preview  | (alias only)                       | **SHUT DOWN 2026-03-09**                          | already aliased → `gemini-3.1-pro-preview`        |
| Gemini 2.5 Pro        | (alias only)                       | **DEPRECATED - retires Jun 17, 2026**             | already aliased → `gemini-3.1-pro-preview`        |
| Gemini 2.5 Flash      | (alias only)                       | **DEPRECATED - retires Jun 17, 2026**             | already aliased → `gemini-3-flash-preview`        |
| Gemini 2.5 Flash Lite | (alias only)                       | **DEPRECATED - retires Jul 22, 2026**             | already aliased → `gemini-3.1-flash-lite-preview` |
| Gemini 2.0 Flash      | (alias only)                       | **DEPRECATED - retires Jun 1, 2026**              | already aliased → `gemini-3-flash-preview`        |
| Gemini 2.0 Flash Lite | (alias only)                       | **DEPRECATED - retires Jun 1, 2026**              | already aliased → `gemini-3.1-flash-lite-preview` |

### Groq - verified at console.groq.com/docs/models

All six IDs in our catalog confirmed live:
`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `groq/compound`, `groq/compound-mini` ✅

### xAI - verified at docs.x.ai + cross-checked via aggregator listings

| Model                                          | Old catalog                      | Live API ID                   | Action                                    |
| ---------------------------------------------- | -------------------------------- | ----------------------------- | ----------------------------------------- |
| Grok 4.20                                      | `grok-4.20` ❌                   | `grok-4-20`                   | **Corrected** - xAI uses dashes, not dots |
| Grok 4.1 Fast (reasoning)                      | `grok-4-1-fast-reasoning` ✅     | `grok-4-1-fast-reasoning`     | keep                                      |
| Grok 4.1 Fast (non-reasoning)                  | `grok-4-1-fast-non-reasoning` ✅ | `grok-4-1-fast-non-reasoning` | keep                                      |
| Grok Code Fast                                 | `grok-code-fast-1` ✅            | `grok-code-fast-1`            | keep                                      |
| `grok-beta`, `grok-2`, `grok-2-mini`, `grok-3` | (alias only)                     | retired                       | already aliased forward                   |

### Moonshot - verified at platform.kimi.ai/docs/guide/kimi-k2-6-quickstart

| Model                  | Consilium catalog | Provider status                    | Action    |
| ---------------------- | ----------------- | ---------------------------------- | --------- |
| Kimi K2.6              | `kimi-k2.6` ✅    | Current flagship                   | keep      |
| Kimi K2.5              | (added)           | Current                            | **Added** |
| Kimi K2 Thinking       | (added)           | Current (thinking-enabled variant) | **Added** |
| Kimi K2 Thinking Turbo | (added)           | Current                            | **Added** |
| Kimi K2 Turbo Preview  | (added)           | Current                            | **Added** |

### OpenRouter - verified at openrouter.ai/collections/free-models

The previous catalog's free-tier IDs were **all retired**. Confirmed by fetching the live free-models collection on Apr 25, 2026. Replaced with the current free roster:

| Old (retired)                            | Replacement                              |
| ---------------------------------------- | ---------------------------------------- |
| `meta-llama/llama-3.3-70b-instruct:free` | `qwen/qwen3-coder:free`                  |
| `google/gemma-2-9b-it:free`              | `google/gemma-4-26b-a4b-it:free`         |
| `mistralai/mistral-7b-instruct:free`     | `google/gemma-4-26b-a4b-it:free`         |
| `nvidia/nemotron-4-340b-instruct:free`   | `nvidia/nemotron-3-super-120b-a12b:free` |
| `qwen/qwen-2.5-72b-instruct:free`        | `qwen/qwen3-coder:free`                  |

Old IDs are kept in `MODEL_ALIASES` so any externally-stored model preferences forward to a callable target.

Free-tier resolver tier-equivalents updated to:

- **fast** → `google/gemma-4-26b-a4b-it:free`
- **balanced** → `qwen/qwen3-coder:free`
- **deep** → `nvidia/nemotron-3-super-120b-a12b:free`

OpenRouter free-tier rate limit: **20 req/min, 50 req/day** per their April 2026 announcement.

## Summary of corrections in this audit

1. **xAI** - `grok-4.20` → `grok-4-20` (xAI API uses dashes; the dot was an authoring typo)
2. **OpenRouter free tier** - entire catalog refreshed to current Gemma 4 / Qwen3 / Nemotron 3 / Ling 2.6 lineup
3. **Moonshot** - expanded from a single Kimi K2.6 entry to the full K2.x lineup (K2.5, K2 Thinking, K2 Thinking Turbo, K2 Turbo Preview)
4. **Aliases** - added forward maps for the retired OpenRouter free IDs and the dotted xAI alias

## Files touched

- `apps/agents/src/shared/config/models.py` - AVAILABLE_MODELS xAI/moonshot/openrouter sections, MODEL_ALIASES
- `apps/agents/src/features/free_tier/resolver.py` - TIER_EQUIVALENT_FREE_MODELS["openrouter"]
- `apps/agents/src/core/orchestrator.py`, `features/deliberation/deliberation_graph.py`, `features/agents/xai_agent.py`, `features/agents/service.py`, `features/health/router.py` - `grok-4.20` → `grok-4-20`
- `packages/cli/src/utils/default-models.ts` - MODEL_CATALOG entries
- `packages/cli/src/utils/key-manager.ts` - MODEL_PROVIDER_MAP entries
- `packages/cli/README.md` - provider table
- `packages/shared/src/providers/models.ts` - MODELS array
- `apps/web/src/shared/lib/constants.ts` - AGENTS array
- `apps/web/src/app/(marketing)/pricing/page.tsx`, `docs/providers/page.tsx`, `docs/getting-started/page.tsx` - marketing copy + tables

## Sources (live URLs hit Apr 25 2026)

- Anthropic - https://platform.claude.com/docs/en/docs/about-claude/models/overview
- OpenAI - https://developers.openai.com/api/docs/models/all
- Google Gemini deprecations - https://ai.google.dev/gemini-api/docs/deprecations
- Groq - https://console.groq.com/docs/models
- xAI - https://docs.x.ai/docs/models (+ cross-checked via aggregator IDs)
- Moonshot Kimi - https://platform.kimi.ai/docs/guide/kimi-k2-6-quickstart
- OpenRouter free collection - https://openrouter.ai/collections/free-models
