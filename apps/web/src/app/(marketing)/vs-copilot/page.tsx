import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "copilot",
  competitor: "GitHub Copilot",
  pageTitle:
    "Consilium vs GitHub Copilot: Multi-AI Council vs Inline Autocomplete",
  metaDescription:
    "GitHub Copilot is the world's most-used AI autocomplete. Consilium does something Copilot does not: a structured multi-provider debate that catches what one model misses.",
  keywords: [
    "github copilot alternative",
    "copilot vs consilium",
    "ai pair programming",
    "ai code review",
    "multi-model coding agent",
  ],
  hero: {
    tagline:
      "Copilot is the typist. Consilium is the council that reviews the typing.",
    hook: "GitHub Copilot is the dominant inline-autocomplete and chat product. Consilium is built around a different operation: structured multi-provider deliberation for moments when one model is not enough.",
    intro: [
      "GitHub Copilot is the most widely deployed AI coding tool on the planet. Inline ghost-text completions, Copilot Chat, agent mode, and Copilot Workspace cover the daily-driver use cases for most developers. The integration with GitHub itself - repos, PRs, issues, Actions - is unique and hard to match.",
      "Copilot is also fundamentally a single-model product per request. You can choose between GPT, Claude, Gemini, or Grok in the model picker, but each request gets one model. Microsoft's proxy controls which models you can route to and at what price. There's no architectural way to ask all of them in parallel and have them argue.",
      "Consilium starts from the parallel-debate premise. Three to five models from different providers (OpenAI, Anthropic, Google, xAI, Groq, Moonshot, OpenRouter) generate independent answers, cross-examine each other with typed challenges, and converge on a synthesized result with mathematical convergence detection.",
      "These are different operations, not interchangeable products. Copilot autocompletes faster than you can think. Consilium runs a multi-model deliberation that catches what one model misses. The right architecture is to use Copilot for inline typing and Consilium for the moments when you want a council - design choices, security review, regulatory writeups, anything where shipping the wrong answer is expensive.",
    ],
  },
  competitorStrengths: [
    "Best inline autocomplete in the industry - ghost-text completions are a daily-driver experience.",
    "Tight GitHub integration: PR summaries, issue triage, Actions debugging, repo-aware context.",
    "Massive ecosystem reach - ships in VS Code, JetBrains, Visual Studio, Vim/Neovim, and the GitHub web UI.",
    "Predictable per-seat pricing through GitHub billing; covered by many enterprise agreements already in place.",
    "Excellent for everyday completion, comment generation, and quick chat questions where speed beats deliberation.",
  ],
  consiliumWins: [
    {
      title: "Multi-provider deliberation, not single-model selection",
      body: "Copilot lets you pick a model per request. Consilium runs three to five models in parallel and makes them argue. The two operations produce fundamentally different signal - one gives you a model's best guess, the other gives you a council's debated synthesis with documented dissent.",
    },
    {
      title: "Eight modes built for different stakes",
      body: "Quick mode for fast checks. Council for design. Red Team for security review with adversarial typed challenges. Jury for risk assessment with mandatory dissent. Healthcare/legal/finance modes ship with required citations and forced dissent. Copilot has chat, agent, and inline completion - all single-voice.",
    },
    {
      title: "Real audit trail",
      body: "Every Consilium debate produces a per-round transcript: each model's input, output, tokens, cost, latency, and the typed challenges/rebuttals exchanged. Required for regulated industries and compliance reviews. Copilot Chat history is conversation-level; Consilium's is debate-level.",
    },
    {
      title: "Provider portability",
      body: "Copilot routes through Microsoft's proxy. If GitHub changes their pricing, model availability, or content policies, you adjust. Consilium uses BYOK - your keys, your terms, with the seven adapters as direct integrations and OpenRouter as escape hatch. The economics and control surface are different.",
    },
    {
      title: "Works outside the GitHub ecosystem",
      body: "Consilium ships as a CLI, VS Code extension, MCP server (Cursor / Claude Desktop / Claude Code / Cline), Python SDK, and TypeScript SDK. Copilot is excellent if your stack is GitHub-centric. If you're on GitLab, Bitbucket, self-hosted Gitea, or stitching across multiple repo hosts, Consilium's surface is broader.",
    },
  ],
  matrix: [
    {
      feature: "Inline autocomplete",
      consilium: "Not a focus - use Copilot for this",
      competitor: "Industry-leading",
      consiliumHas: false,
      competitorHas: true,
    },
    {
      feature: "Models per request",
      consilium: "3–5 in parallel rounds",
      competitor: "1 selected from picker",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Provider count",
      consilium: "7 first-class adapters",
      competitor: "Multi-provider via Microsoft proxy",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Cross-examination / debate",
      consilium: "Typed challenges + categorized rebuttals",
      competitor: "Single-agent loop",
      consiliumHas: true,
      competitorHas: false,
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
      consilium: "Required in healthcare/legal/finance modes",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "GitHub PR / issue integration",
      consilium: "Via gh CLI helpers (debate pr, debate issue)",
      competitor: "First-class - native to the platform",
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
    {
      feature: "BYOK",
      consilium: "Yes - keys local in ~/.consilium",
      competitor: "Microsoft-proxied",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Audit trail",
      consilium: "Per-round structured transcripts",
      competitor: "Chat history",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "MCP server",
      consilium: "Yes - exposes deliberation as MCP tool",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
  ],
  workflows: [
    {
      title: "Copilot for typing, Consilium for review",
      body: "Use Copilot's ghost-text and Copilot Chat through your day for completions and quick questions. When you finish a PR, run consilium debate pr <number> to get adversarial multi-provider review on the diff before requesting human review. Two tools, complementary surfaces.",
    },
    {
      title: "Architecture decisions Copilot can't deliberate",
      body: "Copilot Chat gives you one model's opinion on architecture. Consilium's Council mode (3 models, 3 rounds) produces an ADR-shaped output with documented dissent. Drop the markdown into your repo. Copilot is a typist; Consilium is a council.",
    },
    {
      title: "Catch what Copilot's confident answer missed",
      body: "When Copilot Chat gives you a confident answer that smells off, run the same prompt through Consilium's Jury mode. Five providers in parallel with mandatory dissent will surface the specific edge cases or alternate interpretations that one model glossed over.",
    },
    {
      title: "Provider hedge",
      body: "When Microsoft's Copilot proxy has an incident or pricing change, Consilium gives you direct provider access via BYOK with the free-tier pool as fallback. Useful both as a backup and as a way to avoid being locked into one vendor's roadmap.",
    },
  ],
  faq: [
    {
      question: "Does Consilium replace Copilot?",
      answer:
        "No - and we don't try to. Copilot's inline ghost-text autocomplete is genuinely best-in-class and we'd rather you keep using it. Consilium replaces the parts of Copilot's surface where you wanted multiple opinions: review, architecture, security, anything where one model's confidence is not enough.",
    },
    {
      question: "Can I use Consilium with Copilot side-by-side?",
      answer:
        "Yes. Most users do. Copilot in your editor for inline completion. Consilium in a terminal pane (or via VS Code extension) when you want a council to weigh in on something specific.",
    },
    {
      question: "Why not just use Copilot Workspace for the multi-step stuff?",
      answer:
        "Copilot Workspace is a powerful single-agent autonomous loop, similar in shape to Cursor Agent or Cline. It's still one model at a time. Consilium's mechanic is parallel multi-provider debate - a different operation that produces different signal, especially around design tradeoffs and adversarial review.",
    },
    {
      question: "What about the GitHub integration that Copilot has natively?",
      answer:
        "Copilot is hard to beat on PR summaries and Actions debugging because it's first-party. Consilium ships gh-CLI-powered shortcuts (consilium debate pr <#>, debate issue <#>, debate failing) so you can run a multi-model debate against any GitHub artifact, but the deepest GitHub integration belongs to Copilot.",
    },
    {
      question: "How does pricing compare?",
      answer:
        "Copilot is per-seat at a flat rate. Consilium is BYOK - you pay your providers directly, no markup, with a free-tier pool (Groq + OpenRouter) for casual usage. Heavy users with their own keys often spend less than per-seat Copilot; light users can stay on the free pool.",
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
