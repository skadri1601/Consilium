import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "cursor",
  competitor: "Cursor",
  pageTitle: "Consilium vs Cursor: Multi-AI Council vs Single-Agent IDE",
  metaDescription:
    "Cursor pairs you with one AI inside an IDE. Consilium runs a council of AI models that argue, vote, and produce consensus answers - and it works inside Cursor.",
  keywords: [
    "cursor ai",
    "cursor alternative",
    "cursor vs consilium",
    "ai council ide",
    "multi-model coding agent",
  ],
  hero: {
    tagline:
      "Use Cursor for typing speed. Use Consilium when one AI's answer is not enough.",
    hook: "Cursor is an excellent single-agent IDE. Consilium is a multi-agent deliberation engine that runs across CLI, IDE, and MCP - including inside Cursor itself.",
    answerCapsule:
      "Consilium is the only CLI and IDE companion that cross-examines models against each other. Cursor pairs you with one selected model per request; Consilium runs three to five models from seven providers in structured rounds, then synthesizes a consensus answer with a Kendall tau plus Jaccard plus concession-rate convergence score. Use Cursor for inline typing, Consilium for the decisions that matter.",
    intro: [
      "Cursor reimagined the IDE around an inline AI agent. The result is fast, fluid coding with one model in the loop - Composer for multi-file edits, Agent for autonomous tasks, and tab-complete that's better than every editor that came before it.",
      "Consilium is built around a different premise: when stakes are high, one model is not enough. We make multiple models from different providers - OpenAI, Anthropic, Google, xAI, Groq, Moonshot, OpenRouter - argue with each other in a structured deliberation, then synthesize a consensus answer with tracked confidence and preserved dissent.",
      "These tools are not direct competitors. Cursor wins for inline edits and rapid iteration. Consilium wins for architecture decisions, security reviews, regulatory writeups, and any moment when 'I asked Claude / GPT once' is not a good enough answer. And because Consilium ships an MCP server, you can run a full deliberation from inside Cursor with @consilium.",
      "If you're choosing between them, you're probably asking the wrong question. The right question is: do you want a faster typist, or do you want a council that catches what one model would miss?",
    ],
  },
  stats: [
    { label: "Providers", value: "7 first-class" },
    { label: "Deliberation modes", value: "8" },
    { label: "Models per request", value: "3–5 in parallel" },
    { label: "CLI unit tests", value: "962" },
    { label: "Average quick debate", value: "$0.001" },
    { label: "Average deep debate", value: "$0.50" },
  ],
  competitorQuote: {
    text: "MAX Mode unlocks the full context window of each model and turns on the most capable agent features. MAX requests are usage-priced and not included in your monthly Pro request allowance.",
    source: "Cursor pricing & MAX mode docs (cursor.com)",
    href: "https://cursor.com/pricing",
  },
  competitorStrengths: [
    "Tightest in-IDE inline completion experience available - Tab autocomplete is genuinely best-in-class.",
    "Composer and Agent modes handle most tactical multi-file edits with very low friction.",
    "Mature IDE primitives: split panes, terminal integration, debugger, extension marketplace (forked from VS Code).",
    "Excellent for rapid exploration when you trust the model and want speed over verification.",
    "Established product with a large user base, predictable subscription pricing, and active iteration.",
  ],
  consiliumWins: [
    {
      title: "Real multi-model deliberation, not model switching",
      body: "Cursor lets you pick one model per request from a dropdown. Consilium runs three to five models in parallel rounds - each generates an independent answer, cross-examines the others with typed challenges, and the judge synthesizes a single consensus with mathematical convergence detection (Kendall tau + Jaccard + concession rate ≥ 0.85).",
    },
    {
      title: "Provider-agnostic by design",
      body: "Consilium ships adapters for OpenAI, Anthropic, Google, xAI, Groq, Moonshot, and OpenRouter today. New providers plug in with one adapter file. Cursor exposes a fixed set of provider integrations through their proxy and is in control of which models you can route to.",
    },
    {
      title: "Eight purpose-built modes",
      body: "Council, Deep, Blind, Red Team, Jury, Market, Quick, and Auto - each backed by peer-reviewed research and tuned for different stakes. Healthcare and finance modes ship with mandatory dissent and forced citations. Cursor has one debate-free agent loop.",
    },
    {
      title: "Works wherever you work",
      body: "CLI, VS Code extension, Cursor (via MCP), Claude Desktop (via MCP), Claude Code (via MCP), Python SDK, TypeScript SDK, and the web app. Cursor is a fork of VS Code and locks you into that single surface.",
    },
    {
      title: "Audit trail per round",
      body: "Every Consilium debate produces a transcript: each model's input, output, tokens, cost, latency, plus the challenges and rebuttals it issued and received. Required for regulated work. Cursor doesn't structure or expose this.",
    },
  ],
  matrix: [
    {
      feature: "Models per request",
      consilium: "3–5 in parallel rounds",
      competitor: "1 selected from dropdown",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Provider count",
      consilium:
        "7 (OpenAI, Anthropic, Google, xAI, Groq, Moonshot, OpenRouter)",
      competitor: "Vendor-managed proxy",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Cross-examination / debate",
      consilium: "Typed challenges and categorized rebuttals",
      competitor: "Single agent loop",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Convergence detection",
      consilium: "Kendall tau + Jaccard + concession rate",
      competitor: "Not applicable",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Dissent preservation",
      consilium: "Mandatory in healthcare/legal/finance modes",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
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
      consilium: "First-class - REPL, tools, project memory",
      competitor: "No standalone CLI",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "MCP server",
      consilium: "Yes - works in Cursor, Claude Desktop, Claude Code",
      competitor: "Cursor consumes MCP, doesn't expose one",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "BYOK",
      consilium: "Yes - keys in ~/.consilium or env",
      competitor: "Limited - provider-routed",
      consiliumHas: true,
      competitorHas: true,
      note: "Cursor supports OpenAI/Anthropic/Google keys but routes via their proxy.",
    },
    {
      feature: "Free tier",
      consilium: "Managed pool fallback (Groq + OpenRouter)",
      competitor: "Hobby plan with rate limits",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Audit trail",
      consilium: "Per-round transcript with tokens, cost, latency",
      competitor: "Conversation history only",
      consiliumHas: true,
      competitorHas: false,
    },
  ],
  workflows: [
    {
      title: "Cursor for typing, Consilium for deciding",
      body: "Use Cursor's Composer for everyday refactors and inline edits. When you hit a decision that matters - schema choice, security model, library selection - pause and call @consilium from inside Cursor's MCP host. The council deliberates while you keep typing, then drops a structured recommendation with dissents into your context.",
    },
    {
      title: "Replace the lone-agent loop on PR review",
      body: "Cursor's review agent catches obvious things. Consilium's Red Team mode runs three models in adversarial roles - attacker issues typed challenges (SECURITY_VULN, LOGICAL_FLAW, EDGE_CASE), defender must rebut with evidence, judge synthesizes the final report. Same diff, ~30–40% more findings.",
    },
    {
      title: "Use Consilium when Cursor's model is overconfident",
      body: "If Cursor's selected model gives you an answer that feels too clean, run the same prompt through Consilium's Jury mode with five models. Disagreement among providers is a strong signal that your problem is harder than one model thinks.",
    },
    {
      title: "Architecture and ADRs",
      body: "Consilium's Council mode (3 models, 3 rounds) produces architecture decision records with documented dissent. Drop the markdown into your repo as an ADR. Cursor's single-agent output is one opinion - useful, but not auditable.",
    },
  ],
  faq: [
    {
      question: "Does Consilium replace Cursor?",
      answer:
        "No. Cursor's inline editing experience is excellent and we don't try to compete on that surface. Consilium is for high-stakes decisions where you want multiple models to argue. The two tools work great together - install the Consilium MCP server in Cursor and call @consilium when you want a council.",
    },
    {
      question: "Can I use Consilium inside Cursor?",
      answer:
        "Yes. Consilium ships an MCP server (consilium-mcp on PyPI) that plugs into Cursor's MCP integration. Run pip install consilium-mcp, add it to your Cursor MCP config, and you can call any of the eight deliberation modes from Cursor's chat surface.",
    },
    {
      question: "Why use Consilium when Cursor lets me pick the model?",
      answer:
        "Because picking one model and running the same prompt through five models in parallel are very different operations. Cursor gives you a model choice per request. Consilium runs them simultaneously, makes them argue, and gives you the diff between their answers - including the ones who disagreed.",
    },
    {
      question: "Is Consilium slower?",
      answer:
        "A full Council deliberation is slower than a single-model Cursor request - typically 30–90 seconds for a thorough debate. Use Consilium's Quick mode (2 models, 1 round) when you want speed. Use Council/Deep when the question is worth the wait.",
    },
    {
      question: "What does Consilium cost compared to Cursor?",
      answer:
        "Consilium has a free tier with a managed pool of open models (Groq + OpenRouter), so you can start without keys. BYOK means you pay your provider directly with no markup. Cursor charges a flat subscription that includes their proxy. The economics depend on usage - heavy users with their own keys often spend less on Consilium because there's no proxy margin.",
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
