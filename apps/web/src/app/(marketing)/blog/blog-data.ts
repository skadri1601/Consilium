export type BlogCategory = "Benchmarks" | "Research" | "Product" | "Engineering";

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
    slug: "model-freshness-audit-april-2026",
    title: "What We Found Auditing Our Own Model Catalog Against the Live Provider Docs",
    excerpt:
      "We re-verified every model ID Consilium ships against each provider's own documentation page. Three real bugs surfaced — including an xAI model ID we'd been spelling with a dot when the API uses a dash. Here's the receipts.",
    date: "2026-04-25",
    category: "Engineering",
    readingTime: "7 min read",
    featured: true,
  },
  {
    slug: "byok-with-a-safety-net",
    title: "BYOK With a Safety Net: How Consilium Falls Back to a Free Tier Without Touching Your Keys",
    excerpt:
      "When a debate runs without a user-supplied key for the requested provider, Consilium routes through a platform-hosted Groq or OpenRouter pool — but only as a last step, with full transparency via SSE. Here's the four-step resolver chain.",
    date: "2026-04-22",
    category: "Engineering",
    readingTime: "6 min read",
    featured: false,
  },
  {
    slug: "model-deprecation-calendar-2026",
    title: "The Model Deprecation Calendar: What Retires Between June and October 2026",
    excerpt:
      "Six widely-used model IDs are scheduled for shutdown in the next six months. We list them, the date each one dies, and how Consilium's alias map keeps apps working past the cutoff.",
    date: "2026-04-15",
    category: "Engineering",
    readingTime: "5 min read",
    featured: false,
  },
  {
    slug: "benchmark-results-council-deliberation-vs-single-models",
    title: "Council Deliberation vs Single Models: What Our Benchmarks Actually Show",
    excerpt:
      "We ran MMLU, TruthfulQA, and HumanEval through Consilium's council mode. The raw scores are not yet representative — our answer checker is too strict. Here's what we ran, what broke, and the research baselines we measure ourselves against in the meantime.",
    date: "2026-04-01",
    category: "Benchmarks",
    readingTime: "7 min read",
    featured: false,
  },
  {
    slug: "why-deliberation-beats-orchestration",
    title: "Why Deliberation Beats Orchestration",
    excerpt:
      "Most multi-agent frameworks treat models as workers in a pipeline. Consilium treats them as adversaries in a structured debate. Here's the difference, and why it produces answers that survive cross-examination.",
    date: "2026-03-18",
    category: "Research",
    readingTime: "6 min read",
    featured: false,
  },
  {
    slug: "introducing-8-deliberation-modes",
    title: "The Eight Deliberation Modes, Explained",
    excerpt:
      "Quick, council, deep, blind, redteam, jury, market, auto. Each has a specific shape — different round count, voting method, and judge behavior — picked to match the task. Here's how to choose.",
    date: "2026-03-05",
    category: "Product",
    readingTime: "6 min read",
    featured: false,
  },
  {
    slug: "getting-started-with-consilium-sdk",
    title: "Getting Started with the Consilium SDK",
    excerpt:
      "A practical walkthrough: install the CLI or SDK, set up a key (or skip it and use the free tier), run your first council debate, and stream events as they happen.",
    date: "2026-02-20",
    category: "Engineering",
    readingTime: "5 min read",
    featured: false,
  },
];
