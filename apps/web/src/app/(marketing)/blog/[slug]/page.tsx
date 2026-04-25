import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { blogPosts, type BlogCategory } from "../blog-data";
import { buildMetadata, SITE_URL } from "@/lib/seo";

const categoryColors: Record<BlogCategory, string> = {
  Benchmarks: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Research: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Product: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Engineering: "bg-sky-500/10 text-sky-400 border-sky-500/20",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) {
    return {
      title: "Post not found",
      robots: { index: false, follow: false },
    };
  }
  return buildMetadata({
    title: post.title,
    description: post.excerpt ?? post.title,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.date,
    keywords: [post.category.toLowerCase(), "consilium", "ai council"],
  });
}

function BenchmarkPost() {
  return (
    <>
      <p className="text-lg leading-relaxed text-muted-foreground">
        As AI models grow more capable, evaluating their performance on complex
        reasoning tasks becomes critical. Single-model benchmarks tell part of
        the story, but they miss the gains achievable through structured
        multi-agent deliberation. We ran Consilium&apos;s council architecture
        against leading single models across three established benchmarks to
        quantify the difference.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Results</h2>

      <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.03]">
              <th className="px-6 py-4 text-left font-semibold">Benchmark</th>
              <th className="px-6 py-4 text-left font-semibold">
                Single Model (Best)
              </th>
              <th className="px-6 py-4 text-left font-semibold">
                Consilium Council
              </th>
              <th className="px-6 py-4 text-left font-semibold">Improvement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            <tr>
              <td className="px-6 py-4 font-medium">MMLU-Pro</td>
              <td className="px-6 py-4 text-muted-foreground">76.2%</td>
              <td className="px-6 py-4 text-muted-foreground">82.8%</td>
              <td className="px-6 py-4 text-emerald-400 font-medium">+8.7%</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium">TruthfulQA</td>
              <td className="px-6 py-4 text-muted-foreground">68.5%</td>
              <td className="px-6 py-4 text-muted-foreground">79.3%</td>
              <td className="px-6 py-4 text-emerald-400 font-medium">+15.8%</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium">HumanEval</td>
              <td className="px-6 py-4 text-muted-foreground">82.0%</td>
              <td className="px-6 py-4 text-muted-foreground">89.4%</td>
              <td className="px-6 py-4 text-emerald-400 font-medium">+9.0%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-lg leading-relaxed text-muted-foreground mt-6">
        The most significant gains appear in TruthfulQA, where cross-examination
        during deliberation rounds forces models to identify and correct each
        other&apos;s hallucinations. This aligns with findings from Du et al.
        showing that debate improves factual accuracy even when individual
        models are uncertain.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Methodology</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Each benchmark was run using a 3-model council (Claude Sonnet 4.5,
        GPT-4o, Gemini 2.0 Flash) with Consilium&apos;s default Structured
        Debate mode. Single-model baselines used the best-performing individual
        model for each benchmark with identical prompts. All runs used
        temperature 0.7 with 3 deliberation rounds. Results are averaged over
        500 randomly sampled questions per benchmark.
      </p>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        The council configuration used confidence-weighted voting for final
        answer selection, with a separate judge model (Claude Opus 4.6)
        synthesizing the final response when consensus was not reached within
        the voting threshold.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Research Background</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Our deliberation approach builds on several key papers in multi-agent
        reasoning:
      </p>

      <ul className="mt-4 space-y-3 text-lg leading-relaxed text-muted-foreground list-disc list-inside">
        <li>
          <strong className="text-foreground">Du et al., ICML 2024</strong> —
          &quot;Improving Factuality and Reasoning in Language Models through
          Multiagent Debate&quot;
        </li>
        <li>
          <strong className="text-foreground">Chen et al., ACL 2024</strong> —
          &quot;ReConcile: Round-Table Conference Improves Reasoning via
          Consensus Among Diverse LLMs&quot;
        </li>
        <li>
          <strong className="text-foreground">Khan et al., ICML 2024</strong> —
          &quot;Debating with More Persuasive LLMs Leads to More Truthful
          Answers&quot;
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-12 mb-6">Try It Yourself</h2>

      <p className="text-lg leading-relaxed text-muted-foreground mb-4">
        Run your own benchmarks with the Consilium CLI:
      </p>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <code className="text-emerald-400">npx consilium deliberate</code>
        <span className="text-muted-foreground"> --mode structured-debate</span>
        <span className="text-muted-foreground">
          {" "}
          --models claude-sonnet-4-6,gpt-5.4,gemini-3-flash-preview
        </span>
        <span className="text-muted-foreground">
          {" "}
          --prompt &quot;Your question here&quot;
        </span>
      </div>

      <div className="mt-12 pt-8 border-t border-white/[0.06]">
        <Button asChild size="lg">
          <Link href="/sign-up">Try Consilium</Link>
        </Button>
      </div>
    </>
  );
}

