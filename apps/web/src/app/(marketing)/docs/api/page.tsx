import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "API Reference",
  description:
    "Consilium REST and SSE API reference — start debates, stream rounds, manage personas, and integrate with your own tools.",
  path: "/docs/api",
});

const endpointGroups = [
  {
    title: "Debates",
    endpoints: [
      {
        method: "POST",
        path: "/debates/estimate",
        description: "Estimate cost before running",
        rateLimit: "30/60s",
      },
      {
        method: "POST",
        path: "/debates",
        description: "Create a new debate",
        rateLimit: "10/60s",
      },
      {
        method: "GET",
        path: "/debates",
        description: "List debates (query: limit, offset, search)",
      },
      {
        method: "GET",
        path: "/debates/:id",
        description: "Get debate with rounds and messages",
      },
      {
        method: "GET",
        path: "/debates/:id/conversation",
        description: "Get all debates in conversation",
      },
      {
        method: "PATCH",
        path: "/debates/:id",
        description: "Update debate (rename/archive)",
      },
      { method: "DELETE", path: "/debates/:id", description: "Delete debate" },
      {
        method: "POST",
        path: "/debates/:id/cancel",
        description: "Cancel active debate",
        rateLimit: "10/60s",
      },
      {
        method: "POST",
        path: "/debates/:id/retry",
        description: "Retry failed debate",
        rateLimit: "5/60s",
      },
      {
        method: "GET",
        path: "/debates/:id/stream",
        description: "SSE stream (text/event-stream)",
      },
    ],
  },
  {
    title: "Deliberation",
    endpoints: [
      {
        method: "POST",
        path: "/deliberation/create",
        description: "Start a deliberation session",
      },
      {
        method: "POST",
        path: "/deliberation/redteam",
        description: "Red team adversarial assessment",
      },
      {
        method: "POST",
        path: "/deliberation/blind",
        description: "Blind evaluation (anonymized)",
      },
      {
        method: "GET",
        path: "/deliberation/:id",
        description: "Get deliberation with rounds/messages",
      },
      {
        method: "POST",
        path: "/deliberation/:id/retry",
        description: "Retry failed deliberation",
      },
      {
        method: "POST",
        path: "/deliberation/:id/cancel",
        description: "Cancel active deliberation",
      },
      {
        method: "GET",
        path: "/deliberation/:id/stream",
        description: "SSE stream (text/event-stream)",
      },
    ],
  },
  {
    title: "Agents",
    endpoints: [
      {
        method: "POST",
        path: "/agents",
        description: "Create agent configuration",
      },
      { method: "GET", path: "/agents", description: "List all agents" },
      { method: "GET", path: "/agents/:id", description: "Get agent by ID" },
      {
        method: "PATCH",
        path: "/agents/:id",
        description: "Update agent configuration",
      },
      { method: "DELETE", path: "/agents/:id", description: "Delete agent" },
    ],
  },
  {
    title: "Personas",
    endpoints: [
      {
        method: "POST",
        path: "/personas",
        description: "Create persona with system prompt",
      },
      { method: "GET", path: "/personas", description: "List all personas" },
      {
        method: "GET",
        path: "/personas/:id",
        description: "Get persona by ID",
      },
      { method: "PATCH", path: "/personas/:id", description: "Update persona" },
      {
        method: "DELETE",
        path: "/personas/:id",
        description: "Delete persona",
      },
    ],
  },
  {
    title: "API Keys",
    endpoints: [
      { method: "GET", path: "/api-keys", description: "List API keys" },
      { method: "POST", path: "/api-keys", description: "Create API key" },
      {
        method: "POST",
        path: "/api-keys/test",
        description: "Test API key validity",
      },
      {
        method: "POST",
        path: "/api-keys/cli-token",
        description: "Generate CLI authentication token",
      },
    ],
  },
  {
    title: "Analytics & Health",
    endpoints: [
      {
        method: "GET",
        path: "/analytics",
        description: "Usage analytics and cost breakdown",
      },
      { method: "GET", path: "/health", description: "Service health check" },
    ],
  },
  {
    title: "Webhooks",
    endpoints: [
      {
        method: "POST",
        path: "/webhooks/clerk",
        description: "Clerk authentication webhook",
      },
    ],
  },
];

