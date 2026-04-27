# CLI UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all CLI UX issues: 413 payload errors, missing codebase permission prompts, broken chat experience with no slash command UI, and no chat management in interactive mode.

**Architecture:** Six focused fixes targeting the critical path a user takes when running `consilium` or `consilium chat`. The 413 is the root blocker (Fastify default 1MB body limit vs 4MB scanned context). Permission prompt exists but is silently skipped when already stored. Chat REPL has 35+ slash commands but no discoverability. Menu lacks chat management.

**Tech Stack:** TypeScript, Node.js readline, Fastify (NestJS), raw terminal ANSI codes

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/api/src/main.ts` | Modify | Increase Fastify body limit for CLI payloads |
| `packages/cli/src/utils/project-scanner.ts` | Modify | Add payload budget to prevent oversized context |
| `packages/cli/src/utils/codebase-permissions.ts` | Modify | Always prompt on first run per project, reset stale permissions |
| `packages/cli/src/utils/workspace-debate-context.ts` | Modify | Enforce max payload size before sending |
| `packages/cli/src/commands/chat.ts` | Modify | Add slash command autocomplete, improve input UX |
| `packages/cli/src/commands/menu.ts` | Modify | Add chat management options (New Chat, Resume Chat) |
| `packages/cli/src/commands/chat-slash-dispatch.ts` | Modify | Add `/new` command, improve `/help` grouping |

---

### Task 1: Fix 413 — Increase API Body Limit

The Fastify adapter uses its default 1MB body limit. CLI sends up to 4MB of scanned project files. Fix both sides: increase API limit AND cap CLI payload.

**Files:**
- Modify: `apps/api/src/main.ts:36-38`

- [ ] **Step 1: Write the change**

In `apps/api/src/main.ts`, update the FastifyAdapter constructor to set a 5MB body limit:

```typescript
new FastifyAdapter({
  logger: { level: resolveFastifyLogLevel() },
  bodyLimit: 5 * 1024 * 1024,
}),
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit -p apps/api/tsconfig.json`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/main.ts
git commit -m "fix(api): increase Fastify body limit to 5MB for CLI context payloads"
```

---

### Task 2: Fix 413 — Cap CLI Context Payload Size

Even with the API limit raised, the CLI should never send more than it needs. The project scanner loads up to 12MB / 2000 files. Add a budget that caps what actually gets sent to the API at 1MB of file content.

**Files:**
- Modify: `packages/cli/src/utils/project-scanner.ts:25-27`
- Modify: `packages/cli/src/utils/workspace-debate-context.ts:47-52`

- [ ] **Step 1: Reduce scanner defaults**

In `packages/cli/src/utils/project-scanner.ts`, change the constants:

```typescript
const DEFAULT_MAX_FILES = 500;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;  // 2MB (was 12MB)
const DEFAULT_MAX_DEPTH = 12;               // was 18
```

- [ ] **Step 2: Add payload budget to context builder**

In `packages/cli/src/utils/workspace-debate-context.ts`, after scanning, truncate files to fit a budget before returning. After line 52 (`content: f.content,`), add truncation logic:

```typescript
const PAYLOAD_BUDGET = 1.5 * 1024 * 1024; // 1.5MB max for API payload
let totalBytes = 0;
const budgetedFiles: Array<{ name: string; content: string }> = [];
for (const f of projectFiles) {
  const size = Buffer.byteLength(f.content, 'utf-8');
  if (totalBytes + size > PAYLOAD_BUDGET) break;
  totalBytes += size;
  budgetedFiles.push({ path: f.path, content: f.content });
}
const files = budgetedFiles.map((f) => ({ name: f.path, content: f.content }));
```

Replace the existing `const files = projectFiles.map(...)` with this block.

- [ ] **Step 3: Rebuild and test**

