import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Zap, Users, FileText, Eye, Target, Shield, BarChart3, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbList,
  definedTermSetSchema,
  techArticleSchema,
} from "@/lib/structured-data";

const modesGlossary = definedTermSetSchema({
  name: "Consilium deliberation glossary",
  description:
    "Definitions of the eight Consilium deliberation modes plus the social-choice voting methods used to converge on a consensus answer.",
  path: "/docs/modes",
  terms: [
    { term: "Quick mode", description: "Single-round Consilium deliberation: one model proposes, the response is evaluated, and the answer is returned. Best for simple factual queries needing a fast sanity check.", url: "#quick" },
    { term: "Council mode", description: "Three-round Consilium deliberation with multiple models cross-examining each other through the full propose-challenge-rebut-evaluate-vote-synthesize pipeline. The default mode.", url: "#council" },
    { term: "Deep mode", description: "Five-round Consilium deliberation with sub-agents researching specific points before the next round. For high-stakes, mission-critical questions.", url: "#deep" },
    { term: "Blind mode", description: "Council deliberation with model identity stripped during evaluation so brand bias cannot influence votes.", url: "#blind" },
    { term: "Red Team mode", description: "Adversarial Consilium deliberation: one cohort of models attacks the proposal across eight categories, another defends, and a judge ruling produces the final answer.", url: "#redteam" },
    { term: "Jury mode", description: "Council deliberation with mandatory dissent: minority opinions are required output, modeled on common-law jury practice.", url: "#jury" },
    { term: "Market mode", description: "Probability aggregation using prediction-market mechanics: models stake credibility on positions, and confidences are averaged into a market price.", url: "#market" },
    { term: "Auto mode", description: "Complexity-based router that picks the appropriate Consilium mode for the query without the user specifying.", url: "#auto" },
    { term: "Condorcet method", description: "Voting method that selects the candidate who beats every other candidate in pairwise comparison. If no Condorcet winner exists, Consilium falls back to Ranked Pairs.", sameAs: "https://www.wikidata.org/wiki/Q839616" },
    { term: "Borda count", description: "Voting method that scores candidates by their position on each ballot. Consilium uses confidence-weighted Borda for ranking strength of agreement.", sameAs: "https://www.wikidata.org/wiki/Q777887" },
    { term: "Ranked Pairs", description: "Voting method that locks pairwise victories in order of margin without creating cycles. Used as the Condorcet fallback in Consilium.", sameAs: "https://www.wikidata.org/wiki/Q1192987" },
    { term: "Kendall tau", description: "Rank correlation coefficient. Consilium combines Kendall tau (weight 0.4) with Jaccard similarity (0.35) and concession rate (0.25) to detect convergence.", sameAs: "https://www.wikidata.org/wiki/Q1730681" },
  ],
});

const modesTechArticle = techArticleSchema({
  title: "Deliberation modes",
  description:
    "Reference for the eight deliberation modes in Consilium - quick, council, deep, blind, red team, jury, market, auto - with the voting and convergence math behind each.",
  path: "/docs/modes",
  proficiencyLevel: "Intermediate",
  publishedTime: "2026-04-15",
  modifiedTime: "2026-04-15",
});

const modesBreadcrumbs = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "Deliberation Modes", path: "/docs/modes" },
]);

export const metadata: Metadata = buildMetadata({
  title: "Deliberation Modes",
  description:
    "The eight deliberation modes in Consilium — classic debate, socratic, tree-of-thoughts, red-team, constitutional, ranked-choice, and more — each backed by peer-reviewed research.",
  path: "/docs/modes",
  keywords: ["ai deliberation modes", "multi-agent debate modes", "tree of thoughts", "socratic ai"],
});

