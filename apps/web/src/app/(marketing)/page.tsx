"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/utils";
import {
  Zap,
  Shield,
  Users,
  Eye,
  Target,
  BarChart3,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Code,
  FileText,
  Key,
  CheckCircle2,
  X,
  MessageSquare,
  AlertTriangle,
  History,
  Search,
  Send,
  Terminal,
  Cpu,
  Gift,
} from "lucide-react";

const steps = [
  {
    id: "propose",
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Propose",
    description:
      "Each model independently analyzes the problem and presents its initial position.",
  },
  {
    id: "challenge",
    icon: <AlertTriangle className="h-6 w-6" />,
    title: "Challenge",
    description:
      "Models cross-examine each other, probing assumptions and identifying weaknesses.",
  },
  {
    id: "rebut",
    icon: <History className="h-6 w-6" />,
    title: "Rebut",
    description:
      "Models refine their positions based on challenges, strengthening or revising arguments.",
  },
  {
    id: "evaluate",
    icon: <Search className="h-6 w-6" />,
    title: "Evaluate",
    description:
      "A judge model assesses argument quality, evidence strength, and logical consistency.",
  },
  {
    id: "vote",
    icon: <Send className="h-6 w-6" />,
    title: "Vote",
    description:
      "Models cast confidence-weighted votes on the strongest positions.",
  },
  {
    id: "synthesize",
    icon: <Sparkles className="h-6 w-6" />,
    title: "Synthesize",
    description:
      "A final synthesis integrates the best arguments into a single, rigorous answer.",
  },
];

const modes = [
  {
    key: "quick",
    icon: <Zap className="h-5 w-5" />,
    title: "Quick",
    description:
      "Single round, fastest response. Best for simple questions needing a fast sanity check.",
    time: "~15s",
  },
  {
    key: "council",
    icon: <Users className="h-5 w-5" />,
    title: "Council",
    description:
      "Multi-round deliberation between models. The default mode for most decisions.",
    time: "~45s",
  },
  {
    key: "deep",
    icon: <FileText className="h-5 w-5" />,
    title: "Deep",
    description:
      "Extended deliberation with sub-agent research for complex, high-stakes questions.",
    time: "~90s",
  },
  {
    key: "blind",
    icon: <Eye className="h-5 w-5" />,
    title: "Blind",
    description:
      "Model names hidden until scored. Eliminates brand bias from evaluation.",
    time: "~45s",
  },
  {
    key: "redteam",
    icon: <Target className="h-5 w-5" />,
    title: "Red Team",
    description:
      "Adversarial assessment where models actively try to break each other's arguments.",
    time: "~120s",
  },
  {
    key: "jury",
    icon: <Shield className="h-5 w-5" />,
    title: "Jury",
    description:
      "Panel deliberation with structured voting. Models must reach consensus or declare dissent.",
    time: "~60s",
  },
  {
    key: "market",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Market",
    description:
      "Prediction market style confidence aggregation. Models stake credibility on positions.",
    time: "~90s",
  },
  {
    key: "auto",
    icon: <Sparkles className="h-5 w-5" />,
    title: "Auto",
    description:
      "Automatically selects the best deliberation mode based on topic complexity.",
    time: "~45s",
  },
];

const comparisonRows = [
  {
    feature: "Multiple model perspectives",
    deliberation: true,
    orchestration: true,
  },
  {
    feature: "Models challenge each other",
    deliberation: true,
    orchestration: false,
  },
  {
    feature: "Structured argumentation",
    deliberation: true,
    orchestration: false,
  },
  { feature: "Dissent tracking", deliberation: true, orchestration: false },
  {
    feature: "Confidence-weighted voting",
    deliberation: true,
    orchestration: false,
  },
  {
    feature: "Adversarial red-teaming",
    deliberation: true,
    orchestration: false,
  },
  {
    feature: "Blind evaluation mode",
    deliberation: true,
    orchestration: false,
  },
  {
    feature: "Audit trail of reasoning",
    deliberation: true,
    orchestration: false,
  },
];

const pythonCode = `from consilium import ConsiliumClient, DeliberationMode

client = ConsiliumClient(
    api_url="https://api.myconsilium.xyz",
    api_key="your-key",
)

result = client.deliberate(
    "Should we migrate to microservices?",
    mode=DeliberationMode.COUNCIL,
    models=["claude-sonnet-4-6",
            "gpt-5.4", "gemini-3-flash-preview"],
)

print(result.golden_prompt)
print(result.confidence_scores)
print(result.dissent_report)`;

