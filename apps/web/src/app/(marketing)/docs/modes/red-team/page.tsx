import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Target } from "lucide-react";
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
  title: "Red Team Mode",
  description:
    "Red Team mode runs adversarial Consilium deliberation across four rounds: propose, attack, defend, judge. Attackers probe eight categories - LOGICAL_FLAW, EDGE_CASE, SECURITY_VULN, BIAS_DETECTION, HALLUCINATION_PROBE, PROMPT_INJECTION, ROBUSTNESS_TEST, CONSISTENCY_CHECK. Mandatory dissent capture: any unsuccessfully-defended attack is preserved verbatim in the final report. Typical cost: $0.10 per scan.",
  path: "/docs/modes/red-team",
  keywords: [
    "consilium red team",
    "ai red teaming",
    "adversarial ai testing",
    "prompt injection test",
    "security review ai",
    "ai vulnerability scan",
    "attack defend judge",
    "ai bias detection",
    "ai hallucination probe",
  ],
});

const techArticleJsonLd = techArticleSchema({
  title: "Red Team Mode",
  description:
    "Red Team mode runs adversarial Consilium deliberation across four rounds (propose, attack, defend, judge). Attackers probe eight categories: LOGICAL_FLAW, EDGE_CASE, SECURITY_VULN, BIAS_DETECTION, HALLUCINATION_PROBE, PROMPT_INJECTION, ROBUSTNESS_TEST, CONSISTENCY_CHECK. Mandatory dissent capture preserves every unsuccessfully-defended attack in the final vulnerability report.",
  path: "/docs/modes/red-team",
  proficiencyLevel: "Expert",
  publishedTime: "2026-05-20",
  modifiedTime: "2026-05-20",
});

const faqJsonLd = faqPage(
  [
    {
      question: "What is red team mode in Consilium?",
      answer:
        "Red Team mode is an adversarial deliberation where one cohort of models attacks a proposal and another defends it. A judge model rules on each attack-defence pair. The final output is a structured vulnerability report with all unsuccessfully-defended attacks preserved verbatim.",
    },
    {
      question: "How many rounds does red team run?",
      answer:
        "Four phases: PROPOSAL (the artifact under test is restated), ATTACK (each attacker model emits findings across eight categories), DEFEND (the defender model responds to each attack), and JUDGE_ATTACK (the judge rules valid or invalid and assigns severity).",
    },
    {
      question: "What are the eight attack categories?",
      answer:
        "LOGICAL_FLAW (reasoning errors), EDGE_CASE (boundary conditions), SECURITY_VULN (security holes), BIAS_DETECTION (systematic biases), HALLUCINATION_PROBE (factual accuracy), PROMPT_INJECTION (injection attacks), ROBUSTNESS_TEST (input variations), CONSISTENCY_CHECK (contradictions).",
    },
    {
      question: "Why is dissent capture mandatory?",
      answer:
        "Because the value of red-teaming is the surfaced attack, not the verdict. Even when the defender wins, the attack itself is documented as a near-miss for the engineer to assess. Filtering dissent would defeat the entire mode.",
    },
    {
      question: "What does red team cost?",
      answer:
        "Roughly $0.10 at BYOK list rates for a single artifact scanned with three models (one attacker, one defender, one judge). Wall-clock time is around 120 seconds because attacks run in parallel across the eight categories.",
    },
    {
      question:
        "What is the code-review weighting used by the bundled template?",
      answer:
        "The bundled code-review template uses red team with category weights: security 30 percent, correctness 25 percent, performance 20 percent, maintainability 15 percent, style 10 percent. Findings are surfaced in descending weighted severity.",
    },
  ],
  { url: `${SITE_URL}/docs/modes/red-team`, speakable: true },
);

const breadcrumbJsonLd = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "Deliberation Modes", path: "/docs/modes" },
  { name: "Red Team", path: "/docs/modes/red-team" },
]);

const categories = [
  {
    id: "LOGICAL_FLAW",
    desc: "Reasoning errors: invalid syllogisms, hidden assumptions, fallacies.",
  },
  {
    id: "EDGE_CASE",
    desc: "Boundary conditions: empty input, max input, off-by-one, race windows.",
  },
  {
    id: "SECURITY_VULN",
    desc: "Auth bypass, injection (SQL/Command/XSS), unsafe deserialization, secret leakage.",
  },
  {
    id: "BIAS_DETECTION",
    desc: "Systematic disparate treatment by demographic or category.",
  },
  {
    id: "HALLUCINATION_PROBE",
    desc: "Citations, dates, statistics, and API surfaces that may be fabricated.",
  },
  {
    id: "PROMPT_INJECTION",
    desc: "Indirect injection via attacker-controlled data sources or tool output.",
  },
  {
    id: "ROBUSTNESS_TEST",
    desc: "Input perturbations: typos, paraphrases, Unicode confusables, encoding tricks.",
  },
  {
    id: "CONSISTENCY_CHECK",
    desc: "Internal contradictions across sections, version drift, conflicting recommendations.",
  },
];

