import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { blogPosts } from "@/app/(marketing)/blog/blog-data";

/**
 * RSS 2.0 feed for the blog. AI search engines (Perplexity, ChatGPT
 * search, Bing Chat) treat fresh feed entries as a freshness signal,
 * and feed readers like NetNewsWire and Feedly are still where a
 * meaningful chunk of engineering audience subscribes.
 *
 * Served at /feed.xml. Linked from <head> via the head <link rel> tag
 * we add to the marketing layout, plus referenced from /llms.txt.
 */

export const dynamic = "force-static";
export const revalidate = 3600;

const xmlEscape = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

function rfc822(dateStr: string): string {
  return new Date(dateStr).toUTCString();
}

function buildFeed(): string {
  const sortedPosts = [...blogPosts].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const lastBuildDate =
    sortedPosts.length > 0
      ? rfc822(sortedPosts[0].date)
      : new Date().toUTCString();

  const items = sortedPosts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      return [
        "    <item>",
        `      <title>${xmlEscape(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${rfc822(post.date)}</pubDate>`,
        `      <category>${xmlEscape(post.category)}</category>`,
        `      <description>${xmlEscape(post.excerpt)}</description>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xmlEscape(SITE_NAME)} blog</title>`,
    `    <link>${SITE_URL}/blog</link>`,
    `    <description>${xmlEscape(SITE_DESCRIPTION)}</description>`,
    `    <language>en-US</language>`,
    `    <lastBuildDate>${lastBuildDate}</lastBuildDate>`,
    `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

export function GET(): Response {
  return new Response(buildFeed(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
