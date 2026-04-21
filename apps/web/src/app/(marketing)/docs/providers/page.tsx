import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Providers & Models",
  description: "Supported AI providers and models in Consilium — OpenAI, Anthropic, Google, Groq, and xAI. Pricing, capabilities, and model selection guide.",
  path: "/docs/providers",
  keywords: ["ai providers","openai claude gemini","llm comparison","model pricing"],
});

const models = [
  { provider: "Anthropic", model: "Claude Opus 4.6", id: "claude-opus-4-6", input: "$15.00", output: "$75.00", free: false, tier: "Most Capable" },
  { provider: "Anthropic", model: "Claude Sonnet 4.5", id: "claude-sonnet-4-5", input: "$3.00", output: "$15.00", free: false, tier: "Balanced" },
  { provider: "Anthropic", model: "Claude Haiku 4.5", id: "claude-haiku-4-5-20251001", input: "$0.80", output: "$4.00", free: false, tier: "Fast" },
  { provider: "OpenAI", model: "GPT-4o", id: "gpt-4o", input: "$2.50", output: "$10.00", free: false, tier: "Flagship" },
  { provider: "OpenAI", model: "GPT-4o Mini", id: "gpt-4o-mini", input: "$0.15", output: "$0.60", free: false, tier: "Cost-effective" },
  { provider: "OpenAI", model: "GPT-4.1", id: "gpt-4.1", input: "$2.00", output: "$8.00", free: false, tier: "Latest" },
  { provider: "OpenAI", model: "o3-mini", id: "o3-mini", input: "$1.10", output: "$4.40", free: false, tier: "Reasoning" },
  { provider: "Google", model: "Gemini 2.0 Flash", id: "gemini-2.0-flash", input: "$0.10", output: "$0.40", free: false, tier: "Fastest" },
  { provider: "Google", model: "Gemini 2.5 Flash", id: "gemini-2.5-flash", input: "$0.15", output: "$0.60", free: false, tier: "Balanced" },
  { provider: "Google", model: "Gemini 2.5 Pro", id: "gemini-2.5-pro", input: "$1.25", output: "$5.00", free: false, tier: "Most Capable" },
  { provider: "Groq", model: "Llama 3.1 8B", id: "llama-3.1-8b-instant", input: "$0.00", output: "$0.00", free: true, tier: "Instant" },
  { provider: "Groq", model: "Llama 3.3 70B", id: "llama-3.3-70b-versatile", input: "$0.00", output: "$0.00", free: true, tier: "Versatile" },
  { provider: "Groq", model: "Llama 4 Scout", id: "llama-4-scout-17b", input: "$0.00", output: "$0.00", free: true, tier: "Latest" },
  { provider: "xAI", model: "Grok 2", id: "grok-2", input: "$2.00", output: "$10.00", free: false, tier: "Full" },
  { provider: "xAI", model: "Grok 2 Mini", id: "grok-2-mini", input: "$0.30", output: "$1.00", free: false, tier: "Compact" },
];

const providerDetails = [
  {
    name: "Anthropic",
    env: "ANTHROPIC_API_KEY",
    api: "anthropic.AsyncAnthropic",
    maxTokens: 2000,
    judgePriority: 1,
    description: "Claude models excel at nuanced reasoning, following complex instructions, and producing well-structured outputs. Claude Opus 4.6 is the most capable model available. Claude Sonnet 4.5 offers the best balance of cost and capability. Claude Haiku 4.5 is optimized for speed.",
    strengths: "Nuanced reasoning, instruction following, safety, structured output",
  },
  {
    name: "OpenAI",
    env: "OPENAI_API_KEY",
    api: "openai.AsyncOpenAI (httpx.AsyncClient)",
    maxTokens: 2000,
    judgePriority: 3,
    description: "GPT-4o is OpenAI's flagship multimodal model. GPT-4o Mini is the most cost-effective option for lighter tasks. GPT-4.1 is the latest iteration. o3-mini specializes in chain-of-thought reasoning tasks.",
    strengths: "General capability, code generation, creative writing, multimodal",
  },
  {
    name: "Google",
    env: "GOOGLE_API_KEY",
    api: "google.generativeai.GenerativeModel",
    maxTokens: 2000,
    judgePriority: 2,
    description: "Gemini models offer excellent performance at competitive prices. Gemini 2.0 Flash is one of the cheapest capable models. Gemini 2.5 Pro provides strong reasoning at a fraction of Claude Opus cost. Token estimation uses word_count * 2 approximation.",
    strengths: "Cost efficiency, multimodal, long context, reasoning",
  },
  {
    name: "Groq",
    env: "GROQ_API_KEY",
    api: "OpenAI-compatible (api.groq.com/openai/v1)",
    maxTokens: 2000,
    judgePriority: 5,
    description: "Groq provides Llama models at zero cost through their free tier. All three models (Llama 3.1 8B, 3.3 70B, 4 Scout) are completely free. Consilium uses Groq as the automatic fallback when no paid API keys are configured.",
    strengths: "Free, fast inference, good for prototyping and fallback",
  },
  {
    name: "xAI",
    env: "XAI_API_KEY",
    api: "OpenAI-compatible (api.x.ai/v1)",
    maxTokens: 2000,
    judgePriority: 4,
    description: "Grok models from xAI. Grok 2 is the full-capability model. Grok 2 Mini offers a compact, more affordable option. Both use the OpenAI-compatible API format.",
    strengths: "Real-time knowledge, conversational, competitive pricing",
  },
];

