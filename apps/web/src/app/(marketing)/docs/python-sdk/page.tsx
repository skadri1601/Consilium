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
  title: "Python SDK",
  description:
    "The official Consilium Python SDK — start debates, stream rounds, manage personas, and integrate multi-AI deliberation into your Python app.",
  path: "/docs/python-sdk",
  keywords: ["consilium python sdk", "ai debate python", "llm council python"],
});

const methods = [
  {
    name: "health_check()",
    returns: "HealthStatus",
    desc: "Check API connectivity. Returns status, version, uptime.",
  },
  {
    name: "deliberate(topic, mode, models, ...)",
    returns: "DeliberationResult",
    desc: "Run multi-agent deliberation. Returns golden_prompt, dissent_report, cost, audit_trail, votes, confidence_scores.",
  },
  {
    name: "red_team(topic, models, ...)",
    returns: "RedTeamResult",
    desc: "Adversarial assessment. Returns attacks, defenses, judgments, overall_score, vulnerability_count.",
  },
  {
    name: "blind_eval(topic, models, ...)",
    returns: "EvalResult",
    desc: "Anonymous evaluation. Returns rankings, scores, method used.",
  },
  {
    name: "estimate_cost(topic, mode, models)",
    returns: "CostEstimate",
    desc: "Calculate cost before running. Returns estimated_cost, breakdown per model, rounds, mode.",
  },
  {
    name: "stream_deliberation(topic, mode, models, ...)",
    returns: "Iterator[Event]",
    desc: "Stream real-time events. Yields event type, agent_id, chunk, round, model, content.",
  },
];

const types = [
  {
    name: "DeliberationMode",
    desc: "Enum: quick, council, deep, blind, redteam, jury, market, auto, prediction-market, adversarial, delphi",
  },
  {
    name: "DeliberationResult",
    desc: "golden_prompt, dissent_report, cost, audit_trail[], votes, confidence_scores",
  },
  {
    name: "RedTeamResult",
    desc: "attacks[], defenses[], judgments[], overall_score, vulnerability_count",
  },
  { name: "EvalResult", desc: "rankings[], scores, method" },
  {
    name: "CostEstimate",
    desc: "estimated_cost, breakdown[CostBreakdownEntry], rounds, mode",
  },
  { name: "CostBreakdownEntry", desc: "model, role, estimated_cost" },
  { name: "HealthStatus", desc: "status, version, uptime" },
  {
    name: "SemanticExtractionResult",
    desc: "decisions, action_items, key_disagreements, consensus_level",
  },
];

