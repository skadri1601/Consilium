import Link from "next/link";
import type { Metadata } from "next";
import { buildMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbList } from "@/lib/structured-data";
import { blogPosts } from "@/app/(marketing)/blog/blog-data";
import { NOTION_DOCS } from "@/lib/notion";

/**
 * Human-readable sitemap. Mirrors the XML sitemap at /sitemap.xml but
 * is browseable, helps users recover from broken paths, and gives AI
 * crawlers an HTML index they can ingest without parsing XML.
 *
 * The route lists are duplicated from app/sitemap.ts deliberately so
 * we can group them under section headings - the XML sitemap is flat.
 * If sections drift, fix them here, not in the XML.
 */

export const metadata: Metadata = buildMetadata({
  title: "Sitemap",
  description:
    "Browseable index of every public page on Consilium - product, docs, blog, comparisons, and policy pages.",
  path: "/sitemap",
});

interface Group {
  heading: string;
  description: string;
  links: Array<{ href: string; title: string }>;
}

const productLinks: Group["links"] = [
  { href: "/", title: "Home" },
  { href: "/pricing", title: "Pricing" },
  { href: "/use-cases", title: "Use cases" },
  { href: "/faq", title: "FAQ" },
  { href: "/about", title: "About" },
  { href: "/research", title: "Research" },
  { href: "/contact", title: "Contact" },
];

const docsLinks: Group["links"] = [
  { href: "/docs", title: "Docs home" },
  { href: "/docs/getting-started", title: "Getting started" },
  { href: "/docs/how-it-works", title: "How it works" },
  { href: "/docs/modes", title: "Deliberation modes" },
  { href: "/docs/architecture", title: "Architecture" },
  { href: "/docs/api", title: "API reference" },
  { href: "/docs/cli", title: "CLI" },
  { href: "/docs/providers", title: "Providers" },
  { href: "/docs/templates", title: "Templates" },
  { href: "/docs/python-sdk", title: "Python SDK" },
  { href: "/docs/typescript-sdk", title: "TypeScript SDK" },
];

const comparisonLinks: Group["links"] = [
  { href: "/vs-cursor", title: "Consilium vs Cursor" },
  { href: "/vs-aider", title: "Consilium vs Aider" },
  { href: "/vs-cline", title: "Consilium vs Cline" },
  { href: "/vs-claude-code", title: "Consilium vs Claude Code" },
  { href: "/vs-copilot", title: "Consilium vs Copilot" },
];

const policyLinks: Group["links"] = [
  { href: "/privacy", title: "Privacy policy" },
  { href: "/terms", title: "Terms of service" },
];

const machineLinks: Group["links"] = [
  { href: "/sitemap.xml", title: "XML sitemap" },
  { href: "/feed.xml", title: "Blog RSS feed" },
  { href: "/llms.txt", title: "llms.txt - AI crawler index" },
  { href: "/llms-full.txt", title: "llms-full.txt - full corpus" },
  { href: "/robots.txt", title: "robots.txt" },
];

const blogLinks: Group["links"] = [...blogPosts]
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((post) => ({
    href: `/blog/${post.slug}`,
    title: `${post.title} (${post.date})`,
  }));

const notionDocsLinks: Group["links"] = Object.keys(NOTION_DOCS).map(
  (slug) => ({
    href: `/docs/notion/${slug}`,
    title: slug.replace(/[-_]/g, " "),
  }),
);

const groups: Group[] = [
  {
    heading: "Product",
    description: "Marketing and informational pages.",
    links: productLinks,
  },
  {
    heading: "Documentation",
    description: "Setup guides, API reference, and SDK docs.",
    links: docsLinks,
  },
  {
    heading: "Comparisons",
    description: "How Consilium compares to other AI tools.",
    links: comparisonLinks,
  },
  {
    heading: "Blog",
    description: "Engineering, research, product, and benchmark writing.",
    links: blogLinks,
  },
  ...(notionDocsLinks.length
    ? [
        {
          heading: "Notion docs",
          description: "Synced Notion documentation pages.",
          links: notionDocsLinks,
        },
      ]
    : []),
  {
    heading: "Policy",
    description: "Legal and privacy pages.",
    links: policyLinks,
  },
  {
    heading: "Machine-readable indexes",
    description: "XML, RSS, and AI-crawler index files.",
    links: machineLinks,
  },
];

const breadcrumbs = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Sitemap", path: "/sitemap" },
]);

export default function SitemapPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-sitemap-breadcrumbs" data={breadcrumbs} />
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {SITE_NAME} sitemap
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            Every public page on {SITE_URL.replace(/^https?:\/\//, "")}, grouped
            for browsing. The machine-readable XML sitemap lives at{" "}
            <Link
              className="underline hover:text-foreground"
              href="/sitemap.xml"
            >
              /sitemap.xml
            </Link>
            .
          </p>

          {groups.map((group) => (
            <div key={group.heading} className="mb-10">
              <h2 className="text-xl font-semibold mb-2">{group.heading}</h2>
              <p className="text-sm text-muted-foreground mb-3">
                {group.description}
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {group.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="underline-offset-4 hover:underline hover:text-foreground"
                    >
                      {l.title}
                    </Link>{" "}
                    <span className="text-xs text-muted-foreground/60">
                      {l.href}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
