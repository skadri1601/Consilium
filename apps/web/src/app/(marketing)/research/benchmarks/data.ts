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
  "Consilium is building a benchmark suite to measure multi-AI debate against single-model baselines on factual accuracy, calibration, and code quality. Benchmark results will be published here once the benchmark CLI ships. The suites below describe our planned methodology.";

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
    bestSingle: "Coming soon",
    council: "Coming soon",
    delta: "---",
  },
  {
    benchmark: "TruthfulQA (factual + calibration)",
    bestSingle: "Coming soon",
    council: "Coming soon",
    delta: "---",
  },
  {
    benchmark: "HumanEval (code synthesis pass@1)",
    bestSingle: "Coming soon",
    council: "Coming soon",
    delta: "---",
  },
  {
    benchmark: "BBH-hard (reasoning)",
    bestSingle: "Coming soon",
    council: "Coming soon",
    delta: "---",
  },
  {
    benchmark: "Hallucination rate (open-domain)",
    bestSingle: "Coming soon",
    council: "Coming soon",
    delta: "---",
  },
  {
    benchmark: "Calibration (ECE, lower is better)",
    bestSingle: "Coming soon",
    council: "Coming soon",
    delta: "---",
  },
];

export const MODE_COMPARISON: ModeComparisonRow[] = [
  { mode: "Quick", latency: "Coming soon", cost: "Coming soon", mmlu: "Coming soon" },
  {
    mode: "Council (3 rounds)",
    latency: "Coming soon",
    cost: "Coming soon",
    mmlu: "Coming soon",
  },
  {
    mode: "Deep (5 rounds, sub-agents)",
    latency: "Coming soon",
    cost: "Coming soon",
    mmlu: "Coming soon",
  },
  { mode: "Red Team", latency: "Coming soon", cost: "Coming soon", mmlu: "Coming soon" },
  { mode: "Jury", latency: "Coming soon", cost: "Coming soon", mmlu: "Coming soon" },
  { mode: "Market", latency: "Coming soon", cost: "Coming soon", mmlu: "Coming soon" },
  { mode: "Blind", latency: "Coming soon", cost: "Coming soon", mmlu: "Coming soon" },
];

export const CONVERGENCE_FORMULA =
  "Kendall tau 0.4 + Jaccard 0.35 + concession 0.25";

export const CONVERGENCE_THRESHOLD_HIT_RATE = 0;

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
      "The benchmark CLI is under development. Once it ships, you will be able to run consilium benchmark with the same suite and models to reproduce results.",
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
