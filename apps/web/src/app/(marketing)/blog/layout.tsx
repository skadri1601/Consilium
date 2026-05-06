import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbList } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Writing on multi-AI deliberation, prompt engineering, LLM evaluation, and the research behind the Consilium debate engine.",
  path: "/blog",
});

const breadcrumbs = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Blog", path: "/blog" },
]);

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd id="ld-blog-breadcrumbs" data={breadcrumbs} />
      {children}
    </>
  );
}
