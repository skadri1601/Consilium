# Distribution & marketplace submissions

This directory holds the submission materials for getting Consilium
into MCP marketplaces. Each file is a runbook - read it, follow the
steps, link the resulting listing back here when it goes live.

## Submission targets, in priority order

| Target                       | File                    | Priority | Effort  | Reach                                               |
| ---------------------------- | ----------------------- | -------- | ------- | --------------------------------------------------- |
| Smithery.ai                  | `smithery.yaml`         | **1**    | 30 min  | Auto-imports into Cursor + various Claude clients   |
| modelcontextprotocol/servers | `mcp-servers-pr.md`     | **2**    | 1 hr    | Canonical curated list. Every MCP host links to it. |
| Cursor MCP marketplace       | `cursor-marketplace.md` | **3**    | 1-2 hrs | Highest single-channel reach. One-click install.    |

## Why this order

1. **Smithery first** because Cursor auto-imports verified servers from there. Single submission unlocks two channels.
2. **modelcontextprotocol/servers** second because every other client (Claude Desktop, Cline, Continue, etc.) cross-links to it.
3. **Cursor direct** third - fastest path is via Smithery (#1), but a direct entry in `@cursor/mcp-registry` ensures top-of-category placement that auto-imports might miss.

## What to update after each lands

- **Smithery live** → add a "Install via Smithery" badge on the landing page.
- **modelcontextprotocol/servers PR merged** → link the entry from `packages/cli/README.md` and `apps/web/src/app/(marketing)/page.tsx`.
- **Cursor marketplace live** → add the one-click install button (Cursor deeplink) on the landing page; update README install section.

## Pre-submission checklist (one-time)

Before any of these submissions go out, verify:

- [ ] `pip install consilium` works on a fresh machine
- [ ] `consilium-mcp` (the PyPI binary script) starts cleanly via stdio
- [ ] All 5 advertised tools (`consilium_deliberate`, `_red_team`, `_blind_eval`, `_list_debates`, `_cancel_debate`) return valid responses against the prod API
- [ ] No `CONSILIUM_API_KEY` set → falls back to the free-tier pool without error
- [ ] `CONSILIUM_API_KEY` set → uses BYOK provider keys
- [ ] Markdown output renders correctly in Claude Desktop (verified after PR #47 merges)
- [ ] Repo README has a clear "Install in Claude Desktop / Cursor" section with copy-paste config
