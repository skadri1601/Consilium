import { NextResponse, type NextRequest } from "next/server";
import { pingIndexNow } from "@/lib/indexnow";
import { SITE_URL } from "@/lib/seo";
import { blogPosts } from "@/app/(marketing)/blog/blog-data";

/**
 * Internal IndexNow trigger. POSTs the full URL list (or a body-supplied
 * subset) to the IndexNow gateway so Bing / Yandex / Seznam pick up
 * new content within minutes. Gated by ``INTERNAL_API_SECRET`` so the
 * endpoint is operator-only - we don't want a public route that lets
 * arbitrary callers churn the gateway with our domain.
 *
 * Usage:
 *   curl -X POST -H "x-internal-secret: $INTERNAL_API_SECRET" \
 *        -H "Content-Type: application/json" \
 *        -d '{"urls": ["/blog/new-post"]}' \
 *        https://myconsilium.xyz/api/internal/indexnow
 *
 * Body is optional. With no urls field we ping every public route the
 * web app declares (sitemap-equivalent).
 */

export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "/",
  "/pricing",
  "/about",
  "/use-cases",
  "/faq",
  "/research",
  "/contact",
  "/blog",
  "/docs",
  "/docs/getting-started",
  "/docs/how-it-works",
  "/docs/modes",
  "/docs/architecture",
  "/docs/api",
  "/docs/cli",
  "/docs/providers",
  "/docs/templates",
  "/docs/python-sdk",
  "/docs/typescript-sdk",
  "/vs-cursor",
  "/vs-aider",
  "/vs-cline",
  "/vs-claude-code",
  "/vs-copilot",
];

function authorized(req: NextRequest): boolean {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) return false;
  const provided =
    req.headers.get("x-internal-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";
  return provided === secret;
}

function allKnownRoutes(): string[] {
  const blogRoutes = blogPosts.map((p) => `/blog/${p.slug}`);
  return [...STATIC_ROUTES, ...blogRoutes];
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let urls: string[] = [];
  try {
    const body = (await req.json()) as { urls?: string[] };
    if (Array.isArray(body?.urls) && body.urls.length > 0) {
      urls = body.urls;
    }
  } catch {
    /* empty body is fine - default to allKnownRoutes() */
  }

  const targets = (urls.length > 0 ? urls : allKnownRoutes()).map((u) =>
    u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? u : `/${u}`}`,
  );

  const result = await pingIndexNow(targets);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