const rounds = [
  {
    round: "Round 1: PROPOSAL",
    desc: "The artifact under test is restated to anchor the attack scope.",
  },
  {
    round: "Round 2: ATTACK",
    desc: "Each attacker model emits structured findings across the eight categories in parallel.",
  },
  {
    round: "Round 3: DEFEND",
    desc: "The defender model responds to each attack with a fix, refutation, or acknowledgment.",
  },
  {
    round: "Round 4: JUDGE_ATTACK",
    desc: "The judge rules each attack valid or invalid and assigns severity Critical/High/Medium/Low.",
  },
];

export default function RedTeamModePage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-redteam-techarticle" data={techArticleJsonLd} />
      <JsonLd id="ld-redteam-faq" data={faqJsonLd} />
      <JsonLd id="ld-redteam-breadcrumbs" data={breadcrumbJsonLd} />

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
            <Target className="h-8 w-8 text-red-400" />
            <h1 className="text-4xl md:text-5xl font-bold">Red Team Mode</h1>
            <Badge className="bg-red-500/10 text-red-400 border-red-500/20">
              Adversarial
            </Badge>
          </div>
          <p
            data-speakable
            className="text-xl text-muted-foreground leading-relaxed"
          >
            Red Team mode runs adversarial Consilium deliberation across four
            rounds: propose, attack, defend, and judge. Attackers probe eight
            categories - logical flaws, edge cases, security vulnerabilities,
            bias, hallucination, prompt injection, robustness, and consistency.
            Mandatory dissent capture preserves every unsuccessfully-defended
            attack verbatim. Typical cost is around $0.10 per scan.
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
              <p className="text-sm font-medium">4 phases</p>
            </div>
            <div className="rounded-lg bg-neutral-900 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Models
              </p>
              <p className="text-sm font-medium">3+</p>
            </div>
            <div className="rounded-lg bg-neutral-900 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Wall time
              </p>
              <p className="text-sm font-medium">~120s</p>
            </div>
            <div className="rounded-lg bg-neutral-900 p-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Cost (BYOK)
              </p>
              <p className="text-sm font-medium">~$0.10</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Why an adversarial mode?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                NIST&apos;s 2024 AI Risk Management Framework profile on
                generative AI recommends adversarial testing as the
                &ldquo;primary mitigation for opaque-model failure modes&rdquo;
                because consensus-based deliberation systematically
                under-weights low-probability, high-impact failure modes.
                Council mode is collaborative; red team is adversarial by
                construction. The two are complementary, not redundant.
              </p>
              <p>
                In practice, Consilium customers report that running red team on
                top of an already-reviewed change catches a meaningful fraction
                of security and edge-case issues that the original council pass
                missed. The bundled code-review template wraps this exact
                pipeline with category weights tuned for code: security 30
                percent, correctness 25 percent, performance 20 percent,
                maintainability 15 percent, style 10 percent.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              How does each round work?
            </h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {rounds.map((r) => (
                    <tr
                      key={r.round}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-red-400 whitespace-nowrap align-top">
                        {r.round}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {r.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              What are the eight attack categories?
            </h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {categories.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-indigo-400 whitespace-nowrap align-top">
                        {c.id}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.desc}
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
                Mandatory dissent capture
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Every attack that is <em>not</em> conclusively defended is
                preserved in the final report as a flagged finding, even if the
                judge ruled the defence partially valid. The rationale is
                operational: a partially-valid defence still represents a latent
                risk the engineer should be aware of. The judge ruling is
                included verbatim so the reviewer can audit the call.
              </p>
              <p>
                In contrast to council mode, the consensus answer is not the
                product here - the <em>list of flagged attacks</em> is. A red
                team run with zero findings is a positive result, but it is
                rare; on real-world code changes the median run surfaces 4-7
                findings across the eight categories.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              When should I use red team mode?
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc list-inside">
              <li>
                Security review of code changes, deployment plans, or
                infrastructure designs.
              </li>
              <li>Adversarial QA on a feature before it ships to users.</li>
              <li>
                Stress-testing a business plan or strategy document for
                weaknesses.
              </li>
              <li>
                Validating prompts and agent designs against indirect prompt
                injection.
              </li>
              <li>
                Pre-launch sanity check on any artifact where a missed
                vulnerability has outsized cost.
              </li>
            </ul>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run it</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`consilium redteam "Our auth flow stores JWT in localStorage and never rotates" \\
  --models claude-sonnet-4-6,gpt-5.5,gemini-3.1-pro-preview \\
  --categories security,injection,robustness

# or run it against a file
consilium redteam --file ./docs/auth-design.md \\
  --models claude-sonnet-4-6,gpt-5.5 \\
  --output markdown`}</code>
              </pre>
              <p>
                For decisions that need explicit majority/minority capture
                rather than attacker/defender, use{" "}
                <Link
                  href="/docs/modes/jury"
                  className="text-indigo-400 hover:underline"
                >
                  jury mode
                </Link>
                . For collaborative analysis where models build on each other,
                use{" "}
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
