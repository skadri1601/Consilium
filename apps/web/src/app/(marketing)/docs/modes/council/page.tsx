import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Users } from "lucide-react";
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
  title: "Council Mode",
  description:
    "Council mode is the default Consilium deliberation: three rounds of propose, challenge, and synthesize across 2-5 frontier models. Cross-examination phase forces models to defend or revise. Voting uses Condorcet with Ranked Pairs fallback and confidence-weighted Borda. Convergence score: 0.4 * ranking_similarity + 0.35 * proposal_similarity + 0.25 * concession_rate. Typical cost: $0.05-$0.15 per debate.",
  path: "/docs/modes/council",
  keywords: [
    "consilium council mode",
    "multi agent debate",
    "council deliberation",
    "ai cross examination",
    "condorcet voting ai",
    "borda count ai",
    "convergence score",
    "three round debate",
    "high stakes ai decision",
  ],
});

const techArticleJsonLd = techArticleSchema({
  title: "Council Mode",
  description:
    "Council mode is the default Consilium deliberation. Three rounds (propose, challenge, synthesize) across 2-5 frontier models with formal cross-examination, Condorcet voting with Ranked Pairs fallback, and confidence-weighted Borda count. Convergence is detected when 0.4 * ranking_similarity + 0.35 * proposal_similarity + 0.25 * concession_rate >= 0.85.",
  path: "/docs/modes/council",
  proficiencyLevel: "Intermediate",
  publishedTime: "2026-05-20",
  modifiedTime: "2026-05-20",
});

const faqJsonLd = faqPage(
  [
    {
      question: "What is council mode in Consilium?",
      answer:
        "Council mode is the default deliberation. It runs 2-5 frontier models through three rounds: round 1 each model proposes independently, round 2 each model challenges the others, round 3 each model synthesizes a final position. Voting then produces a single consensus answer using Condorcet with Ranked Pairs fallback.",
    },
    {
      question: "How many rounds does council mode run?",
      answer:
        "Three by default. Each round runs the full propose-challenge-rebut-evaluate-vote-converge pipeline. The debate exits early if the convergence score reaches 0.85 before round 3, which happens on roughly one in three queries.",
    },
    {
      question: "Which voting method does council mode use?",
      answer:
        "Condorcet method first - it picks the candidate that beats every other candidate in pairwise comparison. If no Condorcet winner exists (a cycle), the system falls back to Ranked Pairs. Borda count runs alongside for confidence-weighted ranking strength.",
    },
    {
      question: "How is convergence detected?",
      answer:
        "Convergence score = 0.4 * ranking_similarity (Kendall tau) + 0.35 * proposal_similarity (Jaccard) + 0.25 * concession_rate. The deliberation halts early when the score crosses 0.85, indicating models have effectively agreed.",
    },
    {
      question: "What does a council debate cost?",
      answer:
        "Typically $0.05-$0.15 at BYOK list rates for a standard three-round, three-model debate (Claude Sonnet + GPT-5 + Gemini Pro). Wall-clock time is ~45 seconds. Cost scales linearly with the number of models and rounds.",
    },
    {
      question: "When should I use council mode versus deep mode?",
      answer:
        "Council mode (3 rounds) is the right default for architecture decisions, technical trade-offs, and most knowledge work. Deep mode (5 rounds plus sub-agent research) is for mission-critical questions where the cost of being wrong dwarfs the cost of two extra rounds. Roughly: use council 80 percent of the time, deep for the remaining 20 percent.",
    },
  ],
  { url: `${SITE_URL}/docs/modes/council`, speakable: true },
);

const breadcrumbJsonLd = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "Deliberation Modes", path: "/docs/modes" },
  { name: "Council", path: "/docs/modes/council" },
]);

const phases = [
  {
    phase: "Round 1: PROPOSAL",
    what: "Each model writes an independent answer with no knowledge of the others. Isolates priors.",
  },
  {
    phase: "Round 2: CHALLENGE",
    what: "Each model receives every other model's proposal and writes critique-counter pairs.",
  },
  {
    phase: "Round 2: REBUTTAL",
    what: "Each model defends or concedes against the critiques. Concessions are tracked for the convergence score.",
  },
  {
    phase: "Round 3: EVALUATION",
    what: "A judge model scores each proposal across correctness, completeness, and reasoning quality.",
  },
  {
    phase: "Round 3: VOTING",
    what: "Condorcet method picks the pairwise champion; Ranked Pairs is the fallback if a cycle exists.",
  },
  {
    phase: "Round 3: SYNTHESIS",
    what: "Winning proposal is re-rendered as the final consensus answer with dissenting points footnoted.",
  },
];

