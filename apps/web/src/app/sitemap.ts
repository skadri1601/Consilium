import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { blogPosts } from "@/app/(marketing)/blog/blog-data";
import { NOTION_DOCS } from "@/lib/notion";

type Route = {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
  /** ISO 8601 date the route last had meaningful content updates. */
  lastModified?: string;
};

/**
 * lastModified is intentionally hand-curated per route instead of
 * `new Date()`. A sitemap that says "everything changed at the moment
 * you crawled this" trains Google to ignore lastmod, which removes
 * the signal entirely. Bump the date here when the content of the
 * route actually changes.
 */
const SITE_LAST_REVIEWED = "2026-04-29";

const MARKETING_ROUTES: Route[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0, lastModified: SITE_LAST_REVIEWED },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9, lastModified: SITE_LAST_REVIEWED },
  { path: "/about", changeFrequency: "monthly", priority: 0.7, lastModified: SITE_LAST_REVIEWED },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-04-15" },
  { path: "/use-cases", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-04-15" },
  { path: "/research", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-04-10" },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5, lastModified: "2026-01-15" },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8, lastModified: SITE_LAST_REVIEWED },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-01-15" },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-01-15" },
];

const DOCS_ROUTES: Route[] = [
  { path: "/docs", changeFrequency: "weekly", priority: 0.9, lastModified: SITE_LAST_REVIEWED },
  { path: "/docs/getting-started", changeFrequency: "weekly", priority: 0.9, lastModified: SITE_LAST_REVIEWED },
  { path: "/docs/how-it-works", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-04-15" },
  { path: "/docs/modes", changeFrequency: "monthly", priority: 0.8, lastModified: "2026-04-15" },
  { path: "/docs/architecture", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-04-15" },
  { path: "/docs/api", changeFrequency: "monthly", priority: 0.8, lastModified: SITE_LAST_REVIEWED },
  { path: "/docs/cli", changeFrequency: "monthly", priority: 0.8, lastModified: SITE_LAST_REVIEWED },
  { path: "/docs/providers", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-04-15" },
  { path: "/docs/templates", changeFrequency: "monthly", priority: 0.6, lastModified: "2026-04-15" },
  { path: "/docs/python-sdk", changeFrequency: "monthly", priority: 0.7, lastModified: SITE_LAST_REVIEWED },
  { path: "/docs/typescript-sdk", changeFrequency: "monthly", priority: 0.7, lastModified: SITE_LAST_REVIEWED },
];

function blogRoutes(): Route[] {
  return blogPosts.map((post) => ({
    path: `/blog/${post.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
    lastModified: post.date,
  }));
}

function notionDocRoutes(): Route[] {
  return Object.keys(NOTION_DOCS).map((slug) => ({
    path: `/docs/notion/${slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    lastModified: SITE_LAST_REVIEWED,
  }));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const fallback = new Date(SITE_LAST_REVIEWED);
  return [
    ...MARKETING_ROUTES,
    ...DOCS_ROUTES,
    ...blogRoutes(),
    ...notionDocRoutes(),
  ].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: r.lastModified ? new Date(r.lastModified) : fallback,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
