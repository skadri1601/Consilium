import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const APP_DISALLOW = [
  "/api/",
  "/monitoring",
  "/sentry-example-page",
  "/council",
  "/history",
  "/analytics",
  "/settings",
  "/personas",
  "/agents",
  "/debates/",
  "/sign-in",
  "/sign-up",
  "/cli/auth",
];

/**
 * ============================================================================
 * Consilium AEO / GEO crawler allow-list policy
 * Last reviewed: 2026-05-20
 * ----------------------------------------------------------------------------
 * Allowing documented AI crawlers is an AEO ("answer engine optimization")
 * and GEO ("generative engine optimization") choice. We WANT our docs,
 * comparison pages, and blog cited in ChatGPT, Claude, Perplexity, Gemini,
 * Apple Intelligence, Meta AI, Alexa, Amazon Rufus, and Mistral answers.
 * Blocking these bots removes Consilium from the citation pool entirely.
 *
 * Policy: every documented mainstream AI / answer-engine crawler is in
 * AI_BOTS_ALLOW. Hostile or non-compliant crawlers (e.g. Bytespider, which
 * has a long record of ignoring robots.txt and scraping aggressively)
 * are moved to AI_BOTS_DISALLOW. Site-wide APP_DISALLOW paths (auth,
 * dashboard, API) still apply to every allowed bot - we never expose
 * authenticated routes.
 *
 * To opt OUT of any allowed bot in the future, move its user-agent string
 * from AI_BOTS_ALLOW to AI_BOTS_DISALLOW. Do not silently delete entries.
 *
 * To opt INTO a new bot, add the user-agent to AI_BOTS_ALLOW with a source
 * link in the table below. Re-deploy the web app; Next.js regenerates
 * /robots.txt at build time.
 *
 * Sources for user-agent strings:
 *   GPTBot:             https://platform.openai.com/docs/bots
 *   OAI-SearchBot:      https://platform.openai.com/docs/bots
 *   ChatGPT-User:       https://platform.openai.com/docs/bots
 *   ClaudeBot:          https://support.anthropic.com/en/articles/8896518
 *   Claude-Web:         https://support.anthropic.com/en/articles/8896518
 *   Claude-User:        https://support.anthropic.com/en/articles/8896518
 *   anthropic-ai:       https://support.anthropic.com/en/articles/8896518
 *   PerplexityBot:      https://docs.perplexity.ai/guides/bots
 *   Perplexity-User:    https://docs.perplexity.ai/guides/bots
 *   Google-Extended:    https://developers.google.com/search/docs/crawling-indexing/google-extended
 *   Applebot-Extended:  https://support.apple.com/en-us/119829
 *   CCBot:              https://commoncrawl.org/ccbot
 *   cohere-ai:          https://docs.cohere.com/docs/web-search-and-crawling
 *   FacebookBot:        https://developers.facebook.com/docs/sharing/bot
 *   Meta-ExternalAgent: https://developers.facebook.com/docs/sharing/bot/
 *   YouBot:             https://about.you.com/youbot
 *   Diffbot:            https://docs.diffbot.com/reference/diffbot-crawler
 *   DuckAssistBot:      https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot
 *   MistralAI-User:     https://docs.mistral.ai
 *   ImagesiftBot:       https://imagesift.com/about
 *   Amazonbot:          https://developer.amazon.com/amazonbot
 *   Bytespider:         https://www.toutiao.com/spider/ (BLOCKED - ignores robots.txt)
 * ============================================================================
 */
const AI_BOTS_ALLOW = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "cohere-ai",
  "FacebookBot",
  "Meta-ExternalAgent",
  "YouBot",
  "Diffbot",
  "DuckAssistBot",
  "MistralAI-User",
  "ImagesiftBot",
  "Amazonbot",
];

const AI_BOTS_DISALLOW: string[] = ["Bytespider"];

export default function robots(): MetadataRoute.Robots {
  const aiAllowRules = AI_BOTS_ALLOW.map((userAgent) => ({
    userAgent,
    allow: "/",
    disallow: APP_DISALLOW,
  }));
  const aiDisallowRules = AI_BOTS_DISALLOW.map((userAgent) => ({
    userAgent,
    disallow: "/",
  }));

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: APP_DISALLOW,
      },
      ...aiAllowRules,
      ...aiDisallowRules,
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
