import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { PricingPageClient } from "./pricing-ui";

export const metadata: Metadata = buildMetadata({
  title: "Pricing",
  description:
    "Weighted tokens, optional prepaid wallet, and on-demand fallback. Transparent tiers across Free, Pro, and Max — one plan for web, CLI, and MCP.",
  path: "/pricing",
  keywords: [
    "consilium pricing",
    "ai council pricing",
    "weighted tokens",
    "llm deliberation pricing",
  ],
});

export default function PricingPage() {
  return <PricingPageClient />;
}