const sseEvents = [
  {
    category: "Deliberation",
    events: [
      "deliberation:start",
      "deliberation:round",
      "deliberation:complete",
      "deliberation:error",
    ],
  },
  {
    category: "Phases",
    events: [
      "phase:analysis",
      "phase:crossExamination",
      "phase:rebuttal",
      "phase:synthesis",
      "phase:judgment",
    ],
  },
  {
    category: "Agents",
    events: [
      "agent:thinking",
      "agent:response",
      "agent:critique",
      "agent:agreement",
    ],
  },
  {
    category: "Convergence",
    events: [
      "convergence:update",
      "convergence:reached",
      "convergence:stalled",
    ],
  },
  {
    category: "Dissent",
    events: ["dissent:registered", "dissent:minority-report"],
  },
  {
    category: "Red Team",
    events: ["redteam:attack", "redteam:defense", "redteam:vulnerability"],
  },
  {
    category: "Market",
    events: ["market:prediction", "market:update", "market:settlement"],
  },
  {
    category: "System",
    events: ["system:heartbeat", "system:ratelimit", "system:cancel"],
  },
];

const rateLimits = [
  { endpoint: "POST /debates", limit: "10 requests", window: "60 seconds" },
  {
    endpoint: "POST /debates/estimate",
    limit: "30 requests",
    window: "60 seconds",
  },
  {
    endpoint: "POST /debates/:id/cancel",
    limit: "10 requests",
    window: "60 seconds",
  },
  {
    endpoint: "POST /debates/:id/retry",
    limit: "5 requests",
    window: "60 seconds",
  },
  {
    endpoint: "POST /deliberation/create",
    limit: "10 requests",
    window: "60 seconds",
  },
  {
    endpoint: "POST /deliberation/redteam",
    limit: "5 requests",
    window: "60 seconds",
  },
  {
    endpoint: "POST /deliberation/blind",
    limit: "5 requests",
    window: "60 seconds",
  },
  { endpoint: "GET endpoints", limit: "100 requests", window: "60 seconds" },
  { endpoint: "SSE streams", limit: "5 concurrent", window: "per user" },
];

const methodColors: Record<string, string> = {
  GET: "text-emerald-400 bg-emerald-400/10",
  POST: "text-sky-400 bg-sky-400/10",
  PATCH: "text-amber-400 bg-amber-400/10",
  DELETE: "text-red-400 bg-red-400/10",
};

