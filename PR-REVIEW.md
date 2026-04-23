# Pull Request Standards

## PR Title Format

```
<type>(<scope>): <subject> [TICKET-ID]
```

**Types:** feat, fix, refactor, docs, test, ci, chore, perf, security
**Scopes:** web, api, agents, cli, shared, db, ci, bot, monitor

Examples:

- `feat(bot): add Redis queue with 3 workers [MYC-42]`
- `fix(api): prevent duplicate debate creation on retry [MYC-55]`
- `refactor(agents): break orchestrator god functions into focused methods`

## PR Description Template

### Summary

1-3 bullet points describing what changed and WHY.

### Linear Ticket

- Ticket: MYC-XX
- Status before: In Progress
- Status after PR merge: Done (auto-updated by linear-sync.yml)

### Changes

#### Added

- List new files, features, endpoints

#### Modified

- List changed files with what changed and why

#### Removed

- List deleted files with justification

### Files Touched

```
path/to/file.py  — what changed
path/to/file.ts  — what changed
```

### How I Tested

- Start all services: `./run.sh`
- Deliberation tests: `cd apps/agents && python -m pytest tests/deliberation/ --noconftest`
- Bot tests: `python -m agents.scripts.test_pipeline_e2e`
- Type check: `pnpm typecheck`
- Lint: `pnpm lint`
- Manual test: [describe what you did]

### Checklist

- [ ] No duplicate types (use packages/shared/)
- [ ] Model IDs use full versions (claude-haiku-4-5-20251001)
- [ ] No hardcoded secrets
- [ ] No comments added to code (unless asked)
- [ ] External API calls wrapped in recovery/try-except
- [ ] Redis writes have error handling
- [ ] Tests pass
- [ ] No opus model usage in bot layer

### Screenshots / Logs

If UI change: attach screenshot
If bot change: paste relevant Slack/terminal output

## Branch Naming

```
feature/MYC-42-short-description
fix/MYC-55-short-description
refactor/short-description
```

## Commit Message Format

```
<type>(<scope>): <description>

<body — what and why, not how>
```

Keep subject under 72 characters. Body wraps at 80.

## Auto-Review Process

1. PR opened → claude-code-review.yml triggers automatically ( tagging needed)
2. Claude reviews with sonnet (haiku fallback)
3. Review comments posted → Slack notification via linear-sync.yml
4. Linear ticket updated with review status
5. CI checks run in parallel
6. On merge → Linear ticket transitions to Done → Slack notification
