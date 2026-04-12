import Link from "next/link";
import { ArrowLeft, GitBranch, BarChart3, TrendingUp, Split, Gauge, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

const stateFields = [
  { field: "topic", type: "string", desc: "The question or topic being deliberated" },
  { field: "mode", type: "DeliberationMode", desc: "Active deliberation mode (quick/council/deep/blind/redteam/jury/market/auto)" },
  { field: "round_number", type: "int", desc: "Current round (increments after convergence check)" },
  { field: "max_rounds", type: "int", desc: "Maximum rounds before forced output" },
  { field: "models", type: "list[str]", desc: "Model IDs participating in the debate" },
  { field: "judge_model", type: "str", desc: "Model used for evaluation and synthesis" },
  { field: "proposals", type: "list[dict]", desc: "Independent positions from each model" },
  { field: "challenges", type: "list[dict]", desc: "Cross-examination results with typed objections" },
  { field: "rebuttals", type: "list[dict]", desc: "Responses: CONCEDE, REFUTE, QUALIFY, or REDIRECT" },
  { field: "evaluations", type: "list[dict]", desc: "Rubric-based scoring of each proposal" },
  { field: "votes", type: "list[dict]", desc: "Ranked ballots with confidence weights" },
  { field: "aggregation_result", type: "dict", desc: "Combined vote results (winner, method, ranking)" },
  { field: "convergence_result", type: "dict", desc: "Convergence score and recommendation" },
  { field: "dissent_report", type: "dict", desc: "Majority/minority positions via clustering" },
  { field: "confidence_scores", type: "dict", desc: "Per-model calibrated confidence" },
  { field: "audit_trail", type: "list[dict]", desc: "Every step: model, input, output, tokens, cost, latency" },
  { field: "cost_tracker", type: "dict", desc: "Cost breakdown by model and round" },
  { field: "golden_prompt", type: "str", desc: "Final synthesized answer" },
];

export default function HowItWorksPage() {
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
            How the Deliberation Engine Works
          </h1>
          <p className="text-xl text-muted-foreground">
            A deep technical explanation of the state machine, voting algorithms, convergence detection, dissent clustering, and confidence calibration that power Consilium.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto space-y-16">

          <div id="state-machine">
            <div className="flex items-center gap-3 mb-6">
              <GitBranch className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">A. The State Machine</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Consilium&apos;s deliberation engine is built on a LangGraph-based state machine. Each deliberation progresses through a defined sequence of phases, with the state object accumulating results at each step. The state machine enforces the debate protocol: no model can skip a phase, and convergence is checked mathematically before termination.
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-mono">Phase Pipeline (Council/Deep/Jury/Blind)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {["PROPOSAL", "CHALLENGE", "REBUTTAL", "EVALUATION", "VOTING", "AGGREGATION", "CONVERGENCE", "OUTPUT"].map((phase, i) => (
                      <span key={phase} className="inline-flex items-center gap-1">
                        <span className="rounded bg-indigo-500/10 px-2.5 py-1.5 text-xs font-mono text-indigo-400">{phase}</span>
                        {i < 7 && <span className="text-muted-foreground text-xs">→</span>}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Each phase handler processes sequentially. After CONVERGENCE, the engine either loops back to PROPOSAL for another round or proceeds to OUTPUT. Round number increments after each convergence check.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">DeliberationState Object</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Field</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-2 text-left font-medium text-muted-foreground">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stateFields.map((f) => (
                          <tr key={f.field} className="border-b border-white/[0.06] last:border-0">
                            <td className="px-4 py-2 font-mono text-xs text-indigo-400">{f.field}</td>
                            <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{f.type}</td>
                            <td className="px-4 py-2 text-xs text-muted-foreground">{f.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Phase Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm"><span className="text-indigo-400 font-medium">PROPOSAL</span> — Each model independently generates: claims (list of assertions), reasoning chain (step-by-step logic), confidence score, and supporting evidence. No model sees others&apos; proposals.</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm"><span className="text-indigo-400 font-medium">CHALLENGE</span> — Models cross-examine each other. Challenges are typed: factual errors, missing evidence, logical flaws, better alternatives. Each challenge targets a specific claim in another model&apos;s proposal.</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm"><span className="text-indigo-400 font-medium">REBUTTAL</span> — Defenders respond with categorized rebuttals: CONCEDE (accept the challenge), REFUTE (counter with evidence), QUALIFY (accept partially with conditions), or REDIRECT (reframe the question). Rebuttal types feed into convergence and confidence metrics.</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm"><span className="text-indigo-400 font-medium">EVALUATION</span> — Proposals scored against a rubric with weighted dimensions. Each dimension gets a 0-1 score. The rubric varies by template (e.g., security 30% + correctness 25% for code review).</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm"><span className="text-indigo-400 font-medium">VOTING</span> — Models cast RankedBallots: an ordered preference list of proposals with a confidence_weight (0-1). Higher confidence = more influence on the final ranking.</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm"><span className="text-indigo-400 font-medium">AGGREGATION</span> — Votes aggregated through the voting pipeline: Borda scores → full ranking → Condorcet check → Ranked Pairs fallback. Produces winner, method used, and confidence level.</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm"><span className="text-indigo-400 font-medium">CONVERGENCE</span> — Three metrics combined to determine if debate should continue. If converged (score ≥ 0.85) or max rounds reached, proceeds to OUTPUT. Otherwise loops back to PROPOSAL.</p>
                    </div>
                    <div className="rounded-lg bg-neutral-900 p-3">
                      <p className="text-sm"><span className="text-indigo-400 font-medium">OUTPUT</span> — Final synthesis: judge model integrates strongest arguments, applies dissent detection, calibrates confidence, and produces the golden prompt.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div id="voting">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">B. Voting Mechanisms</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Consilium implements four formal social choice theory algorithms. These aren&apos;t simple &quot;pick the most popular&quot; mechanisms — they&apos;re mathematically rigorous voting methods used in political science and decision theory.
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Condorcet Method (Primary)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Checks if any candidate beats ALL others in pairwise matchups. For each pair of candidates (A, B), counts how many voters prefer A over B (weighted by confidence_weight). If one candidate wins every pairwise comparison, it&apos;s the Condorcet winner — the strongest possible consensus.
                  </p>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`For each pair (A, B):
  score_A = sum(confidence_weight for ballots where A ranked above B)
  score_B = sum(confidence_weight for ballots where B ranked above A)
  A wins pair if score_A > score_B

Condorcet winner = candidate that wins ALL pairwise comparisons
Returns: single winner or None (triggers Ranked Pairs fallback)`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Borda Count (Scoring)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Assigns points based on rank position, weighted by voter confidence. Produces a complete ranking of all candidates, not just a winner.
                  </p>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`For each ballot:
  For each candidate at rank r (0-indexed):
    points[candidate] += (n - 1 - r) * confidence_weight

Full ranking = candidates sorted by total points (descending)
Used even when Condorcet winner exists, to produce complete ordering`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ranked Pairs (Tiebreaker)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    When no Condorcet winner exists (a cycle: A beats B, B beats C, C beats A), Ranked Pairs resolves by locking the strongest victories first while preventing cycles.
                  </p>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`1. List all pairwise matchups with victory margins
2. Sort by margin (descending) — strongest victories first
3. For each matchup:
   - Lock the edge (winner → loser) IF it doesn't create a cycle
   - Skip if it would create a cycle (topological sort check)
4. Winner = candidate with no incoming locked edges

Complexity: O(n² log n) where n = number of candidates`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Copeland (Comparative Analysis)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Simple win/loss scoring for comparative analysis. Not used for final winner selection, but provides intuitive &quot;how dominant is this candidate?&quot; metric.
                  </p>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`For each candidate:
  copeland_score = (# pairwise wins) - (# pairwise losses)
  Range: -(n-1) to +(n-1)

Example with 4 candidates:
  A beats B, C, D → score = +3 (dominant)
  B beats C, loses to A, D → score = -1`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Aggregation Pipeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`1. Calculate Borda scores (confidence-weighted)
2. Generate full_ranking from Borda
3. Check for Condorcet winner
   → Found: return (winner, full_ranking, method="condorcet", confident=True)
   → Not found: use Ranked Pairs as tiebreaker
4. Return (ranked_pairs_winner, full_ranking, method="ranked_pairs", confident=False)`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>

          <div id="convergence">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">C. Convergence Detection</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Convergence detection determines whether the debate has reached a stable consensus or should continue for another round. Three independent metrics are combined into a single score.
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Kendall Tau Distance (Ranking Similarity)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Measures how similar the vote rankings are between consecutive rounds. Maps items to positions, counts concordant vs discordant pairs. Normalized to [0, 1] where 1.0 = identical rankings across rounds.
                  </p>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`tau = (concordant_pairs - discordant_pairs) / total_pairs
normalized = tau * 0.5 + 0.5  → maps [-1, 1] to [0, 1]

concordant: pair (i,j) ranked same order in both rounds
discordant: pair (i,j) ranked opposite order`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Jaccard Similarity (Proposal Content)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Measures how much the actual content of proposals overlaps between rounds. Converts proposals to word sets, computes intersection/union.
                  </p>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`For each model's proposals across rounds:
  words_prev = set(proposal_round_n.lower().split())
  words_curr = set(proposal_round_n+1.lower().split())
  similarity = |words_prev ∩ words_curr| / |words_prev ∪ words_curr|

Average across all model-pair comparisons`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Concession Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Fraction of rebuttals where models concede or qualify their positions. High concession = models are willing to adapt, indicating movement toward consensus.
                  </p>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`concession_rate = count(rebuttals where type == CONCEDE or QUALIFY) / total_rebuttals`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Combined Convergence Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`score = 0.40 * ranking_similarity    (Kendall tau)
      + 0.35 * proposal_similarity   (Jaccard)
      + 0.25 * concession_rate        (rebuttal analysis)

Termination rules:
  round >= max_rounds        → converged = True (forced)
  round < 2                  → converged = False (need baseline)
  score >= 0.85              → converged = True (consensus)
  score < 0.85               → converged = False (continue)

Output: { converged, score, components, recommendation }`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>

          <div id="dissent">
            <div className="flex items-center gap-3 mb-6">
              <Split className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">D. Dissent Detection</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Dissent detection identifies whether models genuinely agree or if there are distinct camps with fundamentally different positions. Uses agglomerative clustering on proposal content similarity.
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Agglomerative Clustering Algorithm</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`1. Build similarity matrix:
   matrix[i][j] = Jaccard(words_i, words_j)
   Symmetric: matrix[i][j] == matrix[j][i]
   Diagonal: matrix[i][i] = 1.0

2. Initialize: each proposal = singleton cluster

3. Iteratively merge:
   - Find closest cluster pair (highest avg pairwise similarity)
   - If similarity >= 0.5 threshold: merge into one cluster
   - If similarity < 0.5: stop (remaining clusters are distinct positions)

4. Interpret results:
   - 1 cluster → consensus (majority only, no dissent)
   - 2+ clusters → dissent detected
     - Largest cluster = majority position
     - Others = minority positions`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dissent Report Structure</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`{
  type: "consensus" | "dissent",
  majority: {
    models: ["claude-sonnet-4", "gpt-4o"],
    position_summary: "First 200 chars of largest cluster's proposal",
    key_arguments: ["extracted from claims"],
    proposals: [full proposal objects]
  },
  minority: [  // empty if consensus
    {
      models: ["gemini-2.5-flash"],
      position_summary: "...",
      key_arguments: ["..."],
      proposals: [...]
    }
  ],
  disagreement_points: [
    { challenger: "gemini", target: "claude", type: "REFUTE", argument: "..." }
  ]
}`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>

          <div id="confidence">
            <div className="flex items-center gap-3 mb-6">
              <Gauge className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">E. Confidence Calibration</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Confidence calibration measures how much each model actually stands behind its claims. A model that caves under scrutiny gets a lower confidence score than one that defends its position with evidence. This is based on &quot;explanation stability&quot; — the degree to which a model&apos;s claims survive cross-examination.
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Calibration Formula</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`stability_score = avg(Jaccard(original_claims, post_challenge_claims))
  → 1.0 = claims unchanged, 0.0 = completely revised

concession_rate = count(CONCEDE rebuttals) / total_rebuttals
  → Higher = model yielded more often

qualification_rate = count(QUALIFY rebuttals) / total_rebuttals
  → Partial yielding, less severe than concession

calibrated_confidence = stability_score
                      * (1 - concession_rate)
                      * (1 - 0.3 * qualification_rate)

Clamped to [0.0, 1.0]

Output: {
  value: float,          // final calibrated score
  stability_score: float,
  concession_rate: float,
  method: "explanation_stability"
}`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>

          <div id="cost-routing">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">F. Cost-Based Routing</h2>
            </div>
            <div className="space-y-6">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Auto mode uses cost-based routing to select the optimal deliberation mode and model count. It extracts features from the query, scores complexity, and routes to the cheapest configuration that meets quality requirements.
              </p>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Feature Extraction</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`token_count:      number of words in topic
has_code:         presence of code markers (\`\`\`, def, class, import, {})
is_factual:       starts with "what is", "who is", "when did", "how many"
is_creative:      contains "write", "create", "design", "brainstorm", "imagine"
is_analytical:    contains "compare", "analyze", "evaluate", "pros and cons"
has_stakes:       contains "medical", "legal", "financial", "security",
                  "compliance", "hipaa", "soc"`}</code>
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Complexity Scoring &amp; Routing</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                    <code className="text-muted-foreground">{`Base score (from token count):
  < 20 tokens:   0.1
  ≤ 100 tokens:  0.3
  ≤ 500 tokens:  0.5
  > 500 tokens:  0.7

Adjustments:
  + 0.2  if has_code
  + 0.3  if has_stakes_keywords
  + 0.2  if is_analytical
  + 0.1  if is_creative
  - 0.2  if is_factual

Floor: if has_stakes and score < 0.3, boost to 0.3

Routing decision:
  score < 0.3  → Quick mode,   1 model    (cheapest)
  score < 0.6  → Council mode, 3 models   (balanced)
  score ≥ 0.6  → Council mode, 3-5 models (thorough)
  score ≥ 0.8  → Deep mode,    5 models   (maximum)

Cost estimation:
  estimated = num_api_calls * estimated_tokens * cost_per_token
  Quick:    1 call
  Council:  num_models * 3 rounds
  Deep:     num_models * 5 rounds`}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <Link
              href="/docs/modes"
              className="inline-flex h-11 items-center justify-center rounded-md bg-gradient-to-r from-indigo-500 to-purple-600 px-8 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-600 hover:to-purple-700"
            >
              Deliberation Modes
            </Link>
            <Link
              href="/docs/architecture"
              className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent"
            >
              System Architecture
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
