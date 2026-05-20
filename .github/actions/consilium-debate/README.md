# Consilium Debate Action

Run a Consilium multi-agent debate from a GitHub Actions workflow and capture the synthesis as a workflow output. Pairs with the more specialized `consilium-review` action by giving you the raw deliberation surface for any topic (release notes, RFC review, incident postmortem, etc.).

## Quick start

```yaml
- uses: ./.github/actions/consilium-debate
  with:
    topic: "Should we adopt RSC for the dashboard rewrite?"
    mode: council
    models: "claude-sonnet-4-6,gpt-5.4"
    api-key: ${{ secrets.CONSILIUM_API_KEY }}

- run: echo "${{ steps.debate.outputs.synthesis }}"
```

Use `id: debate` on the step to read `outputs.synthesis` and `outputs.debate-id` from downstream jobs.

## Inputs

| Input          | Required | Default              | Description                                                                                                            |
| -------------- | -------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `topic`        | yes      |                      | Debate topic or question.                                                                                              |
| `mode`         | no       | `council`            | Mode: `council`, `quick`, `deep`, `blind`, `redteam`, `jury`, `market`, `auto`.                                        |
| `models`       | no       | (user defaults)      | Comma-separated model IDs. Empty uses the account's defaults.                                                          |
| `api-url`      | no       | hosted API           | Override the API origin (e.g., self-hosted Consilium).                                                                 |
| `api-key`      | no       |                      | Consilium CLI token (`consilium_…`). Required when calling the hosted API.                                             |
| `cli-version`  | no       | `latest`             | Pin the `@myconsilium/cli` version published to npm.                                                                   |
| `node-version` | no       | `20`                 | Node version installed by `actions/setup-node`.                                                                        |

## Outputs

| Output       | Description                                                       |
| ------------ | ----------------------------------------------------------------- |
| `synthesis`  | Final synthesis text from the debate (raw markdown / plaintext).  |
| `debate-id`  | Debate ID from the JSON envelope, when present.                   |

## How it works

1. Installs Node and runs `npx @myconsilium/cli@<version> debate "<topic>" --mode <mode> --output-format json` so the result is machine-readable.
2. Writes the CLI token to `$HOME/.consilium/config.json` if `api-key` is set, so the CLI can authenticate.
3. Parses the JSON with `jq` to pull the `synthesis` / `text` field and the `debateId`.
4. Writes both to `$GITHUB_OUTPUT` using the multiline heredoc syntax.

## Status

Scaffold action. Wired against the published `@myconsilium/cli` headless output (Workstream 7 adds `--output-format json`). Until that lands, the JSON parse falls back to raw stdout, so the synthesis output still contains the deliberation text.

See `docs/superpowers/specs/2026-05-20-cli-sandbox-design.md` and `docs/superpowers/specs/2026-05-20-web-search-grounding.md` for related deferred work.