const typescriptCode = `import { ConsiliumClient } from "@myconsilium/sdk";

const client = new ConsiliumClient({
  apiUrl: "https://api.myconsilium.xyz",
  apiKey: "your-key",
});

const result = await client.deliberate({
  topic: "Should we migrate to microservices?",
  mode: "council",
  models: ["claude-sonnet-4-6",
           "gpt-5.4", "gemini-3-flash-preview"],
});

console.log(result.goldenPrompt);
console.log(result.confidenceScores);
console.log(result.dissentReport);`;

const cliCode = String.raw`# Install
npm install -g @myconsilium/cli
consilium login

# Quick deliberation
consilium debate "Should we migrate to microservices?" \
  --mode council \
  --models claude-sonnet-4-6 gpt-5.4 gemini-3-flash-preview

# Free-tier (no API keys required)
consilium debate "Pick a database for our SaaS" \
  --mode council \
  --models llama-3.3-70b-versatile openai/gpt-oss-120b

# Red team assessment
consilium debate "Is our auth system secure?" \
  --mode redteam \
  --output markdown

# Codebase-aware debate with file context
consilium debate "Review this architecture" \
  --file src/auth.ts --git-diff`;

const papers = [
  {
    title: "Debating with More Persuasive LLMs Leads to More Truthful Answers",
    authors: "Akbir Khan et al.",
    venue: "ICML 2024",
    insight:
      "AI debate produces more truthful answers than single-model prompting, even when one debater argues for the wrong answer.",
  },
  {
    title: "Improving Factuality and Reasoning via Multiagent Debate",
    authors: "Yilun Du et al.",
    venue: "ICML 2024",
    insight:
      "Multi-agent debate significantly improves factual accuracy and mathematical reasoning across multiple benchmarks.",
  },
  {
    title:
      "LLM Discussion: Enhancing the Creativity of LLMs via Discussion Framework",
    authors: "Li et al.",
    venue: "AAAI 2024",
    insight:
      "Structured discussion between LLMs produces more creative and diverse outputs than individual generation.",
  },
  {
    title: "Scalable AI Safety via Doubly-Efficient Debate",
    authors: "Irving et al.",
    venue: "AI Safety Research",
    insight:
      "Debate between AI systems provides a scalable mechanism for aligning AI behavior with human values.",
  },
];

const installSnippet = String.raw`# 1. Install the CLI globally
npm install -g @myconsilium/cli

# 2. Sign in (or run on the free tier with no key)
consilium login

# 3. Run your first debate
consilium debate "What's the best way to ship this feature?" \
  --mode council`;

type ModelEntry = { id: string; label?: string; free?: boolean };
type ProviderModels = {
  provider: string;
  icon: string;
  blurb: string;
  models: ModelEntry[];
};

