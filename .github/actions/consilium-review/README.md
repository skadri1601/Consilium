# Consilium Multi-Model PR Review Action

A GitHub Action that runs multi-model AI deliberation on pull request changes. Multiple AI models independently review code, then findings are synthesized and deduplicated.

## Usage

```yaml
- uses: consilium/review-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    models: "claude-sonnet-4-6,gpt-5.4"
    mode: "redteam"
```

### With Consilium API (hosted engine)

```yaml
- uses: consilium/review-action@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    api-url: ${{ secrets.CONSILIUM_API_URL }}
    mode: "council"
    max-rounds: "3"
    fail-on-critical: "true"
```

### Local composite action (monorepo)

```yaml
- uses: ./.github/actions/consilium-review
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    models: "claude-sonnet-4-6"
```

## Inputs

| Input               | Required | Default                     | Description                              |
| ------------------- | -------- | --------------------------- | ---------------------------------------- |
| `github-token`      | Yes      |                             | GitHub token for posting reviews         |
| `anthropic-api-key` | Yes      |                             | Anthropic API key                        |
| `openai-api-key`    | No       | `''`                        | OpenAI API key                           |
| `models`            | No       | `claude-sonnet-4-6,gpt-5.4` | Comma-separated model IDs                |
| `mode`              | No       | `redteam`                   | Deliberation mode                        |
| `api-url`           | No       | `''`                        | Consilium API URL (direct mode if empty) |
| `max-rounds`        | No       | `3`                         | Maximum deliberation rounds              |
| `max-diff-size`     | No       | `12000`                     | Max diff chars (0 = unlimited)           |
| `post-as-review`    | No       | `true`                      | Post as PR review vs issue comment       |
| `fail-on-critical`  | No       | `false`                     | Fail action on critical findings         |

### Model availability and keys

- Each model ID in `models` must be callable with the API keys you supply. If a key for a provider is missing, that provider’s models are skipped in **direct mode** (no `api-url`): the action does not fall back to another paid model for the same slot.
- If `api-url` is set, the hosted engine handles routing; key inputs may still be required depending on your deployment.
- To avoid failures, either supply `openai-api-key` / `anthropic-api-key` (and others) for every provider you list in `models`, or narrow `models` to providers you have keys for (e.g. only Claude models with `anthropic-api-key` only).

## Outputs

| Output           | Description                 |
| ---------------- | --------------------------- |
| `review-body`    | Formatted review markdown   |
| `findings-count` | Total number of findings    |
| `critical-count` | Number of critical findings |

## Modes

| Mode      | Description                                                                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `redteam` | Attack/defend/judge cycle; findings are grouped into five review dimensions (security, bugs, performance, quality, edge cases). Security-style issues can span multiple sub-types within the security dimension. |
| `council` | Multi-model debate with cross-examination and rebuttal                                                                                                                                                           |
| `blind`   | Independent reviews with blind evaluation                                                                                                                                                                        |
| `jury`    | Ranked-choice voting on findings                                                                                                                                                                                 |
| `deep`    | Extended multi-round deliberation                                                                                                                                                                                |

## How It Works

1. Fetches the PR diff via GitHub CLI
2. If `api-url` is set, sends the diff to the Consilium deliberation engine
3. If no API URL, calls each model directly with the review prompt
4. Parses structured findings (security, bugs, performance, quality, edge cases)
5. Deduplicates findings across models, keeping highest severity
6. Posts a PR review with inline comments on affected lines
7. Optionally fails the check if critical findings exist

## Review Categories

- Security vulnerabilities (injection, auth bypass, SSRF, data exposure)
- Bugs and errors (null refs, race conditions, logic errors)
- Performance issues (N+1 queries, memory leaks)
- Code quality (error handling, naming, duplication)
- Edge cases (boundary conditions, empty inputs)