const cheapoFallbacks = [
  { from: "gpt-4o", to: "gpt-4o-mini" },
  { from: "gpt-4.1", to: "gpt-4o-mini" },
  { from: "claude-sonnet-4-5", to: "claude-haiku-4-5-20251001" },
  { from: "gemini-2.5-pro", to: "gemini-2.0-flash" },
];

export default function ProvidersPage() {
  return (
    <div className="min-h-screen">
      <section className="pt-28 pb-16 border-b border-white/[0.08]">
        <div className="container-narrow">
          <div className="eyebrow mb-5">Providers & models</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            Five providers.<br /><em>Fifteen models.</em>
          </h1>
          <p className="mt-6 max-w-[640px] text-[17px] leading-[1.55] text-ink-secondary">
            Anthropic, OpenAI, Google, Groq, xAI — with judge priority, fallback rules, and full BYOK pricing.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto space-y-16">

          <div>
            <h2 className="text-2xl font-bold mb-6">All Models &amp; Pricing</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Prices are per 1 million tokens, charged by the provider (not Consilium). Consilium is BYOK — you pay providers directly through your own API keys.
            </p>
            <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Provider</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Model ID</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Input/1M</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Output/1M</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.id} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-4 py-2.5 text-muted-foreground">{m.provider}</td>
                      <td className="px-4 py-2.5 font-medium">{m.model}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-warm hidden md:table-cell">{m.id}</td>
                      <td className="px-4 py-2.5 text-right">
                        {m.free ? <Badge className="bg-agree/14 text-agree border-agree/30">Free</Badge> : <span className="text-muted-foreground">{m.input}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {m.free ? <Badge className="bg-agree/14 text-agree border-agree/30">Free</Badge> : <span className="text-muted-foreground">{m.output}</span>}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{m.tier}</td>
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
                      <Badge className="bg-warm/12 text-warm border-warm/20">Judge Priority #{p.judgePriority}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-lg bg-bg-1 p-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Environment Variable</p>
                        <p className="text-sm font-mono text-warm">{p.env}</p>
                      </div>
                      <div className="rounded-lg bg-bg-1 p-3">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">API Client</p>
                        <p className="text-sm font-mono text-muted-foreground">{p.api}</p>
                      </div>
                    </div>
                    <div className="rounded-lg bg-bg-1 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Strengths</p>
                      <p className="text-sm text-muted-foreground">{p.strengths}</p>
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
                  The judge model evaluates proposals and produces the final synthesis. Consilium selects the judge based on this priority order (using the first provider for which you have a valid key):
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Anthropic","Google","OpenAI","xAI","Groq"].map((p, i) => (
                    <span key={p} className="inline-flex items-center gap-1">
                      <span className="rounded bg-warm/12 px-3 py-1.5 text-sm font-medium text-warm">
                        #{i + 1} {p}
                      </span>
                      {i < 4 && <span className="text-muted-foreground">→</span>}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Free Fallback System</h2>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  When no paid API keys are configured, Consilium automatically falls back to Groq&apos;s free tier models. This means you can use Consilium at zero cost for prototyping and testing.
                </p>
                <div className="rounded-lg bg-bg-1 p-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Free Fallback Models</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-agree/14 text-agree border-agree/30">llama-3.1-8b-instant</Badge>
                    <Badge className="bg-agree/14 text-agree border-agree/30">llama-3.3-70b-versatile</Badge>
                    <Badge className="bg-agree/14 text-agree border-agree/30">llama-4-scout-17b</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Context Overflow Fallback</h2>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <p className="text-sm text-muted-foreground">
                  When a model returns a 413 or 400 error indicating the context is too large, Consilium automatically retries with a cheaper, smaller-context variant:
                </p>
                <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Original Model</th>
                        <th className="px-4 py-2 text-left font-medium text-muted-foreground">Fallback Model</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cheapoFallbacks.map((f) => (
                        <tr key={f.from} className="border-b border-white/[0.06] last:border-0">
                          <td className="px-4 py-2 font-mono text-sm text-muted-foreground">{f.from}</td>
                          <td className="px-4 py-2 font-mono text-sm text-warm">{f.to}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-bg-1 p-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 mt-0.5 text-agree shrink-0" />
              <div>
                <p className="font-medium mb-1">Security</p>
                <p className="text-sm text-muted-foreground">
                  All API keys are encrypted with AES-256-GCM before storage. Keys are never stored in plaintext, never logged, and never transmitted to any third party. In self-hosted deployments, keys never leave your infrastructure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
