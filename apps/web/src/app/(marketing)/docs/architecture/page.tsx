import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Database, Radio, Lock, AlertTriangle, GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Architecture",
  description:
    "System architecture of Consilium — Next.js web app, NestJS API, FastAPI debate engine, Postgres, Redis, and BullMQ for async deliberation.",
  path: "/docs/architecture",
});

const services = [
  { name: "Web App", stack: "Next.js 15, React 19, Tailwind, shadcn/ui, Clerk, Zustand", port: "3000", purpose: "Frontend, marketing, dashboard, debate UI" },
  { name: "API", stack: "NestJS 11, Fastify, Prisma, BullMQ, Clerk SDK", port: "4000", purpose: "REST API, auth, queue processing, database" },
  { name: "Agents", stack: "FastAPI, LangGraph, 5 LLM providers", port: "8000", purpose: "Deliberation engine, benchmarks, templates" },
  { name: "Database", stack: "PostgreSQL 16 (Neon managed)", port: "5432", purpose: "Persistent storage via Prisma ORM" },
  { name: "Cache/Queue", stack: "Redis 7 (Upstash managed)", port: "6379", purpose: "BullMQ jobs, SSE relay, session cache" },
];

const dbModels = [
  { model: "User", fields: "clerkId, email, firstName, lastName, encrypted API keys (AES-256-GCM), cliTokenHash" },
  { model: "DebateSession", fields: "userId, topic, status, modelsUsed, totalCost, goldenPrompt, mode, judgeModel" },
  { model: "DebateRound", fields: "sessionId, roundNumber, status" },
  { model: "DebateMessage", fields: "roundId, agentId, modelUsed, content, promptTokens, completionTokens, cost, latencyMs" },
  { model: "ConversationV2", fields: "userId, title, decisionLog, projectContext, debates[]" },
  { model: "DeliberationRun", fields: "userId, topic, mode, models, judgeModel, status, goldenPrompt, dissentReport, costTotal, tokensTotal" },
  { model: "AuditEntry", fields: "deliberationId, step, modelId, inputSummary, outputSummary, latencyMs, tokensIn, tokensOut, cost, roundNumber" },
  { model: "Agent", fields: "userId, name, provider, modelId, description, isActive, tenantId" },
  { model: "AgentPersona", fields: "userId, name, description, systemPrompt, isDefault" },
  { model: "UsageRecord", fields: "tenantId, agentId, tokens, cost, recordedAt" },
  { model: "AuthLog", fields: "userId, event, ip, userAgent, metadata, severity" },
  { model: "AgentFailure", fields: "modelId, provider, errorType, debateId" },
  { model: "Waitlist", fields: "email, source, metadata, notified" },
];

const sseEvents = [
  { category: "Deliberation", events: "deliberation:start, deliberation:complete" },
  { category: "Phases", events: "phase:proposal, phase:challenge, phase:rebuttal, phase:evaluation, phase:voting, phase:aggregation" },
  { category: "Agents", events: "agent:start, agent:chunk, agent:complete" },
  { category: "Convergence", events: "convergence:detected, convergence:not_detected" },
  { category: "Dissent", events: "dissent:consensus, dissent:report" },
  { category: "Red Team", events: "red_team:attack, red_team:defense, red_team:judgment" },
  { category: "Market", events: "market:bet, market:update, market:converged" },
  { category: "System", events: "cost:update, error, done, debate:cancelled" },
  { category: "Rounds", events: "round:start, round:complete" },
  { category: "Judge", events: "judge_start, judge_retry, synthesis:start" },
];