export default function CouncilModePage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-council-techarticle" data={techArticleJsonLd} />
      <JsonLd id="ld-council-faq" data={faqJsonLd} />
      <JsonLd id="ld-council-breadcrumbs" data={breadcrumbJsonLd} />

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
            <Users className="h-8 w-8 text-indigo-400" />
            <h1 className="text-4xl md:text-5xl font-bold">Council Mode</h1>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              Default
            </Badge>
          </div>
          <p
            data-speakable
            className="text-xl text-muted-foreground leading-relaxed"
          >
            Council mode is the default Consilium deliberation: three rounds of
            propose, challenge, and synthesize across 2-5 frontier models. A
            mandatory cross-examination phase forces each model to defend or
            revise its position against critique from the others. Voting uses
            Condorcet with Ranked Pairs fallback. Typical cost is $0.05-$0.15 at
            BYOK rates and wall-clock time is around 45 seconds.
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
                Models
              </p>
              <p className="text-sm font-medium">2-5</p>
            </div>
            <div className="rounded-lg bg-neutral-900 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Wall time
              </p>
              <p className="text-sm font-medium">~45s</p>
            </div>
            <div className="rounded-lg bg-neutral-900 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Cost (BYOK)
              </p>
              <p className="text-sm font-medium">$0.05-0.15</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Why three rounds of debate?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                The three-round structure is grounded in multi-agent
                deliberation research. Du et al. (&ldquo;Improving Factuality
                and Reasoning in Language Models through Multiagent
                Debate,&rdquo; MIT 2023) reported that &ldquo;multiagent debate
                significantly enhances reasoning and factual accuracy of
                language models across a number of tasks&rdquo; with the largest
                gains landing between rounds two and three. Beyond round three,
                marginal returns drop sharply for general queries, which is why
                council caps at three and deep mode adds a fourth and fifth
                round for high-stakes work.
              </p>
              <p>
                The cross-examination phase is where the value compounds. Round
                1 proposals reveal each model&apos;s priors. Round 2 critiques
                surface the disagreements that matter. Round 3 forces a
                synthesis: every model either defends its position with new
                evidence or concedes the point. The concession rate enters the
                convergence score directly.
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
                      <td className="px-4 py-3 font-mono text-xs text-indigo-400 whitespace-nowrap align-top">
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
                Voting math (Condorcet + Borda)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Council mode runs two voting methods in parallel.{" "}
                <strong className="text-white">Condorcet</strong> selects the
                candidate that beats every other candidate in pairwise
                comparison. If no Condorcet winner exists (a Condorcet paradox),
                the system falls back to{" "}
                <strong className="text-white">Ranked Pairs</strong>, which
                locks pairwise victories in order of margin without creating
                cycles.
              </p>
              <p>
                <strong className="text-white">Borda count</strong> runs
                alongside to provide a confidence-weighted ranking of the full
                slate, not just a winner. Each model&apos;s confidence in its
                ranking is multiplied into the Borda score, so a model that says
                &ldquo;90 percent A&rdquo; weighs more than one that says
                &ldquo;55 percent A.&rdquo;
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Convergence score (early exit at 0.85)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>The convergence score is a weighted combination:</p>
              <pre className="rounded-lg bg-neutral-900 p-4 text-xs overflow-x-auto">
                <code className="text-emerald-400">{`score = 0.40 * ranking_similarity  # Kendall tau
      + 0.35 * proposal_similarity # Jaccard
      + 0.25 * concession_rate     # tracked in round 2

if score >= 0.85: halt early`}</code>
              </pre>
              <p>
                The deliberation exits early when the score crosses 0.85,
                indicating the models have effectively converged. Early exit
                fires on roughly one in three queries and saves the cost of the
                third round entirely.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              When should I use council mode?
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc list-inside">
              <li>
                Architecture decisions:{" "}
                <em>
                  &ldquo;Should we use microservices or a monolith?&rdquo;
                </em>
              </li>
              <li>
                Technical trade-offs:{" "}
                <em>
                  &ldquo;Postgres vs. DynamoDB for this access pattern?&rdquo;
                </em>
              </li>
              <li>
                Design reviews:{" "}
                <em>
                  &ldquo;Does this API surface have a better shape?&rdquo;
                </em>
              </li>
              <li>
                Cross-functional decisions:{" "}
                <em>&ldquo;Build in-house or buy?&rdquo;</em>
              </li>
              <li>
                Any question where you specifically want multi-model debate
                rather than a single answer.
              </li>
            </ul>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`consilium debate "Should we use microservices or a monolith for our v1?" \\
  --mode council \\
  --models claude-sonnet-4-6,gpt-5.5,gemini-3.1-pro-preview \\
  --rounds 3`}</code>
              </pre>
              <p>
                Switch to{" "}
                <Link
                  href="/docs/modes/jury"
                  className="text-indigo-400 hover:underline"
                >
                  jury mode
                </Link>{" "}
                when you need mandatory dissent capture or{" "}
                <Link
                  href="/docs/modes/red-team"
                  className="text-indigo-400 hover:underline"
                >
                  red-team mode
                </Link>{" "}
                when you need adversarial probing. See the full{" "}
                <Link
                  href="/docs/modes"
                  className="text-indigo-400 hover:underline"
                >
                  modes overview
                </Link>{" "}
                for the other six modes.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
