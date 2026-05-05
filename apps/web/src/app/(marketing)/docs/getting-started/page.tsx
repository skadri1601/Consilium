import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  Globe,
  Terminal,
  Code,
  Server,
  Key,
  Shield,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbList, howToSchema } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Getting Started",
  description:
    "Quickstart for Consilium - sign up, add provider keys, run your first multi-AI debate in under five minutes via web, CLI, or SDK.",
  path: "/docs/getting-started",
});

const howToData = howToSchema({
  name: "Get started with Consilium",
  description:
    "Run your first multi-AI deliberation in under five minutes via the web app, CLI, or SDK.",
  url: `${SITE_URL}/docs/getting-started`,
  totalTime: "PT5M",
  estimatedCost: { value: "0", currency: "USD" },
  tools: [
    "Web browser, terminal, or any HTTP client",
    "At least one LLM provider API key (or use the Groq free tier)",
  ],
  steps: [
    {
      name: "Sign up or install the CLI",
      text: "Sign up at https://myconsilium.xyz or install the CLI with `npm i -g @myconsilium/cli`. The web app needs no setup; the CLI shares the same API.",
      url: `${SITE_URL}/sign-up`,
    },
    {
      name: "Add at least one provider key",
      text: "Paste an API key from any of the seven supported providers (Anthropic, OpenAI, Google, Groq, xAI, Moonshot, OpenRouter). Groq is free and works as an automatic fallback if you skip BYOK entirely.",
    },
    {
      name: "Pick a deliberation mode",
      text: "Quick (1 round), Council (3 rounds, default), Deep (5 rounds + sub-agents), Blind, Red Team, Jury, Market, or Auto. Use Council unless you need something specific.",
      url: `${SITE_URL}/docs/modes`,
    },
    {
      name: "Run a debate",
      text: "Web: type a question and click Run. CLI: `consilium debate \"your question\" --mode council`. SDK: call `client.debate({ query, mode })` and stream SSE events.",
    },
    {
      name: "Review the consensus output",
      text: "Every debate returns a golden prompt, per-model confidence scores, dissent report (majority and minority positions), vote results, audit trail, and cost breakdown. Export as Markdown, .cursorrules, or plain text.",
    },
  ],
});

const breadcrumbs = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "Getting Started", path: "/docs/getting-started" },
]);

const providers = [
  {
    name: "Anthropic",
    env: "ANTHROPIC_API_KEY",
    models: "Claude Opus 4.7, Opus 4.6, Sonnet 4.6, Haiku 4.5",
    free: false,
  },
  {
    name: "OpenAI",
    env: "OPENAI_API_KEY",
    models: "GPT-5.5 Pro, GPT-5.5, GPT-5.4, GPT-5.4 Mini, GPT-5.4 Nano",
    free: false,
  },
  {
    name: "Google",
    env: "GOOGLE_API_KEY",
    models: "Gemini 3.1 Pro, 3 Flash, 3.1 Flash-Lite",
    free: false,
  },
  {
    name: "Groq",
    env: "GROQ_API_KEY",
    models: "Llama 3.1 8B, 3.3 70B, GPT-OSS 120B/20B, Compound",
    free: true,
  },
  {
    name: "xAI",
    env: "XAI_API_KEY",
    models: "Grok 4.20, Grok 4.1 Fast (reasoning + non-reasoning), Grok Code Fast",
    free: false,
  },
  {
    name: "Moonshot",
    env: "MOONSHOT_API_KEY",
    models: "Kimi K2.6",
    free: false,
  },
  {
    name: "OpenRouter",
    env: "OPENROUTER_API_KEY",
    models: "Free-tier Gemma 4 26B/31B, Qwen3 Coder, Nemotron 3 Super 120B, Ling 2.6 1T (also used as Consilium fallback when no BYOK)",
    free: true,
  },
];

