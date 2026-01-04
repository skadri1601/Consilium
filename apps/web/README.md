# Consilium Frontend

> Next.js 15 application with real-time multi-agent conversation UI and blind evaluation interface.

## Overview

The Consilium frontend provides an intuitive interface for interacting with multiple AI agents simultaneously. Built with Next.js 15 App Router and hosted free on Vercel, it features real-time streaming responses, blind evaluation modes, and comprehensive analytics dashboards.

**Hosted on Vercel Hobby (Free)** with automatic deployments from GitHub.

## Key Features

- **Multi-Agent Chat Interface**: Stream responses from multiple AI models simultaneously
- **Blind Evaluation Mode**: Compare AI outputs without knowing which model generated each response
- **Real-time Streaming**: Server-Sent Events for live token streaming
- **Consensus Visualization**: Interactive diff views showing where models agree/disagree
- **Agent Workspace**: Manage agents, configure parameters, and view execution history
- **Cost Analytics**: Real-time tracking of token usage and costs per model
- **Responsive Design**: Mobile-first UI that works on all devices
- **Authentication**: Clerk with pre-built components

## Tech Stack

- **Framework**: Next.js 15.1+ (App Router)
- **Hosting**: Vercel Hobby (Free)
- **Language**: TypeScript 5.7+
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 4.0
- **AI Integration**: Vercel AI SDK 6
- **State Management**: Zustand + TanStack Query v5
- **Forms**: React Hook Form + Zod validation
- **Authentication**: Clerk (Free for 10K MAU)
- **Real-time**: Server-Sent Events (SSE)
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure

The frontend uses a **feature-based architecture** where each feature contains all its related files.

```
apps/web/
├── src/
│   ├── app/                      # App Router (routing only)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/              # Auth group routes
│   │   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   │   └── sign-up/[[...sign-up]]/page.tsx
│   │   ├── (dashboard)/         # Protected dashboard routes
│   │   │   ├── layout.tsx
│   │   │   ├── council/page.tsx
│   │   │   ├── agents/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── analytics/page.tsx
│   │   └── api/
│   │       └── webhooks/stripe/route.ts
│   │
│   ├── features/                 # Feature modules (main code here!)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── types/
│   │   │   └── index.ts         # Public exports
│   │   │
│   │   ├── council/             # Multi-agent chat interface
│   │   │   ├── components/
│   │   │   │   ├── council-chat.tsx
│   │   │   │   ├── agent-selector.tsx
│   │   │   │   ├── blind-evaluation.tsx
│   │   │   │   ├── consensus-view.tsx
│   │   │   │   └── streaming-message.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-council.ts
│   │   │   │   └── use-streaming.ts
│   │   │   ├── api/
│   │   │   ├── store/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── agents/              # Agent management
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   ├── types/
│   │   │   └── index.ts
│   │   │
│   │   ├── history/             # Conversation history
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── index.ts
│   │   │
│   │   └── analytics/           # Usage analytics
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── api/
│   │       └── index.ts
│   │
│   ├── shared/                   # Shared code across features
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── layout/          # Sidebar, Header, Footer
│   │   │   └── common/          # Loading, ErrorBoundary
│   │   ├── hooks/               # Common hooks
│   │   ├── lib/                 # Utilities
│   │   │   ├── utils.ts
│   │   │   ├── constants.ts
│   │   │   └── api-client.ts
│   │   ├── store/               # Global stores
│   │   └── types/               # Common types
│   │
│   └── styles/
│       └── globals.css
│
├── public/
├── tests/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Getting Started

### Prerequisites

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
node >= 20.x
pnpm >= 9.x
```

### Installation

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
# From monorepo root
pnpm install

# Or install only frontend dependencies
cd apps/web
pnpm install
```

### Environment Variables

Create `apps/web/.env.local`:

**Windows (PowerShell):**
```powershell
# Create the file (if .env.example exists, copy it first)
# Copy-Item .env.example .env.local
# Then edit .env.local with your values
```

**macOS/Linux (Bash):**
```bash
# Create the file (if .env.example exists, copy it first)
# cp .env.example .env.local
# Then edit .env.local with your values
```

**Environment Variables:**

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Payments (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
# Start development server
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Format code
pnpm format
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Component Usage

### Multi-Agent Council Interface

```tsx
import { CouncilChat } from '@/features/council';

export default function CouncilPage() {
  return (
    <CouncilChat
      agentIds={['gpt-4', 'claude', 'gemini']}
      mode="blind"
      onComplete={(result) => console.log(result)}
    />
  );
}
```

### Streaming Messages

```tsx
'use client';

import { useStreaming } from '@/features/council';

export function AgentChat({ agentId }: { agentId: string }) {
  const { messages, sendMessage, isStreaming } = useStreaming(agentId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className="rounded-lg px-4 py-2">
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
        <input placeholder="Ask a question..." disabled={isStreaming} />
        <button type="submit" disabled={isStreaming}>Send</button>
      </form>
    </div>
  );
}
```

### Protected Routes with Clerk

```tsx
// app/(dashboard)/layout.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/shared/components/layout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

## Adding New Features

1. Create a new folder in `src/features/`
2. Add components, hooks, api, and types subfolders
3. Create an `index.ts` for public exports
4. Import in pages via `@/features/your-feature`

Example:

```
src/features/new-feature/
├── components/
│   └── feature-component.tsx
├── hooks/
│   └── use-feature.ts
├── api/
│   └── feature.api.ts
├── types/
│   └── feature.types.ts
└── index.ts
```

## Adding shadcn/ui Components

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
# Add individual components
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add dialog

# Components are added to src/shared/components/ui/
```

## Testing

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Coverage
pnpm test:coverage
```

## Building & Deployment

### Production Build

**Windows (PowerShell) / macOS/Linux (Bash):**
```bash
pnpm build
pnpm start
```

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel (auto-detects Next.js)
3. Add environment variables
4. Every push to main auto-deploys

## Cost Analysis

### Vercel Hobby (Free) Limits

| Resource | Limit | Estimated Usage (100 users) |
|----------|-------|------------------------------|
| Bandwidth | 100GB/month | ~10GB (90% headroom) |
| Build minutes | 6,000/month | ~100 (98% headroom) |
| Function invocations | 1M/month | ~100K (90% headroom) |

**When to upgrade to Vercel Pro ($20/month):**
- Exceeding 100GB bandwidth (typically at 500-1,000 users)
- Need team collaboration features
- Want analytics and speed insights

## Notes

- Always use TypeScript - no `.jsx` or `.js` files
- Follow component naming convention: `kebab-case.tsx`
- Use Server Components by default, add `'use client'` only when needed
- Keep components small and focused (<200 lines)
- Use shadcn/ui components before creating custom ones
- Import from features using `@/features/` path alias

---

**Questions?** Check the [main README](../../README.md) or open an issue.
