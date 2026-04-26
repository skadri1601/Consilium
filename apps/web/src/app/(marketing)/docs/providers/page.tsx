import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Providers & Models",
  description:
    "Supported AI providers and models in Consilium — OpenAI, Anthropic, Google, Groq, xAI, Moonshot, and OpenRouter. Pricing, capabilities, and model selection guide.",
  path: "/docs/providers",
  keywords: [
    "ai providers",
    "openai claude gemini grok kimi openrouter",
    "llm comparison",
    "model pricing",
  ],
});

const models = [
  {
    provider: "Anthropic",
    model: "Claude Opus 4.7",
    id: "claude-opus-4-7",
    input: "$5.00",
    output: "$25.00",
    free: false,
    tier: "Most Capable",
  },
  {
    provider: "Anthropic",
    model: "Claude Opus 4.6",
    id: "claude-opus-4-6",
    input: "$5.00",
    output: "$25.00",
    free: false,
    tier: "Previous Flagship",
  },
  {
    provider: "Anthropic",
    model: "Claude Sonnet 4.6",
    id: "claude-sonnet-4-6",
    input: "$3.00",
    output: "$15.00",
    free: false,
    tier: "Balanced",
  },
  {
    provider: "Anthropic",
    model: "Claude Haiku 4.5",
    id: "claude-haiku-4-5-20251001",
    input: "$1.00",
    output: "$5.00",
    free: false,
    tier: "Fast",
  },
  {
    provider: "OpenAI",
    model: "GPT-5.5 Pro",
    id: "gpt-5.5-pro",
    input: "$30.00",
    output: "$180.00",
    free: false,
    tier: "Most Capable",
  },
  {
    provider: "OpenAI",
    model: "GPT-5.5",
    id: "gpt-5.5",
    input: "$5.00",
    output: "$30.00",
    free: false,
    tier: "Flagship",
  },
  {
    provider: "OpenAI",
    model: "GPT-5.4",
    id: "gpt-5.4",
    input: "$2.00",
    output: "$8.00",
    free: false,
    tier: "Reasoning",
  },
  {
    provider: "OpenAI",
    model: "GPT-5.4 Mini",
    id: "gpt-5.4-mini",
    input: "$0.20",
    output: "$0.80",
    free: false,
    tier: "Cost-effective",
  },
  {
    provider: "OpenAI",
    model: "GPT-5.4 Nano",
    id: "gpt-5.4-nano",
    input: "$0.08",
    output: "$0.30",
    free: false,
    tier: "Lowest Cost",
  },
  {
    provider: "Google",
    model: "Gemini 3.1 Pro",
    id: "gemini-3.1-pro-preview",
    input: "$1.25",
    output: "$5.00",
    free: false,
    tier: "Most Capable",
  },
  {
    provider: "Google",
    model: "Gemini 3 Flash",
    id: "gemini-3-flash-preview",
    input: "$0.15",
    output: "$0.60",
    free: false,
    tier: "Balanced",
  },
  {
    provider: "Google",
    model: "Gemini 3.1 Flash-Lite",
    id: "gemini-3.1-flash-lite-preview",
    input: "$0.05",
    output: "$0.20",
    free: false,
    tier: "Lowest Cost",
  },
  {
    provider: "Groq",
    model: "Llama 3.1 8B",
    id: "llama-3.1-8b-instant",
    input: "$0.00",
    output: "$0.00",
    free: true,
    tier: "Instant",
  },
  {
    provider: "Groq",
    model: "Llama 3.3 70B",
    id: "llama-3.3-70b-versatile",
    input: "$0.00",
    output: "$0.00",
    free: true,
    tier: "Versatile",
  },
  {
    provider: "Groq",
    model: "GPT-OSS 120B",
    id: "openai/gpt-oss-120b",
    input: "$0.00",
    output: "$0.00",
    free: true,
    tier: "Open-Weight Flagship",
  },
  {
    provider: "Groq",
    model: "GPT-OSS 20B",
    id: "openai/gpt-oss-20b",
    input: "$0.00",
    output: "$0.00",
    free: true,
    tier: "Open-Weight",
  },
  {
    provider: "Groq",
    model: "Groq Compound",
    id: "groq/compound",
    input: "$0.80",
    output: "$1.60",
    free: false,
    tier: "Agentic",
  },
  {
    provider: "xAI",
    model: "Grok 4.20",
    id: "grok-4-20",
    input: "$3.00",
    output: "$15.00",
    free: false,
    tier: "Most Capable",
  },
  {
    provider: "xAI",
    model: "Grok 4.1 Fast (reasoning)",
    id: "grok-4-1-fast-reasoning",
    input: "$1.00",
    output: "$4.00",
    free: false,
    tier: "Reasoning",
  },
  {
    provider: "xAI",
    model: "Grok 4.1 Fast",
    id: "grok-4-1-fast-non-reasoning",
    input: "$0.50",
    output: "$2.00",
    free: false,
    tier: "Fast",
  },
  {
    provider: "xAI",
    model: "Grok Code Fast",
    id: "grok-code-fast-1",
    input: "$0.30",
    output: "$1.20",
    free: false,
    tier: "Coding",
  },
  {
    provider: "Moonshot",
    model: "Kimi K2.6",
    id: "kimi-k2.6",
    input: "$1.20",
    output: "$2.50",
    free: false,
    tier: "1T Open-Source",
  },
  {
    provider: "OpenRouter",
    model: "Gemma 4 26B (free)",
    id: "google/gemma-4-26b-a4b-it:free",
    input: "$0.00",
    output: "$0.00",
    free: true,
    tier: "Free Tier",
  },
  {
    provider: "OpenRouter",
    model: "Gemma 4 31B (free)",
    id: "google/gemma-4-31b-it:free",
    input: "$0.00",
    output: "$0.00",
    free: true,
    tier: "Free Tier",
  },
  {
    provider: "OpenRouter",
    model: "Qwen3 Coder (free)",
    id: "qwen/qwen3-coder:free",
    input: "$0.00",
    output: "$0.00",
    free: true,
    tier: "Free Tier",
  },
  {
    provider: "OpenRouter",
    model: "Nemotron 3 Super 120B (free)",
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    input: "$0.00",
    output: "$0.00",
    free: true,
    tier: "Free Tier",
  },
  {
    provider: "OpenRouter",
    model: "Ling 2.6 1T (free)",
    id: "inclusionai/ling-2.6-1t:free",
    input: "$0.00",
    output: "$0.00",
    free: true,
    tier: "Free Tier",
  },
];

