# Slack Remote Control Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive Consilium debates from Slack. A bot installed to a workspace lets users run `/consilium <topic>`, gets a threaded reply with the live synthesis, supports follow-ups in-thread, and ties each thread to a Consilium session so the team's debate history is preserved in both Slack and the Consilium web app.

**Architecture:** A NestJS module under `apps/api/src/features/slack/` handles Slack OAuth, slash-command HTTPS endpoints, Events API webhooks, and Block Kit message rendering. Workspaces install via OAuth v2; tokens are stored encrypted per workspace. A worker maps Slack channel + thread → Consilium session ID and proxies SSE events as message updates (chat.update). Channels can be bound to a specific debate preset (mode + models) by an admin.

**Tech Stack:** `@slack/bolt` (HTTP receiver), `@slack/web-api`, NestJS Fastify, Prisma for workspace/channel storage, BullMQ for the "stream → Slack update" worker, Redis for OAuth-state.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/api/src/features/slack/slack.module.ts` | Create | NestJS module |
| `apps/api/src/features/slack/slack.controller.ts` | Create | OAuth callback + slash command + events endpoints |
| `apps/api/src/features/slack/slack.service.ts` | Create | Bolt app facade |
| `apps/api/src/features/slack/slack-installer.service.ts` | Create | OAuth state, token persistence |
| `apps/api/src/features/slack/slack-renderer.service.ts` | Create | Block Kit builders for debate state |
| `apps/api/src/features/slack/slack-channel-config.service.ts` | Create | Channel ↔ preset binding |
| `apps/api/src/features/slack/workers/slack-debate-stream.worker.ts` | Create | SSE → Slack message updates |
| `packages/database/prisma/schema.prisma` | Modify | Add SlackWorkspace, SlackChannelConfig, SlackThreadSession |
| `apps/web/app/integrations/slack/page.tsx` | Create | Settings UI to install/uninstall and bind channels |
| `apps/web/app/integrations/slack/install/route.ts` | Create | Server-side redirect to Slack OAuth start |
| `tests/api/slack/slack.controller.spec.ts` | Create | Signing-secret verification + slash command flow |

---

### Task 1: Slack App Manifest + OAuth

**Files:**
- Create: `apps/api/src/features/slack/manifest.yml` (committed for reproducibility)
- Create: `apps/api/src/features/slack/slack-installer.service.ts`
- Create: `apps/api/src/features/slack/slack.controller.ts` (OAuth callback only in this task)

- [ ] **Step 1: Define the manifest** with scopes `commands`, `chat:write`, `chat:write.public`, `app_mentions:read`, `channels:history`, `users:read.email`, `team:read`. Bot user named "Consilium". Slash command `/consilium`. Events: `app_mention`, `message.channels` (thread replies only).
- [ ] **Step 2: OAuth start route** `GET /api/v1/slack/install` redirects to `https://slack.com/oauth/v2/authorize?client_id=...&scope=...&state=<csrf>`. State stored in Redis with 10min TTL.
- [ ] **Step 3: OAuth callback** `GET /api/v1/slack/oauth/callback` exchanges the code, persists `SlackWorkspace` row (`teamId`, `accessToken` encrypted with `KEY_ENCRYPTION_KEY`, `botUserId`, `installerUserId`).
- [ ] **Step 4: Uninstall** route removes the workspace row and revokes the token.

---

### Task 2: Database Schema

**Files:**
- Modify: `packages/database/prisma/schema.prisma`

- [ ] **Step 1: SlackWorkspace** `{ teamId @id, teamName, accessToken (encrypted), botUserId, installerUserId, installedAt }`.
- [ ] **Step 2: SlackChannelConfig** `{ teamId, channelId, mode, models String[], pinnedConsiliumUserId, createdAt }`. Composite unique key on (teamId, channelId).
- [ ] **Step 3: SlackThreadSession** `{ teamId, channelId, threadTs, sessionId, debateId, createdAt }`. Maps a Slack thread to a Consilium debate.
- [ ] **Step 4: Migration** `pnpm db:migrate` after editing.

---

### Task 3: Slash Command Handler

**Files:**
- Modify: `apps/api/src/features/slack/slack.controller.ts`
- Create: `apps/api/src/features/slack/slack-renderer.service.ts`

