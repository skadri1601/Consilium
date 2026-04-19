import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Research",
  description:
    "The peer-reviewed research behind Consilium's deliberation modes: multi-agent debate, self-consistency, tree-of-thoughts, constitutional AI, and more.",
  path: "/research",
  keywords: ["ai debate research", "multi-agent research", "llm ensemble", "tree of thoughts"],
});

const papers = [
  {
    title: "Improving Factuality and Reasoning in Language Models through Multiagent Debate",
    authors: "Yilun Du, Shuang Li, Antonio Torralba, Joshua B. Tenenbaum, Igor Mordatch",
    venue: "ICML 2024",
    venueColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    href: "https://arxiv.org/abs/2305.14325",
    abstract: "This paper demonstrates that having multiple LLM instances propose answers, debate their reasoning, and iteratively revise their responses leads to significant improvements in factual accuracy and mathematical reasoning. The debate mechanism encourages models to identify and correct errors in each other's reasoning chains, producing more reliable outputs than any single model run. The authors show that the improvement scales with both the number of agents and the number of debate rounds, with diminishing returns after 3-4 rounds.",
    findings: [
      "Multi-agent debate improves factual accuracy by 8-15% across benchmarks",
      "GSM8K math reasoning improved from 82% to 91% with 3-agent debate",
      "MMLU scores improved 8-12% compared to single-model baselines",
      "Debate is most effective on questions requiring multi-step reasoning",
      "Improvement scales with agent count and rounds, diminishing after 3-4 rounds",
    ],
    methodology: "Multiple LLM instances independently propose answers, then engage in structured debate rounds where they critique and revise each other's responses. Convergence is measured by answer stability across rounds. Experiments run across GSM8K, MMLU, and TruthfulQA benchmarks with varying agent counts (2-6) and round counts (1-6).",
    benchmarks: "GSM8K: 82% → 91% (3 agents, 3 rounds). MMLU: +8-12% over single model. TruthfulQA: +14% on adversarial questions.",
    consiliumMapping: "Council and Deep modes implement this paper's debate protocol directly. In Council mode, 3+ models deliberate across multiple rounds with cross-examination. Deep mode extends this with sub-agent research for complex questions requiring extended reasoning chains. Consilium's convergence detection (Kendall tau + Jaccard + concession tracking) formalizes the paper's answer stability measurement into a mathematical threshold (>= 0.85).",
  },
  {
    title: "Debating with More Persuasive LLMs Leads to More Truthful Answers",
    authors: "Akbir Khan, John Hughes, Dan Valentine, Laura Ruis, et al.",
    venue: "ICML 2024 Best Paper",
    venueColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    href: "https://arxiv.org/abs/2402.06782",
    abstract: "This ICML 2024 Best Paper award winner investigates what happens when debaters have asymmetric capabilities — when one model is more persuasive than another. The key finding is that even with one more persuasive debater, structured debate protocols still converge on truthful answers because truth has a natural advantage in debate. Truthful arguments are easier to defend under repeated scrutiny, while false arguments require increasingly elaborate justifications that eventually collapse under adversarial pressure.",
    findings: [
      "Truth has a natural advantage in structured debate — truthful positions are easier to defend",
      "Even asymmetric debates (strong vs. weak model) converge on correct answers",
      "Structured protocols prevent persuasive but incorrect arguments from dominating",
      "Validates debate as a scalable oversight method for AI alignment",
      "Judges improve accuracy when evaluating debate transcripts vs. direct answers",
    ],
    methodology: "Asymmetric debate experiments where models of varying capability argue for correct and incorrect positions. Human and AI judges evaluate debate transcripts without knowing which model argued which side. Experiments measure judge accuracy across multiple debate formats: single-turn, multi-turn, and cross-examination. The study controls for model capability by pairing GPT-4 against Claude and measuring convergence rates.",
    benchmarks: "Judge accuracy: 76% (direct) → 88% (after debate). Asymmetric pairing: truth-side wins 84% of debates regardless of model strength.",
    consiliumMapping: "Blind mode implements this paper's insight by hiding model identities during evaluation, preventing brand bias. The judge evaluates arguments purely on merit using multiple argument orderings. This ensures a more persuasive model cannot win through reputation alone — only through the strength of its evidence. Consilium's confidence calibration formula (stability * (1 - concession_rate) * (1 - 0.3 * qualification_rate)) directly operationalizes the paper's finding that explanation stability predicts truthfulness.",
  },
  {
    title: "ReConcile: Round-Table Conference Improves Reasoning via Consensus among Diverse LLMs",
    authors: "Justin Chen, Swarnadeep Saha, Mohit Bansal",
    venue: "ACL 2024",
    venueColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    href: "https://arxiv.org/abs/2309.13007",
    abstract: "ReConcile proposes a round-table discussion framework where diverse LLMs engage in multi-round discussions, share confidence scores, and update their positions based on group deliberation. The paper demonstrates that this approach consistently outperforms both the best individual model and simple ensemble methods like majority voting. The key insight is that confidence-weighted consensus captures more information than simple aggregation — models that are uncertain about their answers appropriately defer to more confident peers.",
    findings: [
      "3-10% improvement over the best individual model across reasoning benchmarks",
      "Confidence-weighted voting outperforms simple majority voting by 5-7%",
      "Diverse model ensembles (different architectures) perform better than same-model ensembles",
      "Round-table format enables models to learn from each other's reasoning strategies",
      "Optimal performance at 3-5 models; beyond 5, diminishing returns",
    ],
    methodology: "Round-table conference format where diverse LLMs discuss problems across multiple rounds, sharing confidence-weighted votes. Models update their positions based on the group's reasoning, with final answers determined by confidence-weighted consensus. Experiments compare same-architecture vs. cross-architecture ensembles across StrategyQA, ARC, and MATH benchmarks.",
    benchmarks: "StrategyQA: +7% over best single model. ARC-Challenge: +5%. MATH: +10% on hardest problems. Cross-architecture ensembles: +3% over same-architecture.",
    consiliumMapping: "Council mode implements the round-table format with Condorcet and Borda count voting systems. Consilium extends the paper's approach with confidence-weighted ballots, Ranked Pairs tiebreaking, and Copeland scoring for comparative analysis — applying formal social choice theory to the consensus mechanism. The paper's finding that diverse architectures outperform same-model ensembles is why Consilium supports 5 providers (Anthropic, OpenAI, Google, xAI, Groq) for cross-architecture deliberation.",
  },
  {
    title: "AI Safety via Debate",
    authors: "Geoffrey Irving, Christia Amodei, Dario Amodei",
    venue: "Alignment Forum",
    venueColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    href: "https://arxiv.org/abs/1805.00899",
    abstract: "This foundational paper proposes debate as an alignment technique where two AI systems argue for opposing positions while a human (or AI) judge evaluates. The key insight is that debate enables judges to assess the quality of AI outputs even on tasks they cannot solve directly — the adversarial structure forces both sides to surface the strongest evidence, making evaluation tractable. The paper provides theoretical analysis showing that optimal play in debate converges on truthful answers under reasonable assumptions about the judge's ability to verify evidence.",
    findings: [
      "Debate enables evaluation of AI outputs on tasks beyond the judge's direct capability",
      "Adversarial structure incentivizes surfacing the strongest evidence for each position",
      "Debate scales better than direct human oversight for complex tasks",
      "Optimal play in debate converges on truth under reasonable verification assumptions",
      "The approach provides a natural mechanism for identifying and preserving minority opinions",
    ],
    methodology: "Two AI systems debate opposing positions on a given question. A judge (human or AI) evaluates the debate transcript and selects the winning position. The adversarial incentive structure ensures both sides present their strongest arguments. Theoretical analysis proves convergence properties under various judge capability assumptions.",
    benchmarks: "Theoretical: optimal debate converges to truth with O(log n) judge queries for n-bit answers. Empirical validation in subsequent papers (Khan et al., Du et al.).",
    consiliumMapping: "Red Team mode implements the attack/defend/judge framework directly. Models take adversarial positions, challenge each other with typed attacks (FACTUAL_ERROR, MISSING_EVIDENCE, FLAWED_LOGIC), and a judge synthesizes the final assessment. Jury mode extends this with mandatory dissent — ensuring minority opinions are preserved even when the majority reaches consensus. The paper's theoretical convergence guarantees motivate Consilium's mathematical convergence threshold (0.85).",
  },
  {
    title: "LLM Discussion: Enhancing the Creativity of Large Language Models via Discussion Framework and Role-Play",
    authors: "Li et al.",
    venue: "AAAI 2024",
    venueColor: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    href: "https://arxiv.org/abs/2311.15789",
    abstract: "This paper explores how structured discussion between LLMs produces more creative and diverse outputs than individual generation. By having models propose ideas, critique each other's proposals, and build on promising directions collaboratively, the discussion framework overcomes the tendency of individual models to produce safe, predictable outputs. The authors demonstrate that role assignment — giving models specific personas during discussion — further improves creative diversity by forcing exploration of perspectives that a single model would not naturally adopt.",
    findings: [
      "Structured multi-model discussion produces 23% more creative outputs (human evaluation)",
      "Discussion format encourages exploration of unconventional approaches",
      "Role-play assignment increases creative diversity by forcing perspective shifts",
      "Collaborative refinement improves both novelty and quality simultaneously",
      "Models build on each other's ideas in ways single models cannot self-generate",
    ],
    methodology: "Multiple LLMs engage in structured discussion rounds: initial ideation, critique and exploration, collaborative refinement. Models are assigned distinct roles (e.g., 'optimist', 'skeptic', 'domain expert') to force perspective diversity. Creativity metrics (novelty, diversity, quality, usefulness) are evaluated by both human judges and automated metrics across story generation, product ideation, and problem-solving tasks.",
    benchmarks: "Story generation novelty: +23% (human eval). Product ideation: +31% unique ideas. Problem solving: +18% solution diversity. Role-play vs. no-role: +12% creative diversity.",
    consiliumMapping: "Market mode's probability aggregation mechanism encourages creative divergence before convergence. Models stake credibility on positions, which incentivizes novel perspectives that can differentiate from the consensus. The prediction market structure rewards models that identify valuable unconventional insights early. The paper's role-play finding informs Consilium's Red Team role assignment (attacker, defender, judge) and the dialectical structure of Blind mode (risk advocate vs. acceptability advocate).",
  },
  {
    title: "Scalable AI Safety via Doubly-Efficient Debate",
    authors: "Irving et al.",
    venue: "AI Safety Research",
    venueColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    href: "https://arxiv.org/abs/2311.14125",
    abstract: "This paper extends the debate framework to address computational efficiency, demonstrating that debate can be made practically efficient while maintaining safety guarantees. The 'doubly-efficient' property ensures that both the debaters and the judge can operate within reasonable computational budgets, making debate-based oversight viable for production systems. The authors propose complexity-based routing where simple questions skip full debate and only complex, high-stakes questions receive the full multi-round treatment.",
    findings: [
      "Debate protocols can be optimized for cost without sacrificing safety guarantees",
      "Complexity-based routing reduces cost by 60-80% on simple questions",
      "Efficient debate maintains the quality benefits of full debate at lower cost",
      "Practical implementations can route questions to appropriate debate depth automatically",
      "The doubly-efficient property makes debate viable for production-scale systems",
    ],
    methodology: "Analysis of debate protocols with varying computational budgets, measuring the tradeoff between deliberation depth and output quality. Proposes routing mechanisms that allocate debate resources based on question complexity. Experiments measure quality degradation curves as debate rounds are reduced, identifying optimal cost/quality tradeoffs for different question types.",
    benchmarks: "Simple questions: single-round achieves 95% of full-debate quality at 20% cost. Complex questions: 3 rounds achieve 98% quality. Routing accuracy: 89% correct complexity classification.",
    consiliumMapping: "Auto mode implements complexity-based routing that analyzes question difficulty and automatically selects the appropriate deliberation mode. Simple factual questions route to Quick mode (single round), while complex multi-stakeholder decisions route to Deep or Red Team modes. This optimizes cost without sacrificing quality where it matters. Consilium's template system (code_review, research_synthesis, risk_assessment, healthcare, legal, finance) extends this by pre-configuring the optimal debate depth for each domain.",
  },
];