const providerDetails = [
  {
    name: "Anthropic",
    env: "ANTHROPIC_API_KEY",
    api: "anthropic.AsyncAnthropic",
    maxTokens: 2000,
    judgePriority: 1,
    description:
      "Claude models excel at nuanced reasoning, following complex instructions, and agentic coding. Claude Opus 4.7 is Anthropic's most capable generally available model with a step-change improvement in agentic coding over Opus 4.6. Claude Sonnet 4.6 offers the best balance of speed and intelligence with a 1M-token context. Claude Haiku 4.5 is the fastest model with near-frontier intelligence.",
    strengths:
      "Nuanced reasoning, instruction following, agentic coding, 1M context, structured output",
  },
  {
    name: "OpenAI",
    env: "OPENAI_API_KEY",
    api: "openai.AsyncOpenAI (httpx.AsyncClient)",
    maxTokens: 2000,
    judgePriority: 3,
    description:
      "GPT-5.5 and GPT-5.5 Pro are OpenAI's latest flagship models with 1M-token context windows, available through the Responses and Chat Completions APIs. GPT-5.4 (and the Mini/Nano variants) remain the cost-tier options for high-volume workloads. Retired models like GPT-4o, GPT-4.1, and o4-mini are no longer supported by OpenAI as of February 2026.",
    strengths:
      "General capability, code generation, agentic tool use, multimodal, 1M context",
  },
  {
    name: "Google",
    env: "GOOGLE_API_KEY",
    api: "google.generativeai.GenerativeModel",
    maxTokens: 2000,
    judgePriority: 2,
    description:
      "Gemini 3.1 Pro is Google's most advanced reasoning model, optimized for complex agentic workflows and coding. Gemini 3 Flash provides strong frontier-class performance at low cost, while Gemini 3.1 Flash-Lite is the cheapest option for high-volume, latency-sensitive traffic. Gemini 1.x and 2.x lines have been deprecated.",
    strengths: "Cost efficiency, multimodal, long context, frontier reasoning",
  },
  {
    name: "Groq",
    env: "GROQ_API_KEY",
    api: "OpenAI-compatible (api.groq.com/openai/v1)",
    maxTokens: 2000,
    judgePriority: 6,
    description:
      "Groq provides ultra-fast inference for open-weight models including Llama 3.1 8B, Llama 3.3 70B, and OpenAI's GPT-OSS 120B/20B at zero cost through their free tier. Groq Compound and Compound Mini are agentic systems with built-in web search and code execution. Consilium uses Groq as the primary platform free-tier fallback (CONSILIUM_FREE_TIER_GROQ_KEY) when no BYOK key is configured.",
    strengths: "Free open-weight models, fastest inference, agentic compound systems",
  },
  {
    name: "xAI",
    env: "XAI_API_KEY",
    api: "OpenAI-compatible (api.x.ai/v1)",
    maxTokens: 2000,
    judgePriority: 4,
    description:
      "xAI's Grok lineup launched Grok 4.20 in February 2026 with a four-agent architecture for reasoning. Grok 4.1 Fast (reasoning + non-reasoning variants) and Grok Code Fast cover the lower-cost tier. Use the OpenAI-compatible API format. Grok 2/2-mini and grok-beta are legacy and have been migrated.",
    strengths: "Multi-agent reasoning, real-time knowledge, fast coding tasks",
  },
  {
    name: "Moonshot",
    env: "MOONSHOT_API_KEY",
    api: "OpenAI-compatible (platform.moonshot.ai)",
    maxTokens: 2000,
    judgePriority: 5,
    description:
      "Moonshot's Kimi K2.6 (released April 2026) is a frontier-scale 1T-parameter open-source MoE model with a 262k context window, multi-turn tool calling, vision inputs, and structured outputs for agentic workloads. The API is OpenAI-compatible.",
    strengths: "1T parameters, agentic tool use, long-context coding stability",
  },
  {
    name: "OpenRouter",
    env: "OPENROUTER_API_KEY",
    api: "OpenAI-compatible (openrouter.ai/api/v1)",
    maxTokens: 2000,
    judgePriority: 7,
    description:
      "OpenRouter aggregates access to dozens of models behind one OpenAI-compatible endpoint, including a free tier for popular community models like Gemma 4, Qwen3 Coder, Nemotron 3 Super 120B, and Ling 2.6 1T (rate-limited at 20 req/min, 50 req/day per OpenRouter's April 2026 free-tier policy). Consilium uses OpenRouter as the secondary free-tier fallback (CONSILIUM_FREE_TIER_OPENROUTER_KEY) when Groq is unavailable.",
    strengths: "Free tier breadth, single endpoint for many providers, easy fallback",
  },
];

