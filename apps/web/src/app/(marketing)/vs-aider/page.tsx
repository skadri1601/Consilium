import type { Metadata } from "next";
import { ComparisonPage } from "@/components/marketing/comparison/comparison-page";
import type { CompetitorComparison } from "@/components/marketing/comparison/types";
import { buildMetadata } from "@/lib/seo";

const data: CompetitorComparison = {
  slug: "aider",
  competitor: "Aider",
  pageTitle: "Consilium vs Aider: Multi-AI Council vs Single-Model CLI",
  metaDescription:
    "Aider is a beloved git-native coding CLI for one model at a time. Consilium runs a council of seven providers in parallel, with structured debate and convergence detection.",
  keywords: [
    "aider ai",
    "aider alternative",
    "aider vs consilium",
    "ai coding cli",
    "git-native ai cli",
  ],
  hero: {
    tagline:
      "Aider taught the CLI world how AI should edit code. Consilium asks: what if seven models did it together?",
    hook: "Aider is the gold standard for single-model, git-native CLI coding. Consilium is the same idea - except it runs three to five models in parallel and makes them argue.",
    answerCapsule:
      "Consilium runs 3-5 models from 7 providers in structured debate rounds, then synthesizes a consensus with mathematical convergence detection. Aider edits code with a single chosen model and auto-commits to git. Use Aider for fast routine commits at lowest cost; use Consilium when you need cross-provider verification, adversarial Red Team review, or auditable architecture decisions with documented dissent.",
    intro: [
      "Aider has earned a deserved reputation. It writes commits with sensible messages, applies edits using a structured diff format, builds a repo map for context, and stays out of your way. The whole-file and udiff edit formats it pioneered are now standard practice across the agentic coding ecosystem - including in Consilium's own toolchain.",
      "Aider's core constraint is its core feature: one model, one voice, one perspective. You pick a model - Sonnet, GPT, DeepSeek, whatever - and that one model handles your request from start to finish. It's fast, cheap, and works well when the model is right.",
      "Consilium is built for the cases when one model is not enough. Ambiguous architecture decisions. Code touching auth or money or compliance. Anything where 'I asked Claude' is a sentence you'll have to defend in a postmortem. Consilium runs a council - three to five models from different providers - that independently propose answers, cross-examine each other with typed challenges, and converge on a synthesized result with mathematical convergence checks.",
      "Aider is faster and cheaper for routine changes. Consilium catches things one model misses. Most teams that use both end up with Aider in their daily commit loop and Consilium reserved for high-stakes review and decision points.",
    ],
  },
  stats: [
    { label: "Providers", value: "7 first-class" },
    { label: "Deliberation modes", value: "8" },
    { label: "Models per debate", value: "3–5 parallel" },
    { label: "ICML 2024 accuracy uplift", value: "+8–15%" },
    { label: "CLI unit tests", value: "962" },
    { label: "Convergence threshold", value: ">= 0.85" },
  ],
  competitorQuote: {
    text: "Aider works best with Claude 3.5 Sonnet, DeepSeek Chat V3 and GPT-4o. You will need an API key for whichever LLM you wish to use.",
    source: "Aider docs (aider.chat)",
    href: "https://aider.chat/docs/llms.html",
  },
  competitorStrengths: [
    "Excellent edit-format engineering - the udiff format and whole-file replacement work reliably across models.",
    "Repo map generation is mature and gives the model good context without manual file selection.",
    "Native git integration - every change becomes a commit with a sensible auto-generated message.",
    "Mature, opinionated, single-binary CLI with low-friction setup and a strong Discord community.",
    "Cheaper per request than any deliberation engine because there's only one model in the loop.",
  ],
  consiliumWins: [
    {
      title: "Multiple providers per request, not multiple sessions",
      body: "Aider lets you switch models between sessions. Consilium runs three to five models simultaneously inside one debate and synthesizes their disagreement into a single answer. You don't pick the right model - the council does.",
    },
    {
      title: "Structured cross-examination",
      body: "Consilium's debate engine uses typed challenges (FACTUAL_ERROR, MISSING_EVIDENCE, FLAWED_LOGIC) and categorized rebuttals (CONCEDE, REFUTE, QUALIFY, REDIRECT). Models must justify positions with evidence, not vibes. Aider runs a single agent loop with no adversarial verification.",
    },
    {
      title: "Convergence detection",
      body: "A Consilium debate doesn't end when the model says it's done. It ends when Kendall tau ranking similarity, Jaccard proposal overlap, and concession rate produce a composite score above 0.85 - or it explicitly reports that consensus failed. You always know whether the answer is solid.",
    },
    {
      title: "Eight deliberation modes",
      body: "Quick (2 models, 1 round) for fast checks. Council (3 models, 3 rounds) for design questions. Red Team for adversarial review. Jury for risk assessment with mandatory dissent. Aider has one mode: edit.",
    },
    {
      title: "Distributable beyond the CLI",
      body: "Consilium ships as a CLI, a VS Code extension, an MCP server (works inside Cursor / Claude Desktop / Claude Code), a Python SDK, and a TypeScript SDK. Aider is a CLI. Both are great CLIs - but the surface area is different.",
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
      consilium:
        "7 providers (OpenAI, Anthropic, Google, xAI, Groq, Moonshot, OpenRouter)",
      competitor:
        "Anthropic, OpenAI, Gemini, DeepSeek, Cohere, OpenRouter, Ollama",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Cross-examination",
      consilium: "Typed challenges + rebuttals across rounds",
      competitor: "Single agent loop, no debate",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Convergence detection",
      consilium: "Kendall tau + Jaccard + concession rate",
      competitor: "N/A - single voice",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Mandatory dissent",
      consilium: "Yes in healthcare/legal/finance modes",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Edit format",
      consilium: "Surgical old_string/new_string with permission gating",
      competitor: "udiff and whole-file formats",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "Git integration",
      consilium: "Auto-collect git context; manual commits",
      competitor: "Auto-commit per change with generated messages",
      consiliumHas: true,
      competitorHas: true,
      note: "Aider's auto-commit-per-change is genuinely nice; Consilium leaves commits to you.",
    },
    {
      feature: "Repo map",
      consilium: "Project memory + .consilium/memory.md",
      competitor: "Aider's repo map (well-tuned)",
      consiliumHas: true,
      competitorHas: true,
    },
    {
      feature: "MCP server",
      consilium: "Yes - exposes deliberation as MCP tool",
      competitor: "No",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "VS Code / Cursor extension",
      consilium: "Yes",
      competitor: "No (CLI only)",
      consiliumHas: true,
      competitorHas: false,
    },
    {
      feature: "Audit trail",
      consilium: "Per-round transcript with tokens/cost/latency",
      competitor: "Chat history",
      consiliumHas: true,
      competitorHas: false,
    },
  ],
  workflows: [
    {
      title: "Aider for routine commits, Consilium for the hard ones",
      body: 'Aider is faster, cheaper, and very good at routine refactors and bug fixes. When you hit something gnarly - a schema migration, an auth flow, a perf-critical hot path - pause Aider and run consilium debate "<question>". The council weighs in across providers, and you bring the synthesis back into your Aider session.',
    },
    {
      title: "Pre-merge security review",
      body: "Run your branch's diff through Consilium's Red Team mode before merging. Three models attack the diff with typed security/logic/edge-case challenges; the defender model must rebut with evidence. The findings drop into a structured report you can paste into your PR description. Aider gives you a single voice; Red Team gives you adversarial verification.",
    },
    {
      title: "Architecture decisions",
      body: "When you'd otherwise open a Slack thread or run an ADR meeting, run Consilium's Council mode. Three models, three rounds, with documented dissent. Save the markdown output as your ADR. Aider's single-agent edit loop isn't built for this; deliberation is.",
    },
    {
      title: "When Aider's model gets it wrong",
      body: "If Aider commits something that smells off, run the same prompt through Consilium's Jury mode (five models). Disagreement among providers is a much stronger signal that something is wrong than disagreement between you and one model.",
    },
  ],
  faq: [
    {
      question: "Is Consilium a fork of Aider?",
      answer:
        "No. Consilium is independent and built around a fundamentally different premise - multi-model debate instead of single-model agentic editing. We did learn from Aider's edit-format work, the way every modern AI coding tool has, and we credit them for shaping the entire space.",
    },
    {
      question: "Can I use both Aider and Consilium?",
      answer:
        "Yes - and most heavy users do. Aider is faster and cheaper for routine work. Consilium is for moments when you want a council. Both run as CLIs, both respect your git tree, both work with your provider keys.",
    },
    {
      question: "What providers does Consilium support that Aider doesn't?",
      answer:
        "The provider lists overlap heavily - both support OpenAI, Anthropic, Google, OpenRouter, and various open routes. Where we differ is xAI (Grok) and Moonshot (Kimi K2) as first-class adapters with model-specific tuning. The bigger structural difference is that Consilium runs multiple providers in one request; Aider runs one per session.",
    },
    {
      question: "Does Consilium auto-commit like Aider?",
      answer:
        "Not by default. Aider's auto-commit-per-change is genuinely a nice feature, but Consilium debates often produce structured plans rather than direct edits, and we want commits to be deliberate. You can wire commit automation into your shell or pre-commit hook if you want it.",
    },
    {
      question: "Will Consilium be more expensive than Aider?",
      answer:
        "Per request - yes, because three to five models cost more than one. But the modes are tuned: Quick mode runs two models in one round and is comparable in cost. Use Quick for routine, Council for design, Deep for the genuinely hard problems. The free tier (Groq + OpenRouter pool fallback) keeps casual usage near zero.",
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
