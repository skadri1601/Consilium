"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  ShieldCheck,
  Layers,
  GitBranch,
  Sparkles,
  History as HistoryIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { MarketingHero } from "@/components/shared/marketing-hero";

type Interval = "monthly" | "yearly";

interface Tier {
  id: "free" | "pro" | "max";
  name: string;
  eyebrow: string;
  priceMonthly: number;
  priceYearly: number;
  tagline: string;
  weeklyTokens: string;
  debateCap: string;
  cta: string;
  href: string;
  highlighted?: boolean;
  verified?: boolean;
  features: string[];
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    eyebrow: "Try the council",
    priceMonthly: 0,
    priceYearly: 0,
    tagline: "Room to explore multi-model deliberation before you commit.",
    weeklyTokens: "50K weighted tokens / week",
    debateCap: "5 debates / week · 20 / month",
    cta: "Get started",
    href: "/sign-up",
    features: [
      "3 deliberation modes",
      "Up to 2 models per debate",
      "All models available · free models don't count",
      "Web dashboard · 30-day history",
      "Basic CLI · no codebase context",
      "Wallet top-ups + optional on-demand",
      "Community support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    eyebrow: "Daily driver",
    priceMonthly: 29,
    priceYearly: 290,
    tagline: "For teams shipping real work with the council every day.",
    weeklyTokens: "500K weighted tokens / week",
    debateCap: "No debate cap · token-limited",
    cta: "Start with Pro",
    href: "/sign-up",
    highlighted: true,
    features: [
      "All 8 deliberation modes",
      "Full CLI with codebase context + slash commands",
      "MCP access for IDE + workflow integration",
      "Full analytics · diversity, quality, minority reports",
      "Custom templates · unlimited history + full-text search",
      "Markdown + JSON export · weekly digest",
      "Priority email support",
    ],
  },
  {
    id: "max",
    name: "Max",
    eyebrow: "Verified deliberation",
    priceMonthly: 99,
    priceYearly: 990,
    tagline: "Research-backed safety, transparency, and cost intelligence.",
    weeklyTokens: "2M weighted tokens / week",
    debateCap: "No debate cap · largest headroom",
    cta: "Upgrade to Max",
    href: "/sign-up",
    verified: true,
    features: [
      "Everything in Pro",
      "Conformal safety gate · intercepts 81.9% of wrong consensus",
      "Progressive deepening · stretch tokens 2–5× on easy questions",
      "Disagreement map · see exactly where models diverge",
      "Argument graph · interactive deliberation tree",
      "Debate collapse detection · flags sycophantic convergence",
      "Persistent project memory · context across sessions",
      "Decision audit trail · searchable reasoning history",
      "Parallel + batch CLI · PDF export · private RSS · direct REST API",
      "Founder-level support",
    ],
  },
];

const USAGE_STEPS = [
  {
    title: "Weekly allowance",
    description:
      "Each plan includes weighted tokens that reset on a rolling 7-day window from sign-up. No rollover.",
    accent: "warm",
  },
  {
    title: "Wallet credits",
    description:
      "Prepaid balance you top up when you want. Only tapped after your weekly allowance is exhausted. Credits expire 12 months after deposit (FIFO).",
    accent: "agree",
  },
  {
    title: "On-demand",
    description:
      "Optional auto-charge when weekly + wallet are empty. You set a monthly cap (default $25). Off by default.",
    accent: "dissent",
  },
];

const WEIGHTED_TOKENS = [
  {
    tier: "Free",
    weight: "0×",
    models: "Llama 3.3 / 3.1 / 4 (Groq)",
    note: "Don't count against allowance",
  },
  {
    tier: "Budget",
    weight: "0.1×",
    models: "Gemini Flash · GPT-4o-mini · Haiku · Grok-2-mini",
    note: "10× more usage per token",
  },
  {
    tier: "Mid",
    weight: "0.5×",
    models: "GPT-4.1 · o3-mini",
    note: "2× more usage per token",
  },
  {
    tier: "Standard",
    weight: "1×",
    models: "Sonnet · GPT-4o · Grok-2 · Gemini Pro",
    note: "Baseline",
  },
  {
    tier: "Premium",
    weight: "5×",
    models: "Opus",
    note: "Burns 5× faster",
  },
];

