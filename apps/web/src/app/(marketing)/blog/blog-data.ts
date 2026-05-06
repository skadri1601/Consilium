export type BlogCategory = "Benchmarks" | "Research" | "Product" | "Engineering";

export interface EntityRef {
  /** Display name. Used as the schema name field. */
  name: string;
  /** Authoritative URL. Wikidata, Wikipedia, arXiv, or canonical doc page. */
  url: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: BlogCategory;
  readingTime: string;
  featured: boolean;
  /** Topical tags. Surfaced as og:article:tag and BlogPosting.keywords. */
  keywords?: string[];
  /**
   * ``mentions`` field on schema.org BlogPosting. Each entry should
   * point at an authoritative entity URL (Wikidata is preferred) so AI
   * search engines can disambiguate the topic against their knowledge
   * graphs. Only populate when the URL is verified.
   */
  mentions?: EntityRef[];
  /**
   * ``citation`` field on schema.org BlogPosting. Use for posts that
   * cite specific peer-reviewed work; URLs should resolve to the
   * canonical paper (arXiv, conference proceedings) — not blog
   * paraphrases.
   */
  citations?: EntityRef[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "model-freshness-audit-april-2026",
    title: "What We Found Auditing Our Own Model Catalog Against the Live Provider Docs",
    excerpt:
      "We re-verified every model ID Consilium ships against each provider's own documentation page. Three real bugs surfaced - including an xAI model ID we'd been spelling with a dot when the API uses a dash. Here's the receipts.",
    date: "2026-04-25",
    category: "Engineering",
    readingTime: "7 min read",
    featured: true,
  },
  {
    slug: "byok-with-a-safety-net",
    title: "BYOK With a Safety Net: How Consilium Falls Back to a Free Tier Without Touching Your Keys",
    excerpt:
      "When a debate runs without a user-supplied key for the requested provider, Consilium routes through a platform-hosted Groq or OpenRouter pool - but only as a last step, with full transparency via SSE. Here's the four-step resolver chain.",
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
      "We ran MMLU, TruthfulQA, and HumanEval through Consilium's council mode. The raw scores are not yet representative - our answer checker is too strict. Here's what we ran, what broke, and the research baselines we measure ourselves against in the meantime.",
    date: "2026-04-01",
    category: "Benchmarks",
    readingTime: "7 min read",
    featured: false,
    keywords: ["benchmark", "MMLU", "TruthfulQA", "HumanEval", "multi-agent debate"],
    mentions: [
      { name: "Large language model", url: "https://www.wikidata.org/wiki/Q115305900" },
      { name: "Multi-agent system", url: "https://www.wikidata.org/wiki/Q1429083" },
    ],
    citations: [
      { name: "MMLU (Hendrycks et al.)", url: "https://arxiv.org/abs/2009.03300" },
      { name: "TruthfulQA (Lin et al.)", url: "https://arxiv.org/abs/2109.07958" },
      { name: "HumanEval (Chen et al.)", url: "https://arxiv.org/abs/2107.03374" },
    ],
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
    keywords: ["multi-agent debate", "deliberation", "orchestration", "AI alignment"],
    mentions: [
      { name: "Multi-agent system", url: "https://www.wikidata.org/wiki/Q1429083" },
      { name: "Large language model", url: "https://www.wikidata.org/wiki/Q115305900" },
    ],
    citations: [
      {
        name: "Debating with More Persuasive LLMs Leads to More Truthful Answers (Khan et al., ICML 2024)",
        url: "https://arxiv.org/abs/2402.06782",
      },
      {
        name: "Improving Factuality and Reasoning via Multiagent Debate (Du et al., ICML 2024)",
        url: "https://arxiv.org/abs/2305.14325",
      },
    ],
  },
  {
    slug: "introducing-8-deliberation-modes",
    title: "The Eight Deliberation Modes, Explained",
    excerpt:
      "Quick, council, deep, blind, redteam, jury, market, auto. Each has a specific shape - different round count, voting method, and judge behavior - picked to match the task. Here's how to choose.",
    date: "2026-03-05",
    category: "Product",
    readingTime: "6 min read",
    featured: false,
    keywords: ["deliberation modes", "Condorcet method", "Borda count", "voting"],
    mentions: [
      { name: "Condorcet method", url: "https://www.wikidata.org/wiki/Q839616" },
      { name: "Borda count", url: "https://www.wikidata.org/wiki/Q777887" },
      { name: "Ranked pairs", url: "https://www.wikidata.org/wiki/Q1192987" },
    ],
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
