# consilium-vscode

> Consilium for VS Code (and Cursor) is the multi-AI council extension that runs Claude, GPT-5, Gemini, Grok, Groq, Kimi, and OpenRouter models against your selected code, files, staged diffs, or failing tests in parallel and returns a synthesized answer with explicit dissent inside a live debate panel.

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/myconsilium.consilium-vscode?label=marketplace)](https://marketplace.visualstudio.com/items?itemName=myconsilium.consilium-vscode)
[![installs](https://img.shields.io/visual-studio-marketplace/i/myconsilium.consilium-vscode)](https://marketplace.visualstudio.com/items?itemName=myconsilium.consilium-vscode)
[![tests](https://img.shields.io/github/actions/workflow/status/skadri1601/consilium-vscode/ci.yml?label=tests)](https://github.com/skadri1601/consilium-vscode/actions)

## What it is

Consilium for VS Code is the official extension that puts the Consilium
multi-AI council directly in your editor. Right-click code, ask a
question, watch seven LLM providers argue it out in a live panel, and
get a synthesized answer that survived adversarial cross-examination.
Works in VS Code (Marketplace), Cursor (via OpenVSX), and Codium.

## Why Consilium for VS Code

- **Right-click integration** - "Debate selected code", "Debate this file", "Review staged changes", "Debate the failing test output" land in your context menu and command palette.
- **7 first-class LLM providers** in a single debate: OpenAI, Anthropic, Google, xAI, Groq, Moonshot, OpenRouter.
- **8 deliberation modes** - `auto`, `quick`, `council`, `deep`, `blind`, `redteam`, `jury`, `market` - configurable as the workspace default.
- **Live debate panel** with per-agent cards, per-round progress, convergence score, dissent report, and the final synthesis.
- **Debate history in the activity bar** - jump into any past debate from this workspace or any workspace tied to your account.
- **SCM title-bar entry** for one-click "Review staged changes" without leaving the Source Control view.
- **Status bar entry** for one-click debate from any cursor position.
- **Cross-tool single sign-on** - auto-detects the Consilium CLI token at `~/.consilium/config.json`, no second login required.
- **Free-tier fallback** - no provider keys? The managed Groq + OpenRouter pool runs the debate for free. BYOK always wins when a key is present.

## Quickstart

```text
1. Open VS Code or Cursor.
2. Ctrl/Cmd-P  ->  ext install myconsilium.consilium-vscode
   (or search "Consilium" in the Extensions sidebar.)
3. Cmd/Ctrl-Shift-P  ->  "Consilium: Sign in"
   (Auto-detects the CLI token if you already have one.)
4. Highlight any code  ->  Right-click  ->  "Consilium: Debate selected code"
```

Under 60 seconds end-to-end on a typical machine.

## Install

### VS Code Marketplace

```text
Ctrl/Cmd-P  ->  ext install myconsilium.consilium-vscode
```

### OpenVSX (Cursor / Codium)

The extension is published to OpenVSX and auto-imported by Cursor. Search
for "Consilium" in the Extensions sidebar.

## Commands

| Command                                        | Where it fires from                                |
| ---------------------------------------------- | -------------------------------------------------- |
| `Consilium: Debate a topic`                    | Command palette                                    |
| `Consilium: Debate selected code`              | Right-click in editor, command palette             |
| `Consilium: Debate this file`                  | Right-click in editor or Explorer, command palette |
| `Consilium: Review staged changes`             | SCM title bar, command palette                     |
| `Consilium: Debate the failing test output`    | Command palette (auto-detects your test command)   |
| `Consilium: Apply edits from latest synthesis` | Command palette (after a debate completes)         |
| `Consilium: Open debate history`               | Activity bar, command palette                      |
| `Consilium: Sign in` / `Consilium: Sign out`   | Command palette                                    |

## Views

| View                     | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| Activity bar - Consilium | Debate history, agent cards, account status                                 |
| Debate panel             | Live agent cards, per-round progress, convergence, dissent, final synthesis |
| Status bar entry         | One-click "Debate a topic" from anywhere                                    |
| SCM title bar            | One-click "Review staged changes"                                           |

## Configuration

| Setting key                      | Default                       | What it does                                                             |
| -------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `consilium.apiUrl`               | `https://api.myconsilium.xyz` | API base URL - override for self-hosted or local                         |
| `consilium.defaultMode`          | `auto`                        | One of `auto / quick / council / deep / blind / redteam / jury / market` |
| `consilium.defaultModels`        | `[]`                          | Override council model list. Empty = engine picks based on mode          |
| `consilium.toolsEnabled`         | `true`                        | Advertise built-in Read / Grep / Glob tool schemas to the council        |
| `consilium.autoAttachGitContext` | `true`                        | Auto-attach branch + uncommitted diff + recent commits to every debate   |
| `consilium.testCommand`          | `""`                          | Override auto-detect for "Debate the failing test output"                |
| `consilium.applyEditsPrompt`     | `always`                      | `always`, `once`, or `never` for the pre-apply confirmation prompt       |
| `consilium.streamUpdates`        | `true`                        | Stream SSE updates into the debate panel as they arrive                  |

Configure per-user (settings.json) or per-workspace (`.vscode/settings.json`).

## Sign in

```text
Cmd/Ctrl-Shift-P  ->  "Consilium: Sign in"
```

The extension auto-detects an existing CLI token at
`~/.consilium/config.json` (cross-tool single sign-on with the Consilium
CLI). Otherwise it opens a browser tab to grant a token.

## Bring your own keys (BYOK)

Sign in once, then add provider keys at <https://myconsilium.xyz/settings>.
The extension picks them up on the next debate. Without keys, the council
runs on a managed free-tier pool (Groq + OpenRouter) and emits a
`routing:fallback` event in the debate panel so you always know when the
fallback is engaged.

## Privacy and permissions

- Auth tokens stored in VS Code `SecretStorage` (encrypted at rest).
- File contents are sent to the Consilium API only when you explicitly
  run a "Debate" command. The extension never sends file contents on
  background events (open / save / typing).
- Automatic git context attachment can be disabled per workspace
  (`consilium.autoAttachGitContext`).
- The extension never auto-applies edits. Every edit goes through a
  preview prompt; the default is `always`.

## Comparison

| Feature                            | Consilium for VS Code        | GitHub Copilot       | Cursor (native)     | Cline              | Continue.dev       |
| ---------------------------------- | ---------------------------- | -------------------- | ------------------- | ------------------ | ------------------ |
| Multi-provider debate              | yes - 7 providers per debate | single provider      | single (per chat)   | single per session | single per chat    |
| Right-click debate command         | yes                          | yes (single agent)   | yes (single agent)  | yes (single agent) | yes (single agent) |
| Live debate panel with agent cards | yes                          | no                   | no                  | partial            | no                 |
| Staged-diff council review         | yes                          | no                   | partial             | yes                | partial            |
| Failing-test debate                | yes (auto-detects test cmd)  | partial              | no                  | yes                | partial            |
| Convergence + dissent reporting    | yes                          | no                   | no                  | no                 | no                 |
| Apply edits with preview gate      | yes (always by default)      | yes                  | yes                 | yes                | yes                |
| CLI single sign-on                 | yes                          | no                   | partial             | no                 | no                 |
| BYOK across 7 providers            | yes                          | no                   | yes                 | yes                | yes                |
| Free-tier fallback                 | yes - Groq + OpenRouter pool | Copilot subscription | Cursor subscription | no                 | no                 |

## Related packages

- CLI: [`@myconsilium/cli`](https://www.npmjs.com/package/@myconsilium/cli) on npm
- TypeScript SDK: [`@myconsilium/sdk`](https://www.npmjs.com/package/@myconsilium/sdk) on npm
- Python SDK: [`consilium`](https://pypi.org/project/consilium/) on PyPI
- MCP server: `consilium-mcp` (ships with the Python SDK)

## Docs

- [VS Code extension guide](https://myconsilium.xyz/docs/vscode)
- [Quickstart](https://myconsilium.xyz/docs/getting-started)
- [How it works](https://myconsilium.xyz/docs/how-it-works)
- [Deliberation modes](https://myconsilium.xyz/docs/modes)
- [Provider catalog](https://myconsilium.xyz/docs/providers)

## Support

- Issues: <https://github.com/skadri1601/consilium-vscode/issues>
- Email: <support@myconsilium.xyz>
