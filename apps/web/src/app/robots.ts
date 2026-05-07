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
 * AI crawlers we explicitly allow. These bots are documented and
 * respect robots.txt. Allowing them is an AEO ("answer engine
 * optimization") choice - we want our docs and comparison pages cited
 * in AI assistant answers. To opt out for any of them, move the
 * user-agent into ``AI_BOTS_DISALLOW`` below.
 *
 * Sources for user-agent strings:
 *   GPTBot:           https://platform.openai.com/docs/bots
 *   OAI-SearchBot:    https://platform.openai.com/docs/bots
 *   ChatGPT-User:     https://platform.openai.com/docs/bots
 *   ClaudeBot:        https://support.anthropic.com/en/articles/8896518
 *   Claude-Web:       same Anthropic page
 *   anthropic-ai:     same Anthropic page
 *   PerplexityBot:    https://docs.perplexity.ai/guides/bots
 *   Perplexity-User:  same Perplexity page
 *   Google-Extended:  https://developers.google.com/search/docs/crawling-indexing/google-extended
 *   Applebot-Extended:https://support.apple.com/en-us/119829
 *   Bytespider:       https://www.toutiao.com/spider/ (TikTok / ByteDance)
 *   CCBot:            https://commoncrawl.org/ccbot
 *   cohere-ai:        https://docs.cohere.com/docs/web-search-and-crawling
 *   FacebookBot:      https://developers.facebook.com/docs/sharing/bot
 *   YouBot:           https://about.you.com/youbot
 *   Diffbot:          https://docs.diffbot.com/reference/diffbot-crawler
 *   DuckAssistBot:    https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot
 *   Mistral-AI-User:  https://docs.mistral.ai
 *   ImagesiftBot:     https://imagesift.com/about
 */
const AI_BOTS_ALLOW = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "cohere-ai",
  "FacebookBot",
  "YouBot",
  "Diffbot",
  "DuckAssistBot",
  "Mistral-AI-User",
  "ImagesiftBot",
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
