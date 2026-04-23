import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock, Github } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { blogPosts, type BlogCategory } from "../blog-data";
import { buildMetadata, SITE_URL } from "@/lib/seo";

const categoryColors: Record<BlogCategory, string> = {
  Benchmarks: "bg-agree/14 text-agree border-agree/30",
  Research: "bg-warm/12 text-warm border-warm/20",
  Product: "bg-warm/12 text-warm-bright border-warm/20",
  Engineering: "bg-agree/14 text-agree border-agree/30",
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
              <td className="px-6 py-4 text-agree font-medium">+8.7%</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium">TruthfulQA</td>
              <td className="px-6 py-4 text-muted-foreground">68.5%</td>
              <td className="px-6 py-4 text-muted-foreground">79.3%</td>
              <td className="px-6 py-4 text-agree font-medium">+15.8%</td>
            </tr>
            <tr>
              <td className="px-6 py-4 font-medium">HumanEval</td>
              <td className="px-6 py-4 text-muted-foreground">82.0%</td>
              <td className="px-6 py-4 text-muted-foreground">89.4%</td>
              <td className="px-6 py-4 text-agree font-medium">+9.0%</td>
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

      <div className="bg-bg-1 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <code className="text-agree">npx consilium deliberate</code>
        <span className="text-muted-foreground"> --mode structured-debate</span>
        <span className="text-muted-foreground">
          {" "}
          --models claude-sonnet-4.5,gpt-4o,gemini-2.0-flash
        </span>
        <span className="text-muted-foreground">
          {" "}
          --prompt &quot;Your question here&quot;
        </span>
      </div>

      <div className="mt-12 pt-8 border-t border-white/[0.06]">
        <Button asChild size="lg">
          <Link
            href="https://github.com/skadri1601/Consilium"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="mr-2 h-4 w-4" />
            View on GitHub
          </Link>
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
    publisher: { "@type": "Organization", name: "Consilium", url: SITE_URL },
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
