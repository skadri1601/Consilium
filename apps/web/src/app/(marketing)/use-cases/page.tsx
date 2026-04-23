import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { MarketingHero } from "@/components/shared/marketing-hero";

export const metadata: Metadata = buildMetadata({
  title: "Use Cases",
  description:
    "How teams use Consilium — architecture decisions, code review, research synthesis, model selection, incident retrospectives, and high-stakes prompts.",
  path: "/use-cases",
  keywords: [
    "ai use cases",
    "llm council use cases",
    "ai for engineering teams",
  ],
});
import {
  Code,
  BookOpen,
  ShieldAlert,
  HeartPulse,
  Scale,
  TrendingUp,
  Target,
  Users,
  Eye,
  Shield,
  BarChart3,
} from "lucide-react";

const useCases = [
  {
    id: "code-review",
    icon: Code,
    title: "Code Review",
    mode: "Red Team",
    template: "code_review",
    models: 3,
    rounds: 2,
    modeIcon: Target,
    modeColor: "bg-red-500/10 text-dissent border-red-500/20",
    attackCategories: [
      "SECURITY_VULN",
      "LOGICAL_FLAW",
      "EDGE_CASE",
      "ROBUSTNESS_TEST",
    ],
    description: [
      "Three models independently review your code, each generating a comprehensive analysis of potential issues. Unlike traditional code review tools that run static analysis, Consilium's code review puts models into adversarial positions where they actively attack each other's findings, uncovering issues that surface only under cross-examination. The Red Team framework ensures that every vulnerability claim is stress-tested before reaching the final report.",
      "During the Red Team phase, models issue typed challenges categorized as SECURITY_VULN, LOGICAL_FLAW, EDGE_CASE, or ROBUSTNESS_TEST. A defender model must rebut each challenge with evidence — conceding valid points, refuting false positives, qualifying edge cases, or redirecting to more critical issues. This adversarial dynamic mirrors real security audits where penetration testers and defenders engage in structured conflict to harden systems.",
      "The judge model synthesizes all findings into a final vulnerability report with severity ratings (critical/high/medium/low), maps each finding to the original code location, and includes the defender's rebuttals. The result is a structured, auditable code review that catches 30-40% more issues than single-model review. Each finding is cross-referenced against OWASP Top 10, CWE identifiers, and SANS 25 categories where applicable.",
    ],
    rubric: [
      { name: "Security", weight: "30%" },
      { name: "Correctness", weight: "25%" },
      { name: "Performance", weight: "20%" },
      { name: "Maintainability", weight: "15%" },
      { name: "Style", weight: "10%" },
    ],
    examplePrompt:
      "Review this authentication middleware for security vulnerabilities:\n\nasync function authMiddleware(req, res, next) {\n  const token = req.headers.authorization;\n  const decoded = jwt.verify(token, process.env.JWT_SECRET);\n  req.user = await User.findById(decoded.id);\n  next();\n}",
    outputDescription:
      "Vulnerability report with severity ratings (critical/high/medium/low), defender rebuttals for each finding, judge's final assessment with prioritized remediation steps, and OWASP/CWE cross-references.",
    whyDeliberation:
      "Single models miss 30-40% of security issues. Cross-examination forces models to justify their findings under adversarial pressure, eliminating false positives and surfacing hidden vulnerabilities that no single model catches alone. The Red Team structure ensures the defender cannot dismiss legitimate findings, while the attacker cannot inflate severity without evidence.",
  },
  {
    id: "research-synthesis",
    icon: BookOpen,
    title: "Research Synthesis",
    mode: "Council",
    template: "research_synthesis",
    models: 3,
    rounds: 3,
    modeIcon: Users,
    modeColor: "bg-warm/12 text-warm border-warm/20",
    attackCategories: [],
    description: [
      "Models explore different perspectives on complex research topics, each bringing independent analysis of available evidence. The Council mode ensures diverse viewpoints are represented before any synthesis occurs, preventing the premature convergence that plagues single-model summarization. Three models deliberate across three rounds, with each round building on the previous one's findings and challenges.",
      "During deliberation, models challenge each other's source interpretations, flag potential biases in cited research, and identify gaps in evidence coverage. Each claim must be backed by specific evidence, and models rate their confidence in each assertion. The confidence-weighted voting system (Condorcet + Borda count) ensures well-supported conclusions carry more weight than speculative claims.",
      "The final synthesis includes a comprehensive overview with inline citations, a section of flagged uncertainties where models disagreed, and confidence scores for each major conclusion. Dissenting views are preserved — if one model identified contradictory evidence, that perspective is included alongside the majority position. The output distinguishes between strong consensus, weak consensus, and active disagreement.",
    ],
    rubric: [
      { name: "Accuracy", weight: "30%" },
      { name: "Evidence Quality", weight: "25%" },
      { name: "Completeness", weight: "20%" },
      { name: "Bias Awareness", weight: "15%" },
      { name: "Citation Quality", weight: "10%" },
    ],
    examplePrompt:
      "Synthesize current research on transformer architecture efficiency improvements, including sparse attention mechanisms, mixture of experts, and linear attention variants. Compare their tradeoffs for production deployment.",
    outputDescription:
      "Comprehensive synthesis with inline citations, flagged uncertainties with confidence intervals, per-conclusion confidence scores, and preserved minority opinions where models disagreed on evidence interpretation.",
    whyDeliberation:
      "Multiple models reduce single-model hallucination and confirmation bias by up to 15%. When one model cites a finding, others verify it independently — catching fabricated citations and misrepresented conclusions that single-model approaches propagate unchecked. Three rounds of cross-examination force progressively deeper engagement with the evidence.",
  },
  {
    id: "risk-assessment",
    icon: ShieldAlert,
    title: "Risk Assessment",
    mode: "Jury",
    template: "risk_assessment",
    models: 5,
    rounds: 3,
    modeIcon: Shield,
    modeColor: "bg-warm/12 text-warm-bright border-warm/20",
    attackCategories: [],
    description: [
      "Five models participate in a structured Jury deliberation with MANDATORY_DISSENT reporting across three rounds. Every risk assessment must include minority opinions — no conclusion is presented as unanimous unless mathematically verified through convergence detection (Kendall tau + Jaccard + concession rate >= 0.85). This prevents the groupthink that makes single-model risk assessments dangerously overconfident.",
      "Each model independently identifies risks, assesses likelihood and impact on standardized scales, and proposes mitigation strategies. During deliberation, models challenge each other's likelihood estimates and impact assessments, forcing quantitative justification. A model claiming 'low probability' must defend that assessment against adversarial questioning from four other models across three rounds.",
      "The output is a structured risk matrix with likelihood/impact ratings for each identified risk, detailed mitigation strategies with implementation timelines, and mandatory minority opinions. If even one model identifies a catastrophic risk that others dismiss, that dissent is prominently featured in the final report rather than averaged away. Agglomerative clustering groups related risks and surfaces overlooked tail risks.",
    ],
    rubric: [
      { name: "Risk Identification", weight: "25%" },
      { name: "Likelihood Assessment", weight: "20%" },
      { name: "Impact Analysis", weight: "20%" },
      { name: "Mitigation Quality", weight: "20%" },
      { name: "Compliance", weight: "15%" },
    ],
    examplePrompt:
      "Assess risks of migrating from AWS to multi-cloud architecture (AWS + GCP + Azure). Consider operational complexity, data sovereignty, cost implications, team skill gaps, vendor lock-in tradeoffs, and disaster recovery scenarios.",
    outputDescription:
      "Risk matrix with likelihood/impact ratings, mitigation strategies with implementation order, mandatory minority opinions from all five models, and a dissent report highlighting risks that only some models identified.",
    whyDeliberation:
      "MANDATORY_DISSENT ensures no risks are overlooked due to groupthink. In single-model assessments, the model's training biases determine which risks are emphasized. Five-model Jury deliberation with forced dissent surfaces the full risk landscape — including tail risks that any individual model would dismiss as unlikely.",
  },
  {
    id: "healthcare",
    icon: HeartPulse,
    title: "Healthcare Decision Support",
    mode: "Council",
    template: "healthcare",
    models: 3,
    rounds: 3,
    modeIcon: Users,
    modeColor: "bg-agree/14 text-agree border-agree/30",
    attackCategories: [],
    description: [
      "Healthcare deliberations enforce REQUIRE_DISSENT and REQUIRE_CITATIONS as non-negotiable constraints. Every diagnostic suggestion must cite specific clinical evidence, and every differential diagnosis must include dissenting opinions. This reflects the medical principle that premature diagnostic closure is the leading cause of diagnostic error — a problem that single-model systems systematically amplify.",
      "Models independently evaluate patient presentations, each generating a ranked differential diagnosis with supporting evidence across three rounds of deliberation. During cross-examination, models challenge each other's diagnostic reasoning — questioning whether symptoms truly support a proposed diagnosis, flagging overlooked conditions, and identifying potential drug interactions or contraindications that any single model might miss.",
      "The output includes a ranked differential diagnosis list with evidence chains for each condition, safety flags for critical findings that require immediate action, and explicit dissenting opinions where models disagreed on diagnosis likelihood. Every recommendation includes a confidence score calibrated by how well it withstood cross-examination — models that changed their diagnosis under pressure receive lower calibration scores.",
    ],
    rubric: [
      { name: "Evidence Quality", weight: "30%" },
      { name: "Diagnostic Accuracy", weight: "25%" },
      { name: "Safety Considerations", weight: "20%" },
      { name: "Completeness", weight: "15%" },
      { name: "Actionability", weight: "10%" },
    ],
    examplePrompt:
      "Evaluate differential diagnosis for a 45-year-old patient presenting with acute onset chest pain radiating to the left arm, diaphoresis, elevated troponin, but normal ECG. Consider cardiac, pulmonary, and gastrointestinal etiologies.",
    outputDescription:
      "Ranked differential diagnosis with evidence chains for each condition, safety flags for critical findings requiring immediate action, dissenting opinions on diagnosis likelihood, and confidence scores calibrated by cross-examination resilience.",
    whyDeliberation:
      "Safety-critical decisions need transparent disagreement and evidence chains. A single model might miss a rare but life-threatening diagnosis. REQUIRE_DISSENT ensures uncommon conditions are considered, and REQUIRE_CITATIONS prevents hallucinated medical guidance. Three rounds of deliberation force models to defend their diagnostic reasoning under adversarial scrutiny.",
  },
  {
    id: "legal-analysis",
    icon: Scale,
    title: "Legal Analysis",
    mode: "Blind",
    template: "legal",
    models: 2,
    rounds: 3,
    modeIcon: Eye,
    modeColor: "bg-warm/12 text-warm border-warm/20",
    attackCategories: [],
    description: [
      "Legal analysis uses Blind mode with a dialectical structure: one model argues risk, another argues acceptability, and evaluation happens without knowledge of which model produced which argument. This eliminates the brand bias where evaluators unconsciously favor responses from models they perceive as more authoritative. MANDATORY_DISSENT ensures both conservative and permissive legal interpretations are fully explored across three rounds.",
      "The dialectical format ensures both sides of every legal question are thoroughly explored. The risk-arguing model must identify every potential compliance gap, liability exposure, and regulatory risk. The acceptability-arguing model must demonstrate why current language or practices are legally defensible. Neither model knows the other's position during initial analysis, and the judge evaluates arguments in multiple orderings to prevent position bias.",
      "The blind judge evaluates arguments purely on legal merit, producing clause-by-clause risk ratings, regulatory gap analysis, and recommended revisions with alternative language. The final output includes a dissent report showing where the risk and acceptability models fundamentally disagreed, ensuring stakeholders see the full spectrum of legal opinion rather than a false consensus that masks genuine legal ambiguity.",
    ],
    rubric: [
      { name: "Legal Accuracy", weight: "30%" },
      { name: "Risk Identification", weight: "25%" },
      { name: "Regulatory Compliance", weight: "20%" },
      { name: "Practicality", weight: "15%" },
      { name: "Clarity", weight: "10%" },
    ],
    examplePrompt:
      "Review this SaaS terms of service for GDPR compliance risks. Evaluate data processing clauses, cross-border transfer mechanisms, data subject rights implementation, and breach notification procedures against current EU regulatory requirements.",
    outputDescription:
      "Clause-by-clause risk ratings (high/medium/low), regulatory gaps mapped to specific GDPR articles, recommended revisions with alternative language, and a dissent report showing where risk and acceptability models disagreed.",
    whyDeliberation:
      "Blind evaluation eliminates model bias — the judge cannot favor a 'brand name' model's analysis. The dialectical format with MANDATORY_DISSENT ensures both conservative and permissive legal interpretations are explored across three rounds, giving stakeholders the full picture rather than a single model's risk tolerance.",
  },
  {
    id: "financial-analysis",
    icon: TrendingUp,
    title: "Financial Analysis",
    mode: "Jury",
    template: "finance",
    models: 3,
    rounds: 3,
    modeIcon: BarChart3,
    modeColor: "bg-agree/14 text-agree border-agree/30",
    attackCategories: [],
    metrics: ["VaR", "CVaR", "Sharpe"],
    compliance: ["Basel III", "SOX", "Dodd-Frank", "MiFID II"],
    description: [
      "Financial analysis uses Jury mode with MANDATORY_DISSENT and requires quantitative metrics in every assessment. Three models must provide specific numerical analysis — VaR (Value at Risk), CVaR (Conditional Value at Risk), and Sharpe ratios — rather than qualitative hand-waving. Compliance mapping covers Basel III, SOX, Dodd-Frank, and MiFID II frameworks. Every quantitative claim is stress-tested across three rounds of deliberation.",
      "During deliberation, models challenge each other's quantitative assumptions. If one model projects 12% returns, another must stress-test that assumption against historical drawdown scenarios, current market volatility, and macroeconomic indicators. Scenario analysis is mandatory: bull case, base case, bear case, and black swan scenarios must all be addressed with specific numerical projections and probability-weighted outcomes.",
      "The output includes a comprehensive risk assessment with VaR/CVaR/Sharpe metrics, stress test results across multiple scenarios, regulatory compliance mapping against Basel III, SOX, Dodd-Frank, and MiFID II frameworks, hedging recommendations, and mandatory dissent. If one model identifies a systemic risk that others dismiss, that dissent is preserved with full quantitative backing — preventing the consensus bias that contributed to historical financial crises.",
    ],
    rubric: [
      { name: "Quantitative Rigor", weight: "30%" },
      { name: "Regulatory Alignment", weight: "25%" },
      { name: "Risk Coverage", weight: "20%" },
      { name: "Scenario Analysis", weight: "15%" },
      { name: "Actionability", weight: "10%" },
    ],
    examplePrompt:
      "Evaluate the risk profile of this investment portfolio under current market conditions: 40% US large-cap equities, 20% international developed markets, 15% emerging markets, 15% investment-grade bonds, 10% REITs. Consider interest rate sensitivity, geopolitical risk, and liquidity constraints.",
    outputDescription:
      "Risk assessment with VaR/CVaR/Sharpe metrics, stress test results across bull/base/bear/black-swan scenarios, Basel III/SOX/Dodd-Frank/MiFID II compliance mapping, hedging recommendations, and mandatory dissent on risk factors where models disagreed.",
    whyDeliberation:
      "Jury format with MANDATORY_DISSENT prevents consensus bias in financial decisions. Single models tend to anchor on base-case scenarios. Three-model deliberation with forced dissent ensures tail risks and contrarian indicators are quantified and preserved in the final analysis — the kind of minority opinion that gets averaged away in traditional risk committees.",
  },
];

