import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Shield } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbList,
  techArticleSchema,
  faqPage,
} from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "Jury Mode",
  description:
    "Jury mode runs three rounds of Consilium deliberation with mandatory minority opinion capture. Voting uses confidence-weighted Borda count; agglomerative clustering on Jaccard similarity (threshold 0.5) detects dissent and surfaces both majority and minority positions. Designed for risk, healthcare, finance, and compliance decisions where unanimity must be mathematically verified, not assumed.",
  path: "/docs/modes/jury",
  keywords: [
    "consilium jury mode",
    "ai mandatory dissent",
    "ai minority opinion",
    "borda count voting ai",
    "compliance ai decision",
    "agglomerative clustering ai",
    "risk assessment ai",
    "healthcare ai decision",
    "panel deliberation ai",
  ],
});

const techArticleJsonLd = techArticleSchema({
  title: "Jury Mode",
  description:
    "Jury mode runs three rounds of Consilium deliberation with mandatory minority opinion capture. Voting uses confidence-weighted Borda count; agglomerative clustering on Jaccard similarity (threshold 0.5) detects dissent and surfaces both majority and minority positions. Use for risk, healthcare, finance, and compliance decisions where unanimity must be mathematically verified, not assumed.",
  path: "/docs/modes/jury",
  proficiencyLevel: "Intermediate",
  publishedTime: "2026-05-20",
  modifiedTime: "2026-05-20",
});

const faqJsonLd = faqPage(
  [
    {
      question: "What is jury mode in Consilium?",
      answer:
        "Jury mode is a Consilium deliberation that forces explicit majority and minority opinions in the final output. Three rounds run the standard propose-challenge-rebut pipeline. Voting uses confidence-weighted Borda count. Agglomerative clustering on Jaccard similarity detects whether the panel is genuinely unanimous or split, and reports the split when it exists.",
    },
    {
      question: "Why mandatory dissent?",
      answer:
        "Because consensus bias is dangerous in risk, healthcare, finance, and compliance contexts. A 4-1 split presented as 'the council recommends X' hides exactly the information the decision-maker needs. Jury mode borrows from common-law jury practice: dissent is part of the record, not an inconvenience to be smoothed over.",
    },
    {
      question: "How does Consilium detect dissent?",
      answer:
        "By building a Jaccard similarity matrix between every pair of final proposals, then iteratively merging clusters whose pairwise similarity exceeds 0.5 (agglomerative clustering). A single cluster means genuine consensus; multiple clusters means dissent, and each cluster's contents become a position in the final report.",
    },
    {
      question: "Which voting method does jury mode use?",
      answer:
        "Confidence-weighted Borda count. Borda assigns scores by ranking position; Consilium multiplies each model's stated confidence into the score so a model that says '90 percent A' contributes more weight than one that says '55 percent A.' Borda was chosen over Condorcet here because it produces a full ranking of positions, not just a single winner.",
    },
    {
      question: "When should I prefer jury over council mode?",
      answer:
        "When the cost of falsely declaring unanimity is high. Risk assessments, healthcare protocols, financial recommendations, and any decision that triggers regulatory documentation should use jury so the audit trail explicitly captures dissent. Council is fine when you just want the best consensus answer.",
    },
    {
      question: "What templates ship with jury as the default mode?",
      answer:
        "The bundled risk-assessment and finance templates both default to jury. Either template can be overridden with --mode council or --mode deep, but the templated defaults reflect the compliance reasoning above.",
    },
  ],
  { url: `${SITE_URL}/docs/modes/jury`, speakable: true },
);

const breadcrumbJsonLd = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "Deliberation Modes", path: "/docs/modes" },
  { name: "Jury", path: "/docs/modes/jury" },
]);

const phases = [
  {
    phase: "Round 1: PROPOSAL",
    what: "Each juror model writes an independent position with explicit confidence (0-100).",
  },
  {
    phase: "Round 2: CHALLENGE",
    what: "Each juror critiques the others' proposals. Critiques include severity scoring.",
  },
  {
    phase: "Round 2: REBUTTAL",
    what: "Each juror defends or concedes. Conceded points are tagged for the dissent detector.",
  },
  {
    phase: "Round 3: EVALUATION",
    what: "A judge model scores each proposal on legitimacy and supporting evidence.",
  },
  {
    phase: "Round 3: VOTING",
    what: "Confidence-weighted Borda count produces a full ranking of positions.",
  },
  {
    phase: "Round 3: AGGREGATION",
    what: "Agglomerative clustering on Jaccard similarity merges positions whose similarity > 0.5.",
  },
  {
    phase: "Round 3: OUTPUT",
    what: "Final report surfaces majority position AND every minority position with vote share.",
  },
];