const ciWorkflows = [
  { name: "ci.yml", trigger: "Push/PR to main", purpose: "Lint + typecheck across monorepo" },
  { name: "security.yml", trigger: "Push/PR/weekly", purpose: "CodeQL, pip-audit, bandit, gitleaks" },
  { name: "coverage.yml", trigger: "PR", purpose: "Code coverage reporting" },
  { name: "docker.yml", trigger: "Push to main", purpose: "Build and push Docker images" },
  { name: "consilium-review.yml", trigger: "PR open/sync", purpose: "Multi-model AI code review (Sonnet + Haiku fallback)" },
  { name: "pr-checks.yml", trigger: "PR", purpose: "Pre-merge validation" },
  { name: "publish-npm.yml", trigger: "Release", purpose: "Publish TypeScript SDK to npm" },
  { name: "publish-pypi.yml", trigger: "Release", purpose: "Publish Python SDK to PyPI" },
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Docs
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            System Architecture
          </h1>
          <p className="text-xl text-muted-foreground">
            How Consilium&apos;s microservices, database, queue system, and streaming infrastructure work together.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto space-y-16">

          <div>
            <h2 className="text-2xl font-bold mb-6">System Overview</h2>
            <Card>
              <CardContent className="pt-6">
                <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                  <code className="text-muted-foreground">{`┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  Web App (Next.js 15)  │  CLI (Commander.js)  │  SDKs (Py/TS)  │
└──────────────┬─────────────────┬──────────────────┬─────────────┘
               │                 │                  │
               ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (Port 4000)                       │
│  NestJS 11 / Fastify                                            │
│  ├── Clerk Auth Guard (JWT verification)                        │
│  ├── REST Controllers (debates, deliberation, agents, personas) │
│  ├── BullMQ Queue (debate-jobs)                                 │
│  ├── SSE Proxy (streams from FastAPI → client)                  │
│  ├── Prisma ORM (PostgreSQL)                                    │
│  └── Encryption Service (AES-256-GCM for API keys)              │
└──────────────┬──────────────────────────────────────────────────┘
               │ HTTP + SSE
               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  AGENT LAYER (Port 8000)                         │
│  FastAPI / LangGraph                                             │
│  ├── Deliberation Graph (state machine)                          │
│  │   ├── Phase Handlers (propose, challenge, rebut, evaluate...) │
│  │   ├── Voting Engine (Condorcet, Borda, Ranked Pairs, Copeland)│
│  │   ├── Convergence Detector (Kendall tau + Jaccard + concession│
│  │   ├── Dissent Detector (agglomerative clustering)             │
│  │   └── Confidence Calibrator (explanation stability)           │
│  ├── Agent Factory (5 providers × 15 models)                     │
│  ├── Cost Router (complexity scoring → mode selection)            │
│  ├── Template Registry (6 vertical templates)                     │
│  └── Benchmark Runner (MMLU, TruthfulQA, HumanEval)              │
└─────────────────────────────────────────────────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌────────┐
│PostgreSQL│ │ Redis  │ │  LLM   │
│  (Neon) │ │(Upstash)│ │  APIs  │
│  :5432  │ │  :6379 │ │ (5 co.)│
└────────┘ └────────┘ └────────┘`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Service Architecture</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stack</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Port</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.name} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-2.5 font-medium">{s.name}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.stack}</td>
                      <td className="px-4 py-2.5 font-mono text-indigo-400">{s.port}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <GitBranch className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">Data Flow</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                {[
                  { step: "1", desc: "User submits topic via Web App, CLI, or SDK" },
                  { step: "2", desc: "API creates DebateSession (status: pending), enqueues BullMQ job" },
                  { step: "3", desc: "BullMQ worker picks up job, calls FastAPI POST /api/v1/deliberation/start" },
                  { step: "4", desc: "FastAPI runs LangGraph state machine through phases (PROPOSAL → ... → OUTPUT)" },
                  { step: "5", desc: "Each phase streams SSE events back through API to client in real-time" },
                  { step: "6", desc: "On completion: golden_prompt, dissent_report, cost stored in PostgreSQL" },
                  { step: "7", desc: "AuditEntry records per-step: model, tokens, cost, latency for full transparency" },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 rounded-lg bg-neutral-900 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-400">{item.step}</span>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">Database Schema</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              PostgreSQL via Prisma ORM. All models are relationally connected. Managed by Neon in production.
            </p>
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Key Fields</th>
                  </tr>
                </thead>
                <tbody>
                  {dbModels.map((m) => (
                    <tr key={m.model} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-2.5 font-mono text-sm text-indigo-400 whitespace-nowrap">{m.model}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.fields}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <Radio className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">SSE Event Types</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Real-time streaming uses Server-Sent Events. Connect to <code className="text-xs bg-neutral-900 px-1.5 py-0.5 rounded">/deliberation/:id/stream</code> to receive typed events as the debate progresses.
            </p>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Events</th>
                  </tr>
                </thead>
                <tbody>
                  {sseEvents.map((e) => (
                    <tr key={e.category} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-2.5 font-medium whitespace-nowrap">{e.category}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-indigo-400">{e.events}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <Lock className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">Authentication Flow</h2>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Web App</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Clerk SDK → JWT session → ClerkAuthGuard middleware → CurrentUser decorator extracts userId. Supports email, Google, GitHub sign-in.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">CLI</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground"><code className="text-xs bg-neutral-900 px-1.5 py-0.5 rounded">consilium login</code> → opens browser → Clerk auth → CLI token generated and stored (hashed, not plaintext) in <code className="text-xs bg-neutral-900 px-1.5 py-0.5 rounded">~/.consilium/config.json</code>. One token per user.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">API / SDK</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Bearer token in Authorization header → Clerk SDK verifies JWT → userId extracted from session claims. API keys for LLM providers stored encrypted (AES-256-GCM) in User model.</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">Error Handling &amp; Resilience</h2>
            </div>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="grid gap-3">
                  <div className="rounded-lg bg-neutral-900 p-3">
                    <p className="text-sm"><span className="text-indigo-400 font-medium">Circuit Breakers</span> — Per-provider failure tracking. After consecutive failures, requests are short-circuited to prevent cascading failures.</p>
                  </div>
                  <div className="rounded-lg bg-neutral-900 p-3">
                    <p className="text-sm"><span className="text-indigo-400 font-medium">Retry Logic</span> — MAX_RETRIES: 2 attempts, RETRY_BACKOFF: [2s, 5s] exponential. Only retries on transient errors (5xx, 429).</p>
                  </div>
                  <div className="rounded-lg bg-neutral-900 p-3">
                    <p className="text-sm"><span className="text-indigo-400 font-medium">Error Classification</span> — Errors categorized as: rate_limit, auth, timeout, server_error, unknown. Raised as LLMProviderError(provider, error_type, original_error).</p>
                  </div>
                  <div className="rounded-lg bg-neutral-900 p-3">
                    <p className="text-sm"><span className="text-indigo-400 font-medium">Context Overflow</span> — On 413/400 errors, automatically retries with cheaper model variant (e.g., gpt-4o → gpt-4o-mini).</p>
                  </div>
                  <div className="rounded-lg bg-neutral-900 p-3">
                    <p className="text-sm"><span className="text-indigo-400 font-medium">Timeout</span> — 60 seconds per API call. Configurable per-provider.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">CI/CD Pipeline</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Workflow</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Trigger</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {ciWorkflows.map((w) => (
                    <tr key={w.name} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-2.5 font-mono text-sm text-indigo-400">{w.name}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{w.trigger}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{w.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
