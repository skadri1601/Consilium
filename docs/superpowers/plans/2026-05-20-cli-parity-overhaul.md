# CLI Parity Overhaul — End-to-End Implementation Plan

**Goal:** Close the ~28 design / UX / feature gaps identified in a competitive analysis vs. Claude Code, Gemini CLI, Grok Build, and Cursor CLI. Bring `consilium` CLI to feature parity on coding-CLI ergonomics while preserving its multi-AI debate moat.

**Scope:**
- **Bucket A** (21 CLI-side items): full implementation on this branch
- **Bucket B** (6 infra items): CLI flags + stubs + design docs; backends scaffolded only
- **Bucket C** (5 cross-surface items): plan docs only, multi-week separate projects

**Execution model:** 10 parallel subagents (Multi-Agent Task Protocol). Each owns a disjoint file set to minimize merge conflicts. Main agent verifies, integrates, and commits.

---

## Workstream Map (10 parallel subagents)

| # | Workstream | Primary files | Bucket | Items |
|---|---|---|---|---|
| W1 | Chat REPL input ergonomics | `packages/cli/src/commands/chat.ts` (read-only on others) | A | `@file`, `!shell`, image paste, vim mode, themes |
| W2 | Chat slash command additions | `packages/cli/src/commands/chat-slash-dispatch.ts` | A | `/checkpoint`, `/rewind`, `/fork`, `/loop`, `/goal`, `/schedule`, `/plan`, `/effort`, `/usage`, custom-commands loader |
| W3 | Plan mode + Live TODO checklist | new: `utils/plan-mode.ts`, `utils/todo-tracker.ts`; integrates via env var | A | Plan mode (`--plan`), live TodoWrite-style checklist |
| W4 | Session management upgrades | `utils/session-manager.ts` | A | Checkpoint snapshot/restore, fork/branch |
| W5 | Permission model overhaul | `utils/codebase-permissions.ts`, new: `utils/permission-modes.ts` | A | Stored-permission notice (orig Task 3), permission-mode cycle (Shift+Tab), per-glob grammar |
| W6 | Extensibility — hooks + sub-agents | new: `hooks/`, `sub-agents/` modules | A | User hooks system, user-definable sub-agents from `~/.consilium/agents/*.md` |
| W7 | Headless output + safety flags | `commands/debate.ts`, `utils/stream-renderer.ts` | A | `--output-format text|json|stream-json`, `--json-schema`, `--max-budget-usd`, `--max-turns` |
| W8 | CI token + bare-menu + statusline | `commands/login.ts`, `commands/menu.ts`, `index.ts` | A | `consilium setup-token`, bare invoke → menu (not chat), status line config |
| W9 | Context visualization + diff navigator | new: `utils/context-grid.ts`, `utils/diff-navigator.ts` | A | `/context` colored grid, interactive `/diff` navigator |
| W10 | Bucket B scaffolds + Bucket C plans | new: `utils/worktree.ts`, `commands/sandbox-stub.ts`, plan docs | B+C | `--worktree`, `--sandbox` stub, web-search stub, GH Action stub, Bucket C roadmap docs |

---

## Export contracts (cross-workstream interfaces)

Subagents create new modules with these exports so W2 can wire them into the dispatch table without dependencies:

| Module | Exports | Owner |
|---|---|---|
| `utils/plan-mode.ts` | `isPlanModeActive(): boolean`, `enterPlanMode()`, `exitPlanMode()`, `recordPlanStep(step: string)`, `getPlan(): string[]` | W3 |
| `utils/todo-tracker.ts` | `class TodoTracker { add(text), check(id), render() }` | W3 |
| `utils/session-manager.ts` (extend) | `snapshotSession(id): string`, `restoreSnapshot(id, snapshotId)`, `forkSession(id, newName): string` | W4 |
| `utils/permission-modes.ts` | `type PermissionMode = 'default'|'acceptEdits'|'auto'|'plan'|'bypass'`, `getCurrentMode(): PermissionMode`, `cycleMode(): PermissionMode` | W5 |
| `hooks/runner.ts` | `runHook(event: HookEvent, payload): Promise<HookResult>` with events: `SessionStart`, `PreToolUse`, `PostToolUse`, `UserPromptSubmit`, `Stop` | W6 |
| `sub-agents/loader.ts` | `loadUserSubAgents(): SubAgentDef[]`, `invokeSubAgent(name, prompt): Promise<string>` | W6 |
| `utils/context-grid.ts` | `renderContextGrid(usage: TokenUsage): string` | W9 |
| `utils/diff-navigator.ts` | `async navigateDiff(diffs: Diff[]): Promise<void>` | W9 |
| `utils/worktree.ts` | `createWorktree(branch: string): Promise<string>`, `removeWorktree(path: string)` | W10 |

---

## Acceptance criteria (per workstream)

Each subagent:
1. Implements its workstream end-to-end with TypeScript types
2. Adds at least one unit/integration test where applicable (`*.test.ts` next to source)
3. Does NOT run `git commit` (main agent commits at end after verification)
4. Returns a concise summary: files changed, exports added, tests added, known gaps
5. Builds clean: `pnpm --filter @consilium/cli build` exits 0

---

## Phase 1 (this branch): Bucket A — 21 items, executed in parallel by W1–W9

All listed above.

## Phase 2 (this branch): Bucket B scaffolds — 6 items

`utils/worktree.ts` + `--worktree` CLI flag — basic git worktree create/remove (W10).
`commands/sandbox-stub.ts` + `--sandbox` flag — print "sandbox not yet implemented, use --worktree for isolation" + design doc.
Web-search tool stub — CLI flag `--web-search`, posts to a stub endpoint in agents (TODO in agents service); design doc.
GH Action stub — `.github/actions/consilium-debate/action.yml` skeleton; design doc.
Conversation share — `consilium sessions share <id>` stub + design doc.
Native sandbox (Seatbelt/bwrap) — design doc only.

## Phase 3 (separate roadmap): Bucket C — 5 items

Each gets a plan doc only:
- `docs/superpowers/plans/2026-05-20-vscode-extension.md`
- `docs/superpowers/plans/2026-05-20-desktop-mobile-surfaces.md`
- `docs/superpowers/plans/2026-05-20-voice-dictation.md`
- `docs/superpowers/plans/2026-05-20-image-video-generation.md`
- `docs/superpowers/plans/2026-05-20-slack-remote-control.md`

Each plan includes: scope, key files, dependencies, estimated effort, acceptance criteria.

---

## Verification protocol (main agent)

After all subagents return:
1. `git status` — survey the change surface
2. `pnpm --filter @consilium/cli build` — must pass
3. `pnpm --filter @consilium/cli test -- --run` — must pass
4. Read each new file end-to-end
5. Smoke-test: `node packages/cli/dist/index.js --help` shows new commands
6. Commit per workstream (W1..W10) with conventional commit messages
7. Push, open PR

---

## Out of scope (explicit)

- Backend changes to `apps/agents` or `apps/api` beyond what Bucket B scaffolds reference
- IDE extensions (deferred to Phase 3 plans)
- New product surfaces (desktop, mobile, Slack — Phase 3 plans)
- OS-native sandboxing primitives (design only)
- Sub-agent runtime in `apps/agents` (CLI loader only — actually invoking user sub-agents requires backend support, deferred)