- [ ] **Step 1: Verify signing secret** on every webhook. Reject with 401 if mismatch.
- [ ] **Step 2: Slash dispatch** `POST /api/v1/slack/commands`. Acknowledge within 3s with a placeholder "Consilium is debating..." Block Kit message. Spawn the actual debate asynchronously.
- [ ] **Step 3: Create a Consilium session** if the user has a linked Consilium account (matched via `users:read.email`). If not, prompt to link via a DM with a magic link to `apps/web /integrations/slack/link`.
- [ ] **Step 4: Persist SlackThreadSession** so subsequent thread replies attach to the same Consilium session.

---

### Task 4: SSE → Slack Message Updates

**Files:**
- Create: `apps/api/src/features/slack/workers/slack-debate-stream.worker.ts`

- [ ] **Step 1: Worker subscribes** to the debate's SSE stream via the existing internal API client (server-to-server).
- [ ] **Step 2: Throttle updates** to one `chat.update` per 2s to respect Slack's rate limits. Buffer events and re-render the Block Kit message.
- [ ] **Step 3: Final message** includes the synthesis (markdown → Slack mrkdwn via `slackify-markdown`), the model votes, and a button "Continue in Consilium" linking to the web debate page.
- [ ] **Step 4: Error handling** — if SSE drops, post a fallback message and keep the thread alive for the user to retry.

---

### Task 5: Thread Replies = Follow-ups

**Files:**
- Modify: `apps/api/src/features/slack/slack.controller.ts` (Events API handler)

- [ ] **Step 1: On `message.channels` event** with a `thread_ts` matching a known SlackThreadSession, treat the message as a follow-up to the bound Consilium session.
- [ ] **Step 2: Spawn a follow-up debate** using the session's mode + models. Stream into a new reply in the same thread.
- [ ] **Step 3: De-dupe**: ignore the bot's own messages (`bot_id === self`).
- [ ] **Step 4: 24h cutoff**: if the parent thread is older than 24h, post a "thread expired — start a new debate" reply instead.

---

### Task 6: Channel-Bound Presets (Admin UI)

**Files:**
- Create: `apps/web/app/integrations/slack/page.tsx`
- Create: `apps/web/app/integrations/slack/install/route.ts`
- Create: `apps/api/src/features/slack/slack-channel-config.service.ts`

- [ ] **Step 1: Settings page** lists installed workspaces and their channels (resolved via `conversations.list`).
- [ ] **Step 2: Per-channel form** picks a mode and a model preset. Saves to `SlackChannelConfig`.
- [ ] **Step 3: Slash command resolution** consults `SlackChannelConfig` first; falls back to the installer's account defaults.
- [ ] **Step 4: Uninstall button** revokes the workspace token and clears its rows.

---

### Task 7: Tests + Rate Limiting

**Files:**
- Create: `tests/api/slack/slack.controller.spec.ts`

- [ ] **Step 1: Signing-secret verification** tests with valid + invalid signatures.
- [ ] **Step 2: Slash command happy path** — assert 200 ack within 3s, debate kicked off, SlackThreadSession created.
- [ ] **Step 3: Follow-up thread test** — second message in thread spawns follow-up debate.
- [ ] **Step 4: Rate limit** the slash command at 10 req/min per workspace via Redis token bucket.

---

## Acceptance criteria

1. `/consilium What's the best way to do X?` in a workspace channel produces a threaded reply that streams the synthesis within 2s of debate completion.
2. Replying in the thread spawns a follow-up debate that updates the same Consilium session.
3. OAuth install completes in under 60s; uninstall fully removes workspace data.
4. Channel admins can bind a channel to a preset; the slash command honors the preset.
5. Signing-secret verification rejects malformed requests; tests cover both branches.
6. The web settings page shows all installed workspaces with channel-level configuration.
7. No Slack API rate-limit warnings in a debate that streams for 60s with 4 phases.

## Out of scope

- Slack Enterprise Grid org-level installs (workspace-level only in v1).
- DM-only debates (the bot is channel-first; DMs are a Phase 2 add).
- Auto-summary of long threads as new debate context.
- Slack canvas integration to persist debate transcripts.
- Microsoft Teams parity (separate plan).

## Estimated effort

4 engineer-weeks: 1.5 weeks Slack app + OAuth + DB schema, 1 week slash command + SSE worker, 1 week thread follow-ups + admin UI, 0.5 weeks tests + rate-limiting.
