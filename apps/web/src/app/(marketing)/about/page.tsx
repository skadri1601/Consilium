import type { Metadata } from "next";
import Image from "next/image";
import {
  Shield,
  MessageSquare,
  BarChart3,
  Activity,
  AlertTriangle,
  Gauge,
  FileSearch,
  Key,
  Zap,
  Compass,
  Heart,
  Layers,
  Mail,
  Globe,
} from "lucide-react";
import { LinkedInLogoIcon } from "@radix-ui/react-icons";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbList, personSchema } from "@/lib/structured-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { ScrollButton } from "./scroll-button";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "Consilium is the governance and deliberation infrastructure for autonomous AI agents. Compliance-grade audit trails, formal voting theory, adversarial review, and mandatory dissent preservation. EU AI Act ready.",
  path: "/about",
  keywords: [
    "consilium about",
    "agent governance",
    "ai compliance",
    "agent economy infrastructure",
  ],
});

const differentiators = [
  {
    icon: MessageSquare,
    title: "Agent Governance, Not Just Guardrails",
    description:
      "Guardrails filter outputs after the fact. Consilium governs decisions before they execute. Policy engines define what agents can and cannot do. Quorum voting requires multi-model agreement before high-stakes actions proceed. Delegation hierarchies escalate contested decisions. Cross-examination uses typed challenges (factual error, missing evidence, flawed logic) and categorized rebuttals (concede, refute, qualify, redirect).",
    detail:
      "Policy engines, quorum voting, delegation hierarchies, budget controls.",
  },
  {
    icon: BarChart3,
    title: "Formal Voting Theory",
    description:
      "Condorcet method finds the candidate that beats ALL others pairwise. Borda count provides confidence-weighted scoring across all positions. Ranked Pairs delivers cycle-free tiebreaking using a directed acyclic graph of pairwise victories. Copeland scoring enables comparative analysis by counting net pairwise wins. This is real social choice theory applied to AI consensus - not majority voting, not picking the most popular answer.",
    detail: "Algorithms: Condorcet, Borda Count, Ranked Pairs, Copeland.",
  },
  {
    icon: Activity,
    title: "Continuous Risk Scoring",
    description:
      "Adversarial assessment with drift detection. Convergence is measured using Kendall tau correlation (0.4 weight) for ranking similarity, Jaccard index (0.35 weight) for proposal overlap, and concession tracking (0.25 weight) for position shifts. The composite score must reach 0.85 before consensus is declared. If convergence stalls or risk scores drift, the system detects it and escalates. Not monitoring failures - preventing them.",
    detail:
      "Adversarial assessment + drift detection. Threshold: 0.85 composite score.",
  },
  {
    icon: AlertTriangle,
    title: "Mandatory Dissent Preservation",
    description:
      "Agglomerative clustering identifies minority positions across model responses by measuring semantic distance between position vectors. Every result includes both majority AND minority opinions. Healthcare, legal, and financial modes require explicit dissent reporting. No decision is declared unanimous unless mathematically verified through convergence metrics - and even then, the clustering algorithm surfaces the most distant position as a recorded dissent.",
    detail:
      "Clustering: agglomerative, distance-based. Output: majority position + all minority clusters.",
  },
  {
    icon: Gauge,
    title: "Multi-Vendor Neutrality",
    description:
      "No single LLM vendor honestly reviews its own outputs. Consilium ensures governance decisions are made by models from multiple vendors - Anthropic, OpenAI, Google, xAI, Groq, Moonshot - so no single provider can bias the verdict. Confidence calibration penalizes models that flip under scrutiny: stability * (1 - concession_rate) * (1 - 0.3 * qualification_rate).",
    detail:
      "7 providers, zero vendor lock-in. No model reviews its own outputs.",
  },
  {
    icon: FileSearch,
    title: "Compliance-Grade Audit Trail",
    description:
      "Every governance phase is recorded: input, output, tokens used, cost, and latency per model per round. Full transparency into how verdicts were reached - which models agreed, who dissented, what challenges were raised, and how they were resolved. EU AI Act ready. SOC 2 compatible. Required for regulated verticals: legal, healthcare, finance, and compliance.",
    detail:
      "EU AI Act ready. SOC 2 compatible. Per-model: tokens, cost, latency, round, phase.",
  },
];

const stats = [
  { value: "8", label: "Deliberation Modes" },
  { value: "7", label: "LLM Providers" },
  { value: "6", label: "MCP Tools" },
  { value: "6", label: "Regulated Verticals" },
  { value: "4", label: "Voting Algorithms" },
  { value: "3", label: "Convergence Metrics" },
  { value: "2", label: "SDKs + CLI" },
];

