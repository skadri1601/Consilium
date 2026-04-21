export type BlogCategory =
  | "Benchmarks"
  | "Research"
  | "Product"
  | "Engineering";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: BlogCategory;
  readingTime: string;
  featured: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "benchmark-results-council-deliberation-vs-single-models",
    title: "Benchmark Results: Council Deliberation vs Single Models",
    excerpt:
      "We tested Consilium's multi-agent deliberation against top single models across MMLU-Pro, TruthfulQA, and HumanEval. The results show consistent improvements of 9-16% across all benchmarks.",
    date: "2026-04-01",
    category: "Benchmarks",
    readingTime: "8 min read",
    featured: true,
  },
  {
    slug: "why-deliberation-beats-orchestration",
    title: "Why Deliberation Beats Orchestration",
    excerpt:
      "Traditional multi-agent orchestration routes tasks to specialized models. Deliberation takes a fundamentally different approach—models argue, challenge, and refine each other's reasoning.",
    date: "2026-03-18",
    category: "Research",
    readingTime: "6 min read",
    featured: false,
  },
  {
    slug: "introducing-8-deliberation-modes",
    title: "Introducing 8 Deliberation Modes",
    excerpt:
      "From Confidence-Weighted Voting to Structured Debate, each mode is backed by peer-reviewed research. Here's how to choose the right one for your use case.",
    date: "2026-03-05",
    category: "Product",
    readingTime: "5 min read",
    featured: false,
  },
  {
    slug: "getting-started-with-consilium-sdk",
    title: "Getting Started with Consilium SDK",
    excerpt:
      "A practical guide to integrating Consilium's TypeScript SDK into your application. Set up councils, configure models, and stream deliberation results in minutes.",
    date: "2026-02-20",
    category: "Engineering",
    readingTime: "4 min read",
    featured: false,
  },
];
