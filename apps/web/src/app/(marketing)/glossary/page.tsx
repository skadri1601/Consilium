import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbList, definedTermSetSchema } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Glossary",
  description:
    "The Consilium glossary defines the voting methods, convergence metrics, and deliberation modes the multi-AI council uses to reach consensus. Each term links to its authoritative reference where available.",
  path: "/glossary",
  keywords: [
    "consilium glossary",
    "condorcet method",
    "borda count",
    "ranked pairs",
    "kendall tau",
    "jaccard similarity",
    "convergence detection",
    "multi-agent deliberation",
    "byok",
    "golden prompt",
  ],
});

type GlossaryTerm = {
  term: string;
  description: string;
  sameAs?: string;
};

const terms: GlossaryTerm[] = [
  {
    term: "Condorcet method",
    description:
      "A voting method where the winner is the candidate that beats every other candidate in pairwise comparison. Used in Consilium council and jury modes.",
    sameAs: "https://www.wikidata.org/wiki/Q913033",
  },
  {
    term: "Borda count",
    description:
      "A ranked voting method that assigns descending point values to candidates based on their ranked position. Used in Consilium jury mode for confidence-weighted scoring.",
    sameAs: "https://www.wikidata.org/wiki/Q485003",
  },
  {
    term: "Ranked pairs",
    description:
      "A Condorcet method that locks pairwise majorities by margin without creating cycles. Used by Consilium for tiebreak resolution.",
    sameAs: "https://www.wikidata.org/wiki/Q1854051",
  },
  {
    term: "Copeland scoring",
    description:
      "A voting method where each candidate's score is wins minus losses across pairwise comparisons. Used as a comparative ranking signal.",
    sameAs: "https://www.wikidata.org/wiki/Q1131142",
  },
  {
    term: "Kendall tau distance",
    description:
      "A metric for measuring ranking correlation between rounds. Consilium uses it as 40% of its convergence score.",
    sameAs: "https://www.wikidata.org/wiki/Q1740249",
  },
  {
    term: "Jaccard similarity",
    description:
      "A set-similarity coefficient measuring proposal content overlap. Consilium uses it as 35% of its convergence score.",
    sameAs: "https://www.wikidata.org/wiki/Q1196549",
  },
  {
    term: "Convergence detection",
    description:
      "The combined ranking-correlation, proposal-overlap, and concession-rate score Consilium uses to decide when deliberation has reached consensus (threshold >= 0.85).",
  },
  {
    term: "Concession rate",
    description:
      "The proportion of debate turns where an agent yields to another's argument. Consilium uses it as 25% of its convergence score.",
  },
  {
    term: "Golden prompt",
    description:
      "The synthesized consensus answer Consilium produces at the end of a deliberation, with confidence scores and dissent reports attached.",
  },
  {
    term: "BYOK (Bring Your Own Keys)",
    description:
      "A model where the user supplies provider API keys directly to the platform. Consilium adds zero markup to provider pricing under BYOK.",
  },
  {
    term: "Multi-agent deliberation",
    description:
      "A process where multiple AI agents propose, challenge, and refine claims before voting on a consensus answer. ICML 2024 research shows it improves factual accuracy by 8-15% over single-model responses.",
  },
  {
    term: "Red team mode",
    description:
      "A Consilium deliberation mode that runs adversarial attacks across 8 categories to surface vulnerabilities in a proposed answer.",
  },
  {
    term: "Jury mode",
    description:
      "A Consilium deliberation mode that mandates dissent capture - minority opinions are required output, not just majority consensus.",
  },
  {
    term: "Market mode",
    description:
      "A Consilium deliberation mode using prediction-market mechanics to aggregate probability-weighted answers across models.",
  },
  {
    term: "Council mode",
    description:
      "Consilium's default 3-round deliberation mode with cross-examination phases between propose/challenge/synthesize.",
    sameAs: "https://www.wikidata.org/wiki/Q193292",
  },
  {
    term: "Deep mode",
    description:
      "A Consilium deliberation mode that spawns 5 rounds with sub-agents researching specific points raised in debate.",
  },
  {
    term: "Blind mode",
    description:
      "A Consilium deliberation mode that strips model identity before voting to eliminate brand bias from the consensus.",
  },
];

function slugify(term: string): string {
  return term
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const glossarySchema = definedTermSetSchema({
  name: "Consilium glossary",
  path: "/glossary",
  description:
    "Voting methods, convergence metrics, and deliberation modes used by the Consilium multi-AI council.",
  terms: terms.map((t) => ({
    term: t.term,
    description: t.description,
    url: `#${slugify(t.term)}`,
    sameAs: t.sameAs,
  })),
});

const breadcrumbs = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Glossary", path: "/glossary" },
]);

export default function GlossaryPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-glossary" data={glossarySchema} />
      <JsonLd id="ld-glossary-breadcrumbs" data={breadcrumbs} />

      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Docs
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Glossary</h1>
          <p
            data-speakable
            className="text-xl text-muted-foreground leading-relaxed"
          >
            The Consilium glossary defines the voting methods, convergence
            metrics, and deliberation modes the multi-AI council uses to reach
            consensus. Each term links to its authoritative reference where
            available.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto">
          <nav
            aria-label="Glossary index"
            className="mb-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
          >
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Jump to a term
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {terms.map((t) => {
                const id = slugify(t.term);
                return (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {t.term}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <dl className="space-y-10">
            {terms.map((t) => {
              const id = slugify(t.term);
              return (
                <div
                  key={id}
                  id={id}
                  className="scroll-mt-24 border-b border-white/[0.06] pb-8 last:border-b-0"
                >
                  <dt className="mb-2 flex flex-wrap items-baseline gap-3">
                    <a
                      href={`#${id}`}
                      className="text-2xl font-semibold text-foreground hover:text-indigo-300 transition-colors"
                    >
                      {t.term}
                    </a>
                    {t.sameAs ? (
                      <a
                        href={t.sameAs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-300 transition-colors"
                      >
                        Wikidata reference
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </dt>
                  <dd className="text-base text-muted-foreground leading-relaxed">
                    {t.description}
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-16 flex flex-wrap gap-4">
            <Link
              href="/docs/getting-started"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700"
            >
              Start a deliberation
            </Link>
            <Link
              href={`${SITE_URL}/docs/modes`}
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent"
            >
              Compare deliberation modes
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
