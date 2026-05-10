import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "aider",
  competitor: "Aider",
  pageTitle: "Consilium vs Aider: Governance Layer vs Code Editing CLI",
  metaDescription:
    "Aider applies edits. Consilium validates the reasoning. Multi-model governance, risk scoring, and audit trails for the agent economy.",
  keywords: [
    "aider ai",
    "aider alternative",
    "aider vs consilium",
    "ai governance cli",
    "agent decision validation",
  ],
  hero: {
    tagline: "Aider applies edits. Consilium validates the reasoning.",
    hook: "Aider is a CLI for AI-driven code editing. Consilium ensures the reasoning behind changes is sound through multi-model adversarial review. Aider could use Consilium's validate MCP tool to get a second opinion before applying changes.",
    intro: [
      "Aider has earned a deserved reputation. It writes commits with sensible messages, applies edits using a structured diff format, builds a repo map for context, and stays out of your way. The whole-file and udiff edit formats it pioneered are now standard practice across the agentic coding ecosystem.",
      "But applying edits and validating the reasoning behind them are different operations. When an AI agent proposes a schema migration or a security-critical refactor, who governs that decision? Aider gives you one model's judgment. Consilium runs multi-vendor adversarial deliberation across 3-7 models, producing risk scores, policy compliance checks, and audit-ready documentation.",
      "Consilium is the governance and deliberation OS for the agent economy. It provides policy enforcement, quorum voting, and compliance documentation that code editing CLIs don't generate. Aider can call Consilium's validate MCP tool before applying high-stakes changes -- getting governance review without changing workflows.",
      "Most teams that use both end up with Aider in their daily commit loop and Consilium as the governance gate for high-stakes decisions. Aider is faster and cheaper for routine changes. Consilium catches the reasoning gaps one model misses.",
    ],
  },
  competitorStrengths: [
    "Excellent edit-format engineering -- the udiff format and whole-file replacement work reliably across models.",
    "Repo map generation is mature and gives the model good context without manual file selection.",
    "Native git integration -- every change becomes a commit with a sensible auto-generated message.",
    "Mature, opinionated, single-binary CLI with low-friction setup and a strong Discord community.",
    "Cheaper per request than any deliberation engine because there's only one model in the loop.",
  ],
  consiliumWins: [
    {
      title: "Multi-model governance, not single-model edits",
      body: "Aider lets you switch models between sessions. Consilium runs 3-7 models simultaneously inside one deliberation, cross-examining each other's reasoning with typed challenges. The output isn't an edit -- it's a governance decision with risk scores and documented dissent.",
    },
    {
      title: "Policy engine and quorum voting",
      body: "Consilium ships governance policies that enforce organizational rules -- mandatory review thresholds, quorum requirements, and domain-specific compliance checks. Healthcare and finance modes require forced citations and dissent preservation. Aider has no policy layer.",
    },
    {
      title: "EU AI Act compliant audit trails",
      body: "Every Consilium deliberation produces a structured audit trail: per-model input, output, tokens, cost, latency, and the typed challenges/rebuttals exchanged. This is the documentation regulated industries need. Aider produces chat history.",
    },
    {
      title: "Risk scoring and adversarial assessment",
      body: "Consilium's Red Team mode runs models adversarially -- attacker issues typed challenges (SECURITY_VULN, LOGICAL_FLAW, EDGE_CASE), defender must rebut with evidence, judge synthesizes risk scores. Aider runs a single agent loop with no adversarial verification.",
    },
    {
      title: "Decision history with vector search recall",
      body: "Every governance decision is stored and searchable. When a similar question arises months later, Consilium surfaces past deliberations and outcomes. Aider's history is per-session and not designed for institutional memory.",
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
      competitor: "Single vendor per session",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Code editing",
      consilium: "Not a focus -- use Aider for this",
      competitor: "Best-in-class udiff and whole-file formats",
      consiliumHas: false,
      competitorHas: true,
    },
    {
      feature: "Git integration",
      consilium: "Auto-collect git context; manual commits",
      competitor: "Auto-commit per change with generated messages",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "CLI",
      consilium: "First-class -- REPL, governance tools, project memory",
      competitor: "First-class -- git-native, mature",
      consiliumHas: true,
      competitorHas: true,
    },
  ],
  workflows: [
    {
      title: "Aider for edits, Consilium for governance",
      body: "Aider is faster, cheaper, and very good at routine refactors and bug fixes. When you hit something high-stakes -- a schema migration, an auth flow, a compliance-sensitive change -- pause and run the decision through Consilium's governance layer. The council validates the reasoning across providers before Aider applies the change.",
    },
    {
      title: "Pre-merge governance gate",
      body: "Run your branch's diff through Consilium's Red Team mode before merging. Multiple models attack the diff with typed security/logic/edge-case challenges. The output is a risk-scored governance report with documented dissent -- the audit trail that compliance teams need.",
    },
    {
      title: "Compliance documentation on autopilot",
      body: "Consilium generates audit-ready documentation for every governance decision -- who reviewed, what was challenged, where dissent occurred. Aider produces code. Consilium produces the compliance paper trail that regulated industries require.",
    },
    {
      title: "Decision validation before commit",
      body: "When Aider's model proposes something that feels off, run the same question through Consilium's governance layer. Disagreement among 3-7 providers from different vendors is a much stronger signal than disagreement between you and one model.",
    },
  ],
  faq: [
    {
      question: "Is Consilium a replacement for Aider?",
      answer:
        "No. Aider is a code editing CLI. Consilium is a governance layer. They serve different functions. Use Aider to apply edits, use Consilium to validate the reasoning behind high-stakes decisions. Most teams use both.",
    },
    {
      question: "Can I use both Aider and Consilium?",
      answer:
        "Yes -- and most heavy users do. Aider is faster and cheaper for routine work. Consilium is the governance gate for moments when one model's judgment isn't enough. Both run as CLIs, both respect your git tree, both work with your provider keys.",
    },
    {
      question: "What does the audit trail include?",
      answer:
        "Per-round transcripts with each model's input, output, tokens, cost, latency, and the typed challenges and rebuttals exchanged. Structured for EU AI Act compliance and regulatory review.",
    },
    {
      question: "Does Consilium auto-commit like Aider?",
      answer:
        "No. Consilium produces governance decisions, not code edits. It validates reasoning and generates audit documentation. The commit workflow stays with Aider or your existing tools.",
    },
    {
      question: "Will Consilium be more expensive than Aider?",
      answer:
        "Per request -- yes, because 3-7 models cost more than one. But governance and compliance decisions have different economics than code edits. The free tier (Groq + OpenRouter pool fallback) keeps casual usage near zero.",
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