const COMPARISON: Array<{
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  max: string | boolean;
}> = [
  {
    feature: "Weekly weighted tokens",
    free: "50K",
    pro: "500K",
    max: "2M",
  },
  { feature: "Debate cap", free: "5/wk · 20/mo", pro: "None", max: "None" },
  {
    feature: "Deliberation modes",
    free: "3 basic",
    pro: "All 8",
    max: "All 8 + early access",
  },
  { feature: "Models per debate", free: "2", pro: "All", max: "All" },
  { feature: "Wallet top-ups", free: true, pro: true, max: true },
  { feature: "On-demand (opt-in)", free: true, pro: true, max: true },
  { feature: "Free models (don't count)", free: true, pro: true, max: true },
  { feature: "Bring your own API keys", free: true, pro: true, max: true },
  {
    feature: "Web dashboard",
    free: "History 30 days",
    pro: "Unlimited + search",
    max: "Unlimited + search",
  },
  {
    feature: "CLI",
    free: "Basic",
    pro: "Full + codebase context",
    max: "Parallel + batch",
  },
  { feature: "MCP access", free: false, pro: "Basic", max: "Full streaming" },
  {
    feature: "Templates",
    free: "3 starter",
    pro: "All + custom",
    max: "All + public share",
  },
  {
    feature: "Export",
    free: "Markdown",
    pro: "Markdown · JSON",
    max: "Markdown · JSON · PDF",
  },
  {
    feature: "Analytics",
    free: "Basic",
    pro: "Advanced",
    max: "+ cost optimization",
  },
  {
    feature: "Email digest",
    free: false,
    pro: "Weekly",
    max: "Weekly + daily",
  },
  { feature: "Private RSS feed", free: false, pro: false, max: true },
  { feature: "Direct REST API", free: false, pro: false, max: true },
  {
    feature: "Conformal safety gate",
    free: false,
    pro: false,
    max: true,
  },
  { feature: "Progressive deepening", free: false, pro: false, max: true },
  { feature: "Disagreement map", free: false, pro: false, max: true },
  { feature: "Argument graph", free: false, pro: false, max: true },
  { feature: "Debate collapse detection", free: false, pro: false, max: true },
  { feature: "Persistent project memory", free: false, pro: false, max: true },
  { feature: "Decision audit trail", free: false, pro: false, max: true },
  {
    feature: "Support",
    free: "Community",
    pro: "Priority email",
    max: "Founder access",
  },
];

const MAX_RESEARCH_FEATURES = [
  {
    icon: ShieldCheck,
    title: "Conformal safety gate",
    description:
      "Agreement among models isn't proof of correctness. A calibrated verification layer intercepts 81.9% of wrong consensus before it reaches you — results only ship with a 'verified' badge once confidence passes the threshold.",
    citation: "Wang et al., 2026 · arXiv 2604.07667",
  },
  {
    icon: Layers,
    title: "Progressive deepening",
    description:
      "Starts every debate on cheap models and only escalates to premium when models actually disagree. Saves 80–92% of tokens on easy questions — your weekly allowance stretches 2–5× further.",
    citation: "iMAD / RouteMoA · arXiv 2511.11306 · arXiv 2601.18130",
  },
  {
    icon: GitBranch,
    title: "Disagreement map",
    description:
      "A visual breakdown of exactly where and why models diverged — claim-by-claim, with each model's reasoning. No competitor surfaces divergence this transparently.",
    citation: "Zhu et al., 2026 · arXiv 2601.19921",
  },
  {
    icon: Sparkles,
    title: "Argument graph",
    description:
      "Interactive view of the deliberation tree — which arguments survived cross-examination, which were refuted, and the chain of reasoning from claim to conclusion.",
    citation: "TreeDebater · arXiv 2505.14886",
  },
  {
    icon: X,
    title: "Debate collapse detection",
    description:
      "Auto-detects when models sycophantically converge on wrong answers through social pressure. Flags false consensus with uncertainty scores before presenting results.",
    citation: "Tang et al., 2026 · arXiv 2602.07186",
  },
  {
    icon: HistoryIcon,
    title: "Persistent memory + audit trail",
    description:
      "Context carries across sessions — debates reference past decisions. Every deliberation is searchable later: 'why did we pick this approach?' returns the actual model arguments, votes, and dissent reports.",
    citation: "MAD-M2 · arXiv 2603.20215",
  },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-4 w-4 text-warm mx-auto" />;
  if (value === false) return <X className="h-4 w-4 text-ink-muted mx-auto" />;
  return <span className="text-[13px] text-ink-secondary">{value}</span>;
}

