import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "claude-code",
  competitor: "Claude Code",
  pageTitle: "Consilium vs Claude Code: Multi-AI Council vs Anthropic-Only CLI",
  metaDescription:
    "Claude Code is Anthropic's official CLI built around one provider. Consilium is provider-agnostic and runs Claude alongside GPT, Gemini, Grok, Llama, Kimi, and OpenRouter in one debate.",
  keywords: [
    "claude code cli",
    "claude code alternative",
    "claude code vs consilium",
    "anthropic cli",
    "multi-provider ai cli",
  ],
  hero: {
    tagline:
      "Claude Code is the best way to use Claude. Consilium is the best way to verify Claude with six other models.",
    hook: "Claude Code is Anthropic's official CLI for Claude. Consilium ships an MCP server that plugs into Claude Code so Claude can call a multi-provider council whenever it needs a second opinion.",
    answerCapsule:
      "Consilium adds multi-AI debate across 7 providers on top of core CLI features like plan mode, hooks, sub-agents, and headless JSON output. Sandbox, worktree, voice, and image generation are coming soon. Claude Code locks you into Anthropic billing; Consilium is BYOK with zero markup plus a Groq free-tier fallback.",
    intro: [
      "Claude Code is the official Anthropic CLI for Claude. It's deeply integrated with the Claude family - Sonnet, Opus, Haiku - and ships well-engineered primitives: hooks, slash commands, MCP support, status line customization, sub-agents, and tight integration with Anthropic's API. If your team has standardized on Claude, it's the right tool for daily work.",
      "Claude Code's design constraint is its core value: it's Claude-only. There's no architectural way to ask GPT-5.5 or Gemini 3.1 Pro for a second opinion in the same session. You get exactly the model Anthropic ships, with exactly Anthropic's tradeoffs.",
      "Consilium is provider-agnostic from the bottom up. A single debate can include Claude alongside GPT-5.5, Gemini 3.1 Pro, Grok-4, Kimi K2, and any model on OpenRouter. The point isn't to replace Claude - it's to put Claude in a council where the other six providers cross-examine its reasoning.",
      "If your stack is built on Claude, the right architecture is to keep using Claude Code for daily work and add Consilium's MCP server. Claude Code can then call @consilium when it needs to deliberate across providers, and the council writes its synthesis back into Claude's context.",
    ],
  },
  stats: [
    { label: "Providers", value: "7 first-class" },
    { label: "Deliberation modes", value: "8" },
    { label: "CLI unit tests", value: "962" },
    { label: "Total platform tests", value: "1,553" },
    { label: "Convergence threshold", value: ">= 0.85" },
    { label: "Free tier", value: "1,000 debates / month" },
  ],
  competitorQuote: {
    text: "Plan mode lets Claude Code research, read files, and propose an approach without making any changes. You stay in control of when execution begins.",
    source: "Anthropic Claude Code docs",
    href: "https://docs.claude.com/en/docs/claude-code",
  },
  competitorStrengths: [
    "First-class Anthropic integration - instant access to Sonnet 4.6, Opus 4.7, Haiku 4.5 with no proxy.",
    "Extremely well-engineered CLI primitives: hooks, slash commands, sub-agents, status line, output styles, MCP host.",
    "Tight Anthropic ecosystem fit - works seamlessly with the Claude API, Claude Desktop, and Anthropic billing.",
    "Mature codebase-aware tool calls (Read, Edit, Glob, Grep, Bash, etc.) tuned by the team that ships Claude.",
    "Best in class for users committed to the Claude family who want the deepest integration.",
  ],
  consiliumWins: [
    {
      title: "Multi-provider by design",
      body: "Consilium ships first-class adapters for OpenAI, Anthropic, Google, xAI, Groq, Moonshot, and OpenRouter. Inside one debate, Claude can argue with GPT-5.5 about a security model, Gemini 3.1 Pro can flag a perf regression, and Grok can challenge an edge case Claude missed. Claude Code is single-provider by design.",
    },
    {
      title: "Structured debate, not single-voice generation",
      body: "Consilium's debate engine uses typed challenges (FACTUAL_ERROR, MISSING_EVIDENCE, FLAWED_LOGIC) and categorized rebuttals (CONCEDE, REFUTE, QUALIFY, REDIRECT). Models must justify positions with evidence under cross-examination. Claude Code's tool loop is excellent, but it's still one voice.",
    },
    {
      title: "Mathematical convergence",
      body: "A Consilium debate explicitly reports whether consensus was reached and how strong it is - composite score across Kendall tau, Jaccard, and concession rate, threshold 0.85. You always know when the council agrees and when it doesn't. Claude Code gives you Claude's confidence, calibrated only against Claude's own reasoning.",
    },
    {
      title: "Eight modes for different stakes",
      body: "Quick (2 models, 1 round) for fast checks. Council (3 models, 3 rounds) for design. Red Team for security. Jury for risk with mandatory dissent. Healthcare/legal/finance modes ship with required citations and forced dissent. Claude Code has one mode: Claude.",
    },
    {
      title: "Provider hedge and cost discipline",
      body: "When Anthropic has an outage or rate-limits you, Claude Code is stuck. Consilium can route the same request through GPT, Gemini, Grok, Groq, or OpenRouter - and the free-tier pool fallback keeps debates running even without keys. Multi-provider is also a cost lever: route routine debates through cheaper providers and reserve Claude for the moments it matters.",
    },
  ],
  matrix: [
    {
      feature: "Provider count",
      consilium: "7 first-class adapters",
      competitor: "1 (Anthropic)",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Models per request",
      consilium: "3–5 in parallel rounds",
      competitor: "1 selected Claude model",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Cross-examination",
      consilium: "Typed challenges + rebuttals across rounds",
      competitor: "Single-agent loop",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Convergence detection",
      consilium: "Kendall tau + Jaccard + concession rate ≥ 0.85",
      competitor: "Claude self-reports confidence",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Mandatory dissent",
      consilium: "Required in healthcare/legal/finance modes",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "MCP server",
      consilium: "Yes - exposes deliberation as MCP tool",
      competitor: "Claude Code is an MCP host (consumes, doesn't expose one)",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "MCP host (consume other servers)",
      consilium: "Through CLI MCP integration",
      competitor: "Yes - first-class MCP host",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Hooks / sub-agents",
      consilium: "Custom slash commands in REPL",
      competitor: "First-class hooks + sub-agents + slash commands",
      consiliumHas: true,
      competitorHas: true,
      note: "Claude Code's hook/sub-agent system is more developed than Consilium's REPL today.",
    },
    {
      feature: "VS Code / Cursor extension",
      consilium: "Yes (and via MCP)",
      competitor: "VS Code IDE extension; Cursor via MCP",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Audit trail",
      consilium: "Per-round transcripts with tokens/cost/latency",
      competitor: "Session transcripts",
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
      title: "Claude Code for daily work, Consilium for second opinions",
      body: "Run Claude Code as your primary agent. Install Consilium's MCP server and add it to your .claude/settings. When Claude wants to verify its reasoning, it calls @consilium. The council deliberates across six other providers and returns a structured synthesis Claude folds back into its response.",
    },
    {
      title: "Provider failover",
      body: "When Anthropic has an incident, Claude Code is offline. Consilium can route the same request through GPT-5.5, Gemini 3.1 Pro, Grok, Kimi, Groq's free pool, or anything on OpenRouter - and continue working. Use the consilium CLI when Claude Code can't reach Claude.",
    },
    {
      title: "Cross-provider verification on critical edits",
      body: "Before merging a change touching auth, payments, or compliance, run the diff through consilium debate \"<diff>\" --mode redteam. You get adversarial review across providers, with documented dissent. Claude Code's review is one model's read; Red Team is six.",
    },
    {
      title: "Architecture decision records",
      body: "Use Consilium's Council mode to produce ADRs with documented multi-model dissent. Save the markdown into your repo. Claude Code can write a single-voice ADR; Consilium produces a multi-voice ADR with explicit disagreement on the path not taken.",
    },
  ],
  faq: [
    {
      question: "Does Consilium replace Claude Code?",
      answer:
        "Not for daily Claude usage. Claude Code is the best surface for Claude, and we recommend it. Consilium is what you bolt onto Claude Code for moments when you want six other providers to cross-examine Claude's answer.",
    },
    {
      question: "Can Consilium run inside Claude Code?",
      answer:
        "Yes - Consilium ships an MCP server (consilium-mcp on PyPI) that plugs into Claude Code's MCP host. Add it to your settings, and Claude Code can invoke any of the eight deliberation modes whenever it wants a council.",
    },
    {
      question: "Is this just running Claude five times in parallel?",
      answer:
        "No. The signal in Consilium comes from cross-provider disagreement. Running Claude five times produces five Claude answers, all anchored on the same training distribution. Running Claude + GPT-5.5 + Gemini 3.1 Pro + Grok + Kimi produces independent perspectives that catch each other's blind spots.",
    },
    {
      question: "Will using Consilium leak my prompts to other providers?",
      answer:
        "Only to the providers you choose. By default debates use BYOK - your keys, your provider terms. The free-tier fallback uses Groq and OpenRouter; you can disable it. Consilium itself stores debate transcripts in your account if you opt in, with full audit trail per round.",
    },
    {
      question:
        "Why use Consilium when Claude is already the strongest model on most benchmarks?",
      answer:
        "Because 'strongest on benchmarks' is not the same as 'right for this specific question.' Consilium debates surface the exact cases where Claude is overconfident - and they're not rare. Multi-provider deliberation is also a useful hedge against any one provider's rate-limits, outages, or content-policy quirks.",
    },
  ],
  lastUpdated: "2026-05-23",
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
