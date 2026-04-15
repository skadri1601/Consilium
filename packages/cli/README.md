# @consilium/cli

Command-line interface for Consilium -- a multi-model debate platform that lets you pit AI models against each other before writing code.

## Installation

```bash
npm install -g @consilium/cli
```

Or run without installing:

```bash
npx @consilium/cli debate "your question"
```

## Requirements

- Node.js >= 20.0.0
- A running Consilium backend (or access to a hosted instance)

## Quick Start

```bash
# Interactive REPL session
consilium chat

# Start a debate
consilium debate "How should I implement auth?"

# Debate with options
consilium debate "Design API" --mode council -o output.md

# Resume a previous session
consilium sessions resume <id>
```

## Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `consilium debate <topic>` | `ask` | Start a multi-model debate |
| `consilium chat` | | Interactive REPL with session persistence |
| `consilium config set\|get\|list` | | Configuration management |
| `consilium login` | | Web-based authentication (opens browser) |
| `consilium debug <debateId>` | | Full debate trace |
| `consilium logs <debateId>` | | Query debate logs |
| `consilium stats` | | Model performance dashboard |
| `consilium sessions list\|resume\|rename\|delete` | | Manage saved sessions |

## Debate Options

| Flag | Description |
|------|-------------|
| `-m, --models <models...>` | Select models for the debate |
| `-o, --output <file>` | Save output to file |
| `--mode quick\|council\|deep\|blind` | Set debate mode |

## Debate Modes

| Mode | Rounds | Description |
|------|--------|-------------|
| `quick` | 1 | Single round, fast results |
| `council` | 3 | Multiple rounds of deliberation (default) |
| `deep` | 5 | Multi-round with sub-agents for deeper analysis |
| `blind` | 3 | Anonymous mode, models don't see each other's names |

```bash
consilium debate "Microservices vs monolith" --mode deep
```

## Output Formats

| Format | Use Case |
|--------|----------|
| `markdown` | General documentation |
| `cursorrules` | Cursor IDE rules file |
| `claude-md` | CLAUDE.md instructions |
| `json` | Programmatic consumption |
| `text` | Plain text |

```bash
consilium debate "Error handling strategy" --format cursorrules --output .cursorrules
```

## REPL Mode

Running `consilium chat` drops you into an interactive session with persistent history.

REPL commands:

- `/ask <topic>` -- Start a debate within the session
- `/help` -- List available commands
- `/exit` -- Save session and quit
- Up/Down arrows -- Navigate input history

## Codebase-Aware Debates

Consilium scans your project via ProjectContext and feeds relevant context into the debate. Three specialized agents -- architecture, structure, and config -- analyze your codebase so models understand your tech stack, directory layout, and existing patterns before responding.

## Context Support

Attach files or images to provide additional context:

```bash
consilium debate "Review this architecture" --file diagram.png
consilium debate "Refactor this module" --file src/auth.ts
```

## Configuration

Manage API keys and settings with BYOK (Bring Your Own Keys). Supported providers: OpenAI, Anthropic, Google, Groq, XAI.

```bash
consilium config set openai_key sk-...
consilium config set anthropic_key sk-ant-...
consilium config list
```

Configuration is stored in `~/.consilium/config.json`.

Defaults target production (`https://api.myconsilium.xyz`, `https://myconsilium.xyz`). For a local Nest API, set:

```bash
export CONSILIUM_API_URL="http://localhost:4000"
```

## MCP (Cursor, Claude Code, etc.)

Run `consilium mcp` for a copy-paste stdio config. The Python module `consilium.mcp` calls the same Nest API as the CLI using `CONSILIUM_API_KEY` (your `consilium_` token) and `CONSILIUM_API_URL` (API origin, no `/api/v1` suffix). Install: `pip install -e packages/python-sdk` and optional `pip install 'consilium[mcp]'` for the official MCP stdio transport.

## Features

- **Real-time streaming** -- SSE streaming with progress bars and agent cards
- **Cost estimation** -- See estimated cost before a debate runs
- **Health check** -- Validates backend connectivity before operations
- **Decision tracking** -- Tracks decisions across conversations (decided/tentative/open/superseded)
- **Session persistence** -- Saved to `~/.consilium/sessions/`, resume with `consilium sessions resume <id>`

## Dependencies

commander ^12.1.0, chalk ^5, ora ^8, eventsource ^2, zod ^3, dotenv, open

## License

MIT

## Links

- [GitHub](https://github.com/skadri1601/Consilium)
- [Issues](https://github.com/skadri1601/Consilium/issues)
