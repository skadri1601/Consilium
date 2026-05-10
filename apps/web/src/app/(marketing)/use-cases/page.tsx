import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Use Cases",
  description:
    "How enterprises use Consilium for agent governance - decision validation, compliance audit, risk scoring, policy enforcement, and fleet management.",
  path: "/use-cases",
  keywords: [
    "agent governance use cases",
    "ai compliance",
    "agent fleet management",
    "ai risk scoring",
  ],
});
import {
  ShieldCheck,
  FileCheck,
  ShieldAlert,
  HeartPulse,
  Scale,
  TrendingUp,
  Target,
  Users,
  Eye,
  Shield,
  BarChart3,
  ScrollText,
  Network,
} from "lucide-react";

const useCases = [
  {
    id: "agent-decision-validation",
    icon: ShieldCheck,
    title: "Agent Decision Validation",
    mode: "Red Team",
    template: "agent_validation",
    models: 3,
    rounds: 2,
    modeIcon: Target,
    modeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    attackCategories: [
      "POLICY_VIOLATION",
      "RISK_THRESHOLD",
      "AUTHORITY_SCOPE",
      "BUDGET_LIMIT",
    ],
    description: [
      "Before an AI agent executes a high-stakes action, Consilium runs adversarial multi-model review. The validate MCP tool returns a confidence score, risk assessment, and dissent report. Three models independently evaluate the proposed action - one attacks finding policy violations and risk exposures, one defends proposing mitigations, and a judge evaluates severity and renders a go/no-go decision.",
      "During the Red Team phase, models issue typed challenges categorized as POLICY_VIOLATION, RISK_THRESHOLD, AUTHORITY_SCOPE, or BUDGET_LIMIT. A defender model must rebut each challenge with evidence - conceding valid violations, refuting false positives, qualifying scope boundaries, or demonstrating budget compliance. This adversarial dynamic mirrors the separation of duties required by SOC 2 and ISO 27001.",
      "The judge model synthesizes all findings into a validation report with a confidence score (0-1), severity ratings for each identified risk, and a binary approve/deny recommendation with full reasoning chain. Every validation produces a compliance-grade audit document with model attributions, dissent preservation, and cost breakdown. The validate MCP tool can be called by any AI client - Claude Code, Cursor, custom agent frameworks - making governance a single function call.",
    ],
    rubric: [
      { name: "Policy Compliance", weight: "30%" },
      { name: "Risk Assessment", weight: "25%" },
      { name: "Authority Verification", weight: "20%" },
      { name: "Budget Impact", weight: "15%" },
      { name: "Audit Quality", weight: "10%" },
    ],
    examplePrompt:
      "Validate: Sales agent proposing a 25% discount on a $500K enterprise deal. Agent authority limit is 15%. Customer has been in negotiation for 90 days. Competitor offering similar terms.",
    outputDescription:
      "Validation report with confidence score (0-1), policy compliance status, risk severity ratings, approve/deny recommendation with full reasoning chain, and compliance-grade audit document.",
    whyDeliberation:
      "Single-model validation creates a single point of failure for agent governance. Adversarial multi-model review ensures that policy violations, budget overruns, and authority scope breaches are caught before agents act - not after. The Red Team structure prevents rubber-stamp approvals while the dissent report gives human reviewers full visibility into edge cases.",
  },
  {
    id: "compliance-audit",
    icon: FileCheck,
    title: "Compliance & Audit",
    mode: "Council",
    template: "compliance_audit",
    models: 3,
    rounds: 3,
    modeIcon: Users,
    modeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    attackCategories: [],
    description: [
      "Every deliberation produces a compliance-grade audit document with full reasoning chains, model attributions, and dissent preservation. EU AI Act and SOC 2 ready. Three models deliberate across three rounds, generating a structured record that satisfies the transparency and documentation requirements of major regulatory frameworks.",
      "During deliberation, models independently evaluate agent decisions against applicable regulatory requirements - GDPR data handling, EU AI Act high-risk obligations, SOC 2 trust service criteria, HIPAA safeguards, or industry-specific regulations. Each model cites specific regulatory articles and maps agent behavior to compliance requirements. Cross-examination forces models to identify gaps in compliance coverage and resolve ambiguities in regulatory interpretation.",
      "The final audit document includes a regulatory mapping table (agent action to specific regulation clause), compliance status per requirement, remediation recommendations for gaps, and a dissent report preserving minority interpretations where regulations are ambiguous. High-risk AI obligations under the EU AI Act take effect August 2, 2026 - Consilium's audit trail provides the documentation infrastructure required for conformity assessments.",
    ],
    rubric: [
      { name: "Regulatory Coverage", weight: "30%" },
      { name: "Evidence Quality", weight: "25%" },
      { name: "Gap Identification", weight: "20%" },
      { name: "Remediation Quality", weight: "15%" },
      { name: "Documentation", weight: "10%" },
    ],
    examplePrompt:
      "Audit this AI agent's loan approval workflow for EU AI Act compliance. The agent accesses credit scores, employment history, and demographic data. It makes approval/denial recommendations with a human-in-the-loop for denials over $100K.",
    outputDescription:
      "Compliance audit with regulatory mapping table, per-requirement compliance status, gap analysis with remediation steps, dissent report on ambiguous interpretations, and exportable audit document for conformity assessments.",
    whyDeliberation:
      "Regulatory interpretation is inherently ambiguous. A single model's compliance assessment reflects its training biases - it may over-index on familiar regulations and miss emerging requirements. Three-model deliberation with cross-examination ensures comprehensive regulatory coverage, and dissent preservation captures the interpretive ambiguities that regulators actually care about.",
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
    modeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    attackCategories: [],
    description: [
      "Continuous adversarial risk scoring for agent fleets. One model attacks a proposal finding vulnerabilities, another defends proposing mitigations, a judge evaluates severity. Track risk trends and detect drift over time. Five models participate in a structured Jury deliberation with MANDATORY_DISSENT reporting across three rounds - no conclusion is presented as unanimous unless mathematically verified through convergence detection (score >= 0.85).",
      "Each model independently identifies risks across agent operations, assesses likelihood and impact on standardized scales, and proposes mitigation strategies. During deliberation, models challenge each other's likelihood estimates and impact assessments, forcing quantitative justification. The continuous risk monitor tracks scores over time and detects when an agent's risk profile drifts - surfacing degradation before it becomes a compliance violation.",
      "The output is a structured risk matrix with likelihood/impact ratings for each identified risk, detailed mitigation strategies with implementation timelines, trend analysis showing risk score evolution, and mandatory minority opinions. If even one model identifies a catastrophic risk that others dismiss, that dissent is prominently featured in the final report. Agglomerative clustering groups related risks and surfaces overlooked tail risks across the entire agent fleet.",
    ],
    rubric: [
      { name: "Risk Identification", weight: "25%" },
      { name: "Likelihood Assessment", weight: "20%" },
      { name: "Impact Analysis", weight: "20%" },
      { name: "Mitigation Quality", weight: "20%" },
      { name: "Trend Detection", weight: "15%" },
    ],
    examplePrompt:
      "Score risk for a customer service agent fleet handling 50K interactions/day. Agents can issue refunds up to $500, modify account settings, and escalate to human agents. Evaluate: authority scope creep, PII exposure, financial loss vectors, and compliance drift.",
    outputDescription:
      "Risk matrix with likelihood/impact ratings, mitigation strategies with implementation order, risk trend analysis, mandatory minority opinions from all five models, and drift detection alerts for degrading risk profiles.",
    whyDeliberation:
      "MANDATORY_DISSENT ensures no risks are overlooked due to groupthink. In single-model assessments, the model's training biases determine which risks are emphasized. Five-model Jury deliberation with forced dissent surfaces the full risk landscape - including tail risks and drift patterns that any individual model would dismiss as unlikely.",
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
    modeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    attackCategories: [],
    description: [
      "Multi-model deliberation for contract review, liability analysis, and regulatory compliance. Red-team mode stress-tests legal reasoning before filing. Blind mode ensures evaluation happens without knowledge of which model produced which argument, eliminating the brand bias where evaluators unconsciously favor responses from models they perceive as more authoritative. MANDATORY_DISSENT ensures both conservative and permissive legal interpretations are fully explored.",
      "The dialectical format ensures both sides of every legal question are thoroughly explored. The risk-arguing model must identify every potential compliance gap, liability exposure, and regulatory risk. The acceptability-arguing model must demonstrate why current language or practices are legally defensible. Neither model knows the other's position during initial analysis, and the judge evaluates arguments in multiple orderings to prevent position bias.",
      "The blind judge evaluates arguments purely on legal merit, producing clause-by-clause risk ratings, regulatory gap analysis, and recommended revisions with alternative language. For agent governance, this means every agent-executed contract modification, terms acceptance, or regulatory filing is stress-tested by adversarial legal review before execution. The dissent report ensures stakeholders see the full spectrum of legal opinion rather than a false consensus.",
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
      "Blind evaluation eliminates model bias - the judge cannot favor a 'brand name' model's analysis. The dialectical format with MANDATORY_DISSENT ensures both conservative and permissive legal interpretations are explored across three rounds, giving stakeholders the full picture rather than a single model's risk tolerance.",
  },
  {
    id: "healthcare",
    icon: HeartPulse,
    title: "Healthcare Decisions",
    mode: "Council",
    template: "healthcare",
    models: 3,
    rounds: 3,
    modeIcon: Users,
    modeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    attackCategories: [],
    description: [
      "Diagnostic differentials, drug interaction analysis, and prior authorization appeals evaluated by multiple models with mandatory dissent preservation. Healthcare deliberations enforce REQUIRE_DISSENT and REQUIRE_CITATIONS as non-negotiable constraints. Every diagnostic suggestion must cite specific clinical evidence, and every differential diagnosis must include dissenting opinions.",
      "Models independently evaluate patient presentations, each generating a ranked differential diagnosis with supporting evidence across three rounds of deliberation. During cross-examination, models challenge each other's diagnostic reasoning - questioning whether symptoms truly support a proposed diagnosis, flagging overlooked conditions, and identifying potential drug interactions or contraindications that any single model might miss.",
      "The output includes a ranked differential diagnosis list with evidence chains for each condition, safety flags for critical findings that require immediate action, and explicit dissenting opinions where models disagreed on diagnosis likelihood. For agent governance in healthcare, this means every AI-assisted triage, diagnostic recommendation, or treatment suggestion is validated by adversarial multi-model review with full audit trail before reaching clinicians.",
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
    id: "financial-trade-validation",
    icon: TrendingUp,
    title: "Financial Trade Validation",
    mode: "Jury",
    template: "finance",
    models: 3,
    rounds: 3,
    modeIcon: BarChart3,
    modeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    attackCategories: [],
    metrics: ["VaR", "CVaR", "Sharpe"],
    compliance: ["Basel III", "SOX", "Dodd-Frank", "MiFID II"],
    description: [
      "Before an agent executes a trade, Consilium's quorum voting requires multiple models to independently approve. Budget controls enforce per-agent spending limits. Three models must provide specific numerical analysis - VaR (Value at Risk), CVaR (Conditional Value at Risk), and Sharpe ratios - with MANDATORY_DISSENT ensuring every quantitative claim is stress-tested across three rounds of deliberation.",
      "During deliberation, models challenge each other's quantitative assumptions. If one model approves a trade projection, another must stress-test that assumption against historical drawdown scenarios, current market volatility, and macroeconomic indicators. Quorum voting means no single model can approve a trade unilaterally - the majority must independently agree that the risk/reward profile falls within policy bounds and budget constraints.",
      "The output includes a comprehensive trade validation with VaR/CVaR/Sharpe metrics, stress test results across multiple scenarios, regulatory compliance mapping against Basel III, SOX, Dodd-Frank, and MiFID II frameworks, and a binary approve/deny with full reasoning chain. Budget controls automatically enforce per-agent and per-trade spending limits, blocking any execution that exceeds authorized thresholds. Mandatory dissent preserves contrarian risk assessments.",
    ],
    rubric: [
      { name: "Quantitative Rigor", weight: "30%" },
      { name: "Regulatory Alignment", weight: "25%" },
      { name: "Risk Coverage", weight: "20%" },
      { name: "Budget Compliance", weight: "15%" },
      { name: "Actionability", weight: "10%" },
    ],
    examplePrompt:
      "Validate: Trading agent proposing to execute a $2M equity swap. Agent daily limit is $5M, $3.2M already committed. Portfolio VaR threshold is 2.5%. Evaluate counterparty risk, liquidity impact, and regulatory compliance.",
    outputDescription:
      "Trade validation with VaR/CVaR/Sharpe metrics, quorum vote result (approve/deny), budget impact analysis, regulatory compliance mapping, stress test results, and mandatory dissent on risk factors where models disagreed.",
    whyDeliberation:
      "Quorum voting prevents single-point-of-failure approvals for financial trades. Single models tend to anchor on base-case scenarios. Three-model deliberation with forced dissent and budget controls ensures tail risks are quantified, spending limits are enforced, and contrarian risk indicators are preserved - the kind of minority opinion that gets averaged away in single-model validation.",
  },
  {
    id: "policy-enforcement",
    icon: ScrollText,
    title: "Policy Enforcement",
    mode: "Red Team",
    template: "policy_enforcement",
    models: 3,
    rounds: 2,
    modeIcon: Target,
    modeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    attackCategories: [
      "POLICY_VIOLATION",
      "SCOPE_EXCEEDED",
      "BUDGET_BREACH",
      "AUTHORITY_GAP",
    ],
    description: [
      "Define governance policies: 'Sales agents can offer up to 15% discount without approval.' Consilium's policy engine evaluates every agent action against organizational rules. Three models independently assess the proposed action - one identifies policy violations and scope breaches, one defends the action's compliance with existing policies, and a judge renders a verdict with full reasoning chain.",
      "During the Red Team phase, the attacker model issues typed challenges categorized as POLICY_VIOLATION, SCOPE_EXCEEDED, BUDGET_BREACH, or AUTHORITY_GAP. The defender must rebut each challenge by citing specific policy clauses, demonstrating authority chain compliance, or showing budget availability. Policies are expressed as structured rules with conditions, thresholds, and escalation paths - not as vague natural language guidelines.",
      "The policy engine produces a structured enforcement report: policy compliance status (pass/fail per rule), violation severity ratings, escalation recommendations, and a complete audit trail mapping every agent action to every applicable policy. For organizations deploying agent fleets, this transforms governance from manual review into automated, adversarial policy enforcement that scales with the number of agents.",
    ],
    rubric: [
      { name: "Policy Coverage", weight: "30%" },
      { name: "Violation Detection", weight: "25%" },
      { name: "Severity Assessment", weight: "20%" },
      { name: "Escalation Quality", weight: "15%" },
      { name: "Audit Trail", weight: "10%" },
    ],
    examplePrompt:
      "Enforce: Procurement agent requesting approval to sign a $75K annual SaaS contract. Policy: agents can approve up to $50K without VP sign-off. Agent has approved $180K in the current quarter against a $200K quarterly limit.",
    outputDescription:
      "Policy enforcement report with per-rule compliance status, violation severity ratings, escalation path with required approvers, budget impact analysis, and compliance-grade audit trail.",
    whyDeliberation:
      "Static rule engines catch obvious violations but miss context-dependent edge cases. Adversarial multi-model policy enforcement stress-tests every action against the spirit and letter of organizational policies, catching loopholes, scope creep, and authority gaps that rule-based systems miss. The dissent report surfaces policy ambiguities that need human clarification.",
  },
  {
    id: "agent-fleet-governance",
    icon: Network,
    title: "Agent Fleet Governance",
    mode: "Council",
    template: "fleet_governance",
    models: 3,
    rounds: 3,
    modeIcon: Users,
    modeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    attackCategories: [],
    description: [
      "Delegation hierarchies, budget controls, and quorum voting for enterprise agent deployments. The Active Directory for AI agents. Three models deliberate on fleet-wide governance configurations, evaluating delegation chains, authority scopes, and budget allocations across the entire agent hierarchy to prevent privilege escalation and spending drift.",
      "During deliberation, models independently assess fleet governance structures - reviewing delegation hierarchies for circular authority, budget allocations for over-provisioning, quorum requirements for appropriate rigor, and escalation paths for completeness. Cross-examination forces models to identify governance gaps: agents with overlapping authority, missing escalation paths, budget pools without spending limits, or delegation chains that bypass required human oversight.",
      "The output includes a fleet governance assessment with delegation hierarchy visualization, budget allocation analysis, quorum configuration recommendations, escalation path completeness scoring, and a dissent report highlighting governance risks that only some models identified. For enterprises deploying hundreds of AI agents, this provides the structural machinery for who decides what an agent can do, how decisions are audited, and who is accountable.",
    ],
    rubric: [
      { name: "Hierarchy Design", weight: "25%" },
      { name: "Budget Controls", weight: "25%" },
      { name: "Authority Scope", weight: "20%" },
      { name: "Escalation Coverage", weight: "15%" },
      { name: "Accountability", weight: "15%" },
    ],
    examplePrompt:
      "Evaluate fleet governance for a 200-agent deployment: 50 customer service agents ($500 refund limit), 30 sales agents (15% discount authority), 20 procurement agents ($50K approval limit), 100 internal ops agents. Assess delegation hierarchy, budget controls, and escalation paths.",
    outputDescription:
      "Fleet governance assessment with delegation hierarchy analysis, budget allocation review, quorum configuration recommendations, escalation path scoring, privilege escalation risks, and dissent report on governance gaps.",
    whyDeliberation:
      "Fleet governance is too complex for single-model assessment. Delegation hierarchies, budget controls, and authority scopes create combinatorial complexity where privilege escalation paths hide in the interactions between agents. Three-model deliberation surfaces governance gaps that emerge from the system-level view - the kind of systemic risks that per-agent review misses entirely.",
  },
];

function buildTemplateConfigSnippet(uc: (typeof useCases)[number]): string {
  const mode = uc.mode.toLowerCase().replaceAll(" ", "_");
  const lines: string[] = [
    `mode: "${mode}"`,
    `template: "${uc.template}"`,
    `models: ${uc.models}`,
    `rounds: ${uc.rounds}`,
  ];
  const requireDissent =
    uc.id === "risk-assessment" ||
    uc.id === "legal-analysis" ||
    uc.id === "financial-trade-validation" ||
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
    uc.id === "financial-trade-validation"
  ) {
    lines.push("mandatory_dissent: true");
  }
  if ("metrics" in uc) {
    const { metrics, compliance } = uc;
    if (metrics?.length) {
      lines.push(`metrics: [${metrics.join(", ")}]`);
    }
    if (compliance?.length) {
      lines.push(`compliance: [${compliance.join(", ")}]`);
    }
  }
  return lines.join("\n");
}

export default function UseCasesPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            8 Governance Templates
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Use Cases</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            How enterprises use Consilium to govern AI agent fleets. Each use
            case maps to a specific deliberation mode, evaluation rubric, and
            compliance-grade audit output.
          </p>
        </div>
      </section>

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
                  <Icon className="h-7 w-7 text-indigo-400" />
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
                            className="bg-red-500/10 text-red-400 border-red-500/20 font-mono text-xs"
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
                            className="bg-sky-500/10 text-sky-400 border-sky-500/20 font-mono text-xs"
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

                    <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
                      <h3 className="text-sm font-semibold text-indigo-400 mb-2">
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
