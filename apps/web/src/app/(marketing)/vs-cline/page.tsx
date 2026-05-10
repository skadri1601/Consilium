import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "cline",
  competitor: "Cline",
  pageTitle: "Consilium vs Cline: Governance Layer vs Autonomous Agent",
  metaDescription:
    "Cline executes tasks. Consilium governs which tasks should proceed. Policy enforcement, quorum voting, and risk scoring for autonomous agents.",
  keywords: [
    "cline ai",
    "cline alternative",
    "cline vs consilium",
    "agent governance",
    "autonomous agent governance",
  ],
  hero: {
    tagline:
      "Cline executes tasks. Consilium governs which tasks should proceed.",
    hook: "Cline is an autonomous coding agent. Consilium provides the governance layer -- policy enforcement, quorum voting, and risk scoring -- that prevents autonomous agents from making unchecked high-stakes decisions.",
    intro: [
      "Cline (formerly Claude Dev) helped define the modern in-IDE autonomous-agent experience. You give it a goal, and it plans, edits files, runs commands, drives a browser, and asks for permission at the right moments. The execute-act-observe loop is mature, the Plan/Act split is genuinely useful, and BYOK with broad provider support keeps you in control of cost.",
      "But autonomous agents executing unchecked decisions is exactly the problem the agent economy needs to solve. When Cline proposes a schema migration, a security model change, or a deployment to production -- who validates that the decision is sound? Permission prompts gate execution. Governance gates reasoning.",
      "Consilium is the governance and deliberation OS for the agent economy. It runs 3-7 models from different vendors in adversarial deliberation, producing risk scores, policy compliance checks, and audit-ready documentation. It's the layer between 'the agent wants to do X' and 'X actually happens.'",
      "The two tools complement each other cleanly. Use Cline when you want one agent to execute a plan. Call Consilium (via its MCP server, its CLI, or its VS Code extension) when you want a governance review before the plan executes.",
    ],
  },
  competitorStrengths: [
    "Mature autonomous agent loop with sensible permission gating and a clean Plan/Act mode toggle.",
    "Excellent provider coverage -- OpenAI, Anthropic, Gemini, OpenRouter, Bedrock, Vertex, LiteLLM, local models.",
    "Browser-driving and computer-use integrations are well-engineered and increasingly capable.",
    "Established VS Code extension with active development and a large user base.",
    "Best-in-class for letting one agent grind through a multi-step task autonomously.",
  ],
  consiliumWins: [
    {
      title: "Governance layer for autonomous agents",
      body: "Cline asks 'do you approve this action?' Consilium asks 'is this the right decision?' -- and answers with 3-7 models from different vendors cross-examining the reasoning. Permission gating and governance are different operations. Autonomous agents need both.",
    },
    {
      title: "Policy engine and quorum voting",
      body: "Consilium ships governance policies that enforce organizational rules -- mandatory review thresholds, quorum requirements, and domain-specific compliance checks. Healthcare and finance modes require forced citations and dissent preservation. Cline has permission prompts but no policy enforcement.",
    },
    {
      title: "Risk scoring before execution",
      body: "Before Cline executes a high-stakes task, Consilium's adversarial assessment scores the risk. Red Team mode runs models as attacker/defender with typed challenges. If the risk score exceeds your threshold, the task doesn't proceed. Cline runs one model's plan without adversarial verification.",
    },
    {
      title: "EU AI Act compliant audit trails",
      body: "Every Consilium deliberation produces a structured audit trail: per-model input, output, tokens, cost, latency, and the challenges/rebuttals exchanged. Required for regulated industries. Cline gives you the conversation; Consilium gives you the governance record.",
    },
    {
      title: "Decision history with vector search recall",
      body: "Every governance decision is stored and searchable. When Cline faces a similar decision months later, Consilium surfaces how past deliberations resolved, including dissents and outcomes. Cline's history is per-session.",
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
      competitor: "Cline consumes MCP, doesn't expose one",
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
      feature: "Autonomous task execution",
      consilium: "Not a focus -- use Cline for this",
      competitor: "Best-in-class Plan/Act agent loop",
      consiliumHas: false,
      competitorHas: true,
    },
    {
      feature: "Browser / computer-use",
      consilium: "Not built in (use external tools)",
      competitor: "Yes -- first-class browser drive",
      consiliumHas: false,
      competitorHas: true,
    },
    {
      feature: "CLI",
      consilium: "First-class -- REPL, governance tools, project memory",
      competitor: "No standalone CLI",
      consiliumHas: true,
      competitorHas: false,
    },
  ],
  workflows: [
    {
      title: "Cline executes, Consilium governs",
      body: "Use Cline to drive a multi-step task autonomously -- scaffold the file, wire the route, run the migration. Before execution of high-stakes steps, Cline calls Consilium's MCP validate tool. The governance layer runs multi-vendor deliberation and returns a risk-scored decision. If the quorum approves, Cline proceeds.",
    },
    {
      title: "Use Consilium MCP inside Cline",
      body: "Cline supports MCP. Install Consilium's MCP server (pip install consilium-mcp), add it to Cline's MCP config, and Cline gains access to 6 governance tools. When Cline hits a high-stakes decision, it can request a governance review and integrate the result into its plan.",
    },
    {
      title: "Prevent unchecked autonomous decisions",
      body: "Single-agent autonomous loops can confidently stride past subtle issues -- race conditions, security holes, regulatory gotchas. Consilium's governance layer catches what one model waves past by running adversarial multi-vendor review with mandatory dissent.",
    },
    {
      title: "Compliance documentation on autopilot",
      body: "Consilium generates audit-ready documentation for every governance decision -- who reviewed, what was challenged, where dissent occurred, what the risk score was. Cline produces code. Consilium produces the compliance paper trail.",
    },
  ],
  faq: [
    {
      question: "Does Consilium replace Cline?",
      answer:
        "No. Cline is an autonomous execution agent. Consilium is a governance layer. They serve different functions. Use Cline to execute tasks, use Consilium to govern which tasks should proceed and document why.",
    },
    {
      question: "Can I use Consilium and Cline together?",
      answer:
        "Yes -- and that's the recommended architecture. Install Consilium's MCP server in Cline's MCP config so Cline can request governance review mid-task. Autonomous execution with governance oversight.",
    },
    {
      question: "Why not just use Cline's permission prompts?",
      answer:
        "Permission prompts gate execution -- 'do you approve this action?' Governance gates reasoning -- 'is this the right decision, validated by multiple independent models from different vendors?' They solve different problems. Critical decisions need both.",
    },
    {
      question: "What does the audit trail include?",
      answer:
        "Per-round transcripts with each model's input, output, tokens, cost, latency, and the typed challenges and rebuttals exchanged. Structured for EU AI Act compliance and regulatory review.",
    },
    {
      question: "What's the cost difference?",
      answer:
        "Cline runs one model per session. Consilium runs 3-7 for governance decisions, so per-deliberation cost is higher. But governance decisions are infrequent compared to code edits. The free tier (Groq + OpenRouter pool) keeps onboarding free.",
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
