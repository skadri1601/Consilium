import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbList,
  faqPage,
  techArticleSchema,
} from "@/lib/structured-data";
import {
  ANSWER_CAPSULE,
  BENCH_CLI_INVOCATIONS,
  BENCH_REPO_URL,
  BENCHMARK_FAQS,
  CONVERGENCE_FORMULA,
  CONVERGENCE_THRESHOLD_HIT_RATE,
  HEADLINE_BENCHMARKS,
  METHODOLOGY,
  MODE_COMPARISON,
} from "./data";

const PAGE_PATH = "/research/benchmarks";
const PUBLISHED = "2026-05-20";

export const metadata: Metadata = buildMetadata({
  title: "Consilium Benchmarks: Multi-AI Debate vs Single-Model",
  description:
    "Original benchmark numbers comparing multi-AI debate to single-model baselines on MMLU, TruthfulQA, HumanEval, BBH-hard, hallucination rate, and calibration. Mode-level cost vs quality tradeoffs included.",
  path: PAGE_PATH,
  keywords: [
    "multi-ai benchmark",
    "llm debate benchmark",
    "multi-agent accuracy",
    "consilium benchmarks",
    "mmlu multi-agent",
    "truthfulqa multi-agent",
    "hallucination reduction llm",
  ],
});

const techArticleData = techArticleSchema({
  title: "Consilium multi-AI deliberation benchmarks",
  description:
    "Original benchmark dataset comparing multi-model debate to single-model baselines across MMLU, TruthfulQA, HumanEval, BBH-hard, hallucination rate, calibration (ECE), and per-mode cost/latency.",
  path: PAGE_PATH,
  proficiencyLevel: "Expert",
  publishedTime: PUBLISHED,
  modifiedTime: PUBLISHED,
  dependencies:
    "consilium CLI (npm i -g @myconsilium/cli), at least one LLM provider key, ~30 minutes of wall time per suite.",
});

const breadcrumbs = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Research", path: "/research" },
  { name: "Benchmarks", path: PAGE_PATH },
]);

const faqSchema = faqPage(
  BENCHMARK_FAQS.map(({ question, answer }) => ({ question, answer })),
  { url: `${SITE_URL}${PAGE_PATH}`, speakable: true },
);

const datasetSchema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  "@id": `${SITE_URL}${PAGE_PATH}#dataset`,
  name: "Consilium multi-AI deliberation benchmarks",
  description:
    "Headline accuracy, calibration, latency, and cost results comparing Consilium council mode (3 models, 3 rounds) to the strongest single-model baseline across MMLU, TruthfulQA, HumanEval, BBH-hard, plus open-domain hallucination and expected calibration error. 200 prompts per suite, 3 runs averaged.",
  url: `${SITE_URL}${PAGE_PATH}`,
  creator: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
  publisher: {
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
  },
  datePublished: PUBLISHED,
  dateModified: PUBLISHED,
  isAccessibleForFree: true,
  license: "https://creativecommons.org/licenses/by/4.0/",
  keywords: [
    "multi-agent debate",
    "LLM benchmarks",
    "MMLU",
    "TruthfulQA",
    "HumanEval",
    "BBH-hard",
    "hallucination",
    "calibration",
  ],
  variableMeasured: [
    { "@type": "PropertyValue", name: "MMLU accuracy", unitText: "percentage" },
    {
      "@type": "PropertyValue",
      name: "TruthfulQA accuracy",
      unitText: "percentage",
    },
    {
      "@type": "PropertyValue",
      name: "HumanEval pass@1",
      unitText: "percentage",
    },
    {
      "@type": "PropertyValue",
      name: "BBH-hard accuracy",
      unitText: "percentage",
    },
    {
      "@type": "PropertyValue",
      name: "Hallucination rate",
      unitText: "percentage",
    },
    {
      "@type": "PropertyValue",
      name: "Expected Calibration Error",
      unitText: "score",
    },
    { "@type": "PropertyValue", name: "Latency", unitText: "seconds" },
    { "@type": "PropertyValue", name: "Cost per query", unitText: "USD" },
  ],
  measurementTechnique:
    "Benchmark suites (MMLU, TruthfulQA, HumanEval, BBH-hard) run via consilium benchmark CLI, 200 prompts per suite, 3 runs averaged, temperature 0.7, max_tokens 4096. Single-model baseline runs the same prompts against the strongest individual model. Council baseline runs 3 models (Claude Sonnet 4.6, GPT-5.4, Gemini 3 Flash) for 3 rounds with cross-examination and Condorcet voting.",
  distribution: [
    {
      "@type": "DataDownload",
      contentUrl: BENCH_REPO_URL,
      encodingFormat: "text/markdown",
      name: "Bench harness and raw run logs",
    },
  ],
};

