# `.claude/` — Claude Code project config

This folder is where Claude Code looks first. Everything here except the
gitignored personal files is committed and shared with the team.

## Layout

| Path | Purpose |
| --- | --- |
| `settings.json` | Shared config: hook registry, status line, and a conservative permission allowlist. Committed. |
| `settings.local.json` | Personal overrides (model pin, extra permissions). **Gitignored** — copy from `settings.local.json.example`. |
| `hooks/session-start.sh` | `SessionStart` hook — prints project orientation into context at session start. |
| `hooks/post-tool-use.sh` | `PostToolUse` hook — reminds you to rebuild `@consilium/shared` after editing it. |
| `statusline.sh` | Renders the bottom status bar (`dir · branch · model`). |
| `agents/*.md` | Subagents (`code-reviewer`, `researcher`, `log-analyzer`) the main agent can delegate to. |
| `skills/<name>/SKILL.md` | Model-invokable skills. `add-debate-mode` mirrors the runbook in `CLAUDE.md`. |
| `commands/*.md` | Slash commands. `/ship` runs lint + type-check + tests (it does **not** deploy). |

`.mcp.json` (repo root) holds project-scoped MCP servers — currently empty;
add servers under `mcpServers`.

## How hooks actually work

Hooks are **registered in `settings.json`**, not auto-discovered by filename.
The scripts in `hooks/` only run because `settings.json` points at them via
`$CLAUDE_PROJECT_DIR`. Renaming a script means updating `settings.json` too.

## Notes vs. the viral ".claude folder" infographics

This structure intentionally omits a few things those posts show, because they
aren't real Claude Code features:

- **No `rules/` folder with glob-scoped loading** — that's Cursor's
  `.cursor/rules/*.mdc`. Claude Code's path-scoped guidance is **nested
  `CLAUDE.md`** files in subdirectories.
- **No `output-styles/`** — not a current, documented feature.
- **No `plugins/` folder** — plugins are external packages installed via
  `/plugin`, not hand-authored here.
- **No bare `statusline` file** — the status line is a `statusLine` entry in
  `settings.json` that points at a script.
- **Slash commands are not "legacy"** — `commands/` and `skills/` are both
  current and complementary.

Personal, project-level instruction overrides go in `CLAUDE.local.md` at the
repo root (gitignored).
