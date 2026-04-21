import Link from "next/link";
import type { Metadata } from "next";
import { Check, X, Github, Calculator, Zap } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Pricing",
  description:
    "Bring your own API keys and only pay the model providers. Consilium is free, open-source, and self-hostable. Compare Free, Pro, and Max plans.",
  path: "/pricing",
  keywords: [
    "consilium pricing",
    "ai council pricing",
    "byok",
    "free ai debate",
  ],
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    description: "Perfect for trying out AI deliberation",
    features: [
      "50 deliberations per month",
      "3 models per debate",
      "All 8 deliberation modes",
      "All 6 vertical templates",
      "Streaming support",
      "Basic audit trail",
      "Basic analytics",
      "Community support",
      "Export to Markdown",
    ],
    cta: "Get Started",
    href: "/sign-up",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    description: "For developers and teams shipping with AI",
    features: [
      "Unlimited deliberations",
      "5+ models per debate",
      "All 8 deliberation modes",
      "All 6 vertical templates",
      "Streaming support",
      "Full audit trail",
      "Advanced analytics",
      "Priority support",
      "Full API access",
      "CLI access",
      "SDK access (TypeScript & Python)",
      "Custom export formats",
      "99.9% SLA",
    ],
    cta: "Start Free Trial",
    href: "/sign-up",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations with advanced needs",
    features: [
      "Unlimited deliberations",
      "Unlimited models per debate",
      "All 8 modes + custom modes",
      "All 6 templates + custom templates",
      "Streaming support",
      "Full audit trail + export",
      "Advanced + custom analytics",
      "Dedicated support",
      "Full API access",
      "CLI access",
      "SDK access (TypeScript & Python)",
      "SSO / SAML",
      "On-premise managed deployment",
      "99.99% SLA",
    ],
    cta: "Contact Us",
    href: "/contact",
    highlighted: false,
  },
];

const comparisonFeatures = [
  {
    feature: "Deliberations / month",
    free: "50",
    pro: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Models per debate",
    free: "3",
    pro: "5+",
    enterprise: "Unlimited",
  },
  {
    feature: "Deliberation modes",
    free: "All 8",
    pro: "All 8",
    enterprise: "All 8 + custom",
  },
  {
    feature: "Vertical templates",
    free: "All 6",
    pro: "All 6",
    enterprise: "All 6 + custom",
  },
  { feature: "API access", free: "Limited", pro: true, enterprise: true },
  { feature: "CLI access", free: false, pro: true, enterprise: true },
  { feature: "SDK access", free: false, pro: true, enterprise: true },
  { feature: "Streaming", free: true, pro: true, enterprise: true },
  {
    feature: "Audit trail",
    free: "Basic",
    pro: "Full",
    enterprise: "Full + export",
  },
  {
    feature: "Analytics",
    free: "Basic",
    pro: "Advanced",
    enterprise: "Advanced + custom",
  },
  {
    feature: "Support",
    free: "Community",
    pro: "Priority",
    enterprise: "Dedicated",
  },
  { feature: "SSO / SAML", free: false, pro: false, enterprise: true },
  {
    feature: "On-premise",
    free: "Self-host only",
    pro: "Self-host only",
    enterprise: "Managed",
  },
  {
    feature: "SLA",
    free: "None",
    pro: "99.9%",
    enterprise: "99.99%",
  },
];

const modelPricing = [
  {
    provider: "Anthropic",
    models: [
      { name: "Claude Opus 4.6", input: "$15.00", output: "$75.00" },
      { name: "Claude Sonnet 4.5", input: "$3.00", output: "$15.00" },
      { name: "Claude Haiku 4.5", input: "$0.80", output: "$4.00" },
    ],
  },
  {
    provider: "OpenAI",
    models: [
      { name: "GPT-4o", input: "$2.50", output: "$10.00" },
      { name: "GPT-4o-mini", input: "$0.15", output: "$0.60" },
      { name: "GPT-4.1", input: "$2.00", output: "$8.00" },
      { name: "o3-mini", input: "$1.10", output: "$4.40" },
    ],
  },
  {
    provider: "Google",
    models: [
      { name: "Gemini 2.0 Flash", input: "$0.10", output: "$0.40" },
      { name: "Gemini 2.5 Flash", input: "$0.15", output: "$0.60" },
      { name: "Gemini 2.5 Pro", input: "$1.25", output: "$10.00" },
    ],
  },
  {
    provider: "Groq (Free)",
    models: [
      { name: "Llama 3.1 8B", input: "Free", output: "Free" },
      { name: "Llama 3.3 70B", input: "Free", output: "Free" },
      { name: "Llama 4 Scout", input: "Free", output: "Free" },
    ],
  },
  {
    provider: "xAI",
    models: [
      { name: "Grok 2", input: "$2.00", output: "$10.00" },
      { name: "Grok 2 Mini", input: "$0.30", output: "$1.00" },
    ],
  },
];

