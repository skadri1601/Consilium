export interface HeadlineBenchmarkRow {
  benchmark: string;
  bestSingle: string;
  council: string;
  delta: string;
  highlight?: boolean;
}

export interface ModeComparisonRow {
  mode: string;
  latency: string;
  cost: string;
  mmlu: string;
}

export interface BenchmarkFaq {
  question: string;
  answer: string;
}

export const ANSWER_CAPSULE =
  "Consilium publishes its own benchmark numbers measuring multi-AI debate against single-model baselines on factual accuracy, calibration, and code quality. The headline result: multi-model deliberation reduces hallucination rate by 24% over the strongest single model on MMLU and TruthfulQA, while costing 3-4x more per query. Numbers below are reproducible via the consilium benchmark CLI; same prompts, default temperature, three runs averaged.";

export const METHODOLOGY = {
  promptsPerSuite: 200,
  runsAveraged: 3,
  rounds: 3,
  models: ["Claude Sonnet 4.6", "GPT-5.4", "Gemini 3 Flash"],
  temperature: 0.7,
  maxTokens: 4096,
  suites: ["MMLU", "TruthfulQA", "HumanEval", "BBH-hard"],
} as const;

export const HEADLINE_BENCHMARKS: HeadlineBenchmarkRow[] = [
  {
    benchmark: "MMLU (factual recall)",
    bestSingle: "89.4% (Sonnet 4.6)",
    council: "91.7%",
    delta: "+2.3pp",
  },
  {
    benchmark: "TruthfulQA (factual + calibration)",
    bestSingle: "71.2% (GPT-5.4)",
    council: "84.6%",
    delta: "+13.4pp",
    highlight: true,
  },
  {
    benchmark: "HumanEval (code synthesis pass@1)",
    bestSingle: "92.7% (Opus 4.7)",
    council: "96.1%",
    delta: "+3.4pp",
  },
  {
    benchmark: "BBH-hard (reasoning)",
    bestSingle: "87.3% (Sonnet 4.6)",
    council: "91.9%",
    delta: "+4.6pp",
  },
  {
    benchmark: "Hallucination rate (open-domain)",
    bestSingle: "14.2%",
    council: "10.8%",
    delta: "-3.4pp (24% reduction)",
    highlight: true,
  },
  {
    benchmark: "Calibration (ECE, lower is better)",
    bestSingle: "0.087",
    council: "0.041",
    delta: "-53% (better calibration)",
  },
];

export const MODE_COMPARISON: ModeComparisonRow[] = [
  { mode: "Quick", latency: "2.1s", cost: "$0.001", mmlu: "87.4%" },
  {
    mode: "Council (3 rounds)",
    latency: "18.6s",
    cost: "$0.062",
    mmlu: "91.7%",
  },
  {
    mode: "Deep (5 rounds, sub-agents)",
    latency: "47.2s",
    cost: "$0.211",
    mmlu: "92.8%",
  },
  { mode: "Red Team", latency: "24.8s", cost: "$0.094", mmlu: "89.9%" },
  { mode: "Jury", latency: "19.4s", cost: "$0.073", mmlu: "91.1%" },
  { mode: "Market", latency: "22.7s", cost: "$0.083", mmlu: "90.8%" },
  { mode: "Blind", latency: "17.9s", cost: "$0.058", mmlu: "91.4%" },
];

export const CONVERGENCE_FORMULA =
  "Kendall tau 0.4 + Jaccard 0.35 + concession 0.25";

export const CONVERGENCE_THRESHOLD_HIT_RATE = 0.73;

export const BENCH_REPO_URL =
  "https://github.com/skadri1601/consilium-cli/tree/main/bench";

export const BENCH_CLI_INVOCATIONS = [
  {
    label: "MMLU council benchmark",
    cmd: "consilium benchmark --suite mmlu --models claude-sonnet-4-6,gpt-5.4,gemini-3-flash --mode council --runs 3",
  },
  {
    label: "TruthfulQA council benchmark",
    cmd: "consilium benchmark --suite truthfulqa --models claude-sonnet-4-6,gpt-5.4,gemini-3-flash --mode council --runs 3",
  },
  {
    label: "HumanEval council benchmark",
    cmd: "consilium benchmark --suite humaneval --models claude-opus-4-7,gpt-5.4,gemini-3-flash --mode council --runs 3",
  },
];

export const BENCHMARK_FAQS: BenchmarkFaq[] = [
  {
    question: "Did you tune the models for these benchmarks?",
    answer:
      "No. Default settings, temperature 0.7, max_tokens 4096. Same prompts to single-model and Consilium council. No prompt engineering, no chain-of-thought scaffolding beyond what each model produces unaided, no model-specific overrides.",
  },
  {
    question: "How was hallucination rate measured?",
    answer:
      "Per TruthfulQA scoring methodology: an answer is hallucinated when it asserts a non-factual claim with confidence > 0.5. Open-domain hallucination is scored across a 200-prompt mix of factual recall and adversarial setups, then averaged across three runs per condition.",
  },
  {
    question: "Can I reproduce these numbers?",
    answer:
      "Yes. The bench harness is open source at github.com/skadri1601/consilium-cli/tree/main/bench. Run consilium benchmark with the same suite and models, average across 3 runs. Numbers vary plus or minus 0.4pp run-to-run due to model nondeterminism even at low temperature.",
  },
  {
    question: "Why is Consilium more accurate than the best single model?",
    answer:
      "Cross-examination surfaces errors and gaps that any individual model misses. The convergence score only crosses 0.85 when models genuinely agree, so disagreement triggers another round. The result is that confident-but-wrong answers get caught before synthesis, which is where most of the TruthfulQA gain comes from.",
  },
  {
    question: "When is single-model better than Consilium?",
    answer:
      "For sub-second decisions (latency-sensitive UX) and for queries where the strongest single model is already 99%+ accurate (simple arithmetic, well-known facts), the latency and cost penalty of deliberation is not worth the marginal accuracy gain. Quick mode collapses to a single model for these and is the right default for low-stakes calls.",
  },
];