const cheapoFallbacks = [
  { from: "gpt-5.5-pro", to: "gpt-5.4-mini" },
  { from: "gpt-5.5", to: "gpt-5.4-mini" },
  { from: "claude-opus-4-7", to: "claude-haiku-4-5-20251001" },
  { from: "claude-sonnet-4-6", to: "claude-haiku-4-5-20251001" },
  { from: "gemini-3.1-pro-preview", to: "gemini-3-flash-preview" },
  { from: "grok-4-20", to: "grok-4-1-fast-non-reasoning" },
];

export default function ProvidersPage() {
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
            AI Providers &amp; Models
          </h1>
          <p className="text-xl text-muted-foreground">
            7 providers, 25+ models, from free to frontier. Bring your own keys
            and mix models from different providers in the same deliberation —
            or run on Consilium&apos;s free-tier pool when you don&apos;t have keys.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto space-y-16">
          <div>
            <h2 className="text-2xl font-bold mb-6">
              All Models &amp; Pricing
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Prices are per 1 million tokens, charged by the provider (not
              Consilium). Consilium is BYOK — you pay providers directly through
              your own API keys.
            </p>
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Provider
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Model
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Model ID
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Input/1M
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Output/1M
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Tier
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr
                      key={m.id}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {m.provider}
                      </td>
                      <td className="px-4 py-2.5 font-medium">{m.model}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-indigo-400 hidden md:table-cell">
                        {m.id}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {m.free ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Free
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            {m.input}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {m.free ? (
                          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Free
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            {m.output}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">
                        {m.tier}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Provider Details</h2>
            <div className="space-y-6">
              {providerDetails.map((p) => (
                <Card key={p.name}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{p.name}</CardTitle>
                      <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                        Judge Priority #{p.judgePriority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-neutral-900 p-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          Environment Variable
                        </p>
                        <p className="text-sm font-mono text-indigo-400">
                          {p.env}
                        </p>
                      </div>
                      <div className="rounded-lg bg-neutral-900 p-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                          API Client
                        </p>
                        <p className="text-sm font-mono text-muted-foreground">
                          {p.api}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Strengths
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {p.strengths}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Judge Model Priority</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  The judge model evaluates proposals and produces the final
                  synthesis. Consilium selects the judge based on this priority
                  order (using the first provider for which you have a valid
                  key):
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Anthropic",
                    "Google",
                    "OpenAI",
                    "xAI",
                    "Moonshot",
                    "Groq",
                    "OpenRouter",
                  ].map((p, i, arr) => (
                    <span key={p} className="inline-flex items-center gap-1">
                      <span className="rounded bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-400">
                        #{i + 1} {p}
                      </span>
                      {i < arr.length - 1 && (
                        <span className="text-muted-foreground">→</span>
                      )}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              Free-Tier Fallback (BYOK Preserved)
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Consilium is BYOK-first. When you supply your own provider
                  API key, that key is always used — no fallback occurs. When
                  no key is set for the requested provider, Consilium routes
                  through a platform-hosted free-tier pool so you can keep
                  working at zero cost. Resolution order:
                </p>
                <ol className="list-decimal pl-6 space-y-1 text-sm text-muted-foreground">
                  <li>
                    <span className="font-medium text-white">Your BYOK key</span>{" "}
                    for the requested provider (always wins)
                  </li>
                  <li>
                    Self-hosted env var (e.g. <code className="font-mono text-indigo-400">OPENAI_API_KEY</code>)
                  </li>
                  <li>
                    Groq free-tier pool —{" "}
                    <code className="font-mono text-indigo-400">CONSILIUM_FREE_TIER_GROQ_KEY</code>
                  </li>
                  <li>
                    OpenRouter free-tier pool —{" "}
                    <code className="font-mono text-indigo-400">CONSILIUM_FREE_TIER_OPENROUTER_KEY</code>
                  </li>
                </ol>
                <p className="text-sm text-muted-foreground">
                  Tier is inferred from the requested model&apos;s catalog cost
                  (fast / balanced / deep) and routed to a tier-equivalent free
                  model. The CLI prints a pre-flight notice and a{" "}
                  <code className="font-mono">routing:fallback</code> SSE event
                  is emitted so you always know when fallback is active.
                </p>
                <div className="rounded-lg bg-neutral-900 p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Tier-equivalent free models
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Groq (preferred)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          llama-3.1-8b-instant (fast)
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          llama-3.3-70b-versatile (balanced)
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          openai/gpt-oss-120b (deep)
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        OpenRouter (backup)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          gemma-2-9b-it:free (fast)
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          llama-3.3-70b-instruct:free (balanced)
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                          qwen-2.5-72b-instruct:free (deep)
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              Context Overflow Fallback
            </h2>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  When a model returns a 413 or 400 error indicating the context
                  is too large, Consilium automatically retries with a cheaper,
                  smaller-context variant:
                </p>
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Original Model
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                          Fallback Model
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cheapoFallbacks.map((f) => (
                        <tr
                          key={f.from}
                          className="border-b border-white/[0.06] last:border-0"
                        >
                          <td className="px-4 py-2 font-mono text-sm text-muted-foreground">
                            {f.from}
                          </td>
                          <td className="px-4 py-2 font-mono text-sm text-indigo-400">
                            {f.to}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 mt-0.5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-medium mb-1">Security</p>
                <p className="text-sm text-muted-foreground">
                  All API keys are encrypted with AES-256-GCM before storage.
                  Keys are never stored in plaintext, never logged, and never
                  transmitted to any third party.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