export default function ApiReferencePage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Docs
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">API Reference</h1>
          <p className="text-xl text-muted-foreground">
            Integrate Consilium into your applications with our REST API
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Base URL</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="block rounded-lg bg-neutral-900 p-4 text-sm text-emerald-400">
                https://api.consilium.dev/api/v1
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Authentication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                All API requests require a Bearer token in the Authorization
                header.
              </p>
              <code className="block rounded-lg bg-neutral-900 p-4 text-sm text-muted-foreground">
                Authorization: Bearer YOUR_API_KEY
              </code>
              <p className="text-sm text-muted-foreground">
                Generate API keys from your dashboard at{" "}
                <Link
                  href="/dashboard/settings"
                  className="text-indigo-400 hover:underline"
                >
                  Settings
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          {endpointGroups.map((group) => (
            <div key={group.title}>
              <h2 className="text-2xl font-bold mb-6">{group.title}</h2>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Path
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.endpoints.map((endpoint) => (
                      <tr
                        key={`${endpoint.method}-${endpoint.path}`}
                        className="border-b border-white/[0.06] last:border-0"
                      >
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs font-mono font-medium ${methodColors[endpoint.method]}`}
                          >
                            {endpoint.method}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-mono text-muted-foreground">
                          {endpoint.path}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {endpoint.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div>
            <h2 className="text-2xl font-bold mb-6">SSE Events Reference</h2>
            <div className="space-y-4">
              {sseEvents.map((group) => (
                <Card key={group.category}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {group.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {group.events.map((event) => (
                        <code
                          key={event}
                          className="rounded bg-neutral-900 px-2.5 py-1 text-xs font-mono text-indigo-400"
                        >
                          {event}
                        </code>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Rate Limits</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Endpoint
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Limit
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                      Window
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rateLimits.map((row) => (
                    <tr
                      key={row.endpoint}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-6 py-3 font-mono text-muted-foreground">
                        {row.endpoint}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {row.limit}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {row.window}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Example Requests</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">
                    <span className="text-sky-400">POST</span>{" "}
                    <span className="text-muted-foreground">
                      /deliberation/create
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Request
                    </p>
                    <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                      <code className="text-muted-foreground">{`curl -X POST https://api.consilium.dev/api/v1/deliberation/create \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "Best practices for error handling in TypeScript",
    "mode": "council",
    "models": ["claude-haiku-4-5-20251001", "gpt-4.1", "gemini-2.5-flash"],
    "judgeModel": "claude-haiku-4-5-20251001",
    "maxRounds": 3,
    "apiKeys": {
      "anthropic": "sk-ant-...",
      "openai": "sk-...",
      "google": "AIza..."
    }
  }'`}</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Response
                    </p>
                    <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                      <code className="text-muted-foreground">{`{
  "id": "dlb_abc123",
  "status": "processing",
  "mode": "council",
  "topic": "Best practices for error handling in TypeScript",
  "models": ["claude-haiku-4-5-20251001", "gpt-4.1", "gemini-2.5-flash"],
  "judgeModel": "claude-haiku-4-5-20251001",
  "maxRounds": 3,
  "created_at": "2026-04-08T12:00:00Z",
  "stream_url": "/api/v1/deliberation/dlb_abc123/stream"
}`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">
                    <span className="text-sky-400">POST</span>{" "}
                    <span className="text-muted-foreground">
                      /debates/estimate
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Request
                    </p>
                    <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                      <code className="text-muted-foreground">{`curl -X POST https://api.consilium.dev/api/v1/debates/estimate \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "Microservices vs monolith for a startup",
    "mode": "council",
    "models": ["claude-haiku-4-5-20251001", "gpt-4.1", "gemini-2.5-flash"]
  }'`}</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Response
                    </p>
                    <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                      <code className="text-muted-foreground">{`{
  "estimatedCost": 0.0847,
  "breakdown": {
    "claude-haiku-4-5-20251001": 0.0312,
    "gpt-4.1": 0.0285,
    "gemini-2.5-flash": 0.0250
  },
  "estimatedTokens": 12400,
  "estimatedDuration": "45s"
}`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">
                    <span className="text-emerald-400">GET</span>{" "}
                    <span className="text-muted-foreground">
                      /deliberation/:id/stream
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Connection
                    </p>
                    <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                      <code className="text-muted-foreground">{`curl -N https://api.consilium.dev/api/v1/deliberation/dlb_abc123/stream \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Accept: text/event-stream"`}</code>
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                      Event Stream
                    </p>
                    <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                      <code className="text-muted-foreground">{`event: deliberation:start
data: {"id":"dlb_abc123","mode":"council","models":3}

event: phase:analysis
data: {"round":1,"phase":"independent_analysis"}

event: agent:response
data: {"agent":"claude-haiku-4-5-20251001","round":1,"content":"..."}

event: convergence:update
data: {"score":0.72,"threshold":0.85}

event: phase:synthesis
data: {"round":3,"phase":"final_synthesis"}

event: deliberation:complete
data: {"id":"dlb_abc123","consensus":true,"rounds":3}`}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Need help integrating? Get in touch.
            </p>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
