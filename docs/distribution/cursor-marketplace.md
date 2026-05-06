# Submitting Consilium to the Cursor MCP Marketplace

Cursor (https://cursor.com) ships an in-app MCP marketplace under
**Settings → Cursor Settings → MCP**. Servers listed there install
with one click from the user's IDE. Getting Consilium listed has
~5x the discoverability of the npm/PyPI listings combined.

## Where Cursor pulls its listings from

As of April 2026, Cursor's MCP marketplace is fed by:

1. The **`@cursor/mcp-registry` GitHub repo** (curated list, PR-based)
2. **Smithery.ai** integration (auto-imports verified servers from there)
3. Manual partner listings (apply via cursor.com/contact)

The fastest path is **Smithery first** (see `docs/distribution/smithery.yaml`),
then PR a manual entry into `@cursor/mcp-registry` to ensure top-of-list
placement under the "Code Review" / "Multi-Agent" category.

## Cursor MCP registry entry

PR target: `cursor/mcp-registry` (private until invited; apply at https://cursor.com/contact mentioning "MCP marketplace listing")

Suggested `consilium.json` entry shape (matches Smithery + Cursor conventions):

```json
{
  "name": "consilium",
  "displayName": "Consilium - Multi-AI Council",
  "description": "Multi-provider AI debate on your codebase. OpenAI + Anthropic + Google + Groq + xAI + Moonshot + OpenRouter, all in one council, with read/edit/grep/bash tools.",
  "categories": ["code-review", "multi-agent", "debugging", "security"],
  "homepage": "https://myconsilium.xyz",
  "repository": "https://myconsilium.xyz",
  "install": {
    "type": "stdio",
    "command": "consilium-mcp",
    "package": {
      "manager": "pip",
      "name": "consilium"
    },
    "env": {
      "CONSILIUM_API_KEY": {
        "description": "CLI token from `consilium login`. Optional - falls back to Consilium-managed free-tier pool.",
        "required": false
      }
    }
  },
  "tools": [
    "consilium_deliberate",
    "consilium_red_team",
    "consilium_blind_eval",
    "consilium_list_debates",
    "consilium_cancel_debate"
  ],
  "screenshots": [
    "https://myconsilium.xyz/og.png"
  ]
}
```

## Email outreach template

If the registry process is slow, email `support@cursor.sh` with the
subject `MCP Marketplace listing - Consilium`:

```
Hi,

We'd like to list the Consilium MCP server in the Cursor marketplace.

What it is: a multi-AI council MCP server. It debates across 7 LLM
providers (OpenAI, Anthropic, Google, Groq, xAI, Moonshot, OpenRouter)
on the user's codebase, with read/edit/grep/glob/git_diff/bash tools.
Eight deliberation modes (quick, council, deep, blind, redteam, jury,
market, auto). Free tier via a Consilium-managed pool when no provider
keys are configured.

Why list it:
1. Multi-provider in a single MCP server - no other listed server does
   this. Cursor users currently have to chain providers manually.
2. Native code-review / red-team / spec workflows via debate-pr,
   debate-issue, debate-failing, debate-staged shortcuts on the CLI
   (also available as standalone MCP tools).
3. The wedge for Cursor users: "5 senior engineers in the room"
   instead of one model. Cuts hallucination + missed-edge-case rate.

Distribution:
- PyPI: pip install consilium → consilium-mcp
- npm: @myconsilium/cli (also published as a CLI)
- Homepage: https://myconsilium.xyz

Smithery listing (in flight): https://smithery.ai/server/consilium
Repo + docs: https://myconsilium.xyz

Happy to do a 15-min demo whenever it suits.

- Saad Kadri
saad@myconsilium.xyz
```

## After it lands

Update `apps/web/src/app/(marketing)/page.tsx` to surface the
"Install in Cursor" one-click button using Cursor's deeplink format:

```
cursor://anysphere.cursor-deeplink/mcp/install?name=consilium&config=<base64-config>
```

That deeplink, when shown alongside the npm install snippet on the
landing page, converts the highest-intent traffic (Cursor users
already on the marketing page) at a much higher rate than text install
instructions alone.
