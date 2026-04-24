# @myconsilium/cli

Command-line interface for Consilium — a multi-model debate platform that lets you pit AI models against each other before writing code.

## Installation

```bash
npm install -g @myconsilium/cli
```

Or run without installing:

```bash
npx @myconsilium/cli debate "your question"
```

## Requirements

- Node.js >= 18.0.0
- A Consilium account (`consilium login`) or a self-supplied `CONSILIUM_API_KEY`

## Quick Start

```bash
# Sign in (opens browser, pastes token into ~/.consilium/config.json)
consilium login

# Start a debate
consilium debate "How should I implement auth?"

# Interactive REPL session
consilium chat

# Fire-and-forget: create a debate and exit with the ID
consilium debates start "Design the API" --json

# Attach to a running debate later
consilium debates stream dbt_01HY3K...

# See the default model lineup
consilium models
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `consilium debate <topic>` | `ask` | Start a multi-model debate and stream it to stdout |
| `consilium debates list` | | List your recent debates (`--limit`, `--offset`, `--search`, `--json`) |
| `consilium debates start <topic>` | | Create a debate and exit (fire-and-forget) |
| `consilium debates stream <id>` | | Attach to a running debate's SSE stream |
| `consilium debates cancel <id>` | | Cancel an in-progress debate (`--deliberation` for deliberation sessions) |
| `consilium chat` | | Interactive REPL with session persistence |
| `consilium redteam <content>` | | Run adversarial assessment |
| `consilium eval <topic>` | | Blind evaluation of multiple responses |
| `consilium benchmark --benchmark <name>` | | MMLU / TruthfulQA / HumanEval benchmarks |
| `consilium models` | | List the default model lineup and full catalog |
| `consilium config set\|get\|list` | | Manage `~/.consilium/config.json` |
| `consilium sessions list\|resume\|rename\|delete` | | Manage saved REPL sessions |
| `consilium login` / `logout` | | Authenticate / clear credentials |
| `consilium debug <id>` | | Full debate trace |
| `consilium logs <id>` | | Query debate logs by level |
| `consilium stats` | | Model performance dashboard |
| `consilium mcp` | | Print MCP (stdio) setup for Claude Desktop / Cursor |

## Debate Options

| Flag | Description |
|------|-------------|
| `-m, --models <models...>` | Select models (defaults: see `consilium models`) |
| `--mode <mode>` | Debate mode (see below) |
| `--output <format>` | `markdown` / `cursorrules` / `claude-md` / `json` / text (default) |
| `--file <paths...>` | Attach files as context (e.g. `--file src/auth.ts diagram.png`) |
| `--git-diff` | Include current git diff as context |
| `--ticket <id>` | Include a Linear ticket as context (e.g. `MYC-123`) |
| `--no-context` | Disable automatic codebase scanning |
| `--apply` | Apply structured edits from synthesis directly to files |

All of these flags work on both `consilium debate` and `consilium debates start`.

## Debate Modes

| Mode | Rounds | Cost | Description |
|------|--------|------|-------------|
| `quick` | 1 | ~$0.01 | Single round, fastest results |
| `council` | 3 | ~$0.04 | Multi-round deliberation (default baseline) |
| `deep` | 3 | ~$0.08 | Multi-round with sub-agent research |
| `blind` | 3 | ~$0.04 | Anonymous — models don't see each other's names |
| `redteam` | 4 | ~$0.10 | Adversarial testing, finds attack surfaces |
| `jury` | 3 | ~$0.05 | Panel with mandatory dissent tracking |
| `market` | 5 | ~$0.09 | Prediction-market style with confidence voting |
| `auto` | 3 | varies | Picks the cheapest mode that fits the topic (default) |

```bash
consilium debate "Microservices vs monolith" --mode deep
consilium debate "Is this API secure?" --mode redteam
consilium debate "Which approach?" --mode auto
```

## Streaming & Reliability

The CLI streams debate progress over SSE with auto-reconnect:

- The stream auto-reconnects up to `CONSILIUM_STREAM_RETRIES` times (default `3`) with 1s/2s/4s backoff.
- `Last-Event-ID` is sent on reconnect so the server can resume without duplicating events.
- `CONSILIUM_STREAM_TIMEOUT` (default `300000` ms = 5min) is an **idle** timeout — it resets on every event received, so long deliberations that stream progress continuously don't get hard-killed.
- 4xx fatal errors (401/403/404) bypass retry and surface immediately.

| Env var | Default | Effect |
|---|---|---|
| `CONSILIUM_API_URL` | `https://api.myconsilium.xyz` | Override the Nest API origin |
| `CONSILIUM_API_KEY` | — | Your `consilium_` token (auto-set by `consilium login`) |
| `CONSILIUM_STREAM_TIMEOUT` | `300000` | Idle-timeout in ms for a single SSE connection |
| `CONSILIUM_STREAM_RETRIES` | `3` | Max reconnect attempts on transient errors |
| `CONSILIUM_DEBUG` | — | Set to `1`/`true` for verbose logs |

## REPL Mode

Running `consilium chat` drops you into an interactive session with persistent history.

REPL commands:

- `/ask <topic>` — start a debate within the session
- `/help` — list available commands
- `/clear` — remove attached files from context
- `/exit` — save session and quit
- Up/Down arrows — navigate input history

Sessions are stored locally in `~/.consilium/sessions/`; manage them with `consilium sessions list/resume/rename/delete`.

## Codebase-Aware Debates

Consilium scans your project and feeds relevant context into the debate. Three specialized agents (architecture, structure, config) analyze your codebase so models understand your tech stack, directory layout, and existing patterns before responding.

## Context Support

Attach files or images:

```bash
consilium debate "Review this architecture" --file diagram.png
consilium debate "Refactor this module" --file src/auth.ts
consilium debate "Compare these implementations" --file old.ts new.ts
consilium debate "Fix the regression introduced here" --git-diff
consilium debate "Address MYC-123" --ticket MYC-123
```

## Benchmarks

```bash
consilium benchmark --benchmark mmlu -n 20
consilium benchmark --benchmark truthfulqa --local -n 10 --output results.json
```

| Flag | Description |
|------|-------------|
| `--benchmark <name>` | `mmlu`, `truthfulqa`, or `humaneval` |
| `-m, --models <models...>` | Models to use as debaters |
| `--mode <mode>` | Deliberation mode (default: council) |
| `-n <count>` | Number of questions to run |
| `--output <path>` | Save JSON results to file |
| `--local` | Run via local Python agent instead of API |

## Eval

Blind evaluation of multiple responses to the same question:

```bash
consilium eval "Which sorting algorithm is best for nearly-sorted data?"
consilium eval "Which sorting algorithm?" --responses responses.json
```

The `--responses` file should be a JSON array: `[{"model": "gpt-4o", "text": "..."}, ...]`

## Configuration

```bash
consilium config set apiKey consilium_...
consilium config set apiUrl https://api.myconsilium.xyz
consilium config list
```

Configuration is stored in `~/.consilium/config.json` (chmod 600).

## MCP (Cursor, Claude Code, Claude Desktop)

```bash
consilium mcp --json
```

Emits a copy-paste stdio config block. The Python module `consilium.mcp` calls the same Nest API as the CLI using your `CONSILIUM_API_KEY`. See the [Python SDK README](../python-sdk/README.md) for the full MCP tool list.

## License

MIT