export default function GettingStartedPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-getting-started-howto" data={howToData} />
      <JsonLd id="ld-getting-started-breadcrumbs" data={breadcrumbs} />
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Docs
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Getting Started
          </h1>
          <p className="text-xl text-muted-foreground">
            Set up Consilium and run your first multi-agent deliberation in
            minutes
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Choose your path:{" "}
              </span>
              Consilium can be used through the web app (no setup) or via the
              SDKs and CLI for engineers. Pick the approach that fits your
              workflow.
            </p>
          </div>

          <div id="web-app">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">For Users: Web App</h2>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                Easiest
              </Badge>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    1. Create an Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Sign up at myconsilium.xyz. Authentication is handled by
                    Clerk with support for email, Google, and GitHub sign-in
                    methods. Your account gives you access to the deliberation
                    dashboard, debate history, analytics, and API key
                    management.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    2. Add Your API Keys (BYOK)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Consilium uses a Bring Your Own Keys model. Navigate to
                    Settings and add API keys for the providers you want to use.
                    All keys are encrypted with AES-256-GCM before storage —
                    they are never stored in plaintext or logged. You need at
                    least one provider key, but using 2-3 different providers
                    gives you genuine model diversity in debates.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      No keys?{" "}
                    </span>
                    Consilium automatically falls back to Groq&apos;s free tier
                    models (Llama 3.1 8B, Llama 3.3 70B, Llama 4 Scout) when no
                    paid keys are configured.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    3. Start Your First Deliberation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Go to the Council page. Enter your topic or question, select
                    a deliberation mode (Council is the default), and choose 2-5
                    AI models. Click &quot;Start Deliberation&quot; and watch
                    the debate unfold in real-time via Server-Sent Events
                    streaming.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll see each phase live: models proposing
                    independently, cross-examining each other, defending their
                    positions, voting, and finally synthesizing a consensus
                    answer.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    4. Understanding Your Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Every deliberation produces a rich set of outputs:
                  </p>
                  <div className="grid gap-3">
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm">
                        <span className="text-indigo-400 font-medium">
                          Golden Prompt
                        </span>{" "}
                        — The synthesized final answer integrating the strongest
                        arguments from all models
                      </p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm">
                        <span className="text-indigo-400 font-medium">
                          Confidence Scores
                        </span>{" "}
                        — Per-model calibrated confidence based on explanation
                        stability (how much each model changed its position
                        under pressure)
                      </p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm">
                        <span className="text-indigo-400 font-medium">
                          Dissent Report
                        </span>{" "}
                        — Majority and minority positions identified via
                        agglomerative clustering. Shows where models agreed and
                        where they fundamentally disagreed
                      </p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm">
                        <span className="text-indigo-400 font-medium">
                          Vote Results
                        </span>{" "}
                        — Condorcet winner (if any), Borda scores, full ranking.
                        Shows which position won and by what margin
                      </p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm">
                        <span className="text-indigo-400 font-medium">
                          Audit Trail
                        </span>{" "}
                        — Every step recorded: model, input, output, tokens
                        used, cost, latency. Full transparency into how
                        consensus was reached
                      </p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm">
                        <span className="text-indigo-400 font-medium">
                          Cost Breakdown
                        </span>{" "}
                        — Per-model, per-round cost tracking with total cost and
                        token usage
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Export results as Markdown, .cursorrules files, plain text,
                    or copy to clipboard.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div id="engineer">
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">
                For Engineers: SDK &amp; CLI
              </h2>
              <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/20">
                Recommended
              </Badge>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Install the CLI</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-emerald-400">
                      npm install -g @myconsilium/cli
                    </code>
                  </pre>
                  <p className="text-sm text-muted-foreground">
                    Or with yarn/pnpm:
                  </p>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto space-y-1">
                    <code className="text-muted-foreground block">
                      yarn global add @myconsilium/cli
                    </code>
                    <code className="text-muted-foreground block">
                      pnpm add -g @myconsilium/cli
                    </code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Authenticate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`consilium login`}</code>
                  </pre>
                  <p className="text-sm text-muted-foreground">
                    Opens your browser for Clerk authentication. On success, a
                    CLI token is stored in{" "}
                    <code className="text-xs bg-neutral-900 px-1.5 py-0.5 rounded">
                      ~/.consilium/config.json
                    </code>
                    . Alternatively, set the{" "}
                    <code className="text-xs bg-neutral-900 px-1.5 py-0.5 rounded">
                      CONSILIUM_API_KEY
                    </code>{" "}
                    environment variable.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Run Your First Deliberation (CLI)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`consilium debate "Should we migrate from REST to GraphQL?" \\
  --mode council \\
  --models claude-sonnet-4-6,gpt-5.4,gemini-3-flash-preview \\
  --output markdown`}</code>
                  </pre>
                  <p className="text-sm text-muted-foreground mt-3">
                    The CLI renders the debate in real-time with agent progress
                    bars, phase transitions, convergence tracking, and cost
                    updates. The final synthesis is formatted according to your
                    chosen output format (text, markdown, cursorrules,
                    claude-md, or json).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Run Your First Deliberation (Python SDK)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-emerald-400">
                      pip install consilium
                    </code>
                  </pre>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`from consilium import ConsiliumClient

client = ConsiliumClient(
    api_url="http://localhost:4000/api/v1",
    api_key="your-api-key"
)

result = client.deliberate(
    topic="Should we migrate from REST to GraphQL?",
    mode="council",
    models=[
        "claude-sonnet-4-6",
        "gpt-5.4",
        "gemini-3-flash-preview"
    ],
    max_rounds=3
)

print(result.golden_prompt)
print(f"Cost: \${result.cost:.4f}")
print(f"Dissent: {result.dissent_report}")`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Run Your First Deliberation (TypeScript SDK)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-emerald-400">
                      npm install @myconsilium/sdk
                    </code>
                  </pre>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`import { ConsiliumClient } from "@myconsilium/sdk";

const client = new ConsiliumClient({
  apiUrl: "http://localhost:4000/api/v1",
  apiKey: "your-api-key",
});

const result = await client.deliberate({
  topic: "Should we migrate from REST to GraphQL?",
  mode: "council",
  models: [
    "claude-sonnet-4-6",
    "gpt-5.4",
    "gemini-3-flash-preview",
  ],
  maxRounds: 3,
});

console.log(result.goldenPrompt);
console.log(\`Cost: \$\${result.cost.toFixed(4)}\`);`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>

          <div id="byok">
            <div className="flex items-center gap-3 mb-6">
              <Key className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">BYOK: Bring Your Own Keys</h2>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Provider
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Environment Variable
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Models
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                          Free?
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {providers.map((p) => (
                        <tr
                          key={p.name}
                          className="border-b border-white/[0.06] last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">{p.name}</td>
                          <td className="px-4 py-3 font-mono text-xs text-indigo-400">
                            {p.env}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {p.models}
                          </td>
                          <td className="px-4 py-3">
                            {p.free ? (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                Free
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                Paid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-neutral-900 p-3">
                  <Shield className="h-4 w-4 mt-0.5 shrink-0 text-emerald-400" />
                  <p className="text-sm text-muted-foreground">
                    All API keys are encrypted with AES-256-GCM before storage.
                    Keys are never stored in plaintext, never logged, and never
                    transmitted to any third party.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Link
              href="/docs/modes"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700"
            >
              Explore Deliberation Modes
            </Link>
            <Link
              href="/docs/providers"
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent"
            >
              View All Models &amp; Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