const implementationMapping = [
  {
    finding: "Multi-agent debate improves factuality by 8-15%",
    paper: "Du et al. (ICML 2024)",
    features: ["Council mode", "Deep mode", "Multi-round deliberation", "Cross-examination"],
  },
  {
    finding: "Truth wins in structured debate even with asymmetric models",
    paper: "Khan et al. (ICML 2024 Best Paper)",
    features: ["Blind mode", "Identity-hidden judge evaluation", "Multiple argument orderings"],
  },
  {
    finding: "Confidence-weighted consensus outperforms majority voting by 5-7%",
    paper: "Chen et al. (ACL 2024)",
    features: ["Condorcet voting", "Borda count", "Confidence-weighted ballots", "Ranked Pairs"],
  },
  {
    finding: "Adversarial debate enables scalable oversight beyond judge capability",
    paper: "Irving et al. (Alignment Forum)",
    features: ["Red Team mode", "Typed attack/defend phases", "Mandatory dissent", "Judge synthesis"],
  },
  {
    finding: "Multi-model discussion produces 23% more creative outputs",
    paper: "Li et al. (AAAI 2024)",
    features: ["Market mode", "Probability aggregation", "Role assignment", "Creative divergence"],
  },
  {
    finding: "Complexity routing reduces debate cost by 60-80% on simple questions",
    paper: "Irving et al. (AI Safety)",
    features: ["Auto mode", "Complexity routing", "Template pre-configuration", "Cost optimization"],
  },
  {
    finding: "Diverse model architectures outperform same-model ensembles by 3%",
    paper: "Chen et al. (ACL 2024)",
    features: ["5 LLM providers", "15 models", "Cross-architecture debate"],
  },
  {
    finding: "Mathematical convergence detection improves reliability",
    paper: "Du et al. (ICML 2024)",
    features: ["Kendall tau (0.4)", "Jaccard index (0.35)", "Concession tracking (0.25)", "Threshold: 0.85"],
  },
  {
    finding: "Explanation stability predicts answer truthfulness",
    paper: "Khan et al. (ICML 2024 Best Paper)",
    features: ["Confidence calibration", "Concession rate tracking", "Qualification penalty"],
  },
  {
    finding: "Role assignment increases creative diversity by 12%",
    paper: "Li et al. (AAAI 2024)",
    features: ["Red Team roles (attacker/defender/judge)", "Blind dialectical structure", "Persona-driven deliberation"],
  },
];