Run: `cd packages/cli && pnpm build && node dist/index.js debate "test" --mode quick -m llama-3.1-8b-instant llama-3.3-70b-versatile`
Expected: No 413 error. Context loads but stays within budget.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/utils/project-scanner.ts packages/cli/src/utils/workspace-debate-context.ts
git commit -m "fix(cli): cap context payload to 1.5MB to prevent 413 errors"
```

---

### Task 3: Fix Codebase Permission — Always Prompt on New Projects

The permission system works but stores `always` grants in `~/.consilium/permissions.json`. A fresh install that inherited permissions from a previous session silently loads the codebase. Fix: show a notice when using stored permissions, and add a `--no-context` default for first-time users.

**Files:**
- Modify: `packages/cli/src/utils/codebase-permissions.ts:257-283`

- [ ] **Step 1: Add stored-permission notice**

In `requestCodebasePermission()`, after the existing check for stored permission (around line 259), add a notice when using a previously-stored `always` grant:

```typescript
export async function requestCodebasePermission(
  scopePath: string,
): Promise<boolean> {
  const normalized = normalizeScopePath(scopePath);
  const existing = getReadPermission(normalized);

  if (existing === 'deny') return false;
  if (existing === 'always') {
    console.log(
      style().dim(`  Codebase read access: granted (stored). Revoke with: /codebase revoke`),
    );
    return true;
  }
  if (existing === 'session') return true;

  if (!process.stdin.isTTY) return false;

  const answer = await askChoice(
    `\n  Consilium wants to read project files under ${normalized}.\n  Allow read access? [n/session/always] `,
  );
  // ... rest unchanged
```

- [ ] **Step 2: Rebuild and test**

Delete `~/.consilium/permissions.json` to simulate fresh install:
```bash
rm ~/.consilium/permissions.json 2>/dev/null; cd packages/cli && pnpm build && node dist/index.js debate "test" --mode quick -m llama-3.1-8b-instant llama-3.3-70b-versatile
```
Expected: Sees permission prompt before loading files.

- [ ] **Step 3: Commit**

```bash
git add packages/cli/src/utils/codebase-permissions.ts
git commit -m "fix(cli): show stored-permission notice and always prompt fresh installs"
```

---

### Task 4: Fix Chat — Slash Command Discoverability

When user types `/` in the chat REPL, show available commands instead of treating it as a debate topic. Add tab completion for slash commands.

**Files:**
- Modify: `packages/cli/src/commands/chat.ts:256-347`

- [ ] **Step 1: Add slash command autocomplete to readline**

In `chat.ts`, where the readline interface is created (around line 390), add a completer function:

```typescript
const SLASH_COMMANDS = [
  '/ask', '/mode', '/estimate', '/output', '/file', '/image',
  '/workspace', '/context', '/clear', '/status', '/manifest',
  '/models', '/save', '/history', '/sessions', '/search',
  '/api', '/keys', '/codebase', '/permissions', '/apply',
  '/rollback', '/review', '/scope', '/gitdiff', '/help',
  '/exit', '/new', '/rename', '/delete', '/redo',
];

function completer(line: string): [string[], string] {
  if (line.startsWith('/')) {
    const hits = SLASH_COMMANDS.filter((c) => c.startsWith(line));
    return [hits.length ? hits : SLASH_COMMANDS, line];
  }
  return [[], line];
}
```

Update the readline.createInterface call to include the completer:

```typescript
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  history: [] as string[],
  completer,
});
```

- [ ] **Step 2: Show command list when user types just "/"**

In the REPL loop (around line 272-322), before routing to slash dispatch, handle the bare "/" case:

```typescript
if (trimmed === '/') {
  printHelp();
  runReplLoop();
  return;
}
```

- [ ] **Step 3: Rebuild and test**

Run: `cd packages/cli && pnpm build && node dist/index.js chat`
Type `/` and press Enter — should show help.
Type `/m` and press Tab — should autocomplete to `/mode` or show `/mode /models /manifest`.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/chat.ts
git commit -m "feat(cli): add slash command autocomplete and / help in chat"
```

---

### Task 5: Fix Chat — Add /new Command and Chat Management

Add `/new` to start a fresh conversation within the chat REPL, and `/resume <id>` to switch sessions.

**Files:**
- Modify: `packages/cli/src/commands/chat-slash-dispatch.ts`

- [ ] **Step 1: Add /new handler**

In `chat-slash-dispatch.ts`, add a handler for `/new` that resets the session:

```typescript
if (cmd === 'new') {
  session.reset();
  console.log(st.success('Started a new conversation.'));
  return 'continue';
}
```

And in `ChatSession` class (`chat-session.ts`), add a `reset()` method:

```typescript
reset(): void {
  this.data.debates = [];
  this.data.id = generateId('session');
  this.data.contextFilePaths = [];
  this.data.contextImagePaths = [];
}
```

- [ ] **Step 2: Add /resume handler**

In the slash dispatch, add:

