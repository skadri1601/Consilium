import Link from "next/link";
import type { Metadata } from "next";
import { Check, X, Calculator, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { buildMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";

const PRICING_URL = `${SITE_URL}/pricing`;
const ORGANIZATION_ID = `${SITE_URL}#organization`;
const SOFTWARE_ID = `${SITE_URL}#software`;

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": `${PRICING_URL}#product`,
  name: SITE_NAME,
  description:
    "Governance and deliberation infrastructure for the agent economy. Policy enforcement, quorum voting, risk scoring, and compliance-grade audit trails across 7 LLM providers.",
  brand: { "@id": ORGANIZATION_ID },
  isRelatedTo: { "@id": SOFTWARE_ID },
  url: PRICING_URL,
  image: `${SITE_URL}/og.png`,
  offers: [
    {
      "@type": "Offer",
      "@id": `${PRICING_URL}#offer-free`,
      name: "Free + BYOK",
      description:
        "Free governance API with BYOK. 5 deliberations per week (20 per month), audit trails, and risk scoring with your own API keys.",
      price: "0",
      priceCurrency: "USD",
      url: `${SITE_URL}/sign-up`,
      availability: "https://schema.org/InStock",
      category: "free",
      eligibleCustomerType: "https://schema.org/Enduser",
    },
    {
      "@type": "Offer",
      "@id": `${PRICING_URL}#offer-pro`,
      name: "Pro",
      description:
        "For teams deploying AI agents. Governance policies, quorum voting, decision history, and priority support.",
      price: "29",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "29",
        priceCurrency: "USD",
        billingDuration: "P1M",
        unitText: "month",
      },
      availability: "https://schema.org/PreOrder",
      url: PRICING_URL,
      category: "subscription",
      eligibleCustomerType: "https://schema.org/Enduser",
    },
    {
      "@type": "Offer",
      "@id": `${PRICING_URL}#offer-max`,
      name: "Max",
      description:
        "Verified deliberation tier. Conformal safety gate, progressive deepening, debate collapse detection, persistent project memory, searchable audit trail, and SLA-backed uptime.",
      price: "99",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "99",
        priceCurrency: "USD",
        billingDuration: "P1M",
        unitText: "month",
      },
      availability: "https://schema.org/PreOrder",
      url: PRICING_URL,
      category: "subscription",
      eligibleCustomerType: "https://schema.org/Enduser",
    },
  ],
};

export const metadata: Metadata = buildMetadata({
  title: "Pricing",
  description:
    "Agent governance infrastructure with BYOK. Compare Free, Pro, and Max plans for policy enforcement, risk scoring, and compliance audit trails.",
  path: "/pricing",
  keywords: [
    "consilium pricing",
    "agent governance pricing",
    "byok",
    "ai compliance pricing",
  ],
});

const tiers = [
  {
    name: "Free + BYOK",
    price: "$0",
    period: "/forever",
    description: "Free governance API with BYOK - pay only providers",
    comingSoon: false,
    features: [
      "5 deliberations/week, 20/month",
      "2 models per deliberation",
      "3 basic deliberation modes",
      "3 governance templates",
      "Streaming support",
      "Basic audit trail",
      "Risk scoring (basic)",
      "Basic analytics (30-day history)",
      "Community support",
      "Markdown export",
      "All models via BYOK",
      "Wallet top-up available",
    ],
    cta: "Get Started Free",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    yearlyPrice: "$290/yr",
    description: "For teams deploying AI agents in production",
    comingSoon: true,
    features: [
      "Unlimited deliberations",
      "5+ models per deliberation",
      "All 8 deliberation modes",
      "All 8 governance templates + custom",
      "500K weighted tokens/week included",
      "Governance policies (up to 25)",
      "Quorum voting",
      "Risk scoring + trend tracking",
      "Full compliance audit trail",
      "Decision history + full-text search",
      "MCP integration (6 tools)",
      "SDK access (TypeScript & Python)",
      "Full CLI with codebase context",
      "Advanced analytics + diversity scores",
      "Priority email support",
      "JSON + Markdown export",
      "99.9% SLA",
    ],
    cta: "Coming Soon",
    href: "#",
    highlighted: true,
  },
  {
    name: "Max",
    price: "$99",
    period: "/mo",
    yearlyPrice: "$990/yr",
    description: "Verified deliberation with research-backed trust features",
    comingSoon: true,
    features: [
      "Everything in Pro",
      "2M weighted tokens/week included",
      "Unlimited models per debate",
      "Parallel & batch CLI mode",
      "REST API access for automation",
      "Conformal safety gate (81.9% wrong consensus caught)",
      "Progressive deepening (80-92% token savings)",
      "Debate collapse detection",
      "Disagreement map visualization",
      "Argument graph (interactive)",
      "Persistent project memory",
      "Decision audit trail (searchable)",
      "Daily + weekly digest options",
      "Direct founder support",
      "PDF + JSON + Markdown export",
    ],
    cta: "Coming Soon",
    href: "#",
    highlighted: false,
  },
];