const modesComparison = [
  { mode: "Quick", rounds: 1, models: "1", phases: "Propose → Evaluate → Output", time: "~15s", best: "Simple factual queries" },
  { mode: "Council", rounds: 3, models: "2-5", phases: "Full 8-phase pipeline", time: "~45s", best: "Architecture, technical decisions" },
  { mode: "Deep", rounds: 5, models: "2-5", phases: "Full 8-phase + sub-agents", time: "~90s", best: "High-stakes, mission-critical" },
  { mode: "Blind", rounds: 3, models: "2-5", phases: "Full 8-phase (anonymous)", time: "~45s", best: "Unbiased evaluation, legal" },
  { mode: "Red Team", rounds: 1, models: "3+", phases: "Propose → Attack → Defend → Judge", time: "~120s", best: "Security, adversarial testing" },
  { mode: "Jury", rounds: 3, models: "3-5", phases: "Full 8-phase + mandatory dissent", time: "~60s", best: "Risk, healthcare, compliance" },
  { mode: "Market", rounds: 5, models: "3+", phases: "Propose → Bet → Update → Converge", time: "~90s", best: "Prediction, probability, finance" },
  { mode: "Auto", rounds: "1-5", models: "1-5", phases: "Dynamically selected", time: "~45s", best: "When unsure which mode to use" },
];

