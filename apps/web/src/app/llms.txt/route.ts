import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { blogPosts } from "@/app/(marketing)/blog/blog-data";

/**
 * llms.txt - emerging convention (https://llmstxt.org) for giving LLM
 * crawlers a curated, structured map of the site's most important
 * content. Functions like a sitemap-but-for-AI. Served from the root
 * (/llms.txt) by Next's app-router file convention. Plain text, UTF-8.
 *
 * Format: H1 site name, > tagline, ## section headers, then
 * "[Title](url): summary" bullets. Optional sections at the end mark
 * lower-priority content the crawler may skip if context-budget
 * constrained.
 */

export const dynamic = "force-static";
export const revalidate = 3600;

const link = (title: string, path: string, summary?: string) =>
  summary
    ? `- [${title}](${SITE_URL}${path}): ${summary}`
    : `- [${title}](${SITE_URL}${path})`;

function buildLlmsTxt(): string {
  const sortedPosts = [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "Consilium is a multi-AI council where 7 LLM providers (Anthropic, OpenAI, Google, Groq, xAI, Moonshot, OpenRouter) debate, critique, and synthesize a consensus answer. Eight deliberation modes back research-grade voting (Condorcet / Borda / Ranked Pairs) and convergence detection (Kendall tau / Jaccard / concession rate).",
    "",
    "## Product",
    "",
    link("Home", "/", "Product overview, deliberation modes, supported models"),
    link("Pricing", "/pricing", "Free tier (50 deliberations/mo) + Pro $29/mo. BYOK with zero markup; Groq/OpenRouter free fallbacks"),
    link("Use Cases", "/use-cases", "When multi-AI debate beats a single model: high-stakes decisions, dissent capture, eval harnesses"),
    link("FAQ", "/faq", "Common questions about deliberation modes, voting, models, security, and pricing"),
    link("About", "/about", "Founder note + research lineage"),
    link("Research", "/research", "Peer-reviewed research backing each deliberation mode"),
    link("Contact", "/contact", "How to reach the team"),
    "",
    "## Documentation",
    "",
    link("Docs Home", "/docs"),
    link("Getting Started", "/docs/getting-started", "Quickstart in under five minutes via web, CLI, or SDK"),
    link("How It Works", "/docs/how-it-works", "Round-by-round walkthrough of the deliberation pipeline"),
    link("Modes", "/docs/modes", "Quick / Council / Deep / Blind / Red Team / Jury / Market / Auto"),
    link("Architecture", "/docs/architecture", "Web -> API -> Agents pipeline; SSE streaming, BullMQ, Redis"),
    link("API Reference", "/docs/api", "REST endpoints + SSE event schema"),
    link("CLI", "/docs/cli", "@myconsilium/cli - debate, replay, estimate"),
    link("Providers", "/docs/providers", "Setting up keys for the 7 supported LLM providers"),
    link("Templates", "/docs/templates"),
    link("Python SDK", "/docs/python-sdk", "consilium-sdk PyPI package"),
    link("TypeScript SDK", "/docs/typescript-sdk", "@myconsilium/sdk npm package"),
    "",
    "## Comparisons",
    "",
    link("vs Cursor", "/vs-cursor", "Single-model coder vs multi-model deliberation"),
    link("vs Aider", "/vs-aider", "CLI coder vs structured debate"),
    link("vs Cline", "/vs-cline", "VS Code agent vs council deliberation"),
    link("vs Claude Code", "/vs-claude-code", "Anthropic CLI vs multi-provider council"),
    link("vs Copilot", "/vs-copilot", "GitHub autocomplete vs deliberated synthesis"),
    "",
    "## Blog",
    "",
    ...sortedPosts.map((post) =>
      link(post.title, `/blog/${post.slug}`, post.excerpt),
    ),
    "",
    "## Optional",
    "",
    link("Privacy", "/privacy"),
    link("Terms", "/terms"),
    link("Sitemap (XML)", "/sitemap.xml"),
    link("RSS feed", "/feed.xml"),
    link("Full corpus", "/llms-full.txt", "All page bodies inlined for zero-fetch ingestion"),
    "",
  ].join("\n");
}

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
