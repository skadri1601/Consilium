import { fetchNotionPage } from "@/lib/notion";

export async function NotionPage({ pageId }: { pageId: string }) {
  const { title, html } = await fetchNotionPage(pageId);

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            {title}
          </h1>
        </div>
      </section>
      <section className="container mx-auto px-4 pb-24">
        <div
          className="max-w-5xl mx-auto prose prose-invert"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </section>
    </div>
  );
}
