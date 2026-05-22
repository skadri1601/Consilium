# Web Search Grounding Specification

**Status:** Design only. The CLI stub at `packages/cli/src/utils/web-search-stub.ts` POSTs to `/api/v1/tools/web-search`; this spec defines what the backend should do once it's built.

**Goal:** Give Consilium debates real-time web search results so models can cite fresh sources instead of hallucinating. The grounding is a tool the council can invoke during deliberation, not a passive RAG layer — it preserves the multi-AI critique loop (models can challenge each other's sources).

---

## Why grounding

Without grounding, every Consilium debate is bounded by the council's training cutoff. For questions that depend on current events, releases, or pricing, that's a hard limit. Grounding via web search lets models:

- Cite a primary source instead of a memorized summary.
- Disagree about which source to trust (debate sub-thread on source quality).
- Catch their peers using stale information ("you're citing the 2024 docs but the API changed in 2025").

---

## Architecture

```
Council model → tool_call(web_search, query) →
  Agents service tool dispatcher →
    Web search provider (SerpAPI default, fallback: Brave/Bing/DuckDuckGo) →
      Result normalization →
        Citation extraction →
          Returned to model as structured JSON
```

The tool is exposed via the existing MCP tool bridge so any council member can use it. Results are stored in the debate's tool-trace so the synthesis can quote them and the CLI/web can render clickable citations.

---

## Provider abstraction

`apps/agents/src/features/tools/web_search/` houses one adapter per provider, all conforming to:

```python
class WebSearchProvider(Protocol):
    name: str
    async def search(
        self,
        query: str,
        *,
        count: int = 5,
        site: str | None = None,
        freshness: Literal["day", "week", "month", "year", None] = None,
    ) -> list[WebSearchResult]
```

| Provider | Strengths | Cost / 1k queries | Notes |
|----------|-----------|-------------------|-------|
| SerpAPI | Google index, snippets, knowledge graph | ~$5 | Default. Highest quality. |
| Brave Search | Independent index, no Google rate-limit | ~$2 | Backup. Better for adversarial queries. |
| Bing Search | Microsoft index, freshness controls | ~$3 | Good fallback. |
| DuckDuckGo (HTML scrape) | Free | $0 | Last-resort fallback. Slower, less reliable. |

Provider order is configurable per debate via `WEB_SEARCH_PROVIDERS=serpapi,brave,bing,duckduckgo`. The dispatcher rotates on failure.

---

## Tool schema

Exposed to the council:

```json
{
  "name": "web_search",
  "description": "Search the live web for fresh information. Use when an answer depends on current events, recent releases, or anything past your training cutoff.",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query" },
      "count": { "type": "integer", "default": 5, "maximum": 10 },
      "site": { "type": "string", "description": "Optional site restriction (e.g. 'docs.python.org')" },
      "freshness": {
        "type": "string",
        "enum": ["day", "week", "month", "year"],
        "description": "Restrict to results from this time window"
      }
    },
    "required": ["query"]
  }
}
```

The tool returns:

```json
{
  "results": [
    {
      "title": "...",
      "url": "...",
      "snippet": "...",
      "publishedAt": "2026-05-12T...",
      "siteName": "...",
      "favicon": "..."
    }
  ],
  "provider": "serpapi",
  "queryUsed": "..."
}
```

---

## Citation extraction

After the model gets results, it may cite them in its argument. The synthesis pass extracts cited URLs and produces a `citations` array:

```json
{
  "synthesis": "...the new Vercel limits are 1MB request bodies [1], [2]...",
  "citations": [
    { "n": 1, "url": "https://vercel.com/docs/concepts/limits", "title": "Vercel Limits", "citedBy": ["gpt-5.4"] },
    { "n": 2, "url": "https://vercel.com/changelog/...", "title": "Changelog...", "citedBy": ["claude-sonnet-4-6"] }
  ]
}
```

Detection rules:

- Numeric citations in `[N]` form.
- Bare URL mentions (`https?://...`).
- Markdown link form `[text](url)`.

Each citation is back-linked to the model(s) that mentioned it.

---

## CLI / web rendering

- **CLI** prints citations under the synthesis with the URL dimmed: `  [1] https://... — Vercel Limits`.
- **Web** renders inline superscript citation numbers with a hovercard showing the title + snippet + favicon. Click opens the URL in a new tab.
- **JSON output format** (`--output-format json`) includes the full `citations` array.

---

## Debate integration

Models can use the tool in any phase. The orchestrator's effects:

1. **Independent analysis (round 1):** if a model invokes `web_search`, results are private to that model. Other models do not see the search yet.
2. **Cross-examination (round 2):** all round-1 searches become visible. Models can now challenge each other's sources: "your citation [3] is from 2023 but the API changed".
3. **Rebuttal (round 3):** models may re-search to defend or refine.
4. **Synthesis (judge):** the judge has access to all searches across all rounds and weighs source quality.

This mirrors how the existing tool-call dispatch already works — citations are just structured tool results.

---

## Quotas + cost

| Mode | Default max searches | Per-model cap |
|------|---------------------|---------------|
| `quick` | 3 | 1 |
| `council` | 8 | 3 |
| `deep` | 20 | 8 |
| `redteam` | 12 | 5 |

Configurable via env `WEB_SEARCH_MAX_PER_DEBATE` and via `--web-search-budget <count>` CLI flag.

Cost is added to the existing debate cost breakdown as a `web_search` line item priced per provider's published rate. The user sees this in the cost line.

---

## Caching

Per-query LRU cache in Redis with 1-hour TTL (configurable). Cache key is `<provider>:<normalized query>:<count>:<freshness>:<site>`. Reduces costs for popular queries (e.g. "openai pricing") and speeds debates that re-issue the same search across phases.

---

## Failure modes

| Failure | Behavior |
|---------|----------|
| Provider returns 429 / quota | Rotate to next provider in the list. |
| All providers fail | Tool returns `{ results: [], error: "..." }`; model receives error and continues. |
| Quota exhausted for the debate | Tool returns `{ results: [], error: "Search budget exhausted" }`. |
| Search latency > 10s | Abort and rotate. |

---

## Privacy + safety

- Queries are logged with the debate ID for cost reconciliation; queries are NOT sent to third-party analytics.
- Domain blocklist (configurable) for sites we don't want models to cite (e.g. content-farm domains).
- Cite-only mode: tool returns metadata but not full snippets if `--web-search-no-snippets` is set, so the model must follow up with a fetch tool (separate spec).
- Robots.txt is respected by upstream providers; we do no direct scraping outside the DuckDuckGo HTML fallback.

---

## CLI flag + stub

The CLI gains `--web-search` (default off) and `--web-search-budget <n>`. The current stub at `packages/cli/src/utils/web-search-stub.ts` posts to `/api/v1/tools/web-search`. When the backend implements this spec, the stub becomes the real client — the API contract is already in place.

Stub behavior today: returns `{ results: [], provider: 'unavailable' }` and prints a one-liner pointing here.

---

## Implementation order (when picked up)

1. Backend provider abstraction + SerpAPI adapter + tool dispatcher wiring. Tests with mocked HTTP.
2. Brave + Bing + DuckDuckGo adapters. Provider-rotation tests.
3. Caching layer (Redis).
4. Citation extraction + storage in the debate record.
5. CLI rendering of citations.
6. Web rendering with hovercards.
7. Cost line items + debate cost breakdown.
8. `--web-search` flag wiring + quota config.
9. Documentation + load test (1000 concurrent debates with 5 searches each).

---

## Open questions

- Should search results be embedded into the debate's context window, or kept separate and referenced by ID? Leaning embedded for simplicity; revisit if context windows become tight.
- How aggressive should we be at dedup'ing results across models in a phase? Probably not at all — duplication is signal (multiple models found the same source).
- Should the judge be allowed to invoke search itself, or only see what the council found? Current design: judge can search but with a small budget so synthesis remains argumentative not investigative.

## References

- SerpAPI Google Search API.
- Brave Search API.
- Bing Web Search API v7.
- DuckDuckGo Lite HTML endpoint (no official API).
- Anthropic Claude tool-use docs (schema reference).