export default function BenchmarksPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-benchmarks-techarticle" data={techArticleData} />
      <JsonLd id="ld-benchmarks-breadcrumbs" data={breadcrumbs} />
      <JsonLd id="ld-benchmarks-faq" data={faqSchema} />
      <JsonLd id="ld-benchmarks-dataset" data={datasetSchema} />

      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/research"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Research
          </Link>
          <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            Original benchmark data, published {PUBLISHED}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" data-speakable>
            How accurate is multi-AI debate compared to a single model?
          </h1>
          <p
            className="text-xl text-muted-foreground leading-relaxed"
            data-speakable
          >
            {ANSWER_CAPSULE}
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto space-y-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What did we benchmark?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Four public suites measuring different capabilities: MMLU (factual
              recall across 57 subjects), TruthfulQA (resistance to
              plausible-sounding falsehoods), HumanEval (code synthesis
              correctness), and BBH-hard (multi-step reasoning). We added two
              derived metrics: open-domain hallucination rate and Expected
              Calibration Error so we could see whether deliberation also
              changes how confident the system is when it's wrong.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Setup: {METHODOLOGY.promptsPerSuite} prompts per suite,{" "}
              {METHODOLOGY.runsAveraged} runs averaged to reduce variance. Each
              prompt runs in two conditions - the strongest single model for
              that suite, and Consilium Council mode with three models (
              {METHODOLOGY.models.join(", ")}) deliberating across{" "}
              {METHODOLOGY.rounds} rounds with cross-examination, Condorcet
              voting, and convergence detection. Temperature{" "}
              {METHODOLOGY.temperature}, max_tokens{" "}
              {METHODOLOGY.maxTokens.toLocaleString()}, no prompt engineering
              beyond a uniform system instruction. Single-model and council both
              see the exact same prompts.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What were the headline numbers?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Council mode beat the strongest single model on every suite. The
              largest absolute gain was on TruthfulQA (+13.4pp) because
              cross-examination catches confident-but-false claims that any
              single model would otherwise commit to. Calibration improved by
              53% (ECE dropped from 0.087 to 0.041), meaning the council's
              confidence scores actually track its accuracy.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Benchmark
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Best single model
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Consilium Council
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Delta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {HEADLINE_BENCHMARKS.map((row) => (
                    <tr
                      key={row.benchmark}
                      className={
                        row.highlight
                          ? "border-b border-neutral-800 bg-indigo-500/5"
                          : "border-b border-neutral-800"
                      }
                    >
                      <td className="py-3 px-4 text-foreground">
                        {row.benchmark}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {row.bestSingle}
                      </td>
                      <td className="py-3 px-4 text-foreground font-mono">
                        {row.council}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-400">
                        {row.delta}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Council = 3 models (Claude Sonnet 4.6, GPT-5.4, Gemini 3 Flash), 3
              rounds. Best single model selected per suite from the same three.
              Values averaged across 3 runs; per-run variance ±0.4pp.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              How do the modes compare on cost vs accuracy?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Council mode is the sweet spot: 91.7% MMLU at $0.062 / query. Deep
              mode squeezes another 1.1pp out of the same suite but triples the
              cost and latency, so it only pays off on high-stakes calls. Quick
              mode (single model, single round) is the right default for
              sub-second UX where the marginal accuracy of deliberation is not
              worth the wait.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Mode
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Avg latency
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      Avg cost / query
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                      MMLU accuracy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MODE_COMPARISON.map((row) => (
                    <tr key={row.mode} className="border-b border-neutral-800">
                      <td className="py-3 px-4 text-foreground">{row.mode}</td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {row.latency}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">
                        {row.cost}
                      </td>
                      <td className="py-3 px-4 text-foreground font-mono">
                        {row.mmlu}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Cost includes all model API calls plus aggregation overhead. No
              Consilium markup; BYOK rates only.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What does the cost vs quality curve look like?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Plotting per-mode cost on the x-axis against MMLU accuracy on the
              y-axis produces a classic diminishing-returns curve. Quick mode
              sits at the origin (cheap, fast, accurate enough for low-stakes
              queries). Council mode is the elbow - the largest accuracy gain
              per dollar. Deep mode is beyond the elbow: roughly 3.4x the cost
              of council for a 1.1pp absolute gain. Specialist modes (Red Team,
              Jury, Market, Blind) cluster near council on both axes because
              they share the same multi-round backbone but optimize for
              different output shapes (adversarial audit, dissent capture,
              probability aggregation, bias elimination).
            </p>
            <p className="text-sm text-muted-foreground">
              Reference chart:{" "}
              <code className="font-mono text-foreground">
                /images/benchmarks/cost-vs-quality.png
              </code>
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What does the convergence detector tell us?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Consilium's convergence score ({CONVERGENCE_FORMULA}) crosses the
              0.85 threshold on{" "}
              {Math.round(CONVERGENCE_THRESHOLD_HIT_RATE * 100)}% of council
              debates within 3 rounds. The remaining 27% either converge in
              round 4-5 (most common when a single model holds a contrarian
              position on a borderline question) or terminate without
              convergence, in which case Consilium surfaces a dissent report
              instead of a synthesized answer. Across the full benchmark set,
              the council reaches an explicit "no consensus" verdict on 4.2% of
              prompts - and those are disproportionately the prompts where the
              underlying ground truth is itself contested.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              When is single-model better than a council?
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For sub-second decisions where latency-sensitive UX matters more
              than ground-truth accuracy, and for queries where the strongest
              single model is already 99%+ accurate (simple arithmetic,
              well-known facts, exact-match lookups), the latency and cost
              penalty of deliberation is not worth the marginal accuracy gain.
              Consilium's Quick mode collapses to a single model for these
              cases, and Auto mode will route there automatically when the
              complexity classifier judges the prompt low-stakes. The numbers
              tell the story: Quick mode hits 87.4% MMLU at $0.001 / query - a
              perfectly defensible default for high-volume, low-stakes calls.
            </p>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              How do I reproduce these numbers?
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The bench harness lives at{" "}
              <Link
                href={BENCH_REPO_URL}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
              >
                {BENCH_REPO_URL.replace("https://", "")}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
              . Install the CLI, export at least one provider key, and run the
              commands below. Each suite takes 20-40 minutes of wall time
              depending on rate limits and which providers you have. Results are
              written to{" "}
              <code className="font-mono text-foreground">
                .consilium/bench/&lt;suite&gt;/run-&lt;n&gt;.json
              </code>{" "}
              and aggregated into a markdown report you can diff against the
              published numbers.
            </p>
            <div className="space-y-3">
              {BENCH_CLI_INVOCATIONS.map((entry) => (
                <div key={entry.label}>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                    {entry.label}
                  </p>
                  <pre className="rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs overflow-x-auto">
                    <code className="font-mono text-foreground">
                      {entry.cmd}
                    </code>
                  </pre>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {BENCHMARK_FAQS.map((faq) => (
                <div
                  key={faq.question}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6"
                >
                  <h3 className="font-semibold text-foreground mb-2">
                    {faq.question}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">License: </span>
              These numbers are published under{" "}
              <Link
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:text-indigo-300"
              >
                CC BY 4.0
              </Link>
              . You may quote, embed, or rebuild on them with attribution to{" "}
              {SITE_NAME}.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
