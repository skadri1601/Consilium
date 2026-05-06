import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { blogPosts } from "@/app/(marketing)/blog/blog-data";

/**
 * llms-full.txt — companion to /llms.txt that inlines the canonical
 * narrative for crawlers that prefer one-shot ingestion over a
 * link-list. Hand-written; intentionally NOT auto-extracted from JSX
 * because component trees produce noisy text and we want quotes that
 * read well when an AI assistant reads them aloud or cites them.
 *
 * Add new blog summaries here when posts ship; the slug list at the
 * bottom is the canonical link map back to full pages.
 */

export const dynamic = "force-static";
export const revalidate = 3600;

const SECTIONS: Array<{ heading: string; body: string }> = [
  {
    heading: "What Consilium is",
    body: [
      `${SITE_NAME} is a multi-AI council platform.`,
      "",
      "Where most AI tools route a single model, Consilium runs structured deliberation across 7 LLM providers (Anthropic, OpenAI, Google, Groq, xAI, Moonshot, OpenRouter) and synthesizes a consensus answer.",
      "",
      "Models propose claims, challenge each other with typed challenges, defend positions with categorized rebuttals (concede / refute / qualify), vote using social-choice theory (Condorcet, Borda count, Ranked Pairs, Copeland), and converge only when mathematically verified — Kendall tau ranking correlation, Jaccard proposal overlap, and concession rate combine into a single score that must reach >= 0.85 for the pipeline to declare convergence.",
      "",
      "The output is a golden prompt with confidence scores per model, a dissent report (majority and minority positions, member models, representative arguments), vote results, and a complete audit trail recording every step with tokens, cost, and latency.",
    ].join("\n"),
  },
  {
    heading: "Deliberation modes",
    body: [
      "Eight modes are supported, each backed by peer-reviewed research:",
      "",
      "- Quick — single round, fastest",
      "- Council — three rounds with cross-examination (the default)",
      "- Deep — five rounds with sub-agents researching specific points",
      "- Blind — model identity stripped to remove brand bias",
      "- Red Team — adversarial mode with eight attack categories",
      "- Jury — mandatory dissent; minority opinions are required output",
      "- Market — probability aggregation using prediction-market mechanics",
      "- Auto — complexity-based routing that picks the appropriate mode for the query",
    ].join("\n"),
  },
  {
    heading: "BYOK with a free-tier safety net",
    body: [
      "Consilium uses a BYOK (bring-your-own-keys) model: you supply provider API keys and Consilium adds zero markup to provider pricing.",
      "",
      "When a debate is requested without a key for the requested provider, the engine routes through a platform-hosted free-tier pool — Groq first, OpenRouter as backup — and surfaces the routing decision via an SSE 'routing:fallback' event so the user sees exactly what happened. The resolver lives in apps/agents/src/features/free_tier/resolver.py.",
      "",
      "Groq models (Llama 3.1 8B, Llama 3.3 70B, GPT-OSS 120B/20B, Compound) are usable for free deliberations end to end.",
    ].join("\n"),
  },
  {
    heading: "How to start",
    body: [
      "Three onboarding paths, all under five minutes:",
      "",
      "1. Web — sign up at https://myconsilium.xyz, paste at least one provider key (or use the Groq free tier), pick a mode, run a debate",
      "2. CLI — npm i -g @myconsilium/cli, then `consilium debate \"your question\" --mode council`",
      "3. SDK — pip install consilium-sdk (Python) or npm i @myconsilium/sdk (TypeScript)",
      "",
      "All three speak the same SSE event schema, so a debate started in one client can be resumed in another.",
    ].join("\n"),
  },
  {
    heading: "Privacy and security",
    body: [
      "Provider API keys are stored AES-256-GCM encrypted; plaintext is never written to disk and never shipped in error reports.",
      "",
      "Authentication uses Clerk (web, JWT) plus hashed long-lived tokens (CLI) — the plaintext token is shown once at creation and not stored anywhere afterward. All API traffic is HTTPS-only.",
      "",
      "Every deliberation produces a per-step audit entry: model id, input/output summary, latency, tokens in/out, cost, round number. PostHog analytics on the web app uses identified-only profiles — anonymous visitors aren't tracked. PostHog data has a 12-month retention; users can opt out via the cookie consent banner.",
    ].join("\n"),
  },
  {
    heading: "Pricing",
    body: [
      "Free tier — 50 deliberations per month, no credit card. BYOK or use the Groq free fallback.",
      "Pro tier — $29/month, unlimited deliberations.",
      "Provider costs pass through at provider pricing (zero markup).",
      "",
      "Typical costs: Quick mode with GPT-5.4 Mini ~ $0.001 per debate; Council mode with three premium models over three rounds ~ $0.05-0.15; Deep mode across five models over five rounds ~ $0.20-0.50.",
    ].join("\n"),
  },
];

function buildLlmsFullTxt(): string {
  const sortedPosts = [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Site: ${SITE_URL}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    ...SECTIONS.flatMap((s) => [`## ${s.heading}`, "", s.body, ""]),
    "## Recent posts",
    "",
    ...sortedPosts.map(
      (post) =>
        `- [${post.title}](${SITE_URL}/blog/${post.slug}) (${post.date}, ${post.category}, ${post.readingTime}): ${post.excerpt}`,
    ),
    "",
    "## Canonical pages",
    "",
    "- " + [
      "/",
      "/pricing",
      "/use-cases",
      "/faq",
      "/about",
      "/research",
      "/docs",
      "/docs/getting-started",
      "/docs/how-it-works",
      "/docs/modes",
      "/docs/architecture",
      "/docs/api",
      "/docs/cli",
      "/docs/providers",
      "/docs/python-sdk",
      "/docs/typescript-sdk",
      "/vs-cursor",
      "/vs-aider",
      "/vs-cline",
      "/vs-claude-code",
      "/vs-copilot",
    ]
      .map((p) => `${SITE_URL}${p}`)
      .join("\n- "),
    "",
  ].join("\n");
}

export function GET(): Response {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