const modelCatalog: ProviderModels[] = [
  {
    provider: "Anthropic",
    icon: "anthropic",
    blurb: "Claude 4 family — strongest reasoning and synthesis.",
    models: [
      { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
      { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
      { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
    ],
  },
  {
    provider: "OpenAI",
    icon: "openai",
    blurb: "GPT-5 series — fast, mini, and pro tiers.",
    models: [
      { id: "gpt-5.4-nano", label: "GPT-5.4 Nano" },
      { id: "gpt-5.4-mini", label: "GPT-5.4 Mini" },
      { id: "gpt-5.4", label: "GPT-5.4" },
      { id: "gpt-5.5", label: "GPT-5.5" },
      { id: "gpt-5.5-pro", label: "GPT-5.5 Pro" },
    ],
  },
  {
    provider: "Google",
    icon: "google",
    blurb: "Gemini 3 — long context and fast multimodal.",
    models: [
      { id: "gemini-3.1-flash-lite-preview", label: "Gemini 3.1 Flash Lite" },
      { id: "gemini-3-flash-preview", label: "Gemini 3 Flash" },
      { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro" },
    ],
  },
  {
    provider: "Groq",
    icon: "groq",
    blurb: "Sub-second inference. Free tier available.",
    models: [
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant", free: true },
      {
        id: "llama-3.3-70b-versatile",
        label: "Llama 3.3 70B Versatile",
        free: true,
      },
      { id: "openai/gpt-oss-20b", label: "GPT-OSS 20B", free: true },
      { id: "openai/gpt-oss-120b", label: "GPT-OSS 120B", free: true },
      { id: "groq/compound-mini", label: "Groq Compound Mini" },
      { id: "groq/compound", label: "Groq Compound" },
    ],
  },
  {
    provider: "xAI",
    icon: "xai",
    blurb: "Grok 4 — code-focused and reasoning variants.",
    models: [
      { id: "grok-code-fast-1", label: "Grok Code Fast" },
      { id: "grok-4-1-fast-non-reasoning", label: "Grok 4.1 Fast" },
      { id: "grok-4-1-fast-reasoning", label: "Grok 4.1 Reasoning" },
      { id: "grok-4-20", label: "Grok 4.20" },
    ],
  },
  {
    provider: "Moonshot",
    icon: "groq",
    blurb: "Kimi K2 — long-context reasoning.",
    models: [
      { id: "kimi-k2.5", label: "Kimi K2.5" },
      { id: "kimi-k2.6", label: "Kimi K2.6" },
      { id: "kimi-k2-thinking", label: "Kimi K2 Thinking" },
    ],
  },
  {
    provider: "OpenRouter",
    icon: "openai",
    blurb: "Free community models — backup for the free tier.",
    models: [
      {
        id: "google/gemma-4-26b-a4b-it:free",
        label: "Gemma 4 26B",
        free: true,
      },
      { id: "google/gemma-4-31b-it:free", label: "Gemma 4 31B", free: true },
      { id: "qwen/qwen3-coder:free", label: "Qwen3 Coder", free: true },
      {
        id: "nvidia/nemotron-3-super-120b-a12b:free",
        label: "Nemotron 3 Super 120B",
        free: true,
      },
      {
        id: "inclusionai/ling-2.6-1t:free",
        label: "Ling 2.6 1T",
        free: true,
      },
    ],
  },
];

const tabs = ["Python", "TypeScript", "CLI"] as const;
type Tab = (typeof tabs)[number];

function CodeBlock({ code }: Readonly<{ code: string }>) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-muted/50 border p-4 text-sm leading-relaxed">
      <code className="text-muted-foreground">{code}</code>
    </pre>
  );
}

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Python");

  return (
    <>
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/api/video/consilium-prod.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        <button
          onClick={() =>
            document
              .getElementById("hero-content")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer z-10"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      </section>

      <section id="hero-content" className="space-y-6 py-24 md:py-32 lg:py-40">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl sm:text-5xl lg:text-7xl">
            Structured Deliberation Between AI Models
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Not another orchestration tool. Consilium makes AI models argue,
            challenge, and synthesize — producing answers with tracked
            confidence, dissent, and audit trails.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/council"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              View Demo
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="container space-y-6 py-8 md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">How It Works</h2>
          <p className="max-w-[85%] text-muted-foreground sm:text-lg">
            A structured 6-phase deliberation process inspired by academic
            debate and jury systems.
          </p>
        </div>
        <div className="mx-auto grid gap-4 sm:grid-cols-2 md:max-w-5xl lg:grid-cols-3">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className="relative overflow-hidden rounded-lg border bg-background p-2"
            >
              <div className="flex h-[180px] flex-col rounded-md p-6 gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {i + 1}
                  </span>
                  {step.icon}
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="modes"
        className="container space-y-6 py-8 md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">
            8 Deliberation Modes
          </h2>
          <p className="max-w-[85%] text-muted-foreground sm:text-lg">
            Choose the right deliberation strategy for your use case.
          </p>
        </div>
        <div className="mx-auto grid gap-4 sm:grid-cols-2 md:max-w-5xl lg:grid-cols-4">
          {modes.map((mode) => (
            <Card key={mode.key} variant="interactive" className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {mode.icon}
                    <CardTitle className="text-base">{mode.title}</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {mode.time}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {mode.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section
        id="features"
        className="container space-y-6 py-8 md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Why Deliberation {">"} Orchestration
          </h2>
          <p className="max-w-[85%] text-muted-foreground sm:text-lg">
            Orchestration runs models in parallel and picks the best.
            Deliberation makes them argue until the truth emerges.
          </p>
        </div>
        <div className="mx-auto max-w-3xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium">Capability</th>
                <th className="text-center py-3 px-4 font-medium">
                  Deliberation
                </th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">
                  Orchestration
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="border-b border-border/50">
                  <td className="py-3 px-4">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {row.deliberation ? (
                      <CheckCircle2 className="h-4 w-4 mx-auto text-green-500" />
                    ) : (
                      <X className="h-4 w-4 mx-auto text-muted-foreground" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.orchestration ? (
                      <CheckCircle2 className="h-4 w-4 mx-auto text-green-500" />
                    ) : (
                      <X className="h-4 w-4 mx-auto text-muted-foreground" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="install"
        className="container space-y-6 py-8 md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center space-y-4 text-center">
          <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Terminal className="h-3.5 w-3.5" />
            One command to get started
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold">
            Install the CLI
          </h2>
          <p className="max-w-[85%] text-muted-foreground sm:text-lg">
            Run debates from your terminal — pipe in files, diffs, or stdin and
            stream the deliberation live.
          </p>
        </div>
        <div className="mx-auto max-w-3xl space-y-4">
          <CodeBlock code={installSnippet} />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/docs/cli"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              CLI Docs
              <ArrowRight className="ml-2 h-3.5 w-3.5" />
            </Link>
            <Link
              href="https://www.npmjs.com/package/@myconsilium/cli"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              View on npm
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <section id="sdk" className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-6xl flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">SDK Examples</h2>
          <p className="max-w-[85%] text-muted-foreground sm:text-lg">
            Integrate deliberation into your stack in minutes.
          </p>
        </div>
        <div className="mx-auto max-w-3xl">
          <div className="flex border-b mb-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeTab === "Python" && <CodeBlock code={pythonCode} />}
          {activeTab === "TypeScript" && <CodeBlock code={typescriptCode} />}
          {activeTab === "CLI" && <CodeBlock code={cliCode} />}
        </div>
      </section>

      <section
        id="integrations"
        className="container space-y-6 py-8 md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Supported Providers
          </h2>
          <p className="max-w-[85%] text-muted-foreground sm:text-lg">
            Bring your own API keys. Consilium works with all major LLM
            providers.
          </p>
        </div>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-8">
          {[
            { name: "Anthropic", icon: "anthropic" },
            { name: "OpenAI", icon: "openai" },
            { name: "Google", icon: "google" },
            { name: "Groq", icon: "groq" },
            { name: "xAI", icon: "xai" },
          ].map((provider) => (
            <div
              key={provider.name}
              className="flex flex-col items-center gap-2 rounded-lg border bg-background p-6 min-w-[120px]"
            >
              <img
                src={`/brand/providers/${provider.icon}.svg`}
                alt={provider.name}
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="text-sm font-medium">{provider.name}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="models"
        className="container space-y-6 py-8 md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center space-y-4 text-center">
          <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" />
            Available in the CLI and Web app
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold">
            Models on the Council
          </h2>
          <p className="max-w-[85%] text-muted-foreground sm:text-lg">
            Mix any combination across providers. Models marked{" "}
            <span className="inline-flex items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
              <Gift className="h-3 w-3" />
              Free
            </span>{" "}
            run on the no-key-required free tier.
          </p>
        </div>
        <div className="mx-auto grid gap-4 sm:grid-cols-2 md:max-w-6xl lg:grid-cols-3">
          {modelCatalog.map((group) => (
            <Card
              key={group.provider}
              variant="default"
              className="h-full"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={`/brand/providers/${group.icon}.svg`}
                    alt={group.provider}
                    width={24}
                    height={24}
                    className="h-6 w-6"
                  />
                  <CardTitle className="text-base">{group.provider}</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground pt-1">
                  {group.blurb}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {group.models.map((model) => (
                    <li
                      key={model.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {model.label ?? model.id}
                        </div>
                        <code className="text-xs text-muted-foreground truncate block">
                          {model.id}
                        </code>
                      </div>
                      {model.free && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-green-500/40 bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                          <Gift className="h-3 w-3" />
                          Free
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mx-auto max-w-3xl rounded-lg border bg-muted/30 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">No key, no problem.</span>{" "}
            Start a debate with zero setup — Consilium routes free-tier requests
            through Groq and OpenRouter automatically. Bring your own keys
            anytime for premium models.
          </p>
        </div>
      </section>

      <section
        id="research"
        className="container space-y-6 py-8 md:py-12 lg:py-24"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center space-y-4 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Research Backed
          </h2>
          <p className="max-w-[85%] text-muted-foreground sm:text-lg">
            Consilium&apos;s deliberation approach is grounded in peer-reviewed
            research.
          </p>
        </div>
        <div className="mx-auto grid gap-4 sm:grid-cols-2 md:max-w-5xl">
          {papers.map((paper) => (
            <Card key={paper.title} variant="default" className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base leading-snug">
                  {paper.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {paper.authors} — {paper.venue}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{paper.insight}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="byok" className="container space-y-6 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-3xl flex-col items-center space-y-6 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold">
            Your keys. Your control.
          </h2>
          <p className="text-muted-foreground sm:text-lg">
            Bring your own provider keys and pay only for what you use.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
              <Shield className="h-4 w-4" />
              End-to-end encryption
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
              <Key className="h-4 w-4" />
              Bring Your Own Keys
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm">
              <Code className="h-4 w-4" />
              CLI + SDK
            </span>
          </div>
          <div className="flex gap-4 pt-4">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Start free
            </Link>
            <Link
              href="/pricing"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