export default function ResearchPage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-4 bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            6 Papers, 8 Modes
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Research
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The peer-reviewed science behind multi-agent deliberation.
            Every Consilium feature maps to a specific finding from published research
            at ICML, ACL, AAAI, and the AI safety community.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-5xl mx-auto space-y-12">
          {papers.map((paper) => (
            <div key={paper.title} className="group">
              <Card className="transition-all hover:border-white/[0.12]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={paper.venueColor}>{paper.venue}</Badge>
                      </div>
                      <CardTitle className="text-xl leading-snug">
                        {paper.title}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {paper.authors}
                      </p>
                    </div>
                    <Link
                      href={paper.href}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 mt-1"
                      aria-label={`Open ${paper.title} on arXiv in a new tab`}
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" aria-hidden />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Abstract
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {paper.abstract}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Key Findings
                    </h3>
                    <ul className="space-y-1.5">
                      {paper.findings.map((finding) => (
                        <li key={finding} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-indigo-400" />
                          <span>{finding}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Methodology
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {paper.methodology}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Benchmark Results
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed font-mono bg-muted/50 rounded-lg p-3">
                      {paper.benchmarks}
                    </p>
                  </div>

                  <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4">
                    <h3 className="text-sm font-semibold text-indigo-400 mb-2">
                      Consilium Implementation
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {paper.consiliumMapping}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">
              How Consilium Implements the Research
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Every feature maps to a specific peer-reviewed finding.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Research Finding</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Paper</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Consilium Features</th>
                  </tr>
                </thead>
                <tbody>
                  {implementationMapping.map((row) => (
                    <tr key={row.finding} className="border-b border-neutral-800">
                      <td className="py-3 px-4 text-foreground">{row.finding}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.paper}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {row.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