const costExamples = [
  {
    label: "Quick question with GPT-4o-mini",
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
  if (value === true) return <Check className="h-4 w-4 text-warm mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-ink-muted mx-auto" />;
  return <span>{value}</span>;
}

export default function PricingPage() {
  return (
    <div>
      <section className="pt-28 pb-16 border-b border-white/[0.08]">
        <div className="container-narrow">
          <div className="eyebrow mb-5">Pricing</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            Simple. <em>Transparent.</em>
            <br />
            Self-host for free.
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-ink-secondary">
            Start free. Scale when you need to. Self-host anytime. You pay the
            LLM providers directly — Consilium adds zero markup.
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
                  ? "border-warm/30 bg-gradient-to-b from-warm/12 to-transparent relative"
                  : ""
              }
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-warm hover:bg-warm-bright px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <CardDescription className="mt-2">
                  {tier.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link
                  href={tier.href}
                  className={
                    tier.highlighted
                      ? "flex h-11 w-full items-center justify-center rounded-md bg-warm hover:bg-warm-bright text-sm font-medium text-white shadow-lg transition-all  hover:shadow-xl"
                      : "flex h-11 w-full items-center justify-center rounded-md border border-input bg-background text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                  }
                >
                  {tier.cta}
                </Link>
                <ul className="mt-8 space-y-3">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-warm" />
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
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-bg-1">
                  <th className="text-left px-6 py-4 font-semibold">Feature</th>
                  <th className="text-center px-6 py-4 font-semibold">Free</th>
                  <th className="text-center px-6 py-4 font-semibold text-warm">
                    Pro
                  </th>
                  <th className="text-center px-6 py-4 font-semibold">
                    Enterprise
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-white/[0.06] ${i % 2 === 0 ? "bg-bg-1/60" : ""}`}
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
                      <CellValue value={row.enterprise} />
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
          <div className="overflow-x-auto rounded-xl border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-bg-1">
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
                      className="border-b border-white/[0.06]"
                    >
                      <td className="px-6 py-3 font-medium">
                        {i === 0 ? group.provider : ""}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {model.name}
                      </td>
                      <td
                        className={`px-6 py-3 text-right ${model.input === "Free" ? "text-agree font-medium" : "text-muted-foreground"}`}
                      >
                        {model.input}
                      </td>
                      <td
                        className={`px-6 py-3 text-right ${model.output === "Free" ? "text-agree font-medium" : "text-muted-foreground"}`}
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
              <Zap className="h-6 w-6 text-warm" />
              <h2 className="text-2xl font-bold">Cost Examples</h2>
            </div>
            <div className="space-y-4">
              {costExamples.map((example) => (
                <div
                  key={example.label}
                  className="rounded-lg border border-white/[0.08] bg-bg-1 p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{example.label}</span>
                    <span
                      className={`text-sm font-bold ${example.cost === "$0.00" ? "text-agree" : "text-warm"}`}
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
              <Calculator className="h-6 w-6 text-warm" />
              <h2 className="text-2xl font-bold">Cost Estimation Formula</h2>
            </div>
            <div className="rounded-lg border border-white/[0.08] bg-bg-1 p-6 mb-6">
              <code className="text-sm text-warm-bright">
                estimated_cost = num_api_calls * estimated_tokens *
                cost_per_token
              </code>
            </div>
            <div className="space-y-3">
              {costFormulas.map((item) => (
                <div
                  key={item.mode}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] px-4 py-3"
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
        <div className="max-w-2xl mx-auto rounded-2xl border border-white/[0.08] bg-bg-1 p-8 text-center">
          <Github className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Self-Host for Free</h2>
          <p className="text-muted-foreground mb-6">
            Consilium is MIT licensed. Deploy on your own infrastructure with
            Docker Compose and keep full control of your data. You only pay for
            LLM provider API calls — Consilium adds zero markup.
          </p>
          <Link
            href="https://github.com/skadri1601/Consilium"
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center rounded-md bg-warm hover:bg-warm-bright px-8 text-sm font-medium text-white shadow-lg transition-all  hover:shadow-xl"
          >
            <Github className="mr-2 h-4 w-4" />
            View Self-Hosting Guide
          </Link>
        </div>
      </section>
    </div>
  );
}