const comparisonFeatures = [
  {
    feature: "Weekly compute",
    free: "50K weighted tokens",
    pro: "500K weighted tokens",
    max: "2M weighted tokens",
  },
  {
    feature: "Debates",
    free: "5/week, 20/month",
    pro: "Unlimited",
    max: "Unlimited",
  },
  { feature: "Models per debate", free: "2", pro: "5+", max: "Unlimited" },
  {
    feature: "Deliberation modes",
    free: "3 basic",
    pro: "All 8",
    max: "All 8 + early access",
  },
  {
    feature: "Templates",
    free: "3 starter",
    pro: "All 8 + custom",
    max: "All + share publicly",
  },
  {
    feature: "CLI",
    free: "Basic",
    pro: "Full + codebase context",
    max: "Full + parallel/batch",
  },
  { feature: "MCP", free: false, pro: true, max: "Full + streaming" },
  { feature: "SDK access", free: false, pro: true, max: true },
  { feature: "REST API", free: false, pro: false, max: true },
  { feature: "BYOK (own API keys)", free: true, pro: true, max: true },
  { feature: "Wallet top-up", free: true, pro: true, max: true },
  { feature: "On-demand charging", free: true, pro: true, max: true },
  { feature: "Streaming", free: true, pro: true, max: true },
  {
    feature: "Audit trail",
    free: "Basic",
    pro: "Full",
    max: "Full + searchable",
  },
  {
    feature: "Analytics",
    free: "Basic",
    pro: "Advanced",
    max: "Advanced + replay",
  },
  {
    feature: "History",
    free: "30 days",
    pro: "Unlimited + search",
    max: "Unlimited + API",
  },
  { feature: "Conformal safety gate", free: false, pro: false, max: true },
  { feature: "Progressive deepening", free: false, pro: false, max: true },
  { feature: "Debate collapse detection", free: false, pro: false, max: true },
  { feature: "Disagreement map", free: false, pro: false, max: true },
  { feature: "Argument graph", free: false, pro: false, max: true },
  { feature: "Persistent memory", free: false, pro: false, max: true },
  {
    feature: "Support",
    free: "Community",
    pro: "Priority email",
    max: "Founder access",
  },
  { feature: "SLA", free: "None", pro: "99.9%", max: "99.9%" },
];