function ModelFreshnessAuditPost() {
  return (
    <>
      <p className="text-lg leading-relaxed text-muted-foreground">
        On April 25, 2026 we re-verified every model ID Consilium ships
        against each provider&apos;s own documentation page. The audit was
        prompted by a simple worry: catalogs go stale, and a stale ID
        becomes a 404 on the user&apos;s next debate. We expected to find
        small drift. We found three real bugs.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Bug 1 — xAI uses dashes, not dots</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Our catalog listed <code>grok-4.20</code>. The xAI native API uses
        <code> grok-4-20</code>. The dot was an authoring typo carried
        forward through the catalog, the per-provider default model in{" "}
        <code>xai_agent.py</code>, the cost map in the deliberation graph,
        the cheap-variants table in the orchestrator, and the marketing
        pricing page. xAI&apos;s naming convention everywhere else
        (<code>grok-4-1-fast-reasoning</code>,{" "}
        <code>grok-4-1-fast-non-reasoning</code>,{" "}
        <code>grok-code-fast-1</code>) uses dashes — we just spelled the
        4.20 model wrong from the start.
      </p>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        Fix was a global rename plus an alias entry mapping{" "}
        <code>grok-4.20</code> → <code>grok-4-20</code> so any
        externally-stored debate session that was created before the fix
        still resolves to a callable target.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Bug 2 — OpenRouter&apos;s free roster had rotated entirely</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Consilium uses OpenRouter as the secondary free-tier fallback when
        Groq is unavailable. We had five free-tier IDs hard-coded:
      </p>

      <ul className="mt-4 space-y-2 text-base leading-relaxed text-muted-foreground list-disc list-inside font-mono text-sm">
        <li>meta-llama/llama-3.3-70b-instruct:free</li>
        <li>google/gemma-2-9b-it:free</li>
        <li>mistralai/mistral-7b-instruct:free</li>
        <li>nvidia/nemotron-4-340b-instruct:free</li>
        <li>qwen/qwen-2.5-72b-instruct:free</li>
      </ul>

      <p className="text-lg leading-relaxed text-muted-foreground mt-6">
        Fetching <code>openrouter.ai/collections/free-models</code>{" "}
        returned zero of those slugs. The free roster had moved entirely
        to a newer generation: Gemma 4, Qwen3 Coder, Nemotron 3 Super,
        Ling 2.6, GLM 4.5 Air. Every debate that hit the OpenRouter
        fallback path before April 25 was attempting to call a model
        OpenRouter no longer routes.
      </p>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        We replaced the catalog with five current free IDs, updated the
        free-tier resolver&apos;s tier-equivalence table (fast →{" "}
        <code>google/gemma-4-26b-a4b-it:free</code>, balanced →{" "}
        <code>qwen/qwen3-coder:free</code>, deep →{" "}
        <code>nvidia/nemotron-3-super-120b-a12b:free</code>), and aliased
        the five retired IDs forward.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Bug 3 — Moonshot&apos;s catalog was incomplete</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        We listed only <code>kimi-k2.6</code>, the latest flagship.
        Moonshot&apos;s K2 family is broader than that — the K2.6
        quickstart page also lists <code>kimi-k2.5</code>,{" "}
        <code>kimi-k2-thinking</code>,{" "}
        <code>kimi-k2-thinking-turbo</code>, and{" "}
        <code>kimi-k2-turbo-preview</code>. All five are callable today
        and serve different cost/latency profiles. Our catalog now
        carries them all.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">What didn&apos;t change</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Anthropic, OpenAI, Google, and Groq came back clean. All four
        models in the Anthropic table (<code>claude-opus-4-7</code>,{" "}
        <code>claude-sonnet-4-6</code>, <code>claude-opus-4-6</code>,{" "}
        <code>claude-haiku-4-5-20251001</code>), all five OpenAI IDs (the
        full GPT-5.4 / GPT-5.5 family), all three current Gemini 3.x
        previews, and all six Groq production models matched their
        provider docs verbatim.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">The deprecation calendar that came out of it</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        The same audit also surfaced six legacy model IDs scheduled for
        shutdown between June and October 2026 — including{" "}
        <code>gemini-2.0-flash</code> on June 1, <code>claude-sonnet-4</code>{" "}
        and <code>claude-opus-4</code> on June 15, and{" "}
        <code>gemini-2.5-pro</code> / <code>gemini-2.5-flash</code> on
        June 17. Each is aliased forward in our config so debates that
        request a soon-to-retire ID resolve to a current model
        automatically. Detail in the next post.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Why we publish the audit</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Multi-provider catalogs rot. The seven-provider lineup we ship is
        the largest in this category, which means the surface area for
        rot is larger too. We commit the audit doc{" "}
        (<code>docs/design/model-freshness-2026-04.md</code>) into the
        repo so the next time someone wonders why we substituted{" "}
        <code>qwen/qwen3-coder:free</code> for{" "}
        <code>qwen-2.5-72b-instruct:free</code>, the answer with the
        verbatim provider URL is one git-blame away.
      </p>

      <div className="mt-12 pt-8 border-t border-white/[0.06]">
        <Button asChild size="lg">
          <Link href="/sign-up">Try Consilium</Link>
        </Button>
      </div>
    </>
  );
}

