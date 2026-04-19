import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Code, BookOpen, ShieldAlert, HeartPulse, Scale, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Debate Templates",
  description:
    "Prebuilt debate templates for Consilium — code review, architecture decisions, security red-team, clinical reasoning, legal analysis, and forecasting.",
  path: "/docs/templates",
});

function attackCategoryLabelCount(attackCategories: string | null | undefined): number {
  if (!attackCategories) return 0;
  return attackCategories
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0).length;
}

const templates = [
  {
    icon: Code,
    name: "Code Review",
    mode: "Red Team",
    modeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    defaultModels: 3,
    maxRounds: 2,
    description: "Three models independently review code, then adversarially attack each other's findings. Attackers probe for security vulnerabilities, logical flaws, edge cases, and robustness issues. Defenders respond to each attack. A judge evaluates the validity of attacks and strength of defenses.",
    rubric: [
      { dimension: "Security", weight: "30%", desc: "Vulnerabilities, injection risks, auth flaws, data exposure" },
      { dimension: "Correctness", weight: "25%", desc: "Logic errors, off-by-one, null handling, race conditions" },
      { dimension: "Performance", weight: "20%", desc: "Time complexity, memory usage, unnecessary allocations" },
      { dimension: "Maintainability", weight: "15%", desc: "Code clarity, naming, structure, testability" },
      { dimension: "Style", weight: "10%", desc: "Consistency, formatting, idiomatic patterns" },
    ],
    attackCategories: "SECURITY_VULN, LOGICAL_FLAW, EDGE_CASE, ROBUSTNESS_TEST",
    example: "Review this authentication middleware for security vulnerabilities and suggest improvements",
    output: "Vulnerability report with severity ratings, defender's rebuttals, judge's final assessment, prioritized action items",
  },
  {
    icon: BookOpen,
    name: "Research Synthesis",
    mode: "Council",
    modeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    defaultModels: 3,
    maxRounds: 3,
    description: "Models explore different perspectives on complex research topics, challenge each other's sources and interpretations, and converge on well-supported conclusions. All claims must include citations. Uncertainties are explicitly flagged rather than glossed over.",
    rubric: [
      { dimension: "Accuracy", weight: "30%", desc: "Factual correctness of claims and interpretations" },
      { dimension: "Evidence Quality", weight: "25%", desc: "Strength and relevance of cited sources" },
      { dimension: "Completeness", weight: "20%", desc: "Coverage of relevant perspectives and findings" },
      { dimension: "Bias Awareness", weight: "15%", desc: "Recognition of limitations and potential biases" },
      { dimension: "Citation Quality", weight: "10%", desc: "Proper attribution and source reliability" },
    ],
    attackCategories: null,
    example: "Synthesize current research on transformer architecture efficiency improvements published in 2024-2025",
    output: "Comprehensive synthesis with inline citations, flagged uncertainties, confidence scores, areas of consensus and disagreement",
  },
  {
    icon: ShieldAlert,
    name: "Risk Assessment",
    mode: "Jury",
    modeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    defaultModels: 5,
    maxRounds: 3,
    description: "Five models evaluate risks with mandatory dissent reporting. Every assessment must explicitly identify both majority and minority positions. Models rate likelihood and impact for each risk, propose concrete mitigations, and map to compliance frameworks.",
    rubric: [
      { dimension: "Risk Identification", weight: "25%", desc: "Completeness of risk catalog, no blind spots" },
      { dimension: "Likelihood Assessment", weight: "20%", desc: "Accuracy of probability estimates" },
      { dimension: "Impact Analysis", weight: "20%", desc: "Severity scoring and cascading effects" },
      { dimension: "Mitigation Quality", weight: "20%", desc: "Feasibility and effectiveness of proposed controls" },
      { dimension: "Compliance", weight: "15%", desc: "Regulatory alignment and framework mapping" },
    ],
    attackCategories: null,
    example: "Assess risks of migrating our production database from PostgreSQL to a multi-region CockroachDB setup",
    output: "Risk matrix with likelihood/impact ratings, mitigation strategies per risk, mandatory minority opinions, compliance mapping",
  },
  {
    icon: HeartPulse,
    name: "Healthcare Diagnostics",
    mode: "Council",
    modeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    defaultModels: 3,
    maxRounds: 3,
    description: "Safety-critical deliberation with mandatory citations and dissent. Models provide differential diagnoses with evidence strength ratings. Red flags are automatically highlighted. Every claim must be backed by medical literature or clinical guidelines.",
    rubric: [
      { dimension: "Evidence Quality", weight: "30%", desc: "Strength of clinical evidence, guideline adherence" },
      { dimension: "Diagnostic Accuracy", weight: "25%", desc: "Correctness of differential diagnosis" },
      { dimension: "Safety Considerations", weight: "20%", desc: "Red flag identification, contraindication awareness" },
      { dimension: "Completeness", weight: "15%", desc: "Coverage of differential, no missed diagnoses" },
      { dimension: "Actionability", weight: "10%", desc: "Clear next steps, testable hypotheses" },
    ],
    attackCategories: null,
    example: "Evaluate differential diagnosis for patient presenting with acute chest pain, elevated troponin, and normal ECG",
    output: "Ranked differential diagnosis with evidence strength, safety flags, dissenting opinions, recommended workup",
  },
  {
    icon: Scale,
    name: "Legal Review (Dialectical)",
    mode: "Blind",
    modeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    defaultModels: 2,
    maxRounds: 3,
    description: "Dialectical format: one model argues the risk position (this is dangerous/non-compliant), the other argues acceptability (this is fine/compliant). Both are evaluated blindly — model identity stripped — to ensure the quality of legal reasoning matters, not the model brand. Mandatory dissent ensures both sides are fully explored.",
    rubric: [
      { dimension: "Legal Accuracy", weight: "30%", desc: "Correctness of legal interpretations and citations" },
      { dimension: "Risk Identification", weight: "25%", desc: "Completeness of risk and liability analysis" },
      { dimension: "Regulatory Compliance", weight: "20%", desc: "Alignment with applicable regulations" },
      { dimension: "Practicality", weight: "15%", desc: "Feasibility of recommended changes" },
      { dimension: "Clarity", weight: "10%", desc: "Clear, actionable language for non-lawyers" },
    ],
    attackCategories: null,
    example: "Review this SaaS terms of service for GDPR compliance risks and recommend specific clause revisions",
    output: "Clause-by-clause risk ratings, regulatory compliance gaps, recommended revisions with rationale, full dissent report",
  },
  {
    icon: TrendingUp,
    name: "Finance Risk Assessment",
    mode: "Jury",
    modeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    defaultModels: 3,
    maxRounds: 3,
    description: "Quantitative financial risk analysis with mandatory dissent. Models evaluate market, credit, operational, and liquidity risks using standard metrics (VaR, CVaR, Sharpe ratio). Stress testing scenarios are required. Results mapped to regulatory frameworks (Basel III, SOX, Dodd-Frank, MiFID II).",
    rubric: [
      { dimension: "Quantitative Rigor", weight: "30%", desc: "VaR, CVaR, Sharpe ratio, statistical validity" },
      { dimension: "Regulatory Alignment", weight: "25%", desc: "Basel III, SOX, Dodd-Frank, MiFID II compliance" },
      { dimension: "Risk Coverage", weight: "20%", desc: "Market, credit, operational, liquidity risk completeness" },
      { dimension: "Scenario Analysis", weight: "15%", desc: "Stress testing, tail risk, Monte Carlo quality" },
      { dimension: "Actionability", weight: "10%", desc: "Hedging strategies, portfolio adjustments, timelines" },
    ],
    attackCategories: null,
    example: "Evaluate the risk profile of this investment portfolio under current market conditions with stress scenarios",
    output: "Risk assessment with quantitative metrics, stress test results, regulatory mapping, hedging strategies, mandatory dissent",
  },
];

