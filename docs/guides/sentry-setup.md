# Sentry Setup & Configuration

This guide details the Sentry integration for the Consilium platform, spanning the Web (Next.js), API (NestJS), and Agents (FastAPI/Python) services.

## Configuration

### 1. Web (Next.js)
- **Tracing:** Enabled with `tracesSampleRate: 1.0` in `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`.
- **Session Replay:** Enabled in `src/instrumentation-client.ts` with:
  - `replaysSessionSampleRate`: 0.1 (10% of sessions)
  - `replaysOnErrorSampleRate`: 1.0 (100% of sessions with errors)

### 2. API (NestJS)
- **Tracing:** Enabled in `src/main.ts` if `SENTRY_DSN` is present.
- **Sample Rate:** `tracesSampleRate: 1.0`.

### 3. Agents (Python/FastAPI)
- **Tracing:** Enabled in `src/main.py`.
- **Configuration:** `sentry_dsn` is loaded from `src/shared/config/settings.py`.
- **Sample Rate:** `traces_sample_rate=1.0`.

## Recommended Alert Rules

To ensure effective monitoring without notification fatigue, we recommend configuring the following alert rules in the Sentry Dashboard:

### Critical Errors
- **Condition:** Event is `level:fatal` OR `level:error` AND `count` > 10 in 1 hour.
- **Action:** Notify `#dev-ops` via Slack/Email.

### Frontend Crashes (Session Replay)
- **Condition:** Issue category is `Crash` (Unhandled Exception).
- **Action:** Notify `#frontend-team`.
- **Note:** Use the "Replay" link in the issue to watch the user session leading up to the crash.

### API Latency (Performance)
- **Condition:** Transaction duration > 2000ms (p95) for `POST /api/v1/council/debate`.
- **Action:** Notify `#backend-team`.

### Agent Failures
- **Condition:** Tags `service:consilium-agents` AND `level:error`.
- **Action:** Notify `#ai-team`.

## Environment Variables

Ensure the following environment variables are set in your `.env` or deployment configuration:

```bash
# Web
NEXT_PUBLIC_SENTRY_DSN=your_dsn_here

# API
SENTRY_DSN=your_dsn_here

# Agents
SENTRY_DSN=your_dsn_here
```