```typescript
if (cmd === 'resume') {
  if (!args[0]) {
    console.log(st.error('Usage: /resume <sessionId>'));
    return 'continue';
  }
  const loaded = loadSession(args[0]);
  if (!loaded) {
    console.log(st.error(`Session ${args[0]} not found.`));
    return 'continue';
  }
  session.loadFrom(loaded);
  console.log(st.success(`Resumed session: ${loaded.name || args[0]}`));
  console.log(st.dim(`  ${loaded.debates.length} previous debate(s)`));
  return 'continue';
}
```

- [ ] **Step 3: Update /help to show new commands**

Add `/new` and `/resume` to the Session section of `printHelp()`.

- [ ] **Step 4: Rebuild and test**

Run: `cd packages/cli && pnpm build && node dist/index.js chat`
Type `/new` — should reset session.
Type `/sessions` — should list available sessions.
Type `/resume <id>` — should load that session.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/commands/chat-slash-dispatch.ts packages/cli/src/commands/chat-session.ts packages/cli/src/commands/chat.ts
git commit -m "feat(cli): add /new and /resume commands for chat management"
```

---

### Task 6: Fix Menu — Add Chat Management Options

The interactive menu (shown when running bare `consilium`) has no way to resume chats or manage sessions.

**Files:**
- Modify: `packages/cli/src/commands/menu.ts:9-18`
- Modify: `packages/cli/src/commands/menu.ts:52-112`

- [ ] **Step 1: Add menu items**

Update `MENU_ITEMS` array:

```typescript
const MENU_ITEMS = [
  'Start a Debate',
  'Interactive Chat',
  'Resume Chat',
  'Red Team Assessment',
  'Blind Evaluation',
  'Quick Mode',
  'Configure API Keys',
  'View Stats',
  'Logout',
] as const;
```

- [ ] **Step 2: Add Resume Chat action**

In `executeAction`, add the handler for "Resume Chat" that lists sessions and lets user pick one:

```typescript
case 2: { // Resume Chat
  const sessions = listSessions();
  if (sessions.length === 0) {
    console.log(st.dim('\n  No saved sessions.\n'));
    return true;
  }
  console.log(st.brand('\n  Saved Sessions:\n'));
  for (let i = 0; i < Math.min(sessions.length, 10); i++) {
    const s = sessions[i];
    console.log(`  ${i + 1}. ${s.name || 'Untitled'} (${s.debateCount} debates)`);
    console.log(st.dim(`     ID: ${s.id}\n`));
  }
  console.log(st.dim('  Run: consilium sessions resume <id>\n'));
  return true;
}
```

- [ ] **Step 3: Rebuild and test**

Run: `cd packages/cli && pnpm build && node dist/index.js`
Expected: Menu shows "Interactive Chat" and "Resume Chat" as options 2 and 3.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/menu.ts
git commit -m "feat(cli): add Resume Chat and reorder interactive menu"
```

---

### Task 7: Integration Test — Full Chat Flow

Verify the complete user journey works end-to-end.

- [ ] **Step 1: Delete stored permissions to simulate fresh install**

```bash
rm ~/.consilium/permissions.json 2>/dev/null
```

- [ ] **Step 2: Run `consilium chat` and verify permission prompt**

Run: `node dist/index.js chat`
Expected: Sees "Consilium wants to read project files under /path. Allow read access? [n/session/always]"

- [ ] **Step 3: Grant session permission and verify context loads within budget**

Type `session`
Expected: Context loads, shows file count, stays under 1.5MB budget

- [ ] **Step 4: Type `/` and verify help shows**

Expected: Shows all available slash commands grouped by category

- [ ] **Step 5: Type a debate topic and verify no 413**

Type: `What is 2+2?`
Expected: Debate completes successfully with golden prompt

- [ ] **Step 6: Type `/new` and verify fresh session**

Expected: "Started a new conversation."

- [ ] **Step 7: Run vitest**

Run: `cd packages/cli && npx vitest run`
Expected: All tests pass

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "test: verify full chat UX flow end-to-end"
```

---

## Execution Order

Tasks 1-2 are the critical blockers (413 fix). Task 3 fixes permissions. Tasks 4-5 fix chat UX. Task 6 fixes the menu. Task 7 is integration verification.

Tasks 1 and 2 can run in parallel. Tasks 4 and 5 can run in parallel. Everything else is sequential.