export default function TemplatesPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Docs
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Vertical Templates
          </h1>
          <p className="text-xl text-muted-foreground">
            6 pre-configured deliberation templates optimized for specific domains. Each template defines the mode, rubric weights, system prompts, and evaluation criteria.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Overview</h2>
          <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Template</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Models</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rounds</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Key Feature</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.name} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-4 py-2.5 font-medium">{t.name}</td>
                    <td className="px-4 py-2.5"><Badge className={t.modeColor}>{t.mode}</Badge></td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.defaultModels}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{t.maxRounds}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                      {t.attackCategories
                        ? `${attackCategoryLabelCount(t.attackCategories)} attack categories`
                        : t.rubric[0].dimension + " (" + t.rubric[0].weight + ")"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto space-y-12">
          {templates.map((t) => {
            const Icon = t.icon;
            return (
              <Card key={t.name} id={t.name.toLowerCase().replaceAll(/[^a-z]/g, "-")}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-indigo-400" />
                    <CardTitle className="text-xl">{t.name}</CardTitle>
                    <Badge className={t.modeColor}>{t.mode}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Default Models</p>
                      <p className="text-sm font-medium">{t.defaultModels}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Max Rounds</p>
                      <p className="text-sm font-medium">{t.maxRounds}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Mode</p>
                      <p className="text-sm font-medium">{t.mode}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Evaluation Rubric</p>
                    <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Dimension</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Weight</th>
                            <th className="px-4 py-2 text-left font-medium text-muted-foreground">Evaluates</th>
                          </tr>
                        </thead>
                        <tbody>
                          {t.rubric.map((r) => (
                            <tr key={r.dimension} className="border-b border-white/[0.06] last:border-0">
                              <td className="px-4 py-2 font-medium text-indigo-400">{r.dimension}</td>
                              <td className="px-4 py-2 font-mono text-sm">{r.weight}</td>
                              <td className="px-4 py-2 text-xs text-muted-foreground">{r.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {t.attackCategories && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Attack Categories</p>
                      <div className="flex flex-wrap gap-1.5">
                        {t.attackCategories.split(", ").map((cat) => (
                          <Badge key={cat} className="bg-red-500/10 text-red-400 border-red-500/20 text-xs">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Example Prompt</p>
                    <pre className="rounded-lg bg-neutral-900 p-3 text-sm overflow-x-auto">
                      <code className="text-muted-foreground">{t.example}</code>
                    </pre>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Output</p>
                    <p className="text-sm text-muted-foreground">{t.output}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Programmatic Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Templates can be loaded programmatically via the template registry. Each template returns a configuration object with mode, rubric, system prompts, max rounds, and default models.
              </p>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`from consilium.templates import get_template, TEMPLATES

# List all templates
print(TEMPLATES.keys())
# → ["code_review", "research_synthesis", "risk_assessment",
#    "healthcare", "legal", "finance"]

# Load a template
template = get_template("code_review")
# Returns: {
#   topic: str,
#   mode: "redteam",
#   rubric: { security: 0.30, correctness: 0.25, ... },
#   system_prompts: { attacker: "...", defender: "..." },
#   max_rounds: 2,
#   default_models: 3
# }`}</code>
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
