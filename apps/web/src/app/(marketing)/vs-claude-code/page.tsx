import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "claude-code",
  competitor: "Claude Code",
  pageTitle: "Consilium vs Claude Code: Governance Board vs AI Developer",
  metaDescription:
    "Claude Code is an AI developer. Consilium is the governance board. Multi-vendor adversarial deliberation, audit trails, and policy enforcement for the agent economy.",
  keywords: [
    "claude code cli",
    "claude code alternative",
    "claude code vs consilium",
    "ai governance board",
    "multi-vendor deliberation",
  ],
  hero: {
    tagline:
      "Claude Code is an AI developer. Consilium is the governance board.",
    hook: "Claude Code writes and edits code using a single model. Consilium runs multi-vendor adversarial deliberation across multiple providers, ensuring no single model's blind spots go unchallenged. Claude Code can call Consilium via MCP for high-stakes decisions.",
    intro: [
      "Claude Code is the official Anthropic CLI for Claude. It's deeply integrated with the Claude family -- Sonnet, Opus, Haiku -- and ships well-engineered primitives: hooks, slash commands, MCP support, sub-agents, and tight integration with Anthropic's API. If your team has standardized on Claude, it's the right tool for writing code.",
      "But writing code and governing decisions are different operations. Claude Code gives you one vendor's perspective on every decision. When the stakes are high -- security architecture, compliance changes, production deployments -- a single vendor's blind spots become your blind spots.",
      "Consilium is the governance and deliberation OS for the agent economy. A single deliberation can include Claude alongside GPT-5.5, Gemini 3.1 Pro, Grok-4, Kimi K2, and any model on OpenRouter. The point isn't to replace Claude -- it's to put Claude on a governance board where other vendors cross-examine its reasoning and produce documented dissent.",
      "If your stack is built on Claude, the right architecture is to keep using Claude Code for daily work and add Consilium's MCP server. Claude Code calls @consilium when it needs multi-vendor governance review, and the board writes its risk-scored synthesis back into Claude's context.",
    ],
  },
  competitorStrengths: [
    "First-class Anthropic integration -- instant access to Sonnet 4.6, Opus 4.7, Haiku 4.5 with no proxy.",
    "Extremely well-engineered CLI primitives: hooks, slash commands, sub-agents, status line, output styles, MCP host.",
    "Tight Anthropic ecosystem fit -- works seamlessly with the Claude API, Claude Desktop, and Anthropic billing.",
    "Mature codebase-aware tool calls (Read, Edit, Glob, Grep, Bash, etc.) tuned by the team that ships Claude.",
    "Best in class for users committed to the Claude family who want the deepest integration.",
  ],
  consiliumWins: [
    {
      title: "Multi-vendor governance, not single-vendor development",
      body: "Claude Code runs one vendor's model. Consilium runs 3-7 models from OpenAI, Anthropic, Google, xAI, Groq, Moonshot, and OpenRouter in the same deliberation. Inside one governance review, Claude can argue with GPT-5.5 about a security model while Gemini flags a compliance gap. No single vendor's blind spots go unchallenged.",
    },
    {
      title: "Policy engine and quorum voting",
      body: "Consilium ships governance policies that enforce organizational rules -- mandatory review thresholds, quorum requirements, and domain-specific compliance checks. Healthcare and finance modes require forced citations and dissent preservation. Claude Code has no governance policy layer.",
    },
    {
      title: "EU AI Act compliant audit trails",
      body: "Every Consilium deliberation produces a structured audit trail: per-model input, output, tokens, cost, latency, and the typed challenges/rebuttals exchanged. This is the documentation regulated industries need. Claude Code produces session transcripts, not governance records.",
    },
    {
      title: "Risk scoring and adversarial assessment",
      body: "Consilium's Red Team mode runs models adversarially with typed challenges (FACTUAL_ERROR, MISSING_EVIDENCE, FLAWED_LOGIC) and categorized rebuttals (CONCEDE, REFUTE, QUALIFY, REDIRECT). Claude Code's tool loop is excellent, but it's still one vendor's voice.",
    },
    {
      title: "Provider hedge and vendor neutrality",
      body: "When Anthropic has an outage or rate-limits you, Claude Code is stuck. Consilium can route governance reviews through GPT, Gemini, Grok, Groq, or OpenRouter -- and the free-tier pool keeps deliberations running even without keys. Multi-vendor neutrality is enforced by design.",
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
      competitor: "Session transcripts",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "MCP server",
      consilium: "Yes (6 tools)",
      competitor: "Claude Code is an MCP host (consumes, doesn't expose one)",
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
      competitor: "Single vendor (Anthropic)",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "MCP host (consume other servers)",
      consilium: "Through CLI MCP integration",
      competitor: "Yes -- first-class MCP host",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Hooks / sub-agents",
      consilium: "Custom slash commands in REPL",
      competitor: "First-class hooks + sub-agents + slash commands",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Free tier",
      consilium: "Managed pool fallback (Groq + OpenRouter)",
      competitor: "Claude API pricing",
      consiliumHas: true,
      competitorHas: false,
    },
  ],
  workflows: [
    {
      title: "Claude Code for daily work, Consilium for governance",
      body: "Run Claude Code as your primary agent. Install Consilium's MCP server and add it to your .claude/settings. When Claude encounters a high-stakes decision, it calls @consilium. The governance board deliberates across multiple vendors and returns a risk-scored synthesis with documented dissent.",
    },
    {
      title: "Multi-vendor governance gate",
      body: "Before merging a change touching auth, payments, or compliance, run the diff through Consilium's governance layer. You get adversarial review across vendors with risk scoring and documented dissent -- the audit trail that single-vendor tools can't produce.",
    },
    {
      title: "Provider failover",
      body: "When Anthropic has an incident, Claude Code is offline. Consilium can route governance reviews through GPT-5.5, Gemini 3.1 Pro, Grok, Kimi, Groq's free pool, or anything on OpenRouter -- and continue working. Multi-vendor neutrality is also a resilience strategy.",
    },
    {
      title: "Compliance documentation on autopilot",
      body: "Consilium generates audit-ready documentation for every governance decision -- multi-vendor review records, risk scores, documented dissent. Claude Code produces code. Consilium produces the compliance paper trail that regulated industries require.",
    },
  ],
  faq: [
    {
      question: "Does Consilium replace Claude Code?",
      answer:
        "No. Claude Code is an AI developer. Consilium is a governance board. They serve different functions. Use Claude Code to write code, use Consilium to validate high-stakes decisions with multi-vendor review.",
    },
    {
      question: "Can Consilium run inside Claude Code?",
      answer:
        "Yes -- Consilium ships an MCP server with 6 governance tools that plug into Claude Code's MCP host. Add it to your settings, and Claude Code can invoke governance review whenever it encounters a high-stakes decision.",
    },
    {
      question: "Is this just running Claude five times in parallel?",
      answer:
        "No. The signal in Consilium comes from cross-vendor disagreement. Running Claude five times produces five answers anchored on the same training distribution. Running Claude + GPT-5.5 + Gemini 3.1 Pro + Grok + Kimi produces independent perspectives that catch each vendor's blind spots.",
    },
    {
      question: "What does the audit trail include?",
      answer:
        "Per-round transcripts with each model's input, output, tokens, cost, latency, and the typed challenges and rebuttals exchanged. Structured for EU AI Act compliance and regulatory review.",
    },
    {
      question:
        "Why use Consilium when Claude is already the strongest model on most benchmarks?",
      answer:
        "Because 'strongest on benchmarks' doesn't mean 'right for this specific decision.' Governance requires multiple independent perspectives, not one model's confidence. Multi-vendor deliberation surfaces the exact cases where any single model is overconfident.",
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
