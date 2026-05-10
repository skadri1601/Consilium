import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "copilot",
  competitor: "GitHub Copilot",
  pageTitle:
    "Consilium vs GitHub Copilot: Governance Infrastructure vs Inline Autocomplete",
  metaDescription:
    "Copilot suggests code. Consilium validates decisions. Multi-model governance, audit trails, and compliance documentation that copilots don't generate.",
  keywords: [
    "github copilot alternative",
    "copilot vs consilium",
    "ai governance infrastructure",
    "agent economy governance",
    "multi-model decision validation",
  ],
  hero: {
    tagline:
      "Copilot suggests code. Consilium validates decisions.",
    hook: "GitHub Copilot provides inline completions from a single model. Consilium provides governance infrastructure for the agent economy -- multi-model review, audit trails, and compliance documentation that copilots don't generate.",
    intro: [
      "GitHub Copilot is the most widely deployed AI coding tool on the planet. Inline ghost-text completions, Copilot Chat, agent mode, and Copilot Workspace cover the daily-driver use cases for most developers. The integration with GitHub itself -- repos, PRs, issues, Actions -- is unique and hard to match.",
      "But suggesting code and governing decisions are different operations. Copilot gives you one model's completion per request. When autonomous agents are making decisions that affect security, compliance, and production systems, who validates the reasoning? A single-vendor autocomplete doesn't generate governance documentation.",
      "Consilium is the governance and deliberation OS for the agent economy. It provides policy enforcement, quorum voting, risk scoring, and EU AI Act compliant audit trails. 3-7 models from different vendors generate independent assessments, cross-examine each other, and produce governance decisions with documented dissent.",
      "These are different layers, not interchangeable products. Copilot autocompletes faster than you can think. Consilium validates the decisions that matter. The right architecture uses Copilot for inline typing and Consilium for governance -- design choices, security review, regulatory documentation, anything where shipping the wrong decision is expensive.",
    ],
  },
  competitorStrengths: [
    "Best inline autocomplete in the industry -- ghost-text completions are a daily-driver experience.",
    "Tight GitHub integration: PR summaries, issue triage, Actions debugging, repo-aware context.",
    "Massive ecosystem reach -- ships in VS Code, JetBrains, Visual Studio, Vim/Neovim, and the GitHub web UI.",
    "Predictable per-seat pricing through GitHub billing; covered by many enterprise agreements already in place.",
    "Excellent for everyday completion, comment generation, and quick chat questions where speed beats deliberation.",
  ],
  consiliumWins: [
    {
      title: "Governance infrastructure, not code suggestions",
      body: "Copilot suggests code from a single model. Consilium runs 3-7 models from different vendors in adversarial deliberation, producing governance decisions with risk scores, policy compliance checks, and documented dissent. The two operations produce fundamentally different output -- one is a code completion, the other is a governance record.",
    },
    {
      title: "Policy engine and quorum voting",
      body: "Consilium ships governance policies that enforce organizational rules -- mandatory review thresholds, quorum requirements, and domain-specific compliance checks. Healthcare and finance modes require forced citations and dissent preservation. Copilot has chat, agent, and inline completion -- all single-voice, no policy enforcement.",
    },
    {
      title: "EU AI Act compliant audit trails",
      body: "Every Consilium deliberation produces a structured audit trail: per-model input, output, tokens, cost, latency, and the typed challenges/rebuttals exchanged. Required for regulated industries and compliance reviews. Copilot Chat history is conversation-level; Consilium's is governance-grade.",
    },
    {
      title: "Multi-vendor neutrality enforced",
      body: "Copilot routes through Microsoft's proxy. Consilium uses BYOK -- your keys, your terms, with 7 adapters as direct integrations and OpenRouter as escape hatch. Multiple vendors are enforced in every deliberation. No single vendor's blind spots go unchallenged.",
    },
    {
      title: "Decision history with vector search recall",
      body: "Every governance decision is stored and searchable. When a similar question arises months later, Consilium surfaces past deliberations, dissents, and outcomes. Copilot's history is ephemeral and not designed for institutional decision memory.",
    },
  ],
  matrix: [
    {
      feature: "Multi-model review",
      consilium: "Yes (3-7 models cross-examine)",
      competitor: "No (single model)",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Governance policies",
      consilium: "Yes (policy engine, quorum voting)",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Risk scoring",
      consilium: "Yes (adversarial assessment)",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Audit trail",
      consilium: "Yes (EU AI Act compliant)",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "MCP server",
      consilium: "Yes (6 tools)",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Decision history",
      consilium: "Yes (vector search recall)",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Multi-vendor neutrality",
      consilium: "Multiple providers enforced",
      competitor: "Single vendor (Microsoft proxy)",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Inline autocomplete",
      consilium: "Not a focus -- use Copilot for this",
      competitor: "Industry-leading",
      consiliumHas: false,
      competitorHas: true,
    },
    {
      feature: "GitHub PR / issue integration",
      consilium: "Via gh CLI helpers (debate pr, debate issue)",
      competitor: "First-class -- native to the platform",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Editor support",
      consilium:
        "VS Code, Cursor (MCP), Claude Desktop (MCP), Claude Code (MCP)",
      competitor: "VS Code, JetBrains, Visual Studio, Vim/Neovim, Web",
      consiliumHas: true,
      competitorHas: true,
    },
  ],
  workflows: [
    {
      title: "Copilot for typing, Consilium for governance",
      body: "Use Copilot's ghost-text and Copilot Chat through your day for completions and quick questions. When you finish a PR touching critical systems, run it through Consilium's governance layer for adversarial multi-vendor review with risk scoring and audit documentation.",
    },
    {
      title: "Compliance documentation Copilot can't generate",
      body: "Copilot Chat gives you one model's opinion. Consilium generates audit-ready governance documentation -- multi-vendor review records, risk scores, documented dissent, EU AI Act compliant transcripts. The paper trail that regulated industries require.",
    },
    {
      title: "Catch what single-model confidence misses",
      body: "When Copilot Chat gives you a confident answer on a high-stakes question, run the same question through Consilium's governance layer. 3-7 providers from different vendors in adversarial deliberation surface the specific edge cases and risks that one model glosses over.",
    },
    {
      title: "Vendor neutrality as resilience",
      body: "When Microsoft's Copilot proxy has an incident or pricing change, Consilium gives you direct multi-vendor access via BYOK with the free-tier pool as fallback. Governance doesn't depend on any single vendor's availability.",
    },
  ],
  faq: [
    {
      question: "Does Consilium replace Copilot?",
      answer:
        "No. Copilot is an inline autocomplete tool. Consilium is governance infrastructure. They serve different functions. Use Copilot to write code faster, use Consilium to validate the decisions that matter.",
    },
    {
      question: "Can I use Consilium with Copilot side-by-side?",
      answer:
        "Yes. Most users do. Copilot in your editor for inline completion. Consilium in a terminal pane (or via VS Code extension) when you need multi-vendor governance review on something specific.",
    },
    {
      question: "Why not just use Copilot Workspace for the multi-step stuff?",
      answer:
        "Copilot Workspace is a powerful single-agent autonomous loop. It's still one vendor at a time. Consilium provides multi-vendor governance -- a different operation that produces risk scores, audit trails, and compliance documentation that autonomous agents don't generate.",
    },
    {
      question: "What does the audit trail include?",
      answer:
        "Per-round transcripts with each model's input, output, tokens, cost, latency, and the typed challenges and rebuttals exchanged. Structured for EU AI Act compliance and regulatory review.",
    },
    {
      question: "How does pricing compare?",
      answer:
        "Copilot is per-seat at a flat rate. Consilium is BYOK -- you pay your providers directly, no markup, with a free-tier pool (Groq + OpenRouter) for casual usage. Governance decisions are infrequent compared to code completions, so the total cost profile is different.",
    },
  ],
  lastUpdated: "2026-05-10",
};

export const metadata: Metadata = buildMetadata({
  title: data.pageTitle,
  description: data.metaDescription,
  path: `/vs-${data.slug}`,
  keywords: data.keywords,
});

export default function Page() {
  return <ComparisonPage data={data} />;
}
