import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Self-Hosting",
  description:
    "Self-host Consilium on your own infrastructure — Docker Compose, Kubernetes, or a single droplet. Deploy the web app, API, debate engine, and workers.",
  path: "/docs/self-hosting",
  keywords: ["self-host consilium", "docker ai council", "open source ai debate"],
});

const dockerServices = [
  { name: "PostgreSQL 16", container: "consilium_postgres", port: "5432", desc: "Primary database" },
  { name: "Redis 7", container: "consilium_redis", port: "6379", desc: "Queue, cache, SSE relay" },
  { name: "NestJS API", container: "consilium_api", port: "4000", desc: "REST API, auth, BullMQ" },
  { name: "FastAPI Agents", container: "consilium_agents", port: "8000", desc: "Deliberation engine" },
  { name: "Next.js Web", container: "consilium_web", port: "3000", desc: "Frontend application" },
  { name: "Redis Commander", container: "redis-commander", port: "8081", desc: "Dev: Redis browser" },
  { name: "MailHog", container: "mailhog", port: "8025", desc: "Dev: Email testing" },
];

const envVars = [
  { category: "Core", vars: [
    { name: "DATABASE_URL", desc: "PostgreSQL connection string", required: true },
    { name: "REDIS_URL", desc: "Redis connection string (or use UPSTASH_REDIS_URL + UPSTASH_REDIS_TOKEN)", required: true },
    { name: "NODE_ENV", desc: "development | production", required: false },
  ]},
  { category: "Authentication", vars: [
    { name: "CLERK_SECRET_KEY", desc: "Clerk backend secret key", required: true },
    { name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", desc: "Clerk frontend publishable key", required: true },
  ]},
  { category: "LLM Providers (at least one required)", vars: [
    { name: "ANTHROPIC_API_KEY", desc: "Anthropic Claude models", required: false },
    { name: "OPENAI_API_KEY", desc: "OpenAI GPT models", required: false },
    { name: "GOOGLE_API_KEY", desc: "Google Gemini models", required: false },
    { name: "GROQ_API_KEY", desc: "Groq Llama models (free tier)", required: false },
    { name: "XAI_API_KEY", desc: "xAI Grok models", required: false },
  ]},
  { category: "Frontend", vars: [
    { name: "NEXT_PUBLIC_API_URL", desc: "API URL (default: http://localhost:4000)", required: false },
  ]},
  { category: "Observability (optional)", vars: [
    { name: "SENTRY_DSN", desc: "Sentry error tracking DSN", required: false },
    { name: "SENTRY_AUTH_TOKEN", desc: "Sentry authentication token", required: false },
    { name: "POSTHOG_API_KEY", desc: "PostHog analytics key", required: false },
    { name: "POSTHOG_HOST", desc: "PostHog host (default: https://us.i.posthog.com)", required: false },
  ]},
  { category: "CORS", vars: [
    { name: "CORS_ORIGINS", desc: "Comma-separated allowed origins (default: localhost:3000,localhost:3001)", required: false },
  ]},
];

export default function SelfHostingPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link href="/docs" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to Docs
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Self-Hosting Guide</h1>
          <p className="text-xl text-muted-foreground">Deploy Consilium on your own infrastructure with Docker Compose. MIT licensed, full data control, BYOK.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">

          <Card>
            <CardHeader><CardTitle className="text-lg">Prerequisites</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">&#8226;</span>Docker &amp; Docker Compose v2+</li>
                <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">&#8226;</span>Node.js 20+ and pnpm (for manual setup without Docker)</li>
                <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">&#8226;</span>2GB RAM minimum, 4GB recommended</li>
                <li className="flex items-start gap-2"><span className="text-indigo-400 mt-0.5">&#8226;</span>API keys for at least one LLM provider (or use Groq free tier at $0)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Quick Start (Docker Compose)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`git clone https://github.com/skadri1601/Consilium.git
cd Consilium
cp .env.example .env
# Edit .env with your API keys and Clerk credentials
docker compose -f docker-compose.selfhost.yml up`}</code>
              </pre>
              <p className="text-sm text-muted-foreground">
                Once running, open <code className="text-xs bg-neutral-900 px-1.5 py-0.5 rounded">http://localhost:3000</code> to access the web app.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">Services</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Service</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Container</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Port</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {dockerServices.map((s) => (
                    <tr key={s.name} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-2.5 font-medium">{s.name}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-indigo-400">{s.container}</td>
                      <td className="px-4 py-2.5 font-mono text-muted-foreground">{s.port}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{s.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Environment Variables</h2>
            <div className="space-y-6">
              {envVars.map((group) => (
                <Card key={group.category}>
                  <CardHeader><CardTitle className="text-base">{group.category}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          {group.vars.map((v) => (
                            <tr key={v.name} className="border-b border-white/[0.06] last:border-0">
                              <td className="px-4 py-2.5 font-mono text-xs text-indigo-400 whitespace-nowrap">{v.name}</td>
                              <td className="px-4 py-2.5 text-xs text-muted-foreground">{v.desc}</td>
                              <td className="px-4 py-2.5">
                                {v.required ? (
                                  <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">Required</Badge>
                                ) : (
                                  <Badge className="bg-neutral-500/10 text-neutral-400 border-neutral-500/20 text-xs">Optional</Badge>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Manual Setup (Without Docker)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`git clone https://github.com/skadri1601/Consilium.git
cd Consilium
pnpm install

# Setup database
npx prisma generate --schema=packages/database/prisma/schema.prisma
npx prisma db push --schema=packages/database/prisma/schema.prisma

# Start all services (web :3000, api :4000, agents :8000)
./run.sh`}</code>
              </pre>
              <p className="text-sm text-muted-foreground">
                The <code className="text-xs bg-neutral-900 px-1.5 py-0.5 rounded">run.sh</code> script checks prerequisites (Node.js 20+, pnpm), installs dependencies, generates the Prisma client, and spawns all three services in parallel with graceful shutdown handling via SIGINT/SIGTERM traps.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Health Checks</CardTitle></CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`# API health (includes DB connectivity, memory checks)
curl http://localhost:4000/api/v1/health

# Agents health
curl http://localhost:8000/health

# Web app
curl http://localhost:3000`}</code>
              </pre>
              <p className="text-sm text-muted-foreground mt-3">
                The API health endpoint checks database connectivity, memory heap/RSS limits, and returns readiness status for container orchestration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Production Deployment Tips</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                <div className="rounded-lg bg-neutral-900 p-3">
                  <p className="text-sm"><span className="text-indigo-400 font-medium">Managed Database</span> — Use Neon for managed PostgreSQL with auto-scaling, branching, and zero downtime</p>
                </div>
                <div className="rounded-lg bg-neutral-900 p-3">
                  <p className="text-sm"><span className="text-indigo-400 font-medium">Managed Redis</span> — Use Upstash for serverless Redis with per-request pricing and global replication</p>
                </div>
                <div className="rounded-lg bg-neutral-900 p-3">
                  <p className="text-sm"><span className="text-indigo-400 font-medium">Environment</span> — Set <code className="text-xs bg-black/30 px-1 py-0.5 rounded">NODE_ENV=production</code> for optimized builds and error handling</p>
                </div>
                <div className="rounded-lg bg-neutral-900 p-3">
                  <p className="text-sm"><span className="text-indigo-400 font-medium">CORS</span> — Configure <code className="text-xs bg-black/30 px-1 py-0.5 rounded">CORS_ORIGINS</code> with your actual domain(s)</p>
                </div>
                <div className="rounded-lg bg-neutral-900 p-3">
                  <p className="text-sm"><span className="text-indigo-400 font-medium">Monitoring</span> — Enable Sentry (<code className="text-xs bg-black/30 px-1 py-0.5 rounded">SENTRY_DSN</code>) for error tracking and PostHog for analytics</p>
                </div>
                <div className="rounded-lg bg-neutral-900 p-3">
                  <p className="text-sm"><span className="text-indigo-400 font-medium">SSL</span> — Use a reverse proxy (nginx or Caddy) for SSL termination in front of the services</p>
                </div>
                <div className="rounded-lg bg-neutral-900 p-3">
                  <p className="text-sm"><span className="text-indigo-400 font-medium">Resources</span> — Minimum: 2GB RAM, 2 vCPUs. Recommended: 4GB RAM for concurrent deliberations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 mt-0.5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-medium mb-1">Data Sovereignty</p>
                <p className="text-sm text-muted-foreground">
                  Self-hosted Consilium keeps all data on your infrastructure. API keys are encrypted with AES-256-GCM and never leave your environment. LLM API calls go directly from your servers to providers. No telemetry is sent to Consilium servers unless you explicitly configure it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