const modes = [
  {
    key: "quick",
    icon: Zap,
    title: "Quick Mode",
    badge: "Fastest",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    phases: ["PROPOSAL", "EVALUATION", "OUTPUT"],
    maxRounds: 1,
    defaultModels: 1,
    description: "Single-round rapid analysis for straightforward questions. One model generates a response, it gets evaluated, and you receive the output. No debate, no cross-examination — just a fast, direct answer.",
    whenToUse: [
      "Simple factual questions: \"What is the time complexity of quicksort?\"",
      "Quick sanity checks on a single idea",
      "Time-constrained decisions where speed matters more than depth",
      "Low-stakes queries that don't warrant multi-model debate",
    ],
    technicalDetails: "Bypasses challenge, rebuttal, voting, and convergence phases entirely. Cost is minimal: one API call to one model. Useful as a baseline to compare against multi-model deliberation results.",
  },
  {
    key: "council",
    icon: Users,
    title: "Council Mode",
    badge: "Default",
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    phases: ["PROPOSAL", "CHALLENGE", "REBUTTAL", "EVALUATION", "VOTING", "AGGREGATION", "CONVERGENCE", "OUTPUT"],
    maxRounds: 3,
    defaultModels: "2-5",
    description: "The standard multi-round deliberation mode. Models independently propose positions, cross-examine each other's reasoning, defend or revise their claims, then vote using formal social choice theory. The debate continues until mathematical convergence is detected or max rounds are reached.",
    whenToUse: [
      "Architecture decisions: \"Should we use microservices or a monolith?\"",
      "Complex technical questions requiring diverse perspectives",
      "Design decisions where trade-offs need explicit exploration",
      "Any question where you want genuine multi-model debate",
    ],
    technicalDetails: "Voting uses Condorcet method (checks if any candidate beats all others pairwise) with Ranked Pairs fallback. Convergence score = 0.4 * ranking_similarity + 0.35 * proposal_similarity + 0.25 * concession_rate. Converged when score >= 0.85. Borda count provides confidence-weighted scoring for full ranking.",
  },
  {
    key: "deep",
    icon: FileText,
    title: "Deep Mode",
    badge: "Most Thorough",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    phases: ["PROPOSAL", "CHALLENGE", "REBUTTAL", "EVALUATION", "VOTING", "AGGREGATION", "CONVERGENCE", "OUTPUT"],
    maxRounds: 5,
    defaultModels: "2-5",
    description: "Extended deliberation for high-stakes decisions. Same phase pipeline as Council but with 5 rounds instead of 3, plus sub-agent research capability. The additional rounds allow positions to evolve more thoroughly through multiple cycles of challenge and defense.",
    whenToUse: [
      "Security audits requiring exhaustive vulnerability analysis",
      "Compliance reviews where missing something has real consequences",
      "Mission-critical architecture decisions",
      "Complex research questions needing deep exploration",
    ],
    technicalDetails: "5 rounds means 5 full cycles of propose-challenge-rebut-evaluate-vote-converge. Sub-agents can be spawned for targeted research within each round. Higher cost but significantly more thorough analysis. Convergence may trigger early if score >= 0.85 before round 5.",
  },
  {
    key: "blind",
    icon: Eye,
    title: "Blind Mode",
    badge: "Bias-Free",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    phases: ["PROPOSAL", "CHALLENGE", "REBUTTAL", "EVALUATION", "VOTING", "AGGREGATION", "CONVERGENCE", "OUTPUT"],
    maxRounds: 3,
    defaultModels: "2-5",
    description: "Anonymous evaluation that eliminates model identity bias. All proposals are stripped of model identity before evaluation. The judge evaluates arguments in multiple orderings to prevent anchoring bias — ensuring the quality of reasoning matters, not which company built the model.",
    whenToUse: [
      "Fair model comparison without brand bias",
      "Legal analysis where anchoring bias could skew outcomes",
      "Situations where you suspect evaluators favor certain providers",
      "Academic or research contexts requiring objectivity",
    ],
    technicalDetails: "Before evaluation, proposals are anonymized: model IDs mapped to anonymous_1, anonymous_2, etc. AI fingerprints stripped. Judge sees arguments in randomized orderings to prevent position bias. The legal template uses blind mode by default with two advocates (risk vs. acceptability).",
  },
  {
    key: "redteam",
    icon: Target,
    title: "Red Team Mode",
    badge: "Adversarial",
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/20",
    phases: ["PROPOSAL", "ATTACK", "DEFEND", "JUDGE_ATTACK", "OUTPUT"],
    maxRounds: 1,
    defaultModels: "3+",
    description: "Adversarial testing where models actively try to break each other's arguments. Attackers probe for vulnerabilities across 8 categories, defenders respond, and judges evaluate the validity of attacks and strength of defenses. Produces a comprehensive vulnerability report.",
    whenToUse: [
      "Security assessment of code, architectures, or proposals",
      "Finding vulnerabilities in business plans or strategies",
      "Stress-testing ideas before committing resources",
      "Code review focused on catching security issues",
    ],
    technicalDetails: "8 attack categories: LOGICAL_FLAW (reasoning errors), EDGE_CASE (boundary conditions), SECURITY_VULN (security vulnerabilities), BIAS_DETECTION (systematic biases), HALLUCINATION_PROBE (factual accuracy), PROMPT_INJECTION (injection attacks), ROBUSTNESS_TEST (input variations), CONSISTENCY_CHECK (contradictions). The code review template uses this mode with weights: security 30%, correctness 25%, performance 20%, maintainability 15%, style 10%.",
  },
  {
    key: "jury",
    icon: Shield,
    title: "Jury Mode",
    badge: "Mandatory Dissent",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    phases: ["PROPOSAL", "CHALLENGE", "REBUTTAL", "EVALUATION", "VOTING", "AGGREGATION", "CONVERGENCE", "OUTPUT"],
    maxRounds: 3,
    defaultModels: "3-5",
    description: "Panel deliberation with mandatory dissent reporting. Every result must explicitly declare both majority and minority positions — no decision is presented as unanimous unless mathematically verified through agglomerative clustering. Models must declare dissent even if they're in the minority.",
    whenToUse: [
      "Risk assessment where overlooking a minority opinion could be catastrophic",
      "Healthcare decisions requiring transparent disagreement",
      "Regulatory compliance requiring documented dissent",
      "Financial analysis where consensus bias is dangerous",
    ],
    technicalDetails: "MANDATORY_DISSENT flag forces dissent detection via agglomerative clustering. Builds Jaccard similarity matrix between proposals, iteratively merges clusters (threshold >= 0.5). Single cluster = genuine consensus. Multiple clusters = dissent with majority/minority positions. The risk assessment and finance templates use this mode by default.",
  },
  {
    key: "market",
    icon: BarChart3,
    title: "Market Mode (Truth Market)",
    badge: "Probabilistic",
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    phases: ["PROPOSAL", "BET", "MARKET_UPDATE", "CONVERGENCE", "OUTPUT"],
    maxRounds: 5,
    defaultModels: "3+",
    description: "Prediction market mechanism for probabilistic consensus. Models assign probability distributions to outcomes, then update their positions based on others' assessments using log-opinion pooling. The market converges when the maximum difference between consecutive probability distributions falls below 5%.",
    whenToUse: [
      "Prediction and forecasting questions",
      "Probability estimation (\"What's the likelihood of X?\")",
      "Financial analysis with bull/bear perspectives",
      "Scenarios requiring quantified uncertainty",
    ],
    technicalDetails: "Log-opinion pooling: each model's probability distribution is combined using logarithmic aggregation, which naturally weights extreme positions less. Convergence triggered when max(|P_t - P_{t-1}|) < 0.05 across all outcome probabilities. Unlike voting-based modes, this produces a probability distribution rather than a single winner.",
  },
  {
    key: "auto",
    icon: Sparkles,
    title: "Auto Mode",
    badge: "Smart Routing",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    phases: ["Dynamically Selected"],
    maxRounds: "1-5",
    defaultModels: "1-5",
    description: "Intelligent routing that analyzes your query's complexity and automatically selects the optimal mode, number of models, and round count. Uses feature extraction (token count, code presence, stakes keywords, analytical/creative nature) to score complexity and route accordingly.",
    whenToUse: [
      "When you're not sure which mode to pick",
      "General-purpose usage where cost optimization matters",
      "Mixed-complexity workflows with varying query types",
      "Building applications that handle diverse user queries",
    ],
    technicalDetails: "Complexity scoring: base from token count (<20: 0.1, ≤100: 0.3, ≤500: 0.5, >500: 0.7). Adjustments: +0.2 for code, +0.3 for stakes keywords (medical/legal/financial/security/compliance/hipaa/soc), +0.2 for analytical, +0.1 for creative, -0.2 for factual. Routing: score <0.3 → Quick/1 model, 0.3-0.6 → Council/3 models, ≥0.6 → Council or Deep with 3-5 models.",
  },
];

