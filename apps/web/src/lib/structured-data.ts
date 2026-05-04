import { SITE_NAME, SITE_URL } from "./seo";

/**
 * JSON-LD structured data builders. Each returns a plain object that
 * the caller injects via <script type="application/ld+json"> on the
 * page that owns it.
 *
 * Schema choices reflect 2026 Google rich-result guidance:
 *   - Article on /blog/<slug>          (Top Stories eligibility)
 *   - BreadcrumbList on nested routes  (clean SERP path, ~10% CTR lift)
 *   - Person on /about (founder)       (Knowledge Graph "founded by")
 *   - SoftwareApplication site-wide    (already in layout.tsx; we beef it up)
 *
 * NOT shipped:
 *   - FAQPage - Google restricted FAQ rich results to government/health
 *     sites in 2023, so adding it for a SaaS product is wasted markup.
 */

export interface BreadcrumbItem {
  name: string;
  /** Project-relative path. Joined with SITE_URL to produce the absolute URL. */
  path: string;
}

export function breadcrumbList(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: `${SITE_URL}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

export interface ArticleSchemaInput {
  title: string;
  description: string;
  slug: string;
  /** ISO 8601 date string (YYYY-MM-DD or full timestamp). */
  publishedTime?: string;
  /** ISO 8601 date string. Falls back to publishedTime. */
  modifiedTime?: string;
  /** Optional author override; defaults to the SITE_NAME organization. */
  authorName?: string;
  /** Absolute or root-relative image URL. Defaults to the og.png card. */
  image?: string;
}

export function articleSchema(input: ArticleSchemaInput): Record<string, unknown> {
  const url = `${SITE_URL}/blog/${input.slug}`;
  const image = input.image
    ? input.image.startsWith("http")
      ? input.image
      : `${SITE_URL}${input.image}`
    : `${SITE_URL}/og.png`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    image,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    ...(input.publishedTime ? { datePublished: input.publishedTime } : {}),
    dateModified: input.modifiedTime ?? input.publishedTime ?? new Date().toISOString(),
    author: input.authorName
      ? {
          "@type": "Person",
          name: input.authorName,
        }
      : {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/consilium-icon.svg`,
      },
    },
  };
}

export interface PersonSchemaInput {
  name: string;
  url?: string;
  jobTitle?: string;
  worksForName?: string;
  sameAs?: string[];
  image?: string;
}

export function personSchema(input: PersonSchemaInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    ...(input.url ? { url: input.url } : {}),
    ...(input.jobTitle ? { jobTitle: input.jobTitle } : {}),
    ...(input.image
      ? {
          image: input.image.startsWith("http")
            ? input.image
            : `${SITE_URL}${input.image}`,
        }
      : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
    ...(input.worksForName
      ? {
          worksFor: {
            "@type": "Organization",
            name: input.worksForName,
            url: SITE_URL,
          },
        }
      : {}),
  };
}
