# consilium-cli

> Consilium CLI is the multi-AI council command line that runs Claude, GPT-5, Gemini, Grok, Groq, Kimi, and OpenRouter models against the same prompt in parallel, cross-examines them across rounds, and synthesizes a single consensus answer with explicit dissent.

[![npm version](https://img.shields.io/npm/v/@myconsilium/cli)](https://www.npmjs.com/package/@myconsilium/cli)
[![tests](https://img.shields.io/github/actions/workflow/status/skadri1601/consilium-cli/ci.yml?label=tests)](https://github.com/skadri1601/consilium-cli/actions)
[![node](https://img.shields.io/node/v/@myconsilium/cli)](https://www.npmjs.com/package/@myconsilium/cli)

## What it is

Consilium CLI is a command-line tool that orchestrates a structured debate
between multiple large language models from different providers, then
returns a synthesized answer with confidence scores, dissent tracking, and
a full audit trail. It runs locally, talks to the hosted Consilium API
(or a self-hosted backend), and uses your own provider keys when you
have them. Without keys it falls back to a managed free-tier pool so
you can still get work done at zero cost.

## Why Consilium CLI

- **7 first-class LLM providers** in a single debate: OpenAI, Anthropic, Google, xAI, Groq, Moonshot, OpenRouter.
- **8 deliberation modes** backed by peer-reviewed research (multi-agent debate, MIT/ICML/AAAI 2023-2024): `quick`, `council`, `deep`, `blind`, `redteam`, `jury`, `market`, `auto`.
- **Mathematical convergence**: Kendall tau + Jaccard + concession rate, threshold >= 0.85. You know when the council agrees and how strongly.
- **BYOK with zero markup** - bring your own OpenAI, Anthropic, Google, Groq, xAI, Moonshot, or OpenRouter key. No tokens go through us; the Consilium API only orchestrates.
- **Groq free-tier fallback** - no keys? The free pool keeps every debate running. BYOK always wins when a key is present.
- **962 CLI unit tests / 1,553 total platform tests** as of 2026-05-20.
- **Codebase-aware** - the CLI scans your project (architecture, structure, config sub-agents) and feeds relevant context to every model before they speak.

## Quickstart

```bash
# 1. Install (auto-detects pnpm / npm / yarn / bun, or downloads a standalone binary)
curl -fsSL https://install.myconsilium.xyz | sh
# or: npm install -g @myconsilium/cli
# or: brew tap skadri1601/tap && brew install consilium

# 2. Sign in once (opens a browser tab)
consilium login

# 3. Run your first debate
consilium debate "Should I use Postgres or DynamoDB for this workload?"

# 4. Interactive REPL with session persistence
consilium chat
```

Under 60 seconds end-to-end on a typical broadband connection.

## Commands

| Command                                              | Alias | Description                                               |
| ---------------------------------------------------- | ----- | --------------------------------------------------------- |
| `consilium debate <topic>`                           | `ask` | Start a multi-model debate                                |
| `consilium chat`                                     |       | Interactive REPL with session persistence                 |
| `consilium models`                                   |       | Print the live model catalog with pricing and tier badges |
| `consilium config set / get / list`                  |       | Configuration management                                  |
| `consilium login`                                    |       | Web-based authentication (opens browser)                  |
| `consilium debug <debateId>`                         |       | Full debate trace                                         |
| `consilium logs <debateId>`                          |       | Query debate logs                                         |
| `consilium stats`                                    |       | Model performance dashboard                               |
| `consilium sessions list / resume / rename / delete` |       | Manage saved sessions                                     |
| `consilium benchmark`                                |       | Run multi-model benchmarks (MMLU, TruthfulQA, HumanEval)  |
| `consilium eval <topic>`                             |       | Blind evaluation of multiple responses                    |
| `consilium mcp`                                      |       | Print a stdio MCP server config for Claude Code / Cursor  |
| `consilium upgrade`                                  |       | Detect install method and self-upgrade                    |

## Debate options

| Flag                       | Description                                                           |
| -------------------------- | --------------------------------------------------------------------- |
| `-m, --models <models...>` | Select models for the debate                                          |
| `--output <format>`        | Output format: `markdown`, `cursorrules`, `claude-md`, `json`, `text` |
| `--mode <mode>`            | Set debate mode (see Modes below)                                     |
| `--file <paths...>`        | Attach files (or images) as context                                   |
| `--git-diff`               | Include current git diff as context                                   |
| `--ticket <id>`            | Include a Linear ticket as context (e.g. `MYC-123`)                   |
| `--apply`                  | Apply structured edits from synthesis directly to files               |
| `-o, --output-file <path>` | Write final synthesis to a file                                       |

## Debate modes

| Mode      | Rounds | Cost   | Description                                      |
| --------- | ------ | ------ | ------------------------------------------------ |
| `quick`   | 1      | ~$0.01 | Single round, fastest results                    |
| `council` | 3      | ~$0.04 | Multi-round deliberation (default)               |
| `deep`    | 3      | ~$0.08 | Multi-round with sub-agent research              |
| `blind`   | 3      | ~$0.04 | Anonymous - models do not see each other's names |
| `redteam` | 4      | ~$0.10 | Adversarial testing, finds attack surfaces       |
| `jury`    | 3      | ~$0.05 | Panel with mandatory dissent tracking            |
| `market`  | 5      | ~$0.09 | Prediction-market style with confidence voting   |
| `auto`    | 3      | ~$0.04 | Auto-selects the best mode for your topic        |

## REPL slash commands

Running `consilium chat` drops you into an interactive session.

- `/ask <topic>` - start a debate within the session
- `/models <models...>` - set the council for the next debate
- `/mode <mode>` - set the deliberation mode for the next debate
- `/file <path>` - attach a file to the next debate
- `/git-diff` - attach the current git diff
- `/save <name>` - save the session under a name
- `/help` - list slash commands
- `/exit` - save session and quit

## Hooks and sub-agents

Hooks fire on debate lifecycle events. Configure in
`~/.consilium/hooks.json`:

```json
{
  "pre_debate": "scripts/notify.sh",
  "post_debate": "scripts/log-to-linear.sh",
  "on_dissent": "scripts/alert.sh"
}
```

Codebase sub-agents run automatically before every debate:

- `architecture` - infers tech stack and frameworks
- `structure` - reads the directory layout
- `config` - extracts relevant config (lint, TS, package.json, pyproject)

## Sandbox

Use `--sandbox` to run debates against a temporary copy of your repo and
apply edits there first. Validates the changes against your test command
before writing back to your working tree.

```bash
consilium debate "Refactor auth module" --apply --sandbox
```

## Comparison

| Feature                    | Consilium                              | Claude Code             | Gemini CLI          | Grok Build          | Cursor CLI          |
| -------------------------- | -------------------------------------- | ----------------------- | ------------------- | ------------------- | ------------------- |
| Plan mode                  | yes (deep mode)                        | yes                     | partial             | yes                 | yes                 |
| Provider count             | 7 first-class                          | 1 (Anthropic)           | 1 (Google)          | 1 (xAI)             | multi (via MCP)     |
| Models per request         | 3-5 in parallel rounds                 | 1 selected Claude model | 1 selected Gemini   | 1 Grok model        | 1 selected          |
| Cross-examination          | typed challenges + rebuttals           | single-agent loop       | single-agent loop   | single-agent loop   | single-agent loop   |
| Convergence detection      | Kendall tau + Jaccard >= 0.85          | self-reported           | self-reported       | self-reported       | self-reported       |
| Mandatory dissent          | yes (healthcare/legal/finance)         | no                      | no                  | no                  | no                  |
| MCP server                 | yes - exposes deliberation as MCP tool | host only               | no                  | no                  | no                  |
| MCP host                   | yes                                    | yes                     | partial             | no                  | yes                 |
| Free-tier fallback         | Groq + OpenRouter pool                 | Claude API pricing      | Google pricing      | xAI pricing         | provider pricing    |
| Audit trail                | per-round tokens/cost/latency          | session transcripts     | session transcripts | session transcripts | session transcripts |
| VS Code / Cursor extension | yes                                    | yes                     | partial             | no                  | n/a                 |

## Output formats

| Format        | Use case                 |
| ------------- | ------------------------ |
| `markdown`    | General documentation    |
| `cursorrules` | Cursor IDE rules file    |
| `claude-md`   | CLAUDE.md instructions   |
| `json`        | Programmatic consumption |
| `text`        | Plain text               |

## Configuration

BYOK across all 7 providers. Stored in `~/.consilium/config.json`.

```bash
consilium config set openai_key sk-...
consilium config set anthropic_key sk-ant-...
consilium config set google_key ...
consilium config set groq_key gsk_...
consilium config set xai_key xai-...
consilium config set moonshot_key sk-...
consilium config set openrouter_key sk-or-...
consilium config list
```

Override the API origin for self-hosted backends:

```bash
export CONSILIUM_API_URL="http://localhost:4000"
```

## MCP integration

Print a copy-paste stdio config for Claude Code, Cursor, or any MCP host:

```bash
consilium mcp
```

Combined with Claude Code, this lets Claude invoke `@consilium` to
deliberate across the other 6 providers whenever it wants a second
opinion.

## Docs

- [Quickstart](https://myconsilium.xyz/docs/getting-started)
- [CLI reference](https://myconsilium.xyz/docs/cli/reference)
- [Slash commands](https://myconsilium.xyz/docs/cli/slash-commands)
- [Hooks](https://myconsilium.xyz/docs/cli/hooks)
- [Sub-agents](https://myconsilium.xyz/docs/cli/sub-agents)
- [Sandbox](https://myconsilium.xyz/docs/cli/sandbox)
- [Provider catalog](https://myconsilium.xyz/docs/providers)
- [Comparison vs Claude Code / Cursor / Aider / Cline / Copilot](https://myconsilium.xyz/docs/cli/comparison)
