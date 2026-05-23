# Desktop + Mobile Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Native shells (Electron desktop, React Native mobile) that reuse the existing API. Users get push notifications when long debates finish, can resume sessions from any device, and share synthesis results via the OS share sheet.

**Architecture:** Shared TypeScript core wraps the existing `@myconsilium/sdk` for transport. Desktop renders with React + Electron, mobile with React Native. Both surfaces share a `@consilium/client-core` package with state machines, session cache, and offline read support. Auth piggybacks on the same Clerk-issued tokens; deep-linking carries tokens from the web sign-in flow.

**Tech Stack:** Electron 33, React 19, React Native 0.78 (Expo SDK 53), Zustand for state, MMKV (mobile) / electron-store (desktop) for persistence, native push via APNS+FCM through Expo's notification service, OneSignal as fallback.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `packages/client-core/package.json` | Create | Shared client logic; published to internal npm only |
| `packages/client-core/src/session-store.ts` | Create | Cross-platform session cache (memory + KV adapter) |
| `packages/client-core/src/debate-machine.ts` | Create | XState chart for connect → stream → complete |
| `packages/client-core/src/auth.ts` | Create | Token persistence interface (impl injected per surface) |
| `apps/desktop/package.json` | Create | Electron app manifest |
| `apps/desktop/electron/main.ts` | Create | Main-process: window, deep-link handler, auto-update |
| `apps/desktop/electron/preload.ts` | Create | contextBridge surface for renderer |
| `apps/desktop/src/App.tsx` | Create | React root; renders sessions list + debate view |
| `apps/desktop/src/views/SessionsList.tsx` | Create | Mirror of TreeView semantics from VS Code extension |
| `apps/desktop/src/views/DebateView.tsx` | Create | Streaming synthesis + markdown render |
| `apps/desktop/src/native/notifications.ts` | Create | OS notification on debate completion |
| `apps/mobile/app.json` | Create | Expo config (bundle ID, splash, icons) |
| `apps/mobile/App.tsx` | Create | React Navigation entry |
| `apps/mobile/src/screens/SessionsScreen.tsx` | Create | List of saved sessions, pull-to-refresh |
| `apps/mobile/src/screens/DebateScreen.tsx` | Create | Streams synthesis; supports background-task continuation |
| `apps/mobile/src/screens/AuthScreen.tsx` | Create | OAuth deep-link from web sign-in |
| `apps/mobile/src/native/push.ts` | Create | Expo push registration + handler |
| `apps/mobile/src/native/share.ts` | Create | OS share sheet wrapper |
| `apps/api/src/features/devices/devices.controller.ts` | Create | Register push tokens for debate-complete pings |
| `apps/api/src/features/devices/devices.module.ts` | Create | NestJS module |
| `apps/api/src/features/notifications/debate-complete.notifier.ts` | Create | Hook into debate-complete queue → send push |

---

### Task 1: Shared Client Core

Both surfaces depend on a single TypeScript package so business logic doesn't fork.

**Files:**
- Create: `packages/client-core/` (full package, see file map)

- [ ] **Step 1: Define a KV adapter** with `get`, `set`, `delete`, `keys`. Desktop wraps electron-store, mobile wraps MMKV, tests use an in-memory map.
- [ ] **Step 2: SessionStore** caches the last 100 sessions in KV, hydrates on app boot, syncs in background.
- [ ] **Step 3: debateMachine** is an XState chart with states: `idle`, `connecting`, `streaming`, `complete`, `error`. It owns the SSE source and emits events the UI subscribes to.
- [ ] **Step 4: auth.ts** exposes `setToken`, `clearToken`, `getToken`, `onTokenChange`. Each surface implements the adapter using its native secure-storage primitive.

---

### Task 2: Desktop (Electron)

**Files:**
- Create: `apps/desktop/`

- [ ] **Step 1: Main process** registers `consilium://` deep-link handler so the web sign-in flow can drop a token into the app. Auto-updater uses electron-updater pointed at a GitHub Releases feed.
- [ ] **Step 2: Renderer (React)** routes between `Sessions`, `Debate`, `Settings`. Sessions list uses `react-window` for virtualization (some users have hundreds).
- [ ] **Step 3: System tray icon** with "New Debate", "Resume Last", "Open Window", "Quit" menu items.
- [ ] **Step 4: Notifications** fire on `debate.complete` with the synthesis snippet; clicking opens the app to that debate.