export default function ModesPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-modes-techarticle" data={modesTechArticle} />
      <JsonLd id="ld-modes-glossary" data={modesGlossary} />
      <JsonLd id="ld-modes-breadcrumbs" data={modesBreadcrumbs} />
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
            8 Deliberation Modes
          </h1>
          <p className="text-xl text-muted-foreground">
            Each mode implements a distinct debate protocol optimized for specific decision types. Choose the mode that matches your use case, or let Auto mode decide for you.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Comparison</h2>
          <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mode</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Rounds</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Models</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Phases</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Best For</th>
                </tr>
              </thead>
              <tbody>
                {modesComparison.map((m) => (
                  <tr key={m.mode} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-4 py-3 font-medium">{m.mode}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.rounds}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.models}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">{m.phases}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.time}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{m.best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto space-y-12">
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <Card key={mode.key} id={mode.key}>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-6 w-6 text-indigo-400" />
                    <CardTitle className="text-xl">{mode.title}</CardTitle>
                    <Badge className={mode.badgeColor}>{mode.badge}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mode.description}
                  </p>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Max Rounds</p>
                      <p className="text-sm font-medium">{mode.maxRounds}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Models</p>
                      <p className="text-sm font-medium">{mode.defaultModels}</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Phases</p>
                      <p className="text-sm font-medium">{Array.isArray(mode.phases) ? mode.phases.length : "Dynamic"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Phase Pipeline</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(Array.isArray(mode.phases) ? mode.phases : [mode.phases]).map((phase, i) => (
                        <span key={i} className="inline-flex items-center gap-1">
                          <span className="rounded bg-indigo-500/10 px-2 py-1 text-xs font-mono text-indigo-400">
                            {phase}
                          </span>
                          {i < (Array.isArray(mode.phases) ? mode.phases.length : 1) - 1 && (
                            <span className="text-muted-foreground text-xs">→</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">When To Use</p>
                    <ul className="space-y-1.5">
                      {mode.whenToUse.map((use, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-indigo-400 mt-0.5 shrink-0">&#8226;</span>
                          {use}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Technical Details</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {mode.technicalDetails}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex gap-4 flex-wrap">
            <Link
              href="/docs/how-it-works"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700"
            >
              How the Engine Works
            </Link>
            <Link
              href="/docs/templates"
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent"
            >
              Vertical Templates
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
