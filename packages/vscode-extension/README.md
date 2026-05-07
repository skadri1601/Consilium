# Consilium for VS Code & Cursor

Multi-AI council inside your editor. Run debates, deliberations, and red-team
assessments backed by GPT-5, Claude, Gemini, Groq, and xAI without leaving the
IDE.

## Features

- **Sidebar council** - chat-style transcript that streams every agent token
  live as the council debates.
- **Editor commands** - right-click any selection to debate or red-team it.
- **Eight modes** - quick, council, deep, blind, redteam, jury, market, and
  auto. Pick from the command palette or the composer.
- **Workspace context** - automatically sends a redacted snapshot of your
  workspace so the council answers in context. Secrets are scrubbed and
  `.gitignore`d files are excluded.
- **Sessions tree** - browse, reopen, rename, archive, or delete past debates
  from the activity bar.
- **Status bar** - live progress, round counter, and running cost.
- **BYOK** - bring your own provider keys (OpenAI, Anthropic, Google, Groq,
  xAI, Moonshot, OpenRouter). Stored in VS Code's encrypted SecretStorage.
- **Insert golden prompt** - drop the judge's consensus into your file at the
  cursor or open it in a new buffer.

## Requirements

- VS Code 1.85+ (or any compatible editor like Cursor / Windsurf)
- A Consilium account at [myconsilium.xyz](https://myconsilium.xyz)

## Sign in

1. Run **Consilium: Sign In** from the command palette.
2. Your browser opens `https://myconsilium.xyz/cli/auth`. Generate a CLI token.
3. Paste the token (starts with `consilium_`) back into VS Code. The token is
   stored in SecretStorage; nothing is written to settings.json or your disk.

## Default keybindings

| Action             | Shortcut         |
| ------------------ | ---------------- |
| New debate         | `Ctrl/Cmd+Alt+C` |
| Debate selection   | `Ctrl/Cmd+Alt+D` |
| Red-team selection | `Ctrl/Cmd+Alt+R` |

## Settings

| Setting                             | Default                                         | Description                                    |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `consilium.apiUrl`                  | `https://api.myconsilium.xyz`                   | Consilium API origin                           |
| `consilium.webUrl`                  | `https://myconsilium.xyz`                       | Web app origin (sign-in)                       |
| `consilium.defaultMode`             | `council`                                       | Default debate mode                            |
| `consilium.defaultModels`           | gpt-5.4-mini, haiku-4.5, gemini-3-flash-preview | Models on every debate                         |
| `consilium.includeWorkspaceContext` | `true`                                          | Send redacted workspace files with each debate |
| `consilium.contextBudgetKB`         | `512`                                           | Max KB of workspace context per request        |
| `consilium.respectGitIgnore`        | `true`                                          | Honor `.gitignore` when scanning workspace     |
| `consilium.autoApplyGoldenPrompt`   | `false`                                         | Auto-open consensus as a diff                  |

## Privacy

Workspace context is scanned only when `consilium.includeWorkspaceContext` is
enabled. Files matched by `.gitignore`, secret-prefixed filenames (`.env`,
`*.pem`, etc.), and high-entropy secret patterns (AWS keys, GitHub tokens, JWTs)
are excluded or redacted before any payload leaves your machine.

## Roadmap

- Inline diff view for judge-proposed code edits
- MCP tool bridge for `tool:call_request` events
- Persona picker
- Multi-conversation tabs
