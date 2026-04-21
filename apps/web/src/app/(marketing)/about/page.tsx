import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  Github,
  MessageSquare,
  BarChart3,
  Activity,
  AlertTriangle,
  Gauge,
  FileSearch,
  Key,
  Server,
  Zap,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
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
    "Consilium implements formal multi-AI deliberation — typed challenges, social choice voting, convergence detection, and mandatory dissent. Built on peer-reviewed research from ICML, ACL, and AAAI.",
  path: "/about",
  keywords: [
    "consilium about",
    "multi-agent deliberation",
    "ai council",
    "formal argumentation",
    "open source ai",
  ],
});

const differentiators = [
  {
    icon: MessageSquare,
    title: "True Deliberation, Not Orchestration",
    description:
      "Orchestration tools (CrewAI, AutoGen, LangGraph) run models in parallel and pick the best output. Consilium makes models argue, challenge claims, defend positions, vote, and only converge when mathematically confirmed. Cross-examination uses typed challenges (factual error, missing evidence, flawed logic) and categorized rebuttals (concede, refute, qualify, redirect). Each challenge must reference specific claims, and each rebuttal must provide evidence — not hand-waving.",
    detail:
      "Challenge types: FACTUAL_ERROR, MISSING_EVIDENCE, FLAWED_LOGIC. Rebuttal types: CONCEDE, REFUTE, QUALIFY, REDIRECT.",
  },
  {
    icon: BarChart3,
    title: "Formal Voting Theory",
    description:
      "Condorcet method finds the candidate that beats ALL others pairwise. Borda count provides confidence-weighted scoring across all positions. Ranked Pairs delivers cycle-free tiebreaking using a directed acyclic graph of pairwise victories. Copeland scoring enables comparative analysis by counting net pairwise wins. This is real social choice theory applied to AI consensus — not majority voting, not picking the most popular answer.",
    detail: "Algorithms: Condorcet, Borda Count, Ranked Pairs, Copeland.",
  },
  {
    icon: Activity,
    title: "Mathematical Convergence Detection",
    description:
      "Convergence is measured using Kendall tau correlation (0.4 weight) for ranking similarity, Jaccard index (0.35 weight) for proposal overlap, and concession tracking (0.25 weight) for position shifts. The composite score must reach 0.85 before consensus is declared. If convergence stalls, the system detects it and can trigger additional rounds or escalate to a different mode. Not vibes-based — mathematically verified.",
    detail:
      "Formula: 0.4 * kendall_tau + 0.35 * jaccard + 0.25 * concession_rate >= 0.85",
  },
  {
    icon: AlertTriangle,
    title: "Mandatory Dissent Preservation",
    description:
      "Agglomerative clustering identifies minority positions across model responses by measuring semantic distance between position vectors. Every result includes both majority AND minority opinions. Healthcare, legal, and financial modes require explicit dissent reporting. No decision is declared unanimous unless mathematically verified through convergence metrics — and even then, the clustering algorithm surfaces the most distant position as a recorded dissent.",
    detail:
      "Clustering: agglomerative, distance-based. Output: majority position + all minority clusters.",
  },
  {
    icon: Gauge,
    title: "Confidence Calibration",
    description:
      "Models that change their claims under cross-examination pressure receive lower confidence scores. Calibration formula: stability * (1 - concession_rate) * (1 - 0.3 * qualification_rate). This measures explanation stability — do models hold firm on well-supported positions, or cave under scrutiny? Models that maintain their position with evidence get higher calibration; models that flip without justification get penalized.",
    detail:
      "Score = stability * (1 - concession_rate) * (1 - 0.3 * qualification_rate)",
  },
  {
    icon: FileSearch,
    title: "Complete Audit Trail",
    description:
      "Every deliberation phase is recorded: input, output, tokens used, cost, and latency per model per round. Full transparency into how consensus was reached — which models agreed, who dissented, what challenges were raised, and how they were resolved. Token counts, cost breakdowns, and timing data enable cost optimization. Required for regulated industries like healthcare, finance, and legal.",
    detail:
      "Tracked per model: tokens_in, tokens_out, cost_usd, latency_ms, round, phase.",
  },
];