function IntervalToggle({
  interval,
  onChange,
}: {
  interval: Interval;
  onChange: (next: Interval) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-bg-1 p-1">
      <button
        type="button"
        onClick={() => onChange("monthly")}
        aria-pressed={interval === "monthly"}
        className={cn(
          "px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
          interval === "monthly"
            ? "bg-warm/14 text-warm"
            : "text-ink-tertiary hover:text-ink-primary",
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        aria-pressed={interval === "yearly"}
        className={cn(
          "px-4 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-[0.08em] transition-colors flex items-center gap-2",
          interval === "yearly"
            ? "bg-warm/14 text-warm"
            : "text-ink-tertiary hover:text-ink-primary",
        )}
      >
        Yearly
        <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-agree bg-agree/14 border border-agree/30 rounded-full px-1.5 py-0.5">
          2 months free
        </span>
      </button>
    </div>
  );
}

function TierCard({ tier, interval }: { tier: Tier; interval: Interval }) {
  const price = interval === "yearly" ? tier.priceYearly : tier.priceMonthly;
  const suffix =
    tier.id === "free" ? "/forever" : interval === "yearly" ? "/yr" : "/mo";
  const monthlyEquivalent =
    tier.id !== "free" && interval === "yearly"
      ? `$${(tier.priceYearly / 12).toFixed(2)}/mo billed annually`
      : null;

  return (
    <div
      className={cn(
        "relative surface-card p-6 flex flex-col h-full",
        tier.highlighted && "border-warm/40 bg-warm/6",
        tier.verified && "border-agree/30 bg-agree/4",
      )}
    >
      {(tier.highlighted || tier.verified) && (
        <span
          className={cn(
            "absolute -top-px left-0 h-px w-full",
            tier.highlighted ? "bg-warm" : "bg-agree",
          )}
        />
      )}
      {tier.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.12em] text-warm bg-bg-0 border border-warm/40 rounded-full px-3 py-1">
          Most popular
        </span>
      )}
      {tier.verified && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[9px] uppercase tracking-[0.12em] text-agree bg-bg-0 border border-agree/40 rounded-full px-3 py-1 inline-flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" />
          Verified
        </span>
      )}

      <div className="eyebrow">{tier.eyebrow}</div>
      <h3 className="font-display text-[28px] tracking-[-0.02em] text-ink-primary mt-2 font-light">
        {tier.name}
      </h3>
      <p className="text-[13px] text-ink-secondary mt-2 leading-[1.55]">
        {tier.tagline}
      </p>

      <div className="mt-5 pb-5 border-b border-white/[0.06]">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-[40px] tracking-[-0.02em] text-ink-primary font-light">
            ${price}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-tertiary">
            {suffix}
          </span>
        </div>
        {monthlyEquivalent && (
          <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary mt-1">
            {monthlyEquivalent}
          </p>
        )}
      </div>

      <div className="py-4 space-y-2">
        <div className="flex items-start gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary min-w-[72px]">
            Compute
          </span>
          <span className="text-[12px] text-ink-primary">
            {tier.weeklyTokens}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary min-w-[72px]">
            Debates
          </span>
          <span className="text-[12px] text-ink-primary">{tier.debateCap}</span>
        </div>
      </div>

      <ul className="space-y-2.5 mt-2 flex-1">
        {tier.features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-[13px] text-ink-secondary leading-[1.55]"
          >
            <Check className="h-3.5 w-3.5 mt-1 shrink-0 text-warm" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={tier.href}
        className={cn(
          "btn-consilium btn-consilium-lg justify-center mt-6",
          tier.highlighted || tier.verified
            ? "btn-consilium-primary"
            : "btn-consilium-ghost",
        )}
      >
        {tier.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function PricingPageClient() {
  const [interval, setInterval] = useState<Interval>("monthly");

  return (
    <div>
      <MarketingHero
        eyebrow="Pricing"
        title={
          <>
            Weighted tokens. <em>Transparent tiers.</em>
          </>
        }
        description={
          <>
            Subscription allowance, optional prepaid wallet, on-demand fallback.
            Free models never count. One plan covers web, CLI, and MCP.
          </>
        }
      />

      <section className="container mx-auto px-4 pb-20">
        <div className="flex justify-center mb-10">
          <IntervalToggle interval={interval} onChange={setInterval} />
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} interval={interval} />
          ))}
        </div>

        <p className="text-center text-[12px] text-ink-tertiary mt-8 max-w-2xl mx-auto">
          All tiers support wallet top-ups and opt-in on-demand. Wallet overages
          are billed at provider cost × 1.2 — no surprises, no subsidies.
        </p>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="eyebrow">How usage works</div>
            <h2 className="font-display text-[32px] tracking-[-0.02em] text-ink-primary font-light mt-2">
              Three sources. <em className="text-warm italic">No mixing.</em>
            </h2>
            <p className="text-[14px] text-ink-secondary mt-3 max-w-2xl mx-auto leading-[1.6]">
              Each deliberation draws from exactly one source. We never split a
              debate across allowance and wallet — full cost comes from the next
              available pool.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {USAGE_STEPS.map((step, i) => (
              <div key={step.title} className="surface-card p-5 relative">
                <span className="absolute top-5 right-5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                  0{i + 1}
                </span>
                <h3 className="font-display text-[18px] tracking-[-0.01em] text-ink-primary mt-1">
                  {step.title}
                </h3>
                <p className="text-[13px] text-ink-secondary mt-2 leading-[1.6]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="eyebrow">Weighted tokens</div>
            <h2 className="font-display text-[32px] tracking-[-0.02em] text-ink-primary font-light mt-2">
              Model choice stays flexible.
            </h2>
            <p className="text-[14px] text-ink-secondary mt-3 max-w-2xl mx-auto leading-[1.6]">
              Model weights normalize cost so your allowance behaves predictably
              regardless of which model you pick. A 15K raw-token debate on Opus
              deducts 75K weighted; the same debate on Gemini Flash deducts
              1.5K.
            </p>
          </div>

          <div className="overflow-x-auto rounded-[12px] border border-white/[0.08]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-bg-1">
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    Tier
                  </th>
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    Weight
                  </th>
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    Models
                  </th>
                  <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    Effect
                  </th>
                </tr>
              </thead>
              <tbody>
                {WEIGHTED_TOKENS.map((row) => (
                  <tr
                    key={row.tier}
                    className="border-b border-white/[0.04] last:border-0"
                  >
                    <td className="px-5 py-3 font-display text-[14px] tracking-[-0.01em] text-ink-primary">
                      {row.tier}
                    </td>
                    <td className="px-5 py-3 font-mono text-warm">
                      {row.weight}
                    </td>
                    <td className="px-5 py-3 text-ink-secondary">
                      {row.models}
                    </td>
                    <td className="px-5 py-3 text-ink-tertiary">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="eyebrow inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Max tier
            </div>
            <h2 className="font-display text-[32px] tracking-[-0.02em] text-ink-primary font-light mt-2">
              Verified deliberation,{" "}
              <em className="text-warm italic">not just more tokens.</em>
            </h2>
            <p className="text-[14px] text-ink-secondary mt-3 max-w-2xl mx-auto leading-[1.6]">
              Max bundles six research-backed features (2025–2026) that
              transform the council from a novelty into a decision system you
              can trust in production.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {MAX_RESEARCH_FEATURES.map(
              ({ icon: Icon, title, description, citation }) => (
                <div
                  key={title}
                  className="surface-card p-5 hover:border-agree/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4 text-agree" />
                    <h3 className="font-display text-[17px] tracking-[-0.01em] text-ink-primary">
                      {title}
                    </h3>
                  </div>
                  <p className="text-[13px] text-ink-secondary leading-[1.6]">
                    {description}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-tertiary mt-3">
                    {citation}
                  </p>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="eyebrow">Full comparison</div>
            <h2 className="font-display text-[32px] tracking-[-0.02em] text-ink-primary font-light mt-2">
              Every feature, every tier.
            </h2>
          </div>
          <div className="overflow-x-auto rounded-[12px] border border-white/[0.08]">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-white/[0.08] bg-bg-1">
                  <th className="text-left px-5 py-4 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    Feature
                  </th>
                  <th className="text-center px-5 py-4 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-tertiary">
                    Free
                  </th>
                  <th className="text-center px-5 py-4 font-mono text-[10px] uppercase tracking-[0.08em] text-warm">
                    Pro
                  </th>
                  <th className="text-center px-5 py-4 font-mono text-[10px] uppercase tracking-[0.08em] text-agree">
                    Max
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={cn(
                      "border-b border-white/[0.04]",
                      i % 2 === 0 && "bg-bg-1/40",
                    )}
                  >
                    <td className="px-5 py-3 text-ink-secondary">
                      {row.feature}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Cell value={row.free} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Cell value={row.pro} />
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Cell value={row.max} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-2xl mx-auto surface-card p-8 text-center">
          <div className="eyebrow">Questions</div>
          <h2 className="font-display text-[24px] tracking-[-0.01em] text-ink-primary mt-2 font-light">
            Need a custom arrangement?
          </h2>
          <p className="text-[14px] text-ink-secondary mt-3 leading-[1.6]">
            Volume pricing, bring-your-own deployment, or a specific compliance
            requirement — talk to us. We work with teams individually until
            Consilium has the traction for a formal Enterprise tier.
          </p>
          <Link
            href="/contact"
            className="btn-consilium btn-consilium-primary btn-consilium-lg mt-6 inline-flex"
          >
            Talk to us
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