export default function AboutPage() {
  const founderSchema = personSchema({
    name: "Saad Kadri",
    jobTitle: "Founder & Engineer",
    url: "https://saadkadri.dev",
    worksForName: "Consilium",
    image: "/team/saad-kadri.jpg",
    sameAs: [
      "https://www.linkedin.com/in/saad-kadri-58b8bb205/",
      "https://saadkadri.dev",
    ],
  });
  const aboutBreadcrumbs = breadcrumbList([
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ]);
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-founder" data={founderSchema} />
      <JsonLd id="ld-about-breadcrumbs" data={aboutBreadcrumbs} />
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        >
          <source src="/brand/consilium-prod.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black" />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            Agent Governance Infrastructure
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            The Judicial System for the Agent Economy
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Consilium is the governance and deliberation infrastructure for
            autonomous AI agents. When an agent faces a contested, high-stakes,
            or compliance-sensitive decision, it calls Consilium. Multiple
            models independently evaluate, cross-examine, and produce a verdict
            with a compliance-grade audit trail.
          </p>
        </div>
        <ScrollButton />
      </section>

      <section id="about-content" className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Every economy needs a judicial system. The agent economy
            doesn&apos;t have one. Consilium is building the governance
            infrastructure that every AI agent in the world will need.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Not monitoring failures. Preventing them. When AI agents face
            high-stakes decisions, they call Consilium for multi-vendor
            adversarial review, compliance-grade audit trails, and governed
            verdicts backed by formal voting theory.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-20">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-lg border bg-card"
            >
              <div className="text-2xl md:text-3xl font-bold text-indigo-400">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <h2 className="text-3xl font-bold text-center mb-4">
          What Makes Consilium Different
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Six technical differentiators that separate governance from
          guardrails.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {differentiators.map((diff) => {
            const Icon = diff.icon;
            return (
              <Card key={diff.title}>
                <CardHeader>
                  <Icon className="h-8 w-8 mb-2 text-indigo-400" />
                  <CardTitle className="text-lg">{diff.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {diff.description}
                  </p>
                  <pre className="text-xs font-mono text-indigo-400/70 bg-indigo-500/5 rounded p-2 overflow-x-auto">
                    <code>{diff.detail}</code>
                  </pre>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Our Story</h2>

          <div className="space-y-6 text-muted-foreground leading-relaxed">
            <p>
              Consilium started with a simple observation: every economy needs
              a judicial system, and the agent economy doesn&apos;t have one.
              As AI agents gain autonomy over high-stakes decisions -
              deployments, financial transactions, medical recommendations -
              there is no governance layer ensuring those decisions are sound.
              We built that layer.
            </p>

            <p>
              The breakthrough came from academic research on multi-agent
              debate. Papers from ICML 2024 showed that structured adversarial
              review between LLMs improves factual accuracy by 8-15%, and that
              truth has a natural advantage in adversarial argumentation. We
              implemented these findings as production governance infrastructure
              with formal voting theory, convergence detection, and mandatory
              dissent preservation.
            </p>

            <p>
              Consilium supports current-generation models across 7 providers:
              Anthropic (Claude Opus 4.7, Sonnet 4.6, Haiku 4.5), OpenAI
              (GPT-5.5 Pro, GPT-5.4), Google (Gemini 3.1 Pro, Gemini 3 Flash),
              xAI (Grok 4.20, Grok 4.1 Fast), Moonshot (Kimi K2.6), Groq for
              cost-effective inference (Llama 3.x, GPT-OSS, Compound), and
              OpenRouter for free-tier fallback. Models debate through a
              LangGraph state machine with typed challenges, categorized
              rebuttals, confidence-weighted voting, and mathematical
              convergence detection.
            </p>

            <p>
              The architecture is a three-tier system: Next.js 15 frontend,
              NestJS 11 API with BullMQ job processing, and a FastAPI debate
              engine that orchestrates the deliberation state machine. Every
              phase is recorded for full auditability - which models agreed, who
              dissented, what evidence was cited, and how consensus was reached.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Architecture</h2>
          <p className="text-muted-foreground text-center mb-8">
            Three-tier governance system with a LangGraph deliberation state machine.
          </p>
          <div className="rounded-lg border bg-muted/50 p-6 overflow-x-auto">
            <pre className="text-sm text-muted-foreground leading-relaxed">
              <code>{`Web (Next.js 15) → API (NestJS 11/Fastify) → Agents (FastAPI/Python)
                                                      ↓
                                             Debate Orchestrator
                                             ├── Round 1: Independent Analysis
                                             ├── Round 2: Cross-Examination
                                             ├── Round 3: Rebuttal & Refinement
                                             └── Judge: 5-Phase Synthesis

Voting: Condorcet → Borda Count → Ranked Pairs → Copeland
Convergence: Kendall τ + Jaccard + Concession Tracking (threshold: 0.85)
Dissent: Agglomerative Clustering → Minority Position Preservation`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section id="founder" className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Founder
            </Badge>
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              Meet the Founder
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Why one developer is building the governance OS for the agent
              economy.
            </p>
          </div>

          <div className="grid md:grid-cols-[280px,1fr] gap-10 items-start">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="relative w-[240px] h-[300px] rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border">
                <Image
                  src="/team/saad-kadri.jpg"
                  alt="Saad Kadri, Founder of Consilium"
                  fill
                  sizes="240px"
                  className="object-cover"
                  priority={false}
                />
                <div className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-indigo-300/40 -z-10">
                  SK
                </div>
              </div>
              <div className="text-center md:text-left">
                <div className="text-lg font-semibold">Saad Kadri</div>
                <div className="text-sm text-muted-foreground">
                  Founder & Engineer
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://saadkadri.dev"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Personal site"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Globe className="h-5 w-5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/saad-kadri-58b8bb205/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LinkedInLogoIcon className="h-5 w-5" />
                </a>
                <a
                  href="mailto:saad@myconsilium.xyz"
                  aria-label="Email"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Hi, I&apos;m Saad.
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  I build software for a living and saw the same pattern
                  everywhere: companies deploying AI agents with no governance
                  layer, no adversarial review, no audit trail. The fix
                  isn&apos;t better guardrails - it&apos;s a judicial system
                  where multiple models cross-examine every high-stakes
                  decision. That&apos;s Consilium.
                </p>
              </div>

              <Card className="border-indigo-500/30 bg-indigo-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Compass className="h-5 w-5 text-indigo-400" />
                    <CardTitle className="text-base">Mission</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Build the governance infrastructure that every AI agent in
                    the world will need. When agents face high-stakes decisions,
                    they call Consilium. Multi-vendor review, compliance-grade
                    audit trails, and governed verdicts - so every decision is
                    defensible.
                  </p>
                </CardContent>
              </Card>

              <div>
                <h3 className="text-xl font-semibold mb-3">What I value</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border bg-card p-4">
                    <Layers className="h-5 w-5 text-indigo-400 mb-2" />
                    <div className="text-sm font-semibold mb-1">
                      Provider neutrality
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Seven providers, zero lock-in. BYOK or run on the free
                      tier.
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <FileSearch className="h-5 w-5 text-indigo-400 mb-2" />
                    <div className="text-sm font-semibold mb-1">
                      Codebase-aware
                    </div>
                    <div className="text-xs text-muted-foreground">
                      The council reads your files. No more guessing at
                      structure or stack.
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-4">
                    <Heart className="h-5 w-5 text-indigo-400 mb-2" />
                    <div className="text-sm font-semibold mb-1">
                      Show the work
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Every claim is auditable. Dissent is preserved, not
                      hidden.
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Why I built Consilium
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every guardrail tool monitors failures after the fact. Every
                  AI coding tool is a single model with a pretty wrapper. No
                  single LLM vendor honestly reviews its own outputs. The agent
                  economy needs governance, not more monitoring.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-3">
                  Consilium puts seven providers in the same room - OpenAI,
                  Anthropic, Google, Groq, xAI, Moonshot, OpenRouter - and makes
                  them cross-examine each other before any decision ships. When
                  they disagree, you see the disagreement. When they converge,
                  you get a compliance-grade audit trail. That&apos;s the
                  infrastructure I wanted, so I built it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Built for teams deploying agents</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            6 MCP tools any AI client can call. BYOK by default, encrypted at
            rest, with a full SDK and CLI story.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mb-12">
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
              <Key className="h-6 w-6 text-indigo-400" />
              <span className="text-sm font-medium">BYOK</span>
              <span className="text-xs text-muted-foreground text-center">
                Bring Your Own API Keys
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
              <Shield className="h-6 w-6 text-indigo-400" />
              <span className="text-sm font-medium">Encrypted at rest</span>
              <span className="text-xs text-muted-foreground text-center">
                AES-256-GCM on every key
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
              <Zap className="h-6 w-6 text-indigo-400" />
              <span className="text-sm font-medium">Free tier</span>
              <span className="text-xs text-muted-foreground text-center">
                Groq models included at $0
              </span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Badge variant="outline" className="text-xs">
              TypeScript SDK
            </Badge>
            <Badge variant="outline" className="text-xs">
              Python SDK
            </Badge>
            <Badge variant="outline" className="text-xs">
              CLI
            </Badge>
            <Badge variant="outline" className="text-xs">
              REST API
            </Badge>
            <Badge variant="outline" className="text-xs">
              SSE Streaming
            </Badge>
          </div>
        </div>
      </section>
    </div>
  );
}
