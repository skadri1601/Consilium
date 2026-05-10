import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "cursor",
  competitor: "Cursor",
  pageTitle: "Consilium vs Cursor: Governance Layer vs Code Editor",
  metaDescription:
    "Cursor writes code. Consilium governs the decisions behind it. Multi-model review, policy enforcement, and audit trails for the agent economy.",
  keywords: [
    "cursor ai",
    "cursor alternative",
    "cursor vs consilium",
    "ai governance",
    "agent governance layer",
  ],
  hero: {
    tagline:
      "Cursor writes code. Consilium governs the decisions.",
    hook: "Cursor is a code editor with AI assistance. Consilium is the governance layer that validates critical decisions before any tool acts on them. They're complementary -- Cursor can call Consilium's MCP validate tool before executing risky refactors.",
    intro: [
      "Cursor reimagined the IDE around an inline AI agent. The result is fast, fluid coding with one model in the loop -- Composer for multi-file edits, Agent for autonomous tasks, and tab-complete that's better than every editor that came before it. It's the best tool for writing code quickly.",
      "But writing code and governing decisions are different operations. When an autonomous agent proposes a schema migration, a security model change, or a refactor that touches payments -- who validates that decision? Cursor gives you one model's opinion. Consilium runs multi-vendor adversarial deliberation across 3-7 models, producing risk scores, audit trails, and governance documentation.",
      "Consilium is the governance and deliberation OS for the agent economy. It provides policy enforcement, quorum voting, and compliance documentation that code editors don't generate. Cursor can call Consilium's MCP validate tool before executing high-stakes changes -- getting a governance review without leaving the editor.",
      "These tools aren't competitors. Cursor is where code gets written. Consilium is where decisions get validated. The right architecture uses both: Cursor for velocity, Consilium for accountability.",
    ],
  },
  competitorStrengths: [
    "Tightest in-IDE inline completion experience available -- Tab autocomplete is genuinely best-in-class.",
    "Composer and Agent modes handle most tactical multi-file edits with very low friction.",
    "Mature IDE primitives: split panes, terminal integration, debugger, extension marketplace (forked from VS Code).",
    "Excellent for rapid exploration when you trust the model and want speed over verification.",
    "Established product with a large user base, predictable subscription pricing, and active iteration.",
  ],
  consiliumWins: [
    {
      title: "Multi-model governance, not model switching",
      body: "Cursor lets you pick one model per request from a dropdown. Consilium runs 3-7 models in adversarial deliberation -- each generates an independent assessment, cross-examines the others with typed challenges, and the judge synthesizes a governance decision with risk scoring and documented dissent.",
    },
    {
      title: "Policy engine and quorum voting",
      body: "Consilium ships a governance policy engine that enforces organizational rules -- mandatory review thresholds, quorum requirements, and domain-specific compliance checks. Healthcare and finance modes require forced citations and dissent preservation. Cursor has no policy enforcement layer.",
    },
    {
      title: "EU AI Act compliant audit trails",
      body: "Every Consilium deliberation produces a structured audit trail: per-model input, output, tokens, cost, latency, plus the challenges and rebuttals exchanged. This is the documentation regulated industries need. Cursor doesn't structure or expose decision history.",
    },
    {
      title: "Multi-vendor neutrality enforced",
      body: "Consilium runs models from OpenAI, Anthropic, Google, xAI, Groq, Moonshot, and OpenRouter in the same deliberation. No single vendor's blind spots go unchallenged. Cursor exposes a fixed set of provider integrations through their proxy.",
    },
    {
      title: "Decision history with vector search recall",
      body: "Every governance decision is stored and searchable. When a similar question arises months later, Consilium surfaces past deliberations, dissents, and outcomes. Cursor's conversation history is ephemeral and not designed for institutional memory.",
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
      competitor: "Cursor consumes MCP, doesn't expose one",
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
      competitor: "Single vendor per request",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Inline code editing",
      consilium: "Not a focus -- use Cursor for this",
      competitor: "Best-in-class",
      consiliumHas: false,
      competitorHas: true,
    },
    {
      feature: "IDE",
      consilium: "VS Code extension + Cursor via MCP",
      competitor: "Standalone fork of VS Code",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "CLI",
      consilium: "First-class -- REPL, tools, project memory",
      competitor: "No standalone CLI",
      consiliumHas: true,
      competitorHas: false,
    },
  ],
  workflows: [
    {
      title: "Cursor for typing, Consilium for governing",
      body: "Use Cursor's Composer for everyday refactors and inline edits. When you hit a decision that matters -- schema choice, security model, library selection -- Cursor calls Consilium's MCP validate tool. The governance layer runs multi-vendor deliberation and returns a risk-scored recommendation with documented dissent, without leaving the editor.",
    },
    {
      title: "Pre-execution governance gate",
      body: "Before Cursor's agent executes a risky refactor, route the plan through Consilium's policy engine. If the quorum approves, proceed with confidence. If it doesn't, you have explicit dissents and risk scores to review before any code changes.",
    },
    {
      title: "Compliance documentation on autopilot",
      body: "Consilium generates audit-ready documentation for every governance decision -- who reviewed, what was challenged, where dissent occurred. Cursor produces code. Consilium produces the compliance paper trail that regulated industries require.",
    },
    {
      title: "Architecture decision records",
      body: "Consilium's Council mode (3-7 models, 3 rounds) produces governance-grade architecture decision records with documented dissent from multiple vendors. Drop the output into your repo as an ADR. Cursor's single-agent output is one opinion -- useful, but not auditable.",
    },
  ],
  faq: [
    {
      question: "Does Consilium replace Cursor?",
      answer:
        "No. Cursor is a code editor. Consilium is a governance layer. They serve different functions. Use Cursor to write code, use Consilium to validate the decisions behind it. Install the Consilium MCP server in Cursor and call @consilium when you need governance review.",
    },
    {
      question: "Can I use Consilium inside Cursor?",
      answer:
        "Yes. Consilium ships an MCP server with 6 governance tools that plug into Cursor's MCP integration. Cursor can call validate, deliberate, or any of the eight deliberation modes from Cursor's chat surface.",
    },
    {
      question: "Why do I need governance if Cursor is already AI-powered?",
      answer:
        "Because Cursor uses a single model per request. Single-model decisions have single-model blind spots. Consilium runs 3-7 models from different providers in adversarial deliberation, producing the kind of multi-perspective review that governance and compliance require.",
    },
    {
      question: "What does the audit trail include?",
      answer:
        "Per-round transcripts with each model's input, output, tokens, cost, latency, and the typed challenges and rebuttals exchanged. Structured for EU AI Act compliance and regulatory review.",
    },
    {
      question: "What does Consilium cost compared to Cursor?",
      answer:
        "Consilium has a free tier with a managed pool of open models (Groq + OpenRouter). BYOK means you pay your provider directly with no markup. Cursor charges a flat subscription. The economics depend on usage -- heavy governance users with their own keys often spend less because there's no proxy margin.",
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
