# Phase 2 + Phase 3 — Bucket B Backends + Bucket C Surfaces

**Goal:** Move from CLI scaffolds (Phase 1) to working backends (Phase 2) and real product surfaces (Phase 3) for the items the Phase 1 plan deferred.

**Acknowledgement:** This is multi-week scope. Phase 2 is fully implementable in this session via parallel subagents. Phase 3 surfaces will land partial — IDE extension + voice + image-gen tool + backend share endpoint will be functional; Slack and desktop/mobile remain plans only (per CLAUDE.md, Slack is CI-only by policy).

---

## Phase 2 — Bucket B real backends

| # | Workstream | Primary path | Deliverable |
|---|---|---|---|
| W11 | Web search tool (agents) | `apps/agents/src/features/web_search/` | Real provider (DuckDuckGo HTML / Brave / SerpAPI), `POST /api/v1/tools/web-search` route, debate-engine integration via SSE `tool:web-search` event |
| W12 | Sandbox primitives | `packages/cli/src/utils/sandbox-native.ts` + `packages/cli/src/utils/sandbox-runner.ts` | Detect platform; macOS → `sandbox-exec` Seatbelt profile; Linux → `bwrap`; Windows → fall back to worktree+env-strip. Wire `--sandbox` flag in `debate.ts` to actually run. |
| W13 | Background agents daemon (CLI) | `packages/cli/src/commands/agents.ts` + `~/.consilium/daemon.sock` | `consilium agents` (list/attach/detach/stop), `--bg` flag, supervisor PID file, log tailing |
| W14 | Share backend (API) | `apps/api/src/features/shares/` (new module) | `POST /api/v1/sessions/:id/share` + `GET /api/v1/shares/:token` + Prisma `SessionShare` model migration |
| W15 | Voice dictation | `packages/cli/src/utils/voice-input.ts` + `packages/cli/src/commands/voice.ts` | Push-to-talk REPL flag, Whisper-via-API (no native audio dep); `--voice` records to tmpfile then transcribes |

## Phase 3 — Bucket C real surfaces (partial)

| # | Workstream | Primary path | Deliverable |
|---|---|---|---|
| W16 | VS Code extension | `packages/vscode-extension/src/` (extend existing 189-line scaffold) | Status bar item, sessions TreeView (calls existing API), debate-on-selection command, webview panel for in-progress debate stream |
| W17 | Image generation tool (agents) | `apps/agents/src/features/image_gen/` | Provider abstraction (OpenAI DALL-E 3 + Stability + xAI image-gen); `POST /api/v1/tools/image-gen`; outputs to `~/.consilium/generated/`. CLI flag `consilium debate ... --generate-image-from-synthesis`. |
| W18 | Bot pipeline cleanup | `agents/` (root-level bot agents) | Fix the 11 pre-existing test failures in `agents/scripts/test_pipeline_e2e` |
| W19 | Consensus engine improvements | `apps/agents/src/workflows/consensus.py` | Real NLP key-point extraction (replace TODO at line 78) + agreement-level calc (replace TODO at line 95). Use simple lexical-overlap algorithm — no new heavy deps. |
| W20 | Open-PR triage + Dependabot batch | (n/a — meta) | Survey 19 open PRs; rebase + merge non-conflicting Dependabot bumps via PR descriptions; document remaining feature PR conflicts |

---

## Out of scope (deferred to future cycles)

- Desktop app (Electron) — separate multi-week project
- Mobile app (React Native) — separate multi-week project
- Slack remote control — explicit CLAUDE.md policy: Slack is for CI notifications only
- Native Whisper binding (avoid heavy build deps; use OpenAI API instead)
- Full BugBot replica (Cursor-equivalent automated PR reviewer)

---

## Verification protocol

After all workstreams return:
1. `pnpm build` — all packages succeed
2. `pnpm --filter @myconsilium/cli test -- --run` — all CLI tests pass
3. `pnpm --filter @consilium/web test -- --run` — all web tests pass
4. `pnpm --filter @consilium/api test` — all API tests pass
5. `cd apps/agents && poetry run pytest tests/` — all agents tests pass (or document new pre-existing failures)
6. `python -m agents.scripts.test_pipeline_e2e` — bot pipeline tests pass
7. New Prisma migration applies cleanly (W14)
8. Smoke-test CLI: `consilium debate "test" --web-search`, `consilium voice --once "transcribe and debate"`, `consilium debate "x" --sandbox` (on supported OS), VS Code extension F5-launches

Commit per workstream; push; update PR #91.