export default function JuryModePage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-jury-techarticle" data={techArticleJsonLd} />
      <JsonLd id="ld-jury-faq" data={faqJsonLd} />
      <JsonLd id="ld-jury-breadcrumbs" data={breadcrumbJsonLd} />

      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/docs/modes"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Modes
          </Link>
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-emerald-400" />
            <h1 className="text-4xl md:text-5xl font-bold">Jury Mode</h1>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              Mandatory Dissent
            </Badge>
          </div>
          <p
            data-speakable
            className="text-xl text-muted-foreground leading-relaxed"
          >
            Jury mode runs three rounds of Consilium deliberation with mandatory
            minority opinion capture. Voting uses confidence-weighted Borda
            count. Agglomerative clustering on Jaccard similarity at a 0.5
            threshold detects dissent and surfaces both majority and minority
            positions. Use jury for risk, healthcare, finance, and compliance
            decisions where unanimity must be mathematically verified, not
            assumed.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="grid sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-neutral-900 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Rounds
              </p>
              <p className="text-sm font-medium">3</p>
            </div>
            <div className="rounded-lg bg-neutral-900 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Jurors
              </p>
              <p className="text-sm font-medium">3-5</p>
            </div>
            <div className="rounded-lg bg-neutral-900 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Wall time
              </p>
              <p className="text-sm font-medium">~60s</p>
            </div>
            <div className="rounded-lg bg-neutral-900 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Dissent threshold
              </p>
              <p className="text-sm font-medium">Jaccard 0.5</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why mandatory dissent?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                The U.S. Supreme Court&apos;s practice of publishing dissenting
                opinions alongside majority decisions exists because{" "}
                <em>the disagreement is itself information</em>. The same logic
                applies to AI deliberation: a 4-1 split surfaced as a unanimous
                recommendation strips out exactly the signal that makes the
                recommendation actionable. Jury mode is the implementation of
                that principle.
              </p>
              <p>
                Brennan and Pettit&apos;s 2004 work on the discursive dilemma
                showed that &ldquo;majority voting on related propositions can
                produce inconsistent collective judgments even when every
                individual is consistent.&rdquo; The dissent detector exists
                specifically to surface that inconsistency rather than paper
                over it with a forced majority answer.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              How does each phase work?
            </h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {phases.map((p) => (
                    <tr
                      key={p.phase}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400 whitespace-nowrap align-top">
                        {p.phase}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {p.what}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                How is dissent detected?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                After round 3, every juror&apos;s final position is treated as a
                set of claims. Consilium builds a pairwise Jaccard similarity
                matrix between every pair of position-sets. Agglomerative
                clustering then iteratively merges position pairs whose
                similarity exceeds 0.5 until no more merges are possible.
              </p>
              <pre className="rounded-lg bg-neutral-900 p-4 text-xs overflow-x-auto">
                <code className="text-emerald-400">{`positions = [set(claim_extract(p)) for p in proposals]
M = pairwise_jaccard(positions)        # NxN matrix
clusters = agglomerative_merge(M, threshold=0.5)

if len(clusters) == 1:
    report.consensus = clusters[0]
else:
    report.majority = max(clusters, key=lambda c: c.weight)
    report.minorities = [c for c in clusters if c != report.majority]`}</code>
              </pre>
              <p>
                A single cluster means the panel converged on one position - a
                genuine consensus. Two or more clusters means dissent. Each
                cluster becomes an explicit position in the final report,
                annotated with the share of vote weight that backs it.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Confidence-weighted Borda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Voting is Borda count multiplied by each juror&apos;s declared
                confidence (0-100). Borda was chosen here over Condorcet because
                jury mode reports a <em>ranking</em> of positions, not just a
                single winner. A juror who is 90 percent confident in position A
                contributes more Borda weight than a juror who is 55 percent
                confident. This stops a high-confidence dissenter from being
                washed out by lukewarm majority votes.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              When should I use jury mode?
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc list-inside">
              <li>
                Risk assessment where overlooking a minority opinion could be
                catastrophic.
              </li>
              <li>
                Healthcare or clinical decisions requiring transparent
                disagreement.
              </li>
              <li>
                Regulatory compliance reviews where the audit trail must
                preserve dissent.
              </li>
              <li>
                Financial analysis where the bull/bear split is the signal, not
                a noise to be averaged away.
              </li>
              <li>
                Any contested topic where the consumer of the answer must see
                both sides.
              </li>
            </ul>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`consilium debate "Should we approve this drug interaction for off-label use?" \\
  --mode jury \\
  --models claude-sonnet-4-6,gpt-5.5,gemini-3.1-pro-preview \\
  --rounds 3

# explicitly include all minority positions in JSON output
consilium debate "Q3 forecast: bull vs bear case for revenue" \\
  --mode jury \\
  --output json`}</code>
              </pre>
              <p>
                For adversarial probing rather than dissent capture, use{" "}
                <Link
                  href="/docs/modes/red-team"
                  className="text-indigo-400 hover:underline"
                >
                  red team mode
                </Link>
                . For collaborative consensus without mandatory dissent
                tracking, use{" "}
                <Link
                  href="/docs/modes/council"
                  className="text-indigo-400 hover:underline"
                >
                  council mode
                </Link>
                . See the full{" "}
                <Link
                  href="/docs/modes"
                  className="text-indigo-400 hover:underline"
                >
                  modes overview
                </Link>{" "}
                for the other modes.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