const modelPricing = [
  {
    provider: "Anthropic",
    models: [
      { name: "Claude Opus 4.7", input: "$5.00", output: "$25.00" },
      { name: "Claude Opus 4.6", input: "$5.00", output: "$25.00" },
      { name: "Claude Sonnet 4.6", input: "$3.00", output: "$15.00" },
      { name: "Claude Haiku 4.5", input: "$1.00", output: "$5.00" },
    ],
  },
  {
    provider: "OpenAI",
    models: [
      { name: "GPT-5.5 Pro", input: "$8.00", output: "$32.00" },
      { name: "GPT-5.5", input: "$3.00", output: "$12.00" },
      { name: "GPT-5.4", input: "$2.00", output: "$8.00" },
      { name: "GPT-5.4 Mini", input: "$0.20", output: "$0.80" },
      { name: "GPT-5.4 Nano", input: "$0.08", output: "$0.30" },
    ],
  },
  {
    provider: "Google",
    models: [
      { name: "Gemini 3.1 Pro", input: "$1.25", output: "$5.00" },
      { name: "Gemini 3 Flash", input: "$0.15", output: "$0.60" },
      { name: "Gemini 3.1 Flash-Lite", input: "$0.05", output: "$0.20" },
    ],
  },
  {
    provider: "Groq",
    models: [
      { name: "Llama 3.1 8B Instant", input: "Free*", output: "Free*" },
      { name: "Llama 3.3 70B Versatile", input: "Free*", output: "Free*" },
      { name: "GPT-OSS 120B (via Groq)", input: "$0.15", output: "$0.60" },
      { name: "GPT-OSS 20B (via Groq)", input: "$0.05", output: "$0.15" },
      { name: "Groq Compound", input: "$0.80", output: "$1.60" },
      { name: "Groq Compound Mini", input: "$0.30", output: "$0.60" },
    ],
  },
  {
    provider: "xAI",
    models: [
      { name: "Grok 4.20", input: "$3.00", output: "$15.00" },
      { name: "Grok 4.1 Fast (reasoning)", input: "$1.00", output: "$4.00" },
      {
        name: "Grok 4.1 Fast (non-reasoning)",
        input: "$0.50",
        output: "$2.00",
      },
      { name: "Grok Code Fast", input: "$0.30", output: "$1.20" },
    ],
  },
  {
    provider: "Moonshot",
    models: [{ name: "Kimi K2.6", input: "$1.20", output: "$2.50" }],
  },
  {
    provider: "OpenRouter (free tier)",
    models: [
      { name: "Gemma 4 26B (free)", input: "Free", output: "Free" },
      { name: "Gemma 4 31B (free)", input: "Free", output: "Free" },
      { name: "Qwen3 Coder (free)", input: "Free", output: "Free" },
      { name: "Nemotron 3 Super 120B (free)", input: "Free", output: "Free" },
      { name: "Ling 2.6 1T (free)", input: "Free", output: "Free" },
    ],
  },
];

const costExamples = [
  {
    label: "Quick question with GPT-5.4 Mini",
    cost: "~$0.001",
    detail: "1 round, 1 model",
  },
  {
    label: "Council mode with 3 premium models",
    cost: "~$0.05 - $0.15",
    detail: "3 rounds, 3 models",
  },
  {
    label: "Deep mode with 5 models",
    cost: "~$0.20 - $0.50",
    detail: "5 rounds, 5 models + sub-agents",
  },
  {
    label: "Any mode with Groq models",
    cost: "$0.00",
    detail: "Llama models are free",
  },
];

