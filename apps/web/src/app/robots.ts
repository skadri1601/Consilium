import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
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
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