export default function PythonSdkPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16 border-b border-white/[0.08]">
        <div className="container-narrow">
          <div className="eyebrow mb-5">Python SDK</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            The <em>Python</em> client.
          </h1>
          <p className="mt-6 max-w-[640px] text-[17px] leading-[1.55] text-ink-secondary">
            Sync and async clients, streaming, automatic retries, Pydantic
            types. Full method reference with examples.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Installation</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-bg-1 p-4 text-sm overflow-x-auto">
                <code className="text-agree">pip install consilium</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-bg-1 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`from consilium import ConsiliumClient, AsyncConsiliumClient

# Synchronous client
client = ConsiliumClient(
    api_url="http://localhost:4000/api/v1",
    api_key="your-api-key",
    timeout=120,          # seconds (default: 120)
    max_retries=2,        # retry attempts (default: 2)
    retry_delay=1.0       # base delay in seconds (default: 1.0)
)

# Asynchronous client
async_client = AsyncConsiliumClient(
    api_url="http://localhost:4000/api/v1",
    api_key="your-api-key"
)

# Context manager support (auto-cleanup)
with ConsiliumClient(...) as client:
    result = client.deliberate(...)

async with AsyncConsiliumClient(...) as client:
    result = await client.deliberate(...)`}</code>
              </pre>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">Methods</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Returns
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((m) => (
                    <tr
                      key={m.name}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-warm">
                        {m.name}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                        {m.returns}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                        {m.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Types (Pydantic)</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Fields
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => (
                    <tr
                      key={t.name}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-2.5 font-mono text-sm text-warm whitespace-nowrap">
                        {t.name}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {t.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All types use{" "}
              <code className="bg-bg-1 px-1 py-0.5 rounded">
                model_config = {`{"populate_by_name": True}`}
              </code>{" "}
              for flexible field mapping.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Error Handling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <div className="rounded-lg bg-bg-1 p-3">
                  <p className="text-sm">
                    <span className="text-warm font-medium">
                      Exponential backoff
                    </span>{" "}
                    —{" "}
                    <code className="text-xs bg-black/30 px-1 py-0.5 rounded">
                      min(BASE * 2^attempt, 30s)
                    </code>{" "}
                    between retries
                  </p>
                </div>
                <div className="rounded-lg bg-bg-1 p-3">
                  <p className="text-sm">
                    <span className="text-warm font-medium">
                      Automatic retries
                    </span>{" "}
                    — On 5xx server errors and 429 rate limit responses
                  </p>
                </div>
                <div className="rounded-lg bg-bg-1 p-3">
                  <p className="text-sm">
                    <span className="text-warm font-medium">
                      Connection pooling
                    </span>{" "}
                    — HTTP connections managed by httpx for efficiency
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Full Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-bg-1 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`from consilium import ConsiliumClient

client = ConsiliumClient(
    api_url="http://localhost:4000/api/v1",
    api_key="your-key"
)

# 1. Check health
health = client.health_check()
print(f"API Status: {health.status}")

# 2. Estimate cost before running
estimate = client.estimate_cost(
    topic="Should we migrate from REST to GraphQL? ",
    mode="council",
    models=["claude-sonnet-4-20250514","gpt-4o","gemini-2.0-flash"]
)
print(f"Estimated cost: \${estimate.estimated_cost:.4f}")

# 3. Run deliberation
result = client.deliberate(
    topic="Should we migrate from REST to GraphQL? ",
    mode="council",
    models=["claude-sonnet-4-20250514","gpt-4o","gemini-2.0-flash"],
    max_rounds=3
)
print(f"Synthesis: {result.golden_prompt}")
print(f"Actual cost: \${result.cost:.4f}")
print(f"Dissent: {result.dissent_report}")

# 4. Red team assessment
red = client.red_team(
    topic="Review this auth middleware for vulnerabilities",
    models=["claude-sonnet-4-20250514","gpt-4o"]
)
print(f"Vulnerabilities found: {red.vulnerability_count}")
print(f"Overall score: {red.overall_score}")

# 5. Stream events in real-time
for event in client.stream_deliberation(
    topic="Is Kubernetes overkill for our startup? ",
    mode="jury",
    models=["claude-sonnet-4-20250514","gpt-4o","gemini-2.5-flash"]
):
    if event.event =="agent:chunk":
        print(event.chunk, end="")
    elif event.event =="phase:voting":
        print("\\nVoting phase started")
    elif event.event =="convergence:detected":
        print("\\nConsensus reached!")
    elif event.event =="dissent:report":
        print(f"\\nDissent detected: {event.data}")`}</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Async Example</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-bg-1 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`import asyncio
from consilium import AsyncConsiliumClient

async def main():
    async with AsyncConsiliumClient(
        api_url="http://localhost:4000/api/v1",
        api_key="your-key"
    ) as client:
        # Run multiple deliberations concurrently
        results = await asyncio.gather(
            client.deliberate(
                topic="Best database for our use case? ",
                mode="council",
                models=["claude-sonnet-4-20250514","gpt-4o"]
            ),
            client.deliberate(
                topic="Should we add caching? ",
                mode="quick",
                models=["gpt-4o-mini"]
            ),
        )
        for r in results:
            print(r.golden_prompt[:200])

asyncio.run(main())`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
