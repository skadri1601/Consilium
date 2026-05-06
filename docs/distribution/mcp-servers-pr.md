# Submitting Consilium to modelcontextprotocol/servers

The [modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)
GitHub repo is the canonical curated list of MCP servers. Every Cursor /
Claude Desktop / Claude Code user with MCP enabled looks here when
shopping for new servers. Getting Consilium listed there is a one-day
docs-and-PR task.

## Submission steps

1. **Fork** `modelcontextprotocol/servers`.
2. **Add the entry** below to the appropriate section of `README.md`
   (under `### 🌎 Community Servers`, alphabetically by server name).
3. **Open a PR** with the title:
   ```
   Add Consilium - Multi-AI council MCP server
   ```
4. **Fill the PR body** with the template at the bottom of this doc.
5. **Wait for review.** The repo maintainers (Anthropic + community) typically respond within a week.

---

## Entry to add

Add this single line to the Community Servers list, alphabetically (between any "C…" entries):

```markdown
- **[Consilium](https://myconsilium.xyz)** - Multi-AI council that debates across OpenAI, Anthropic, Google, Groq, xAI, Moonshot, and OpenRouter for code review, design questions, and red-team assessments. Full codebase access via MCP tools.
```

---

## PR body template

```markdown
## Adding the Consilium MCP server

**Homepage:** https://myconsilium.xyz
**Published as:** `pip install consilium` → `consilium-mcp` (PyPI)
**License:** Source private. CLI / SDK / MCP server published under permissive distribution.

### What it does

Consilium runs **multi-model debates across 7 LLM providers** - OpenAI, Anthropic, Google, Groq, xAI, Moonshot, OpenRouter - and synthesizes a single answer. The debate has structured phases (proposing → cross-examination → rebuttal → synthesis) and the council can call MCP tools (Read / Edit / Grep / Glob / GitDiff / Bash) on the user's codebase mid-debate.

### Tools exposed

- `consilium_deliberate` - multi-model debate on a topic, with 8 modes (quick, council, deep, blind, redteam, jury, market, auto)
- `consilium_red_team` - adversarial assessment of content (jailbreaks, prompt injection, factual gaps)
- `consilium_blind_eval` - blind evaluation of N pre-existing responses with bias mitigation
- `consilium_list_debates` - list the user's recent debate sessions
- `consilium_cancel_debate` - cancel an in-progress debate

### Install (Claude Desktop / Cursor / Claude Code)

```json
{
  "mcpServers": {
    "consilium": {
      "command": "consilium-mcp",
      "env": {
        "CONSILIUM_API_KEY": "<your-cli-token>"
      }
    }
  }
}
```

Get a free API key at https://myconsilium.xyz/sign-up.

### Why list it

- **Multi-provider in one MCP server** - no other listed server debates across providers; users currently have to chain N single-provider servers and synthesize manually.
- **Codebase-aware** - the council reads files, runs `git diff`, greps, and proposes edits as it debates. Equivalent to having 5 senior engineers in the room.
- **Free tier** - the server falls back to a hosted Groq / OpenRouter pool when no provider keys are configured, so first-time users don't have to wire up auth before seeing value.

### Safety

- Read-only by default. Write/Bash tools require the user to grant per-session permission via `consilium /codebase allow`.
- Bash command denylist blocks `rm -rf /`, `sudo`, fork bombs, `mkfs`, `dd if=/dev/random`, `shutdown`, `reboot`, `curl|sh`, `wget|sh`.
- Path traversal blocked (`assertInsideRoot`).
- 64 KB output cap, 30s exec timeout per Bash call.
- Tool-call budget per debate (5/turn, 50 total).

### Verification

- Homepage: https://myconsilium.xyz
- PyPI: https://pypi.org/project/consilium/
- Docs: https://myconsilium.xyz/docs

Happy to answer questions or iterate on the entry.
```

---

## Variants for one-line listings

Some directories want a strict one-liner. Use:

> **Consilium** - Multi-AI council MCP server. Debates across 7 LLM providers (OpenAI, Anthropic, Google, Groq, xAI, Moonshot, OpenRouter) on your codebase, with read/edit/grep/bash tools and 8 deliberation modes. `pip install consilium`.
