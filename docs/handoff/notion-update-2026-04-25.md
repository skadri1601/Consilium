# Notion / external-doc handoff - April 25, 2026

This doc lists every model/provider claim that needs to be updated on **Notion** and any other off-repo surface (status pages, partner portals, internal wikis). I can't programmatically push to Notion, so this is the manual checklist.

## What changed in the codebase (now live on `feat/free-tier`)

1. **Repo is now private.** Public README badges removed; clone instructions replaced with "request access" wording. Source ships only to licensed customers.
2. **Provider catalog refreshed against live provider docs (Apr 25, 2026).** All seven providers - OpenAI, Anthropic, Google, Groq, xAI, Moonshot, OpenRouter - verified verbatim against each provider's own model page. Three real bugs fixed (xAI dot→dash, OpenRouter free roster fully replaced, Moonshot Kimi family expanded).
3. **BYOK→free-tier resolver covers seven providers end-to-end.** Database schema, NestJS API, web settings UI, CLI, and engine all support Moonshot + OpenRouter BYOK in addition to the existing five.

## Notion pages to refresh manually

> If you don't have access to a Notion page below, ask the owner; if it's stale enough that no one owns it, archive it.

### 1. Engineering wiki → "Models we support"
Replace the existing table with:

| Provider | Models | Notes |
|---|---|---|
| Anthropic | `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-opus-4-6`, `claude-haiku-4-5-20251001` | `claude-sonnet-4` and `claude-opus-4` retire **2026-06-15** - already aliased forward |
| OpenAI | `gpt-5.5-pro`, `gpt-5.5`, `gpt-5.4`, `gpt-5.4-mini`, `gpt-5.4-nano` | All current |
| Google | `gemini-3.1-pro-preview`, `gemini-3-flash-preview`, `gemini-3.1-flash-lite-preview` | `gemini-2.0-flash` retires **2026-06-01**, `gemini-2.5-*` retire **Jun/Jul 2026** - already aliased |
| Groq | `llama-3.1-8b-instant`, `llama-3.3-70b-versatile`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `groq/compound`, `groq/compound-mini` | All current; primary free-tier fallback target |
| xAI | `grok-4-20`, `grok-4-1-fast-reasoning`, `grok-4-1-fast-non-reasoning`, `grok-code-fast-1` | **Note the dash** - `grok-4-20`, not `grok-4.20` |
| Moonshot | `kimi-k2.6`, `kimi-k2.5`, `kimi-k2-thinking`, `kimi-k2-thinking-turbo`, `kimi-k2-turbo-preview` | OpenAI-compatible; 256K context |
| OpenRouter | `google/gemma-4-26b-a4b-it:free`, `google/gemma-4-31b-it:free`, `qwen/qwen3-coder:free`, `nvidia/nemotron-3-super-120b-a12b:free`, `inclusionai/ling-2.6-1t:free` | All free tier; secondary fallback target. Old IDs (`gemma-2-9b`, `mistral-7b`, `nemotron-4-340b`, `llama-3.3-70b-instruct`, `qwen-2.5-72b`) are **gone** from OpenRouter's free roster |

### 2. Engineering wiki → "BYOK + free-tier fallback"
Update the resolver chain explanation to:

1. **BYOK** - user's own key for the requested model's provider wins.
2. **Self-hosted env var** - `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / etc. on the engine host (single-tenant scenario).
3. **Free-tier Groq** - `CONSILIUM_FREE_TIER_GROQ_KEY` with tier-equivalent model:
   - fast → `llama-3.1-8b-instant`
   - balanced → `llama-3.3-70b-versatile`
   - deep → `openai/gpt-oss-120b`
4. **Free-tier OpenRouter** - `CONSILIUM_FREE_TIER_OPENROUTER_KEY` with tier-equivalent free model:
   - fast → `google/gemma-4-26b-a4b-it:free`
   - balanced → `qwen/qwen3-coder:free`
   - deep → `nvidia/nemotron-3-super-120b-a12b:free`
5. **Raise** - `NoKeyAvailableError` if nothing matches.

When a fallback fires, the engine emits a `routing:fallback` SSE event with the substitution reason, the CLI surfaces it as a pre-flight notice, and the web debate detail page renders a banner.

### 3. Engineering wiki → "Repository access"
Add or update:

> The Consilium source repository is **private** as of April 2026. The CLI (`@myconsilium/cli`), TypeScript SDK (`@myconsilium/sdk`), and Python SDK (`consilium`) remain publicly distributed via npm and PyPI, and the hosted web app is at <https://myconsilium.xyz>. For source access, partner integrations, or self-hosting, contact <support@myconsilium.xyz>.

### 4. Internal runbook → "Deprecation calendar"

| Date | Provider | What dies |
|---|---|---|
| 2026-06-01 | Google | `gemini-2.0-flash`, `gemini-2.0-flash-001`, `gemini-2.0-flash-lite`, `gemini-2.0-flash-lite-001` |
| 2026-06-15 | Anthropic | `claude-sonnet-4-20250514`, `claude-opus-4-20250514` |
| 2026-06-17 | Google | `gemini-2.5-pro`, `gemini-2.5-flash` |
| 2026-07-22 | Google | `gemini-2.5-flash-lite` |
| 2026-10-02 | Google | `gemini-2.5-flash-image` |

All deprecated IDs are aliased forward in `apps/agents/src/shared/config/models.py` MODEL_ALIASES, so externally-stored debate sessions continue to resolve.

### 5. npm package pages
Already updated in code via the package READMEs (`packages/cli/README.md`, `packages/sdk/README.md`, `packages/python-sdk/README.md`). The next `npm publish` / `pip publish` will push the refreshed text. **No manual action required** - but reviewers should confirm the `latest` tags after release.

### 6. Status page (status.myconsilium.xyz, if applicable)
Add the seven providers to the dependency monitor list:
- OpenAI
- Anthropic
- Google Gemini
- Groq
- xAI
- Moonshot (Kimi)
- OpenRouter (free pool)

## Source for every change

Primary references hit Apr 25 2026:
- Anthropic - <https://platform.claude.com/docs/en/docs/about-claude/models/overview>
- OpenAI - <https://developers.openai.com/api/docs/models/all>
- Google deprecations - <https://ai.google.dev/gemini-api/docs/deprecations>
- Groq - <https://console.groq.com/docs/models>
- xAI - <https://docs.x.ai/docs/models> + <https://x.ai/news/grok-4-1-fast>
- Moonshot Kimi - <https://platform.kimi.ai/docs/guide/kimi-k2-6-quickstart>
- OpenRouter - <https://openrouter.ai/collections/free-models>

Internal canonical doc: `docs/design/model-freshness-2026-04.md` in this repo.