function buildTemplateConfigSnippet(uc: (typeof useCases)[number]): string {
  const mode = uc.mode.toLowerCase().replaceAll("", "_");
  const lines: string[] = [
    `mode: "${mode}"`,
    `template: "${uc.template}"`,
    `models: ${uc.models}`,
    `rounds: ${uc.rounds}`,
  ];
  const requireDissent =
    uc.id === "risk-assessment" ||
    uc.id === "legal-analysis" ||
    uc.id === "financial-analysis" ||
    uc.id === "healthcare";
  lines.push(
    `require_dissent: ${requireDissent ? "true # MANDATORY" : "true"}`,
  );
  const requireCitations = uc.id === "healthcare" || uc.id === "legal-analysis";
  lines.push(
    `require_citations: ${requireCitations ? "true # REQUIRED" : "false"}`,
  );
  if (
    uc.id === "risk-assessment" ||
    uc.id === "legal-analysis" ||
    uc.id === "financial-analysis"
  ) {
    lines.push("mandatory_dissent: true");
  }
  if ("metrics" in uc) {
    const { metrics, compliance } = uc;
    if (metrics?.length) {
      lines.push(`metrics: [${metrics.join(",")}]`);
    }
    if (compliance?.length) {
      lines.push(`compliance: [${compliance.join(",")}]`);
    }
  }
  return lines.join("\n");
}