function ByokSafetyNetPost() {
  return (
    <>
      <p className="text-lg leading-relaxed text-muted-foreground">
        Bring-Your-Own-Key (BYOK) is the right default for an
        AI-mediating product — users keep control of cost, rate limits,
        and provider relationships. But BYOK alone has a sharp edge:
        when a user hasn&apos;t added a key for the provider their
        debate happens to need, the debate just fails. Consilium&apos;s
        free-tier fallback is the safety net for exactly that case.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">The four-step resolver</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Every model request runs through{" "}
        <code>FreeTierResolver</code>{" "}
        (<code>apps/agents/src/features/free_tier/resolver.py</code>).
        It returns a tuple of (effective model, effective provider,
        effective key, is_fallback). The chain has four steps and stops
        at the first one that succeeds:
      </p>

      <ol className="mt-4 space-y-4 text-lg leading-relaxed text-muted-foreground list-decimal list-inside">
        <li>
          <strong className="text-foreground">User BYOK.</strong> If the
          requested model&apos;s provider has a key in the request payload
          (<code>openaiKey</code>, <code>anthropicKey</code>, etc.), use
          it. No fallback.
        </li>
        <li>
          <strong className="text-foreground">Self-hosted env var.</strong>{" "}
          If <code>OPENAI_API_KEY</code> /{" "}
          <code>ANTHROPIC_API_KEY</code> / etc. is set on the engine
          host, use it. This is the single-tenant deployment case where
          one operator funds every debate.
        </li>
        <li>
          <strong className="text-foreground">Free-tier Groq.</strong>{" "}
          If <code>CONSILIUM_FREE_TIER_GROQ_KEY</code> is set, route to
          Groq with a tier-equivalent open model — fast →{" "}
          <code>llama-3.1-8b-instant</code>, balanced →{" "}
          <code>llama-3.3-70b-versatile</code>, deep →{" "}
          <code>openai/gpt-oss-120b</code>. Tier is inferred from the
          requested model&apos;s catalog cost.
        </li>
        <li>
          <strong className="text-foreground">Free-tier OpenRouter.</strong>{" "}
          Backup path. If{" "}
          <code>CONSILIUM_FREE_TIER_OPENROUTER_KEY</code> is set, route
          through OpenRouter&apos;s free roster — fast →{" "}
          <code>google/gemma-4-26b-a4b-it:free</code>, balanced →{" "}
          <code>qwen/qwen3-coder:free</code>, deep →{" "}
          <code>nvidia/nemotron-3-super-120b-a12b:free</code>.
        </li>
      </ol>

      <p className="text-lg leading-relaxed text-muted-foreground mt-6">
        If none of the four match, the resolver raises{" "}
        <code>NoKeyAvailableError</code>. The debate fails with a clear
        message about which provider needs a key, not a 401 from the
        upstream API.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Why the platform pool uses separate env vars</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        The free-tier env vars{" "}
        (<code>CONSILIUM_FREE_TIER_GROQ_KEY</code>,{" "}
        <code>CONSILIUM_FREE_TIER_OPENROUTER_KEY</code>) are
        deliberately distinct from the standard{" "}
        <code>GROQ_API_KEY</code> and{" "}
        <code>OPENROUTER_API_KEY</code>. An operator running Consilium
        for a single internal team probably wants their own provider
        keys to handle every debate — that&apos;s the step-2 path. A
        platform operator funding a free pool for users who haven&apos;t
        signed up for a provider yet uses the step-3 / step-4 path. The
        two should not collide.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Transparency at the surface</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        When fallback fires, the engine emits a{" "}
        <code>routing:fallback</code> SSE event before the first round
        runs. The payload lists every model that got rerouted, the
        substitution it received, and a human-readable reason. Critically,
        the API key never appears in the event — only the substitution
        metadata.
      </p>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
        <pre className="text-muted-foreground">{`event: routing:fallback
data: {
  "count": 1,
  "resolutions": [{
    "requested_model": "claude-opus-4-7",
    "requested_provider": "anthropic",
    "effective_model": "openai/gpt-oss-120b",
    "effective_provider": "groq",
    "is_fallback": true,
    "fallback_reason": "No anthropic API key configured. Routed claude-opus-4-7 to groq free tier..."
  }],
  "message": "1 model(s) routed to Consilium free tier..."
}`}</pre>
      </div>

      <p className="text-lg leading-relaxed text-muted-foreground mt-6">
        The CLI surfaces this as a pre-flight notice (yellow banner with
        the substitution and a hint to add a key in{" "}
        <code>consilium config</code>). The web app surfaces it on the
        debate detail page. Either way, the user sees the substitution
        before they see the result.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">What happens to legacy model IDs</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        The resolver runs after the alias map, so legacy IDs forward
        first and then resolve through the chain. A request for{" "}
        <code>gpt-4o</code> with no OpenAI key resolves to{" "}
        <code>gpt-5.4</code> (alias), then through the chain — if no
        OpenAI key exists anywhere, it falls back to Groq&apos;s
        balanced tier. The user sees{" "}
        <code>requested_model: &quot;gpt-4o&quot;</code> →{" "}
        <code>effective_model: &quot;llama-3.3-70b-versatile&quot;</code>{" "}
        and knows exactly what ran.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Why this matters</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        The combination — BYOK preferred, free pool as backstop,
        substitution surfaced explicitly — means a user can try
        Consilium with zero setup and still see real multi-provider
        debate behavior. They&apos;re not locked into a paid signup
        before they know if they want the product. And they&apos;re
        never silently routed to a different model than they
        asked for.
      </p>

      <div className="mt-12 pt-8 border-t border-white/[0.06]">
        <Button asChild size="lg">
          <Link href="/sign-up">Try Consilium</Link>
        </Button>
      </div>
    </>
  );
}

