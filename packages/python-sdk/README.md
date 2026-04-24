# Consilium Python SDK

Python client for the Consilium multi-AI deliberation platform.

## Installation

```bash
pip install consilium
```

## Quick Start

```python
from consilium import ConsiliumClient, DeliberationMode

client = ConsiliumClient(
    api_url="https://api.myconsilium.xyz/api/v1",
    api_key="consilium_...",
)

result = client.deliberate(
    "Should we migrate to microservices?",
    mode=DeliberationMode.COUNCIL,
    models=["claude-sonnet-4-20250514", "gpt-4o"],
)
print(result.golden_prompt)
print(result.confidence_scores)
```

The `deliberate()` call validates `topic` (non-empty string) and `models` (non-empty list of non-empty strings) before hitting the API, and raises `ConsiliumError` if the API response is missing the deliberation id.

## Deliberation Modes

| Mode | Description |
|------|-------------|
| `auto` | Automatically selects best mode for topic |
| `quick` | Single round, fastest response |
| `council` | Multi-round deliberation |
| `deep` | Multi-round with sub-agent research |
| `blind` | Names hidden until scored |
| `redteam` | Adversarial red team assessment |
| `jury` | Panel deliberation with voting |
| `market` | Prediction market style confidence aggregation |

## Methods

### deliberate

```python
result = client.deliberate(
    topic="Should we use Rust or Go for the backend?",
    models=["claude-sonnet-4-20250514", "gpt-4o", "gemini-2.5-pro"],
    mode=DeliberationMode.DEEP,
    max_rounds=5,
)
print(result.golden_prompt)
print(result.dissent_report)
print(result.votes)
print(result.confidence_scores)
print(f"Cost: ${result.cost:.3f}")
```

### red_team

```python
result = client.red_team(
    content="Your system prompt here",
    models=["claude-sonnet-4-20250514", "gpt-4o"],
    categories=["injection", "jailbreak", "data_exfiltration"],
)
print(f"Score: {result.overall_score}/10")
print(f"Vulnerabilities: {result.vulnerability_count}")
for attack in result.attacks:
    print(f"  {attack['category']}: {'PASS' if not attack['success'] else 'FAIL'}")
```

### blind_eval

```python
result = client.blind_eval(
    topic="Summarize quantum computing in 100 words",
    responses=[
        "Quantum computing uses qubits...",
        "A quantum computer harnesses...",
    ],
    models=["claude-sonnet-4-20250514"],
)
for rank in result.rankings:
    print(f"#{rank['position']}: {rank['response_id']}")
print(result.scores)
```

### stream_deliberation

```python
stream = client.stream_deliberation(
    topic="Best database for time-series data?",
    models=["claude-sonnet-4-20250514", "gpt-4o"],
    mode=DeliberationMode.COUNCIL,
)
for event in stream.events():
    print(f"[{event.get('type')}] {event.get('content', '')[:80]}")
```

`stream.events()` yields events as they arrive (streaming generator, not a
buffered list) so memory stays bounded for long deliberations.

### estimate_cost

```python
estimate = client.estimate_cost(
    topic="Complex architecture decision",
    mode=DeliberationMode.DEEP,
    models=["claude-sonnet-4-20250514", "gpt-4o", "gemini-2.5-pro"],
)
print(f"Estimated cost: ${estimate.total:.3f}")
print(f"Per round: ${estimate.breakdown.per_round:.3f}")
print(f"Time: {estimate.estimated_time}")
```

### health_check

```python
status = client.health_check()
print(f"Status: {status.status}")
print(f"Version: {status.version}")
```

## Async Support

```python
import asyncio
from consilium import AsyncConsiliumClient, DeliberationMode

async def main():
    async with AsyncConsiliumClient(
        api_url="https://api.consilium.dev/api/v1",
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

## Configuration

```python
client = ConsiliumClient(
    api_url="https://api.consilium.dev/api/v1",
    api_key="your-api-key",
    timeout=60.0,
    max_retries=5,
)
```

The client retries failed requests with exponential backoff for:
- HTTP 429 (rate limit) - respects `Retry-After` header
- HTTP 5xx (server errors)
- Connection timeouts

## Error Handling

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

## MCP Server (Model Context Protocol)

The package ships with a stdio MCP server so Claude Desktop, Cursor, and
Claude Code can run deliberations directly as tool calls.

```bash
pip install 'consilium[mcp]'         # includes the optional mcp library
consilium-mcp                         # runs the stdio server
```

Configure your MCP client with:

```json
{
  "mcpServers": {
    "consilium": {
      "command": "python",
      "args": ["-m", "consilium.mcp"],
      "env": {
        "CONSILIUM_API_URL": "https://api.myconsilium.xyz",
        "CONSILIUM_API_KEY": "${CONSILIUM_API_KEY}"
      }
    }
  }
}
```

### Tools

| Tool | Purpose |
|------|---------|
| `consilium_deliberate` | Run a full deliberation; accepts `topic`, `mode`, `models`, `max_rounds`, optional `context` and `files` (gated on `codebase_access: true`) |
| `consilium_red_team` | Adversarial assessment on arbitrary content |
| `consilium_blind_eval` | Blind-evaluate a set of candidate responses |
| `consilium_list_debates` | Paginate / search the caller's debate history (`limit`, `offset`, `search`) |
| `consilium_cancel_debate` | Cancel an in-flight debate or deliberation by id (`kind: "debate" \| "deliberation"`) |

Long-running deliberation tools consume the Nest SSE stream and emit MCP
`notifications/progress` messages whenever the client supplies a
`progressToken` in `_meta`, so Claude Desktop / Cursor show live phase
and convergence updates instead of a frozen spinner. If the stream
connection fails, the server falls back to status polling so the tool
still returns the final session record.

Errors are converted to actionable messages before being surfaced to
the MCP client (401/403 → "run `consilium login`", 429 → rate-limit
hint, `ConnectError` → includes the configured `CONSILIUM_API_URL`).

### Environment variables

| Variable | Default | Effect |
|----------|---------|--------|
| `CONSILIUM_API_URL` | `https://api.myconsilium.xyz` | Nest API origin (no `/api/v1` suffix) |
| `CONSILIUM_API_KEY` | — | Your `consilium_` token |
| `CONSILIUM_DELIBERATION_TIMEOUT` | `900` (sec) | Max wait for a deliberation to finish |
| `CONSILIUM_HTTP_TIMEOUT` | `120` (sec) | Override for supporting HTTP calls (create, list, cancel) |

## License

MIT