const costFormulas = [
  { mode: "Quick", formula: "1 call per model" },
  { mode: "Council", formula: "num_models * 3 rounds" },
  { mode: "Deep", formula: "num_models * 5 rounds" },
  { mode: "Red Team", formula: "num_models * 3 phases" },
  { mode: "Jury", formula: "num_models * 3 rounds + dissent" },
  { mode: "Market", formula: "num_models * 2 rounds + aggregation" },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true)
    return <Check className="h-4 w-4 text-indigo-400 mx-auto" />;
  if (value === false)
    return <X className="h-4 w-4 text-neutral-600 mx-auto" />;
  return <span>{value}</span>;
}

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-pricing-product" data={productJsonLd} />
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Start free. Scale when you need to.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={
                tier.highlighted
                  ? "border-indigo-500/50 bg-gradient-to-b from-indigo-500/10 to-transparent relative"
                  : ""
              }
            >
              {tier.comingSoon && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                {"yearlyPrice" in tier && tier.yearlyPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    or {tier.yearlyPrice} (2 months free)
                  </p>
                )}
                <CardDescription className="mt-2">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tier.comingSoon ? (
                  <span className="flex h-11 w-full items-center justify-center rounded-md border border-neutral-700 bg-neutral-800/50 text-sm font-medium text-neutral-400 cursor-not-allowed">
                    Coming Soon
                  </span>
                ) : (
                  <Link
                    href={tier.href}
                    className={
                      tier.highlighted
                        ? "flex h-11 w-full items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl"
                        : "flex h-11 w-full items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    }
                  >
                    {tier.cta}
                  </Link>
                )}
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-indigo-400" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Detailed Feature Comparison
          </h2>
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/80">
                  <th className="text-left px-6 py-4 font-semibold">Feature</th>
                  <th className="text-center px-6 py-4 font-semibold">
                    Free + BYOK
                  </th>
                  <th className="text-center px-6 py-4 font-semibold text-indigo-400">
                    Pro
                  </th>
                  <th className="text-center px-6 py-4 font-semibold text-purple-400">
                    Max
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-neutral-800/50 ${i % 2 === 0 ? "bg-neutral-900/30" : ""}`}
                  >
                    <td className="px-6 py-3 text-muted-foreground">
                      {row.feature}
                    </td>
                    <td className="px-6 py-3 text-center text-muted-foreground">
                      <CellValue value={row.free} />
                    </td>
                    <td className="px-6 py-3 text-center text-muted-foreground">
                      <CellValue value={row.pro} />
                    </td>
                    <td className="px-6 py-3 text-center text-muted-foreground">
                      <CellValue value={row.max} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Model Cost Reference
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            These are provider costs per 1M tokens, not Consilium charges.
            Consilium adds zero markup.
          </p>
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/80">
                  <th className="text-left px-6 py-4 font-semibold">
                    Provider
                  </th>
                  <th className="text-left px-6 py-4 font-semibold">Model</th>
                  <th className="text-right px-6 py-4 font-semibold">
                    Input / 1M tokens
                  </th>
                  <th className="text-right px-6 py-4 font-semibold">
                    Output / 1M tokens
                  </th>
                </tr>
              </thead>
              <tbody>
                {modelPricing.map((group) =>
                  group.models.map((model, i) => (
                    <tr
                      key={model.name}
                      className="border-b border-neutral-800/50"
                    >
                      <td className="px-6 py-3 font-medium">
                        {i === 0 ? group.provider : ""}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {model.name}
                      </td>
                      <td
                        className={`px-6 py-3 text-right ${model.input === "Free" ? "text-green-400 font-medium" : "text-muted-foreground"}`}
                      >
                        {model.input}
                      </td>
                      <td
                        className={`px-6 py-3 text-right ${model.output === "Free" ? "text-green-400 font-medium" : "text-muted-foreground"}`}
                      >
                        {model.output}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">Cost Examples</h2>
            </div>
            <div className="space-y-4">
              {costExamples.map((example) => (
                <div
                  key={example.label}
                  className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{example.label}</span>
                    <span
                      className={`text-sm font-bold ${example.cost === "$0.00" ? "text-green-400" : "text-indigo-400"}`}
                    >
                      {example.cost}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {example.detail}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <Calculator className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">Cost Estimation Formula</h2>
            </div>
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-6 mb-6">
              <code className="text-sm text-indigo-300">
                estimated_cost = num_api_calls * estimated_tokens *
                cost_per_token
              </code>
            </div>
            <div className="space-y-3">
              {costFormulas.map((item) => (
                <div
                  key={item.mode}
                  className="flex items-center justify-between rounded-lg border border-neutral-800/50 px-4 py-3"
                >
                  <span className="text-sm font-medium">{item.mode}</span>
                  <code className="text-xs text-muted-foreground">
                    {item.formula}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-2xl mx-auto rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Need a custom arrangement?</h2>
          <p className="text-muted-foreground mb-6">
            Volume pricing, specific compliance requirements, or a private
            deployment - talk to us. We work with teams individually until
            Consilium has the traction for a formal Enterprise tier.
          </p>
          <Link
            href="/contact"
            className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl"
          >
            Talk to us
          </Link>
        </div>
      </section>
    </div>
  );
}