const stats = [
  { value: "8", label: "Deliberation Modes" },
  { value: "5", label: "LLM Providers" },
  { value: "15", label: "Models Supported" },
  { value: "6", label: "Vertical Templates" },
  { value: "4", label: "Voting Algorithms" },
  { value: "3", label: "Convergence Metrics" },
  { value: "2", label: "SDKs + CLI" },
  { value: "MIT", label: "Licensed" },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative pt-28 pb-24 border-b border-white/[0.08] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          disablePictureInPicture
          className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-20"
        >
          <source src="/api/video/consilium-prod.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-bg-0/40 via-bg-0/70 to-bg-0 pointer-events-none" />
        <div className="relative z-10 container-narrow">
          <div className="eyebrow mb-5">About · Open source</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            Structured <em>disagreement</em>
            <br />
            produces better decisions.
          </h1>
          <p className="mt-6 max-w-[640px] text-[17px] leading-[1.55] text-ink-secondary">
            Consilium implements formal argumentation protocols — proven in
            peer-reviewed research at ICML, ACL, and AAAI — where AI models
            propose, challenge, defend, and synthesize positions through
            adversarial debate.
          </p>
          <div className="mt-9">
            <ScrollButton />
          </div>
        </div>
      </section>

      <section id="about-content" className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            We believe the best decisions emerge from structured disagreement.
            Consilium implements formal argumentation protocols — proven in
            peer-reviewed research — where AI models propose, challenge, defend,
            and synthesize through adversarial debate.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            The result is consensus with tracked confidence, preserved dissent,
            and complete audit trails. Every conclusion is backed by evidence
            that survived adversarial scrutiny — not the output of a single
            model that was never challenged.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-20">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 rounded-lg border bg-card"
            >
              <div className="text-2xl md:text-3xl font-bold text-warm">
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
          Six technical differentiators that separate deliberation from
          orchestration.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {differentiators.map((diff) => {
            const Icon = diff.icon;
            return (
              <Card key={diff.title}>
                <CardHeader>
                  <Icon className="h-8 w-8 mb-2 text-warm" />
                  <CardTitle className="text-lg">{diff.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {diff.description}
                  </p>
                  <pre className="text-xs font-mono text-warm/70 bg-warm/8 rounded p-2 overflow-x-auto">
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
              Consilium started with a simple observation: when you ask one AI
              model a hard question, you get one perspective shaped by that
              model&apos;s training biases. Ask three models, and you get three
              perspectives — but no mechanism to resolve disagreements. We built
              that mechanism.
            </p>

            <p>
              The breakthrough came from academic research on multi-agent
              debate. Papers from ICML 2024 showed that structured debate
              between LLMs improves factual accuracy by 8-15%, and that truth
              has a natural advantage in adversarial argumentation. We
              implemented these findings as a production platform with formal
              voting theory, convergence detection, and mandatory dissent
              preservation.
            </p>

            <p>
              Consilium supports 15 models across 5 providers: Anthropic (Claude
              Opus 4.6, Claude Sonnet 4.5), OpenAI (GPT-4o, GPT-o1), Google
              (Gemini 2.0 Flash), xAI (Grok), and Groq for cost-effective
              inference. Models debate through a LangGraph state machine with
              typed challenges, categorized rebuttals, confidence-weighted
              voting, and mathematical convergence detection.
            </p>

            <p>
              The architecture is a three-tier system: Next.js 15 frontend,
              NestJS 11 API with BullMQ job processing, and a FastAPI debate
              engine that orchestrates the deliberation state machine. Every
              phase is recorded for full auditability — which models agreed, who
              dissented, what evidence was cited, and how consensus was reached.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Architecture</h2>
          <p className="text-muted-foreground text-center mb-8">
            Three-tier system with a LangGraph deliberation state machine.
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

      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Open Source Philosophy</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Run it your way. No vendor lock-in. No hidden costs. MIT licensed
            with full source available.
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
              <Shield className="h-6 w-6 text-warm" />
              <span className="text-sm font-medium">MIT Licensed</span>
              <span className="text-xs text-muted-foreground text-center">
                Use commercially, fork, extend
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
              <Key className="h-6 w-6 text-warm" />
              <span className="text-sm font-medium">BYOK</span>
              <span className="text-xs text-muted-foreground text-center">
                Bring Your Own API Keys
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
              <Server className="h-6 w-6 text-warm" />
              <span className="text-sm font-medium">Self-Hostable</span>
              <span className="text-xs text-muted-foreground text-center">
                Docker Compose deployment
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4">
              <Zap className="h-6 w-6 text-warm" />
              <span className="text-sm font-medium">Free Tier</span>
              <span className="text-xs text-muted-foreground text-center">
                Groq fallback, no paid keys required
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
            <Badge variant="outline" className="text-xs">
              Docker Compose
            </Badge>
            <Badge variant="outline" className="text-xs">
              GitHub Actions
            </Badge>
          </div>
        </div>
      </section>

      <section className="bg-muted py-20">
        <div className="container mx-auto px-4 text-center">
          <Github className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Contribute to Consilium</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-muted-foreground">
            We&apos;re open source and welcome contributions from developers of
            all skill levels.
          </p>

          <Button asChild size="lg">
            <Link
              href="https://github.com/skadri1601/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
