import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "cline",
  competitor: "Cline",
  pageTitle: "Consilium vs Cline: Multi-AI Council vs Autonomous Single Agent",
  metaDescription:
    "Cline is a powerful autonomous coding agent inside VS Code. Consilium adds something Cline cannot: a council of models from multiple providers that debate and converge.",
  keywords: [
    "cline ai",
    "cline alternative",
    "cline vs consilium",
    "vscode ai agent",
    "autonomous coding agent",
  ],
  hero: {
    tagline:
      "Cline drives one autonomous agent inside VS Code. Consilium runs a council that disagrees with itself.",
    hook: "Cline is one of the most capable single-agent extensions for VS Code. Consilium ships a parallel VS Code extension whose mechanic is multi-provider deliberation - and an MCP server that plugs into Cline if you want both.",
    answerCapsule:
      "Consilium runs three to five LLMs in parallel debate rounds with typed challenges and convergence detection, while Cline drives one autonomous agent through a Plan/Act loop inside VS Code. Cline is best for executing a plan step by step; Consilium is best for weighing the plan first across multiple providers. They compose: Cline can call Consilium's MCP server mid-task whenever it wants a council.",
    intro: [
      "Cline (formerly Claude Dev) helped define the modern in-IDE autonomous-agent experience. You give it a goal, and it plans, edits files, runs commands, drives a browser, and asks for permission at the right moments. The execute-act-observe loop is mature, the Plan/Act split is genuinely useful, and BYOK with broad provider support keeps you in control of cost.",
      "Cline's architecture is deliberately one-model-at-a-time. You pick an OpenAI / Anthropic / Gemini / OpenRouter / Bedrock / Vertex / LiteLLM target, and that one model handles the entire session - planning, editing, tool calls, the lot. Single-voice agentic loops are great for execution but weak at decisions where multiple perspectives matter.",
      "Consilium starts from the opposite premise. We run three to five models in parallel, route them into a structured debate (typed challenges, categorized rebuttals, mathematical convergence detection), and produce a synthesis with documented dissent. Eight modes - Quick, Council, Deep, Blind, Red Team, Jury, Market, Auto - each tuned for a different stakes profile.",
      "The two tools complement each other cleanly. Use Cline when you want one agent to execute a plan. Call Consilium (via its MCP server, its CLI, or its own VS Code extension) when you want a council to weigh the plan first.",
    ],
  },
  stats: [
    { label: "Providers", value: "7 first-class" },
    { label: "Deliberation modes", value: "8" },
    {
      label: "Convergence weights",
      value: "0.40 tau + 0.35 jaccard + 0.25 concession",
    },
    { label: "CLI unit tests", value: "962" },
    { label: "Free tier", value: "Groq 1,000 / month" },
    { label: "MCP marketplace servers", value: "12 seeded" },
  ],
  competitorQuote: {
    text: "Plan mode lets Cline ask questions, gather context, and design an approach before switching to Act mode to write code, run commands, and use the browser.",
    source: "Cline docs (cline.bot)",
    href: "https://docs.cline.bot/features/plan-and-act",
  },
  competitorStrengths: [
    "Mature autonomous agent loop with sensible permission gating and a clean Plan/Act mode toggle.",
    "Excellent provider coverage - OpenAI, Anthropic, Gemini, OpenRouter, Bedrock, Vertex, LiteLLM, local models.",
    "Browser-driving and computer-use integrations are well-engineered and increasingly capable.",
    "Established VS Code extension with active development and a large user base.",
    "Best-in-class for letting one agent grind through a multi-step task autonomously.",
  ],
  consiliumWins: [
    {
      title: "Parallel multi-model debate",
      body: "Cline is one agent at a time. Consilium runs three to five models simultaneously inside the same debate, makes them argue, and synthesizes the result. The two operations are not interchangeable - debate catches things one autonomous agent never even considers.",
    },
    {
      title: "Convergence as an explicit signal",
      body: "Consilium reports whether the council reached consensus and how strongly. If five models agree, that's a meaningful signal. If they don't, you see the dissent and the cluster of disagreement. Cline produces a single confident output regardless of how shaky the underlying reasoning was.",
    },
    {
      title: "Specialized deliberation modes",
      body: "Healthcare and legal modes ship with mandatory dissent and forced citations. Finance mode requires VaR/CVaR/Sharpe metrics and Basel III/SOX compliance mapping. Red Team mode runs three models adversarially for security review. Cline runs one agentic loop for everything.",
    },
    {
      title: "Multi-surface distribution",
      body: "Consilium ships as CLI, VS Code extension, MCP server (Cursor / Claude Desktop / Claude Code / Cline itself), Python SDK, and TypeScript SDK. Cline is a VS Code extension. Both are valid; the surface area difference matters when your workflow spans terminal and IDE.",
    },
    {
      title: "Audit trail per round",
      body: "Every Consilium debate produces a structured transcript: per-model input, output, tokens, cost, latency, and the typed challenges/rebuttals exchanged. Required for regulated industries. Cline gives you the conversation; Consilium gives you the debate.",
    },
  ],
  matrix: [
    {
      feature: "Models per request",
      consilium: "3–5 in parallel rounds",
      competitor: "1 model per session",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Provider count",
      consilium: "7 first-class adapters",
      competitor:
        "Broad - OpenAI/Anthropic/Gemini/OpenRouter/Bedrock/Vertex/LiteLLM/local",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Cross-examination / debate",
      consilium: "Typed challenges + rebuttals",
      competitor: "Single-agent loop",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Plan/Act mode",
      consilium:
        "8 deliberation modes (Quick / Council / Deep / Blind / Red Team / Jury / Market / Auto)",
      competitor: "Plan vs Act toggle",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Convergence detection",
      consilium:
        "Composite score: 0.4·tau + 0.35·jaccard + 0.25·concession ≥ 0.85",
      competitor: "N/A",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Mandatory dissent",
      consilium: "Required in healthcare/legal/finance",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Browser / computer-use",
      consilium: "Not built in (use external tools)",
      competitor: "Yes - first-class browser drive",
      consiliumHas: false,
      competitorHas: true,
    },
    {
      feature: "VS Code extension",
      consilium: "Yes",
      competitor: "Yes",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "CLI",
      consilium: "First-class - REPL, project memory, slash commands",
      competitor: "No standalone CLI",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "MCP server",
      consilium: "Yes - exposes deliberation as MCP tool",
      competitor: "Cline consumes MCP, doesn't expose one",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Audit trail",
      consilium: "Per-round transcripts with tokens/cost/latency",
      competitor: "Conversation history",
      consiliumHas: true,
      competitorHas: false,
    },
  ],
  workflows: [
    {
      title: "Cline executes, Consilium decides",
      body: "Use Cline to drive a multi-step task autonomously - scaffold the file, wire the route, run the migration. Before you ship, run a Consilium Red Team or Council debate on the diff. You get a single autonomous agent for execution and a council for verification, which is the workflow we recommend most often.",
    },
    {
      title: "Use Consilium MCP inside Cline",
      body: "Cline supports MCP. Install Consilium's MCP server (pip install consilium-mcp), add it to Cline's MCP config, and Cline can call any of the eight deliberation modes mid-task. When Cline hits a fork, it can ask the council and integrate the answer into its plan.",
    },
    {
      title: "Catch what an autonomous loop misses",
      body: "Single-agent autonomous loops can confidently stride past subtle issues - race conditions, security holes, regulatory gotchas. Run the same prompt through Consilium's Jury mode (five models, mandatory dissent) and you get a structured surfacing of the things one agent waved past.",
    },
    {
      title: "Pre-deploy review",
      body: 'Before running cline auto-approve on something risky, run consilium debate "<plan>" through Council mode. If the council converges, your confidence is justified. If it doesn\'t, you have explicit dissents to think through before you run anything autonomously.',
    },
  ],
  faq: [
    {
      question: "Does Consilium replace Cline?",
      answer:
        "Not for autonomous task execution. Cline's agent loop is mature and we recommend it for multi-step grind work. Consilium replaces the parts of Cline's workflow where you wanted multiple opinions - design choices, security review, anything where one agent's confidence is not enough.",
    },
    {
      question: "Can I use Consilium and Cline together?",
      answer:
        "Yes - and many users do. Install Consilium's MCP server in Cline's MCP config so Cline can call the council mid-task, or run consilium debate in a terminal pane next to Cline for higher-friction but more deliberate use.",
    },
    {
      question: "Why not just give Cline more rounds?",
      answer:
        "Because more rounds with the same model is just longer monologue, not debate. The signal in Consilium comes from disagreement between providers - a Claude that thinks the answer is X and a Grok that thinks the answer is Y produce a much stronger consensus check than one model self-reflecting five times.",
    },
    {
      question:
        "Does Consilium's VS Code extension drive my browser like Cline?",
      answer:
        "No - we don't ship browser-drive. Cline is the better tool for that workflow. Our extension focuses on running deliberations from inside the editor and writing the synthesis back to your buffer, with shared SSO so the CLI and extension see the same config.",
    },
    {
      question: "What's the cost difference?",
      answer:
        "Cline runs one model per session, so cost scales with one provider. Consilium runs three to five, so per-debate cost is higher. Use Quick mode (2 models, 1 round) for routine checks, and reserve Council/Deep for the hard stuff. The free tier (Groq + OpenRouter pool) keeps onboarding free.",
    },
  ],
  lastUpdated: "2026-04-30",
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
