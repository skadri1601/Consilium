import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "TypeScript SDK",
  description:
    "The official Consilium TypeScript SDK — start debates, stream rounds over SSE, and embed multi-AI deliberation in your Node.js or browser app.",
  path: "/docs/typescript-sdk",
  keywords: ["consilium typescript sdk", "ai debate javascript", "llm council node"],
});

const methods = [
  { name: "healthCheck()", returns: "Promise<HealthStatus>", desc: "Check API health. Returns status, version, uptime." },
  { name: "deliberate(options)", returns: "Promise<DeliberationResult>", desc: "Run deliberation. Returns goldenPrompt, dissentReport, cost, auditTrail, votes, confidenceScores." },
  { name: "redTeam(options)", returns: "Promise<RedTeamReport>", desc: "Adversarial assessment. Returns attacks, defenses, judgments, overallScore, vulnerabilityCount." },
  { name: "blindEval(options)", returns: "Promise<EvaluationResult>", desc: "Anonymous evaluation. Returns rankings, scores, method." },
  { name: "estimateCost(options)", returns: "Promise<CostEstimate>", desc: "Pre-calculate cost. Returns estimatedCost, breakdown per model, rounds, mode." },
  { name: "streamDeliberation(options)", returns: "AsyncIterable<Event>", desc: "Real-time SSE stream. Yields event, agentId, chunk, round, model, content." },
];

const errorClasses = [
  { name: "ConsiliumError", status: "any", desc: "Base error class. Has message and optional statusCode." },
  { name: "AuthenticationError", status: "401", desc: "Invalid or missing API key / auth token." },
  { name: "TimeoutError", status: "408", desc: "Request exceeded configured timeout." },
  { name: "ServerError", status: "500+", desc: "Server-side error. Automatically retried." },
  { name: "RateLimitError", status: "429", desc: "Rate limit exceeded. Includes retry_after header." },
];

const types = [
  { name: "DeliberationMode", desc: "'quick' | 'council' | 'deep' | 'blind' | 'redteam' | 'jury' | 'market' | 'auto' | 'prediction-market' | 'adversarial' | 'delphi'" },
  { name: "DeliberationResult", desc: "{ goldenPrompt, dissentReport, cost, auditTrail[], votes, confidenceScores }" },
  { name: "RedTeamReport", desc: "{ attacks[], defenses[], judgments[], overallScore, vulnerabilityCount }" },
  { name: "EvaluationResult", desc: "{ rankings[], scores, method }" },
  { name: "CostEstimate", desc: "{ estimatedCost, breakdown[{ model, role, estimatedCost }], rounds, mode }" },
  { name: "DeliberationEvent", desc: "{ event, agentId?, chunk?, round?, model?, content?, message?, data? }" },
];

export default function TypeScriptSdkPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Docs
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">TypeScript SDK</h1>
          <p className="text-xl text-muted-foreground">Full TypeScript client with streaming, typed errors, automatic retries, and complete type definitions.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <Card>
            <CardHeader><CardTitle className="text-lg">Installation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto"><code className="text-emerald-400">npm install @consilium/sdk</code></pre>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto space-y-1">
                <code className="text-muted-foreground block">yarn add @consilium/sdk</code>
                <code className="text-muted-foreground block">pnpm add @consilium/sdk</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Client Configuration</CardTitle></CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`import { ConsiliumClient } from "@consilium/sdk";

const client = new ConsiliumClient({
  apiUrl: "http://localhost:4000/api/v1",  // default
  apiKey: "your-api-key",
  timeout: 120000,     // ms (default: 120s)
  maxRetries: 2,       // retry attempts (default: 2)
  retryDelay: 1000,    // ms base delay (default: 1s)
});`}</code>
              </pre>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">Methods</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Returns</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((m) => (
                    <tr key={m.name} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs text-indigo-400">{m.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{m.returns}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{m.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Types</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Definition</th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.name} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-2.5 font-mono text-sm text-indigo-400 whitespace-nowrap">{t.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{t.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Error Classes</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Class</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {errorClasses.map((e) => (
                    <tr key={e.name} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-2.5 font-mono text-sm text-red-400">{e.name}</td>
                      <td className="px-4 py-2.5 font-mono text-sm text-muted-foreground">{e.status}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{e.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Full Example</CardTitle></CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`import { ConsiliumClient } from "@consilium/sdk";

const client = new ConsiliumClient({
  apiUrl: "http://localhost:4000/api/v1",
  apiKey: "your-api-key",
});

// 1. Health check
const health = await client.healthCheck();
console.log(\`Status: \${health.status}\`);

// 2. Estimate cost
const estimate = await client.estimateCost({
  topic: "Should we migrate from REST to GraphQL?",
  mode: "council",
  models: ["claude-sonnet-4-20250514", "gpt-4o", "gemini-2.0-flash"],
});
console.log(\`Estimated: $\${estimate.estimatedCost.toFixed(4)}\`);

// 3. Run deliberation
const result = await client.deliberate({
  topic: "Should we migrate from REST to GraphQL?",
  mode: "council",
  models: ["claude-sonnet-4-20250514", "gpt-4o", "gemini-2.0-flash"],
  maxRounds: 3,
});
console.log(result.goldenPrompt);
console.log(\`Cost: $\${result.cost.toFixed(4)}\`);

// 4. Red team
const redTeam = await client.redTeam({
  topic: "Review this auth middleware for vulnerabilities",
  models: ["claude-sonnet-4-20250514", "gpt-4o"],
});
console.log(\`Vulnerabilities: \${redTeam.vulnerabilityCount}\`);

// 5. Stream events
for await (const event of client.streamDeliberation({
  topic: "Is Kubernetes overkill for our startup?",
  mode: "jury",
  models: ["claude-sonnet-4-20250514", "gpt-4o", "gemini-2.5-flash"],
})) {
  switch (event.event) {
    case "agent:chunk":
      process.stdout.write(event.chunk ?? "");
      break;
    case "phase:voting":
      console.log("\\nVoting phase started");
      break;
    case "convergence:detected":
      console.log("\\nConsensus reached!");
      break;
    case "dissent:report":
      console.log(\`\\nDissent: \${JSON.stringify(event.data)}\`);
      break;
  }
}`}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Error Handling Example</CardTitle></CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`import {
  ConsiliumClient,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
} from "@consilium/sdk";

try {
  const result = await client.deliberate({ ... });
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key. Check your config.");
  } else if (error instanceof RateLimitError) {
    console.error(\`Rate limited. Retry after \${error.retryAfter}s\`);
  } else if (error instanceof TimeoutError) {
    console.error("Request timed out. Try a simpler mode.");
  } else {
    throw error;
  }
}`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