---

### Task 3: Mobile (React Native / Expo)

**Files:**
- Create: `apps/mobile/`

- [ ] **Step 1: Expo SDK 53** with `expo-router` for stack navigation. Bundle IDs `xyz.myconsilium.app`.
- [ ] **Step 2: AuthScreen** opens an in-app browser to `apps/web /cli/auth?from=mobile` which redirects back to `consilium://auth?token=…`.
- [ ] **Step 3: SessionsScreen** uses `FlashList` for large lists. Pull-to-refresh hits the API; offline mode reads from MMKV cache.
- [ ] **Step 4: DebateScreen** streams SSE via Expo's WebSocket (SSE not native; we use a Cloudflare Worker that converts SSE → WebSocket if running on iOS where SSE has historical bugs in background mode).
- [ ] **Step 5: Push notifications** via `expo-notifications`; register token with the API on first run.
- [ ] **Step 6: Background fetch** keeps long-running debates alive when the app is backgrounded (iOS BGTask, Android Foreground Service).

---

### Task 4: API — Device Registry + Push Notifications

**Files:**
- Create: `apps/api/src/features/devices/` (controller, service, module, prisma model)
- Create: `apps/api/src/features/notifications/debate-complete.notifier.ts`

- [ ] **Step 1: Prisma model `Device`** with `userId`, `platform` (`ios|android|electron`), `pushToken`, `lastSeenAt`.
- [ ] **Step 2: `POST /api/v1/devices`** registers / updates the push token. Auth via existing CLI/Clerk middleware.
- [ ] **Step 3: BullMQ consumer** listens to `debate.complete` and dispatches a push via Expo's `expo-server-sdk`. Group by user, dedupe by debate ID.
- [ ] **Step 4: Rate-limit** notifications to 1 per user per 60s for the same debate.

---

### Task 5: Share Integration

Desktop and mobile each expose "Share synthesis" via the OS share sheet (drag to Notes, AirDrop, Slack share extension, etc.).

**Files:**
- Modify: `apps/desktop/src/views/DebateView.tsx`
- Modify: `apps/mobile/src/screens/DebateScreen.tsx`
- Modify: `apps/api/src/features/sessions/sessions.controller.ts` (`POST /sessions/:id/share` already scaffolded by W10 share command)

- [ ] **Step 1: Desktop** invokes `webContents.send` to push the synthesis to a hidden window with `clipboard.writeText` + `shell.openExternal` to Slack share URL.
- [ ] **Step 2: Mobile** uses `expo-sharing` to invoke the share sheet. Generates a public share link via the API first.

---

### Task 6: Distribution

- [ ] **Step 1: Desktop** GitHub Actions release workflow builds macOS notarized DMG, Windows MSI, Linux AppImage. Signed with Apple Developer ID, EV cert for Windows.
- [ ] **Step 2: Mobile** EAS Build with internal track on TestFlight + Play Console. Submit to public after a beta cohort.
- [ ] **Step 3: App Store metadata** screenshots in 5 device sizes; privacy disclosures.

---

## Acceptance criteria

1. Electron app launches in under 1.5s on M1 Air; bundle under 90 MB.
2. Mobile cold start under 2s on a Pixel 6; APK under 30 MB.
3. SSE streams render at 60fps on both surfaces (no jank during debate streaming).
4. Push notification arrives within 5s of debate completion.
5. Sign-in from web → desktop deep link completes without copy-paste.
6. Offline mode shows the last 50 sessions read-only.
7. CI builds and publishes to GitHub Releases on tag push.

## Out of scope

- Native macOS Catalyst port (Electron suffices).
- Apple Watch / Wear OS companion apps.
- Cross-platform notification preferences UI (basic on/off only in v1).
- In-app billing (web Stripe checkout remains canonical).
- Voice input (covered by `2026-05-20-voice-dictation.md`).

## Estimated effort

6 engineer-weeks: 2 weeks shared core + desktop, 2.5 weeks mobile + push notification backend, 1.5 weeks release pipeline and store approval.
