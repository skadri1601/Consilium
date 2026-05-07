# Consilium Web

Next.js 15.2.3 frontend for Consilium. Hosted on Vercel.

## Tech Stack

| Category   | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Framework  | Next.js 15.2.3 (App Router)                          |
| Hosting    | Vercel                                               |
| Language   | TypeScript                                           |
| Auth       | Clerk (`@clerk/nextjs ^6.0.0`) + webhook support     |
| UI         | shadcn/ui + Radix UI                                 |
| Styling    | Tailwind CSS + `tailwindcss-animate` + Framer Motion |
| State      | Zustand ^5.0.0 + TanStack Query ^5.60.0              |
| Forms      | react-hook-form + zod                                |
| Charts     | Recharts ^2.14.0                                     |
| Payments   | Stripe ^17.0.0 + Svix webhooks                       |
| Monitoring | Sentry (`@sentry/nextjs`) with Session Replay        |
| Theme      | next-themes (dark mode forced)                       |
| Testing    | Vitest + Playwright                                  |

### Radix UI Primitives

accordion, alert-dialog, avatar, dialog, dropdown-menu, label, popover, select, separator, tabs, toast, tooltip

### Stores

- `council` store (Zustand)
- `user` store (Zustand)

## Features

- 4 debate modes: quick, council, deep, blind (via DebateModeSelector)
- Agent selector: multi-model selection across providers
- BYOK key management: bring your own API keys, configured in settings
- SSE streaming: live debate updates as responses arrive
- Cost tracking and analytics: per-model token usage and spend
- Debate history: search, filter, and revisit past debates
- Custom personas: user-defined persona configurations
- Follow-up debates: continue conversations within the same thread
- Dark mode enforced via next-themes

## Routes

### Dashboard

| Route           | Description                       |
| --------------- | --------------------------------- |
| `/council`      | Main debate interface             |
| `/debates/[id]` | Debate detail view                |
| `/history`      | Debate history with search/filter |
| `/settings`     | BYOK keys and preferences         |
| `/analytics`    | Cost tracking and usage stats     |
| `/personas`     | Custom persona management         |
| `/agents`       | Agent configuration               |

### Marketing

| Route      | Description      |
| ---------- | ---------------- |
| `/`        | Landing page     |
| `/about`   | About page       |
| `/faq`     | FAQ              |
| `/privacy` | Privacy policy   |
| `/terms`   | Terms of service |

### Auth

| Route      | Description   |
| ---------- | ------------- |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |

## Feature Modules (8)

`auth`, `council`, `debates`, `history`, `analytics`, `agents`, `personas`, `settings`

## Key Components

### Council

- `agent-selector.tsx` -- model selection
- `council-chat.tsx` -- main chat interface
- `debate-mode-selector.tsx` -- debate mode picker

### Settings

- `api-keys-settings.tsx` -- BYOK key management
- `cli-token-settings.tsx` -- CLI token configuration
- `preferences-settings.tsx` -- user preferences

### Shared UI

accordion, button, card, dialog, input, label, popover, skeleton, textarea, toast

### Layout

- `header.tsx`
- `sidebar.tsx`

### Common

- `error-boundary.tsx`
- `loading.tsx`

### Hooks

- `use-idle-timeout`
- `use-keyboard-shortcuts`
- `use-user-preferences`

## API Routes (15 files)

- Debates: CRUD + stream
- API keys: management + test
- Personas: CRUD
- Analytics
- Waitlist
- Webhooks: Clerk + Stripe
- Sentry example

## Config

- **Output**: standalone
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Redirects**: `/dashboard` redirects to `/council`
- **Sentry tunnel**: `/monitoring`

## Getting Started

```bash
node >= 20.x
pnpm >= 9.x

pnpm install

cp apps/web/.env.example apps/web/.env.local
```

### Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Scripts

```bash
pnpm dev          # Start dev server (http://localhost:3000)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Lint
pnpm type-check   # Type checking
pnpm test         # Run Vitest
pnpm test:e2e     # Run Playwright
```

## Project Structure

Feature-based architecture. Each feature contains its own components, hooks, API calls, and types.

```
src/
  app/              # App Router pages (thin route wrappers)
  features/         # Feature modules (main application code)
    auth/           # Authentication
    council/        # Debate interface
    debates/        # Debate detail/streaming
    history/        # Debate history
    analytics/      # Usage analytics
    agents/         # Agent configuration
    personas/       # Custom personas
    settings/       # User settings
  shared/           # Shared components, hooks, utilities
    components/ui/  # shadcn/ui components
  styles/           # Global styles
```

## Deployment

Push to `main` on GitHub. Vercel auto-deploys.