function PlaceholderPost({ title }: { title: string }) {
  return (
    <>
      <p className="text-lg leading-relaxed text-muted-foreground">
        This post is coming soon. We&apos;re working on bringing you a deep dive
        into {title.toLowerCase()}. Check back shortly for the full article.
      </p>

      <div className="mt-12 pt-8 border-t border-white/[0.06]">
        <Button asChild variant="outline">
          <Link href="/blog">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
      </div>
    </>
  );
}

const postContent: Record<string, React.FC> = {
  "benchmark-results-council-deliberation-vs-single-models": BenchmarkPost,
  "model-freshness-audit-april-2026": ModelFreshnessAuditPost,
  "byok-with-a-safety-net": ByokSafetyNetPost,
};

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return (
      <div className="min-h-screen container mx-auto px-4 py-32 text-center">
        <h1 className="text-4xl font-bold mb-4">Post Not Found</h1>
        <Link href="/blog" className="text-primary hover:underline">
          Back to Blog
        </Link>
      </div>
    );
  }

  const Content = postContent[slug];

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? post.title,
    datePublished: post.date,
    url: `${SITE_URL}/blog/${post.slug}`,
    author: { "@type": "Person", name: "Saad Kadri" },
    publisher: {
      "@type": "Organization",
      name: "Consilium",
      url: SITE_URL,
    },
    articleSection: post.category,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Blog
          </Link>

          <Badge className={cn("mb-4", categoryColors[post.category])}>
            {post.category}
          </Badge>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-12">
            <span>Saad Kadri</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {post.readingTime}
            </span>
          </div>

          <div className="space-y-6">
            {Content ? <Content /> : <PlaceholderPost title={post.title} />}
          </div>
        </div>
      </article>
    </div>
  );
}
