import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

type Route = {
  path: string;
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: number;
};

const MARKETING_ROUTES: Route[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/use-cases", changeFrequency: "monthly", priority: 0.8 },
  { path: "/research", changeFrequency: "monthly", priority: 0.7 },
  { path: "/community", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

const DOCS_ROUTES: Route[] = [
  { path: "/docs", changeFrequency: "weekly", priority: 0.9 },
  { path: "/docs/getting-started", changeFrequency: "weekly", priority: 0.9 },
  { path: "/docs/how-it-works", changeFrequency: "monthly", priority: 0.8 },
  { path: "/docs/modes", changeFrequency: "monthly", priority: 0.8 },
  { path: "/docs/architecture", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs/api", changeFrequency: "monthly", priority: 0.8 },
  { path: "/docs/cli", changeFrequency: "monthly", priority: 0.8 },
  { path: "/docs/providers", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs/templates", changeFrequency: "monthly", priority: 0.6 },
  { path: "/docs/python-sdk", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs/typescript-sdk", changeFrequency: "monthly", priority: 0.7 },
  { path: "/docs/self-hosting", changeFrequency: "monthly", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [...MARKETING_ROUTES, ...DOCS_ROUTES].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