export default function UseCasesPage() {
  return (
    <div className="min-h-screen">
      <MarketingHero
        eyebrow="Use cases"
        title={
          <>
            How teams <em>use</em>
            <br />
            deliberation in practice.
          </>
        }
        description={
          <>
            Six vertical templates — code review, research synthesis, risk
            assessment, healthcare, legal, financial — pre-configured for the
            job.
          </>
        }
      />

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto space-y-24">
          {useCases.map((uc, index) => {
            const Icon = uc.icon;
            const ModeIcon = uc.modeIcon;
            return (
              <div key={uc.id} id={uc.id} className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </span>
                  <Icon className="h-7 w-7 text-warm" />
                  <h2 className="text-2xl md:text-3xl font-bold">{uc.title}</h2>
                </div>

                <div className="grid lg:grid-cols-3 gap-8 mt-6">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="flex flex-wrap gap-2">
                      <Badge className={uc.modeColor}>
                        <ModeIcon className="h-3 w-3 mr-1" />
                        {uc.mode} Mode
                      </Badge>
                      <Badge variant="outline">{uc.template} template</Badge>
                      <Badge variant="outline">{uc.models} models</Badge>
                      <Badge variant="outline">{uc.rounds} rounds</Badge>
                    </div>

                    {uc.attackCategories.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {uc.attackCategories.map((cat) => (
                          <Badge
                            key={cat}
                            className="bg-red-500/10 text-dissent border-red-500/20 font-mono text-xs"
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {"metrics" in uc && uc.metrics && uc.compliance && (
                      <div className="flex flex-wrap gap-2">
                        {uc.metrics.map((m) => (
                          <Badge
                            key={m}
                            className="bg-agree/14 text-agree border-agree/30 font-mono text-xs"
                          >
                            {m}
                          </Badge>
                        ))}
                        {uc.compliance.map((c) => (
                          <Badge key={c} variant="outline" className="text-xs">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="space-y-4">
                      {uc.description.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="text-muted-foreground leading-relaxed"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Example Prompt
                      </h3>
                      <pre className="overflow-x-auto rounded-lg bg-muted/50 border p-4 text-sm leading-relaxed">
                        <code className="text-muted-foreground whitespace-pre-wrap">
                          {uc.examplePrompt}
                        </code>
                      </pre>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                        Output
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {uc.outputDescription}
                      </p>
                    </div>

                    <div className="rounded-lg border border-warm/20 bg-warm/8 p-4">
                      <h3 className="text-sm font-semibold text-warm mb-2">
                        Why Deliberation Beats Single-Model
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {uc.whyDeliberation}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Evaluation Rubric
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {uc.rubric.map((r) => (
                            <div
                              key={r.name}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm text-muted-foreground">
                                {r.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-indigo-500"
                                    style={{ width: r.weight }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-muted-foreground w-8 text-right">
                                  {r.weight}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 pt-4 border-t">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left py-1.5 font-medium text-muted-foreground">
                                    Criterion
                                  </th>
                                  <th className="text-right py-1.5 font-medium text-muted-foreground">
                                    Weight
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {uc.rubric.map((r) => (
                                  <tr
                                    key={r.name}
                                    className="border-b border-border/50"
                                  >
                                    <td className="py-1.5 text-muted-foreground">
                                      {r.name}
                                    </td>
                                    <td className="py-1.5 text-right font-mono text-muted-foreground">
                                      {r.weight}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          Template Config
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs text-muted-foreground leading-relaxed overflow-x-auto">
                          <code>{buildTemplateConfigSnippet(uc)}</code>
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {index < useCases.length - 1 && (
                  <div className="border-b border-border/50 mt-16" />
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
