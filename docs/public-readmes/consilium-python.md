# consilium-python

> Consilium Python is the official Python SDK for the Consilium multi-AI council platform - sync and async clients with full type hints and pydantic models for running a structured debate across Claude, GPT-5, Gemini, Grok, Groq, Kimi, and OpenRouter and getting a synthesized answer with confidence scores and dissent.

[![PyPI version](https://img.shields.io/pypi/v/consilium)](https://pypi.org/project/consilium/)
[![Python versions](https://img.shields.io/pypi/pyversions/consilium)](https://pypi.org/project/consilium/)
[![tests](https://img.shields.io/github/actions/workflow/status/skadri1601/consilium-python/ci.yml?label=tests)](https://github.com/skadri1601/consilium-python/actions)

## What it is

Consilium Python is the official Python client for the Consilium API. It
ships both `ConsiliumClient` (sync) and `AsyncConsiliumClient` (async)
backed by `httpx`, with full type hints and `pydantic` response models
for every method - `deliberate`, `red_team`, `blind_eval`,
`stream_deliberation`, `estimate_cost`, `health_check`. Includes
exponential-backoff retry, `Retry-After` honoring, and an optional MCP
stdio server (`consilium-mcp`) so Claude Code and Cursor can invoke a
debate as an MCP tool.

## Why Consilium Python

- **Sync and async clients** - `ConsiliumClient` for scripts, `AsyncConsiliumClient` for FastAPI / asyncio / aiohttp pipelines.
- **8 deliberation modes** - `auto`, `quick`, `council`, `deep`, `blind`, `redteam`, `jury`, `market`.
- **7 first-class LLM providers** - OpenAI, Anthropic, Google, xAI, Groq, Moonshot, OpenRouter - in a single debate.
- **Full type hints + pydantic models** - `DeliberationResult`, `RedTeamReport`, `BlindEvalResult`, `CostEstimate`, `HealthStatus`. mypy clean.
- **Built-in retry / backoff** for HTTP 429 (`Retry-After`-aware), 5xx, connection timeouts. Configurable timeout and max retries.
- **Optional MCP server** (`pip install 'consilium[mcp]'`) - turns the SDK into a stdio MCP tool callable from Claude Code, Cursor, and any MCP host.
- **Free-tier fallback** - no keys? Consilium routes through a managed Groq + OpenRouter pool and emits a `routing:fallback` event on the SSE stream so you know.

## Quickstart

```bash
pip install consilium
# or, with the MCP server: pip install 'consilium[mcp]'
```

```python
from consilium import ConsiliumClient, DeliberationMode

client = ConsiliumClient(
    api_url="https://api.myconsilium.xyz/api/v1",
    api_key="your-api-key",
)

result = client.deliberate(
    "Should we migrate to microservices?",
    mode=DeliberationMode.COUNCIL,
    models=["claude-sonnet-4-6", "gpt-5.4"],
)
print(result.golden_prompt)
print(result.confidence_scores)
```

Under 60 seconds end-to-end including install.

## API surface

### `deliberate`

```python
result = client.deliberate(
    topic="Should we use Rust or Go for the backend?",
    models=["claude-sonnet-4-6", "gpt-5.4", "gemini-3.1-pro-preview"],
    mode=DeliberationMode.DEEP,
    max_rounds=5,
)

print(result.golden_prompt)
print(result.dissent_report)
print(result.votes)
print(result.confidence_scores)
print(f"Cost: ${result.cost:.3f}")
```

### `red_team`

```python
report = client.red_team(
    content="Your system prompt here",
    models=["claude-sonnet-4-6", "gpt-5.4"],
    categories=["injection", "jailbreak", "data_exfiltration"],
)
print(f"Score: {report.overall_score}/10")
print(f"Vulnerabilities: {report.vulnerability_count}")
for attack in report.attacks:
    print(f"  {attack['category']}: {'PASS' if not attack['success'] else 'FAIL'}")
```

### `blind_eval`

```python
result = client.blind_eval(
    topic="Summarize quantum computing in 100 words",
    responses=[
        "Quantum computing uses qubits...",
        "A quantum computer harnesses...",
    ],
    models=["claude-sonnet-4-6"],
)
for rank in result.rankings:
    print(f"#{rank['position']}: {rank['response_id']}")
print(result.scores)
```

### `stream_deliberation`

```python
stream = client.stream_deliberation(
    topic="Best database for time-series data?",
    models=["claude-sonnet-4-6", "gpt-5.4"],
    mode=DeliberationMode.COUNCIL,
)
for event in stream.events():
    print(f"[{event.get('type')}] {event.get('content', '')[:80]}")
```

### `estimate_cost`

```python
estimate = client.estimate_cost(
    topic="Complex architecture decision",
    mode=DeliberationMode.DEEP,
    models=["claude-sonnet-4-6", "gpt-5.4", "gemini-3.1-pro-preview"],
)
print(f"Estimated cost: ${estimate.total:.3f}")
print(f"Per round: ${estimate.breakdown.per_round:.3f}")
print(f"Time: {estimate.estimated_time}")
```

### `health_check`

```python
status = client.health_check()
print(f"Status: {status.status}")
print(f"Version: {status.version}")
```

## Async client

```python
import asyncio
from consilium import AsyncConsiliumClient, DeliberationMode

async def main():
    async with AsyncConsiliumClient(
        api_url="https://api.myconsilium.xyz/api/v1",
        api_key="your-api-key",
    ) as client:
        result = await client.deliberate(
            "Should we adopt event sourcing?",
            mode=DeliberationMode.COUNCIL,
        )
        print(result.golden_prompt)

        async for event in client.stream_deliberation(
            "Best CI/CD pipeline?",
            mode=DeliberationMode.QUICK,
        ):
            print(event)

asyncio.run(main())
```

The async client is FastAPI / Starlette / aiohttp friendly. The context
manager closes the underlying `httpx.AsyncClient` cleanly so it is safe
to use as a per-request dependency.

## Pydantic response models

Every method returns a typed pydantic model. mypy and pyright pick them
up automatically.

- `DeliberationResult` - `golden_prompt`, `confidence_scores`, `votes`, `dissent_report`, `cost`, `rounds`, `metadata`
- `RedTeamReport` - `overall_score`, `vulnerability_count`, `attacks`
- `BlindEvalResult` - `rankings`, `scores`
- `CostEstimate` - `total`, `breakdown`, `estimated_time`
- `HealthStatus` - `status`, `version`, `services`

## Configuration

```python
client = ConsiliumClient(
    api_url="https://api.myconsilium.xyz/api/v1",
    api_key="your-api-key",
    timeout=60.0,
    max_retries=5,
)
```

Retries with exponential backoff fire for:

- HTTP 429 (rate limit) - respects `Retry-After` header
- HTTP 5xx (server errors)
- Connection timeouts

## Error handling

```python
from consilium import (
    ConsiliumError,
    AuthenticationError,
    TimeoutError,
    ServerError,
    RateLimitError,
)

try:
    result = client.deliberate("topic")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError as e:
    print(f"Rate limited, retry after {e.retry_after}s")
except TimeoutError:
    print("Request timed out")
except ServerError as e:
    print(f"Server error {e.status_code}: {e.message}")
except ConsiliumError as e:
    print(f"Error: {e.message}")
```

## MCP server

Install the optional MCP extras and expose Consilium as an MCP tool:

```bash
pip install 'consilium[mcp]'

# stdio server (default for Claude Code, Cursor)
export CONSILIUM_API_KEY=consilium_...
export CONSILIUM_API_URL=https://api.myconsilium.xyz
consilium-mcp
```

Wired into Claude Code, this lets Claude call `@consilium` to deliberate
across the other 6 providers whenever it wants a second opinion.

## Comparison

| Feature                  | Consilium Python              | OpenAI Python   | Anthropic Python | LangChain Python | LiteLLM            |
| ------------------------ | ----------------------------- | --------------- | ---------------- | ---------------- | ------------------ |
| Multi-provider debate    | yes - 7 providers in one call | single provider | single provider  | agent chains     | proxy/routing only |
| Sync + async             | yes                           | yes             | yes              | yes              | yes                |
| Pydantic response models | yes                           | partial         | partial          | partial          | partial            |
| Convergence detection    | yes - Kendall tau + Jaccard   | no              | no               | no               | no                 |
| Mandatory dissent        | yes                           | no              | no               | no               | no                 |
| Built-in retry/backoff   | yes                           | yes             | yes              | partial          | yes                |
| Free-tier fallback       | yes - Groq + OpenRouter pool  | no              | no               | no               | no                 |
| MCP server included      | yes (optional extra)          | no              | no               | no               | no                 |
| Red-team mode            | yes                           | no              | no               | partial          | no                 |
| Blind evaluation         | yes                           | no              | no               | no               | no                 |

## Runtime support

- Python >= 3.10
- httpx >= 0.27
- pydantic >= 2.5
- Optional: `mcp` (for the MCP stdio server)

## Docs

- [Python SDK reference](https://myconsilium.xyz/docs/python-sdk)
- [Quickstart](https://myconsilium.xyz/docs/getting-started)
- [How it works](https://myconsilium.xyz/docs/how-it-works)
- [Deliberation modes](https://myconsilium.xyz/docs/modes)
- [Provider catalog](https://myconsilium.xyz/docs/providers)
