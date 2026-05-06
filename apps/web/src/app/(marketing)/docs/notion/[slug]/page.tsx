import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { NOTION_DOCS, fetchNotionPage } from "@/lib/notion";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 3600;

export function generateStaticParams() {
  return Object.keys(NOTION_DOCS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pageId = NOTION_DOCS[slug];
  if (!pageId) {
    return {
      title: "Not found",
      robots: { index: false, follow: false },
    };
  }
  const { title } = await fetchNotionPage(pageId);
  return buildMetadata({
    title,
    description: `${title} - Consilium documentation.`,
    path: `/docs/notion/${slug}`,
  });
}

export default async function NotionDocPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pageId = NOTION_DOCS[slug];
  if (!pageId) notFound();

  const { title, html } = await fetchNotionPage(pageId);

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Documentation
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            {title}
          </h1>
        </div>
      </section>
      <section className="container mx-auto px-4 pb-24">
        <div
          className="max-w-5xl mx-auto"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
    </div>
  );
}
