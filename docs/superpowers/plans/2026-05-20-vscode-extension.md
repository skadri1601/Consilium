# VS Code Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a VS Code extension that brings Consilium debates inline with the editor. Users select code, run a command, and get a multi-model debate in a side panel without leaving the IDE. A TreeView surfaces saved sessions; the command palette exposes every CLI verb; status bar shows the active model preset and last debate cost.

**Architecture:** The extension is a thin client over the existing Consilium API. Authentication piggybacks on the CLI token in `~/.consilium/config.json` (cross-OS resolved). Streaming uses the same SSE contract the CLI consumes. A WebView panel renders the synthesis with full markdown + syntax highlighting. No new backend.

**Tech Stack:** TypeScript, `vscode` API, esbuild bundler, undici (fetch+SSE), Marked for markdown render in the WebView.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/vscode-extension/package.json` | Create | Extension manifest (contributes, activationEvents, commands) |
| `apps/vscode-extension/src/extension.ts` | Create | activate/deactivate, register commands + providers |
| `apps/vscode-extension/src/api/consilium-client.ts` | Create | SSE-aware fetch client mirroring CLI's ConsiliumClient |
| `apps/vscode-extension/src/api/auth.ts` | Create | Read CLI token from `~/.consilium/config.json`; show login prompt |
| `apps/vscode-extension/src/views/sessions-tree-provider.ts` | Create | TreeDataProvider for the "Consilium Sessions" view |
| `apps/vscode-extension/src/views/debate-webview.ts` | Create | WebView panel: streams synthesis + renders markdown |
| `apps/vscode-extension/src/commands/debate-selection.ts` | Create | Implements `consilium.debateSelection` |
| `apps/vscode-extension/src/commands/debate-prompt.ts` | Create | Implements `consilium.debatePrompt` (palette → input box) |
| `apps/vscode-extension/src/commands/resume-session.ts` | Create | Implements `consilium.resumeSession <id>` |
| `apps/vscode-extension/src/commands/configure-models.ts` | Create | Implements `consilium.configureModels` quick-pick |
| `apps/vscode-extension/src/status-bar/status-item.ts` | Create | Shows active preset + cost |
| `apps/vscode-extension/esbuild.config.mjs` | Create | Bundler config (single-file output to dist/extension.js) |
| `apps/vscode-extension/README.md` | Create | Marketplace listing copy |
| `apps/vscode-extension/CHANGELOG.md` | Create | Standard VS Code changelog format |
| `packages/vscode-extension/` | Repurpose | Shared types between the desktop and web-side extensions, if needed; otherwise delete |

---

### Task 1: Manifest + Scaffolding

The extension activates on command and on view open to keep startup fast.

**Files:**
- Create: `apps/vscode-extension/package.json`
- Create: `apps/vscode-extension/src/extension.ts`
- Create: `apps/vscode-extension/esbuild.config.mjs`

- [ ] **Step 1: Define manifest** with `engines.vscode >= ^1.95.0`, `categories: ["AI", "Other"]`, and these contributions:
  - `commands`: `consilium.debateSelection`, `consilium.debatePrompt`, `consilium.resumeSession`, `consilium.configureModels`, `consilium.shareSession`
  - `menus`: `editor/context` → `consilium.debateSelection` when `editorHasSelection`
  - `views`: `explorer` sidebar contributes `consiliumSessions`
  - `configuration`: `consilium.apiUrl`, `consilium.defaultMode`, `consilium.defaultModels`
- [ ] **Step 2: Wire `activate(context)`** to register the TreeView, status bar item, and each command. `deactivate()` flushes the WebView and closes the SSE.
- [ ] **Step 3: esbuild config** bundles to a single `dist/extension.js` (CJS, `external: ['vscode']`).

---

### Task 2: Auth + API Client

The extension never asks the user to paste a token. It reads the CLI's stored token from `~/.consilium/config.json`. If missing, it shows a notification with a "Sign in" action that opens `apps/web /cli/auth` in the user's default browser, then polls the CLI token file for changes.

**Files:**
- Create: `apps/vscode-extension/src/api/auth.ts`
- Create: `apps/vscode-extension/src/api/consilium-client.ts`

- [ ] **Step 1: `readCliToken()`** resolves `~/.consilium/config.json` via `os.homedir()`. Validates the token starts with `consilium_`.
- [ ] **Step 2: ConsiliumClient class** mirrors `packages/cli/src/api/client.ts` for the relevant verbs: `createDebate`, `streamDebate`, `cancelDebate`, `listSessions`, `loadSession`. Uses `undici`'s fetch + EventSource so the bundle stays small.
- [ ] **Step 3: Token-change watcher** uses `vscode.workspace.createFileSystemWatcher` so the extension picks up `consilium login` re-auths without needing a window reload.

---

### Task 3: TreeView for Sessions

Sidebar shows the user's saved sessions, grouped by recency. Clicking a leaf opens the synthesis in a WebView. Right-click offers Resume, Rename, Share, Delete.

**Files:**
- Create: `apps/vscode-extension/src/views/sessions-tree-provider.ts`

- [ ] **Step 1: SessionsTreeProvider implements `vscode.TreeDataProvider`**. Fetches the list from the API on first reveal; refresh on focus and on `consilium.refreshSessions`.
- [ ] **Step 2: Group sessions** by Today / This Week / Older. Each leaf shows session name, debate count, model preset.
- [ ] **Step 3: Context menu actions** wire to existing commands. Add `viewItem` context value so the menu shows different actions for groups vs leaves.

---

### Task 4: Debate-on-Selection

The user's primary workflow: select code → right-click → "Debate this with Consilium" → enter a question → side-panel streams the synthesis.

**Files:**
- Create: `apps/vscode-extension/src/commands/debate-selection.ts`
- Create: `apps/vscode-extension/src/views/debate-webview.ts`

- [ ] **Step 1: `debateSelection` command** captures the editor's selection, the file path, the language ID, and the git branch (via `vscode.git` extension API). Prompts for a question with default "Review this code".
- [ ] **Step 2: Build a `DebateOptions`** with the selection as a `files` attachment, set `mode` from settings, send `debateSource: 'vscode'`.
- [ ] **Step 3: Open the WebView** (singleton — reuses if already open). Stream SSE events. Render markdown with code blocks syntax-highlighted using VS Code's `MarkdownString`.
- [ ] **Step 4: Apply edits** if the synthesis contains a `consilium-edits` block, prompt to apply — uses `vscode.WorkspaceEdit` so changes are undoable.

---

### Task 5: Command Palette + Status Bar

Every CLI subcommand reachable through the Command Palette. Status bar shows the active model preset and the last debate's cost so users know they're spending real money.

**Files:**
- Create: `apps/vscode-extension/src/commands/debate-prompt.ts`
- Create: `apps/vscode-extension/src/commands/resume-session.ts`
- Create: `apps/vscode-extension/src/commands/configure-models.ts`
- Create: `apps/vscode-extension/src/status-bar/status-item.ts`

- [ ] **Step 1: `debatePrompt`** opens a quick-pick of modes, then an input box for the topic.
- [ ] **Step 2: `resumeSession`** opens a quick-pick of saved sessions and reuses the WebView.
- [ ] **Step 3: `configureModels`** multi-select quick-pick of available models; persists to extension settings.
- [ ] **Step 4: Status item** shows `Consilium: claude-sonnet-4-6 + gpt-5.4`. Tooltip lists last cost. Click opens `configureModels`.

---

### Task 6: Tests + Marketplace Prep

- [ ] **Step 1: Unit tests** with `@vscode/test-cli` for the TreeProvider and the API client (mocked fetch).
- [ ] **Step 2: Integration test** stubs the API and verifies the WebView receives the SSE stream.
- [ ] **Step 3: README** with screenshots, install instructions (`code --install-extension`), and a "first run" walkthrough.
- [ ] **Step 4: CI** add a `vscode-extension` matrix entry to `.github/workflows/ci.yml` running `vsce package --no-dependencies`.

---

## Acceptance criteria

1. `vsce package` exits 0 and produces a `.vsix` under 1 MB.
2. With a valid CLI token, "Consilium: Debate Selection" runs end-to-end against the hosted API and renders the synthesis.
3. The Sessions tree refreshes on `consilium login` from the terminal without reloading the window.
4. Cancelling a debate from the status bar aborts the SSE stream within 1 second.
5. README screenshots match the actual UI.
6. Extension contributes no new permissions beyond filesystem read for the CLI config and network for the configured API URL.

## Out of scope

- New backend endpoints; the extension uses the same API the CLI does.
- Inline edit suggestions in the editor gutter (deferred to a future Phase 2).
- Multi-cursor / multi-selection debates (single selection only in v1).
- Telemetry beyond what the API server already records.
- Cursor/Windsurf forks of the extension (publishing to OpenVSX is part of v1; Cursor reads from OpenVSX).

## Estimated effort

3 engineer-weeks. Half a week of design polish on the WebView. One week of API-client + auth plumbing. One week of testing + marketplace prep. The rest is buffer.
