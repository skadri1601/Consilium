import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { blogPosts, type BlogCategory } from "../blog-data";
import { buildMetadata, SITE_NAME, SITE_URL } from "@/lib/seo";
import { SAAD_AUTHOR_ID } from "@/lib/authors";

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

function PostCTA() {
  return (
    <div className="mt-12 pt-8 border-t border-white/[0.06]">
      <Button asChild size="lg">
        <Link href="/sign-up">Try Consilium</Link>
      </Button>
    </div>
  );
}

function BlogTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/[0.06] mt-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03]">
            {headers.map((h) => (
              <th key={h} className="px-6 py-4 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">{children}</tbody>
      </table>
    </div>
  );
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
        Most multi-agent products advertise benchmark gains. We ran our
        own — and the raw numbers are not yet representative of what
        either single models or council deliberation can do. The reason
        is mundane: our answer-checker is too strict. This post lays
        out what we ran in April 2026, what broke, what the cost was,
        and the published research baselines we measure ourselves
        against in the meantime.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">What we actually ran</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Three benchmarks against a 3-model council (GPT-5.4, Claude
        Sonnet 4.6, Gemini 3 Flash) in council mode (3 rounds), with
        single-model GPT-5.4 as the baseline:
      </p>

      <BlogTable
        headers={[
          "Benchmark",
          "N",
          "Raw single",
          "Raw deliberation",
          "API cost (single / debate)",
          "Status",
        ]}
      >
        <tr>
          <td className="px-6 py-4 font-medium">MMLU</td>
          <td className="px-6 py-4 text-muted-foreground">200</td>
          <td className="px-6 py-4 text-muted-foreground">2%</td>
          <td className="px-6 py-4 text-muted-foreground">2%</td>
          <td className="px-6 py-4 text-muted-foreground">$0.03 / $9.58</td>
          <td className="px-6 py-4 text-amber-400 text-xs">checker too strict</td>
        </tr>
        <tr>
          <td className="px-6 py-4 font-medium">TruthfulQA</td>
          <td className="px-6 py-4 text-muted-foreground">100</td>
          <td className="px-6 py-4 text-muted-foreground">27%</td>
          <td className="px-6 py-4 text-muted-foreground">19%</td>
          <td className="px-6 py-4 text-muted-foreground">$0.01 / $4.69</td>
          <td className="px-6 py-4 text-amber-400 text-xs">checker + API errors</td>
        </tr>
        <tr>
          <td className="px-6 py-4 font-medium">HumanEval</td>
          <td className="px-6 py-4 text-muted-foreground">50</td>
          <td className="px-6 py-4 text-muted-foreground">0%</td>
          <td className="px-6 py-4 text-muted-foreground">0%</td>
          <td className="px-6 py-4 text-muted-foreground">$0.01 / $3.00</td>
          <td className="px-6 py-4 text-amber-400 text-xs">checker too strict</td>
        </tr>
      </BlogTable>

      <p className="text-lg leading-relaxed text-muted-foreground mt-6">
        Total spend: $17.30 for 350 questions. We&apos;re publishing
        the raw numbers because pretending we have headline gains right
        now would be dishonest.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Why the scores are not representative</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Our answer-checker uses exact string matching. That works for
        carefully formatted multiple-choice answers and breaks
        immediately on:
      </p>

      <ul className="mt-4 space-y-3 text-lg leading-relaxed text-muted-foreground list-disc list-inside">
        <li>
          <strong className="text-foreground">Free-text TruthfulQA answers</strong> —
          a model can produce a factually correct response that doesn&apos;t
          contain the reference string verbatim, and the checker scores it
          zero. Council deliberation produces longer, more carefully-worded
          answers, which actually <em>hurts</em> the raw score under exact
          match. (That&apos;s why deliberation scored 19% to single-model 27%
          on TruthfulQA — not a real regression.)
        </li>
        <li>
          <strong className="text-foreground">HumanEval code</strong> — we
          should be running the unit tests that ship with each problem,
          not string-matching the function body. The fix is straightforward
          but it&apos;s not done yet.
        </li>
        <li>
          <strong className="text-foreground">MMLU at 2%</strong> — the
          checker is failing to extract the answer letter from longer
          responses. A 2% absolute score on a 4-choice benchmark is a
          checker bug, not a model bug.
        </li>
      </ul>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        Some TruthfulQA runs also hit OpenAI rate limits during
        execution, which dropped a fraction of debates entirely. We
        haven&apos;t separated checker noise from rate-limit noise yet.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">What we measure ourselves against</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Until the checker is fixed, the published research literature is
        the most honest reference for what multi-agent debate
        contributes:
      </p>

      <BlogTable headers={["Study", "Finding"]}>
        <tr>
          <td className="px-6 py-4 font-medium align-top">Du et al., ICML 2024</td>
          <td className="px-6 py-4 text-muted-foreground">
            Multi-agent debate adds +10–20% on math and strategic
            reasoning tasks vs. single-model baselines.
          </td>
        </tr>
        <tr>
          <td className="px-6 py-4 font-medium align-top">Chen et al., ACL 2024 (ReConcile)</td>
          <td className="px-6 py-4 text-muted-foreground">
            +6.8% accuracy on reasoning benchmarks using
            heterogeneous models with confidence-weighted voting.
          </td>
        </tr>
        <tr>
          <td className="px-6 py-4 font-medium align-top">Khan et al., ICML 2024</td>
          <td className="px-6 py-4 text-muted-foreground">
            Debate between persuasive LLMs increases truthfulness
            even when none of the participants individually knows
            the answer.
          </td>
        </tr>
        <tr>
          <td className="px-6 py-4 font-medium align-top">Liang et al., 2023</td>
          <td className="px-6 py-4 text-muted-foreground">
            Multi-agent debate increases solution diversity on
            creative and divergent-thinking tasks.
          </td>
        </tr>
      </BlogTable>

      <p className="text-lg leading-relaxed text-muted-foreground mt-6">
        These are the deltas Consilium&apos;s council mode is designed
        to capture. They&apos;re also the deltas we expect to see on
        our benchmark runs once the checker is doing semantic matching
        for free-text and unit-test execution for code.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Operational metrics that are real</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Even with the checker noise, we did learn something concrete
        about runtime cost and convergence behavior:
      </p>

      <ul className="mt-4 space-y-3 text-lg leading-relaxed text-muted-foreground list-disc list-inside">
        <li>
          <strong className="text-foreground">Council deliberation cost</strong> ran
          ~$0.05–0.10 per question with 3 models × 3 rounds (the 350-question
          spend works out close to this on average).
        </li>
        <li>
          <strong className="text-foreground">Convergence detection</strong> shaves
          roughly 30–40% off API spend vs. running a fixed round count, by
          stopping early when the council&apos;s votes have stabilized.
        </li>
        <li>
          <strong className="text-foreground">Median latency</strong> ~45s in
          council mode, ~15s in quick mode.
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-12 mb-6">When we&apos;ll publish real scores</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        The next benchmark run is gated on the checker fix: semantic
        match for TruthfulQA (LLM-as-judge with a held-out reference
        model), unit-test execution for HumanEval, and per-question
        rate-limit retry. When that lands we&apos;ll re-run the same
        350-question set, publish the deltas, and update this post.
        Until then, treat the table at the top as evidence that we ran
        the experiment, not as evidence of what deliberation does.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Run your own</h2>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <pre className="text-muted-foreground">{`cd apps/agents
python -m src.features.deliberation.benchmarks.runner \\
  --benchmark mmlu_pro \\
  --models claude-sonnet-4-6,gpt-5.4,gemini-3-flash-preview \\
  --mode council --n 200 \\
  --output results/mmlu_pro_council.json`}</pre>
      </div>

      <PostCTA />
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

      <PostCTA />
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

      <PostCTA />
    </>
  );
}

function ModelDeprecationCalendarPost() {
  return (
    <>
      <p className="text-lg leading-relaxed text-muted-foreground">
        While auditing our catalog on April 25, 2026 we pulled every
        provider&apos;s deprecation schedule. Six widely-used model IDs
        across Anthropic and Google are scheduled for shutdown in the
        next six months. If your application hard-codes any of them,
        the calls will start returning 404 on the date listed. If your
        application talks to Consilium, our alias map redirects each
        retired ID to a live equivalent — but you should still know what
        is moving.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">The calendar</h2>

      <BlogTable headers={["Date", "Provider", "Model ID", "Aliased forward to"]}>
        {[
          ["Jun 1, 2026", "Google", "gemini-2.0-flash", "gemini-3-flash-preview"],
          ["Jun 1, 2026", "Google", "gemini-2.0-flash-lite", "gemini-3.1-flash-lite-preview"],
          ["Jun 15, 2026", "Anthropic", "claude-sonnet-4-20250514", "claude-sonnet-4-6"],
          ["Jun 15, 2026", "Anthropic", "claude-opus-4-20250514", "claude-opus-4-6"],
          ["Jun 17, 2026", "Google", "gemini-2.5-pro", "gemini-3.1-pro-preview"],
          ["Jun 17, 2026", "Google", "gemini-2.5-flash", "gemini-3-flash-preview"],
          ["Jul 22, 2026", "Google", "gemini-2.5-flash-lite", "gemini-3.1-flash-lite-preview"],
          ["Oct 2, 2026", "Google", "gemini-2.5-flash-image", "gemini-3.1-flash-image-preview"],
        ].map(([date, provider, oldId, newId]) => (
          <tr key={`${date}-${oldId}`}>
            <td className="px-6 py-4 font-medium">{date}</td>
            <td className="px-6 py-4 text-muted-foreground">{provider}</td>
            <td className="px-6 py-4 font-mono text-xs">{oldId}</td>
            <td className="px-6 py-4 font-mono text-xs">{newId}</td>
          </tr>
        ))}
      </BlogTable>

      <p className="text-sm text-muted-foreground mt-3">
        Sourced from{" "}
        <a
          href="https://docs.anthropic.com/en/docs/about-claude/model-deprecations"
          className="text-primary hover:underline"
        >
          Anthropic deprecations
        </a>{" "}
        and{" "}
        <a
          href="https://ai.google.dev/gemini-api/docs/deprecations"
          className="text-primary hover:underline"
        >
          Gemini deprecations
        </a>
        {" "}as of April 25, 2026.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Already gone</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        One model in our previous catalog was already retired before the
        audit ran: <code>gemini-3-pro-preview</code> shut down on March
        9, 2026 — about seven weeks before we caught it. The replacement
        target Google specifies is <code>gemini-3.1-pro-preview</code>,
        which is what our catalog now points to. Anyone who hit the old
        ID between March 9 and our April 25 update would have seen a
        404 on the upstream call. (We didn&apos;t list it as a default,
        which is the only reason the impact was small.)
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">How aliasing keeps debates working</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Every entry in the calendar above has a key in our{" "}
        <code>MODEL_ALIASES</code> map (<code>apps/agents/src/shared/config/models.py</code>).
        When a debate request arrives with one of these IDs — usually
        from a script someone wrote a year ago, or a debate session we
        replay from history — the resolver substitutes the live target
        before the agent class is constructed. The user&apos;s
        configured model is preserved in the session record so the
        substitution is auditable, but the actual upstream call uses an
        ID that responds.
      </p>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        The tradeoff: alias targets must themselves stay live. We
        deliberately do not point an alias at any model with its own
        retirement date inside the calendar window. So{" "}
        <code>gemini-2.5-pro</code> (retiring Jun 17) is{" "}
        <strong>not</strong> aliased to{" "}
        <code>gemini-2.5-flash</code> (also retiring Jun 17) — both go
        directly to the 3.x preview line. Same logic for{" "}
        <code>claude-sonnet-4-20250514</code> →{" "}
        <code>claude-sonnet-4-6</code> (skipping{" "}
        <code>claude-sonnet-4-5</code>, which has its own future risk).
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">What you should do if you hard-code IDs</h2>

      <ul className="mt-4 space-y-3 text-lg leading-relaxed text-muted-foreground list-disc list-inside">
        <li>
          Search your code for any of the eight legacy IDs above and
          replace them with the alias target on the right. Do not wait
          for the retirement date — preview IDs have shorter notice
          windows, and the migration is mechanical.
        </li>
        <li>
          If you call Consilium, you don&apos;t need to do anything — but
          it&apos;s still cleaner to migrate so the substitution is
          visible in your code, not invisible in our resolver.
        </li>
        <li>
          For Gemini specifically: do not move from{" "}
          <code>gemini-2.0-flash</code> to{" "}
          <code>gemini-2.5-flash</code>. Both retire in June. Move
          straight to <code>gemini-3-flash-preview</code>.
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-12 mb-6">Why we re-audit</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Provider deprecation schedules don&apos;t arrive in a feed we
        can subscribe to. The shutdown dates land on documentation pages
        we have to fetch and re-read. We re-audit on a calendar (next
        run: end of May, just before the June 1 cluster) and commit the
        diff back to the catalog. The audit doc is in the repo at{" "}
        <code>docs/design/model-freshness-2026-04.md</code> with the
        verbatim source URLs for every row above.
      </p>

      <PostCTA />
    </>
  );
}

function WhyDeliberationBeatsOrchestrationPost() {
  return (
    <>
      <p className="text-lg leading-relaxed text-muted-foreground">
        Most multi-agent frameworks — CrewAI, LangGraph orchestrations,
        AutoGen pipelines — treat AI models as workers in a sequence:
        researcher hands off to writer, writer hands off to editor,
        editor produces the final answer. Consilium does something
        different. Models are adversaries in a structured debate, not
        collaborators in an assembly line. This post explains why that
        choice changes the output and where it doesn&apos;t.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Orchestration: errors propagate</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        In a sequential pipeline, the second model only sees the first
        model&apos;s output. If the first model hallucinated a fact, made
        an off-by-one in the reasoning, or anchored on the wrong
        framing, the downstream models inherit it. They might polish
        the prose, but they don&apos;t go back and check whether the
        upstream claim was correct — that&apos;s not their job in the
        pipeline graph. The compounding error problem is well-known in
        chained agent systems.
      </p>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        The orchestration approach also flattens disagreement. If two
        models would have produced contradictory answers, you only see
        whichever one happened to be in the right slot at the right
        time. The dissent — usually the most informative signal — is
        gone before the response leaves the system.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Deliberation: errors get caught</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Consilium runs a fixed protocol every debate:
      </p>

      <ol className="mt-4 space-y-4 text-lg leading-relaxed text-muted-foreground list-decimal list-inside">
        <li>
          <strong className="text-foreground">Round 1 — Independent
          analysis.</strong> Every model produces an answer to the
          topic in isolation. They never see each other&apos;s output
          in this round, so the responses are uncorrelated and any
          shared error has to come from training-data overlap, not
          from one model influencing another.
        </li>
        <li>
          <strong className="text-foreground">Round 2 —
          Cross-examination.</strong> Each model receives every other
          model&apos;s Round 1 answer and is asked to challenge it on
          factual errors, flawed reasoning, missing evidence, and edge
          cases. Challenges are typed, so the engine can route each
          one to the right defender.
        </li>
        <li>
          <strong className="text-foreground">Round 3 — Rebuttal and
          refinement.</strong> Defenders respond to each challenge
          (concede, refute, qualify, or redirect) and produce a
          revised answer that incorporates the survivable points and
          drops the indefensible ones.
        </li>
        <li>
          <strong className="text-foreground">Judge — 5-phase
          synthesis.</strong> A separate judge model performs claim
          extraction, cross-reference (which claims survived
          challenge), dispute resolution (where models still
          disagree), rubric scoring (correctness 30% / reasoning 25%
          / completeness 20% / actionability 15% / conciseness 10%),
          and produces the final verdict with a dissent report
          attached.
        </li>
      </ol>

      <p className="text-lg leading-relaxed text-muted-foreground mt-6">
        The cross-examination round is the load-bearing piece. It is
        the only place in the protocol where one model&apos;s mistake
        gets named by another model in the same conversation. In
        orchestration, that doesn&apos;t happen — there&apos;s no
        round where the editor is asked &quot;does this claim from the
        researcher actually hold up?&quot;
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">A concrete diff</h2>

      <BlogTable
        headers={[
          "Property",
          "Orchestration (CrewAI / LangChain agents)",
          "Deliberation (Consilium)",
        ]}
      >
        {[
          ["Model interaction", "Sequential pipeline", "Adversarial rounds"],
          ["Error handling", "Propagates downstream", "Caught by cross-examination"],
          ["Confidence", "Self-reported", "Calibrated via convergence detection"],
          ["Disagreement", "Hidden / overwritten", "Surfaced as dissent reports"],
          ["Audit trail", "Logs of intermediate outputs", "Structured claims, challenges, rebuttals"],
        ].map(([prop, orch, del]) => (
          <tr key={prop}>
            <td className="px-6 py-4 font-medium">{prop}</td>
            <td className="px-6 py-4 text-muted-foreground">{orch}</td>
            <td className="px-6 py-4 text-muted-foreground">{del}</td>
          </tr>
        ))}
      </BlogTable>

      <h2 className="text-2xl font-bold mt-12 mb-6">When orchestration is better</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Deliberation is not a universal upgrade. We don&apos;t ship
        Consilium as a replacement for every agent framework, and
        you&apos;d misuse it if you tried. Orchestration wins for:
      </p>

      <ul className="mt-4 space-y-3 text-lg leading-relaxed text-muted-foreground list-disc list-inside">
        <li>
          <strong className="text-foreground">Pure tool execution.</strong>{" "}
          If the task is &quot;run this query, summarize the result&quot;
          and the tool call is the bottleneck, multiple models arguing
          about the result is overkill.
        </li>
        <li>
          <strong className="text-foreground">Speed-bound interactive UX.</strong>{" "}
          A 3-round debate adds 30–60 seconds of latency. For an
          autocomplete or a typing-speed chat surface, that&apos;s
          not the right tradeoff.
        </li>
        <li>
          <strong className="text-foreground">Single-domain expert pipelines.</strong>{" "}
          When you genuinely have a researcher → writer → editor flow
          and the boundaries between roles are clear, orchestration is
          a more natural fit than &quot;all three argue.&quot;
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-12 mb-6">When deliberation is better</h2>

      <ul className="mt-4 space-y-3 text-lg leading-relaxed text-muted-foreground list-disc list-inside">
        <li>
          <strong className="text-foreground">Hard reasoning with disagreement.</strong>{" "}
          Architecture decisions, technical tradeoffs, code reviews
          where multiple defensible answers exist.
        </li>
        <li>
          <strong className="text-foreground">Hallucination-prone domains.</strong>{" "}
          Anything where one model could confidently produce a wrong
          fact and the only way to catch it is another model checking.
          Du et al. and Khan et al. both quantify this gain in the
          literature.
        </li>
        <li>
          <strong className="text-foreground">High-stakes decisions where dissent matters.</strong>{" "}
          When the user wants to see &quot;the answer is X, but two
          out of five panelists pushed back on Y&quot;, deliberation
          surfaces that. Orchestration silently picks one.
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-12 mb-6">What this looks like in code</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        The deliberation graph lives in{" "}
        <code>apps/agents/src/features/deliberation/deliberation_graph.py</code>{" "}
        and the judge in <code>apps/agents/src/core/judge.py</code>.
        It&apos;s a LangGraph state machine — round transitions are
        explicit nodes, the round-2 challenge generation is its own
        prompt, and the rebuttal classifications (concede / refute /
        qualify / redirect) come back as typed structured output. The
        whole thing is auditable: every challenge, every rebuttal,
        and every claim that survived to the synthesis is preserved
        in the debate session record.
      </p>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        That auditability is the other reason we picked deliberation
        over orchestration. When a debate produces a controversial
        answer, you can replay it and see exactly which model said
        what at which point — not just &quot;the writer agent
        produced this.&quot;
      </p>

      <PostCTA />
    </>
  );
}

function EightDeliberationModesPost() {
  return (
    <>
      <p className="text-lg leading-relaxed text-muted-foreground">
        Consilium ships eight deliberation modes. They&apos;re not
        marketing skins on the same logic — each one is a distinct
        state machine in the deliberation graph with a different
        round count, transition shape, and judge behavior. Picking the
        right one matters. Picking the wrong one wastes spend or
        produces a thinner answer than the topic deserves. Here&apos;s
        what each mode actually does, when to reach for it, and what
        it costs.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">The lineup</h2>

      <BlogTable headers={["Mode", "Rounds", "Median latency", "Best for"]}>
        {[
          ["quick", "1", "~15s", "Fast lookup-style questions"],
          ["council", "3", "~45s", "Default for most reasoning tasks"],
          ["deep", "5", "~90s", "Architecture-level decisions"],
          ["blind", "3", "~45s", "Reducing model-anchor bias"],
          ["redteam", "1 (attack/defend cycle)", "~60–120s", "Security & vulnerability review"],
          ["jury", "3", "~60s", "Ranked-choice on multiple options"],
          ["market", "5", "~90s", "Forecasting / probability claims"],
          ["auto", "varies", "depends on routed mode", "When you don’t want to choose"],
        ].map(([mode, rounds, latency, best]) => (
          <tr key={mode}>
            <td className="px-6 py-4 font-medium">{mode}</td>
            <td className="px-6 py-4 text-muted-foreground">{rounds}</td>
            <td className="px-6 py-4 text-muted-foreground">{latency}</td>
            <td className="px-6 py-4 text-muted-foreground">{best}</td>
          </tr>
        ))}
      </BlogTable>

      <p className="text-sm text-muted-foreground mt-3">
        Round counts are the actual values in{" "}
        <code>MAX_ROUNDS_BY_MODE</code> in{" "}
        <code>apps/agents/src/features/deliberation/deliberation_graph.py</code>.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">quick — single round, no debate</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Each model produces one independent answer; the judge picks
        the best one. There is no cross-examination round. This is
        the cheapest mode and the only mode where you are essentially
        getting a ranked best-of-N from your council. Use it when you
        want multiple model perspectives but the question is simple
        enough that none of them is going to challenge another&apos;s
        answer productively.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">council — the default</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Three rounds: independent analysis, cross-examination,
        rebuttal-and-refinement. The judge runs the 5-phase synthesis
        on the round-3 outputs. This is what we recommend for most
        non-trivial reasoning tasks: long enough to surface
        disagreement, short enough not to drag.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">deep — five rounds with sub-agent research</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Adds two more rounds beyond council, plus optional sub-agent
        research for context-heavy questions. Worth the extra spend
        when the topic is genuinely contested and the room is split
        after round 3. Convergence detection still applies, so a
        deep-mode debate that locks in early ends early — you only
        pay for the rounds you needed.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">blind — names hidden until scored</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Same shape as council, but model identities are stripped
        before each round so models judging round-1 outputs in
        round 2 don&apos;t know which one came from
        Claude vs. GPT vs. Gemini. Useful when you suspect anchoring
        to a particular brand — for example when ranking responses to
        a prompt where the &quot;safe&quot; answer is the one a more
        cautious model wrote.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">redteam — attack/defend cycle</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Designed for security review. The flow is asymmetric: one
        subset of models attacks (generates exploits / failure modes
        / adversarial inputs), another defends, and the judge
        categorizes findings into five severity-ranked dimensions
        (security, bugs, performance, quality, edge cases). Despite
        the single-round count, redteam runs longer than council in
        wall-clock time because the attack and defend phases are
        sequential and each pulls more tokens than a normal
        round-1 generation.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">jury — ranked-choice voting</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Three rounds. After round 3, every model casts a ranked
        ballot over the candidate answers. We aggregate using
        Borda count for the headline score and run a Condorcet check
        for cycle detection. When the room produces a consistent
        preference order, jury surfaces it; when there&apos;s a
        cycle (A beats B beats C beats A), the judge produces a
        weighted synthesis that the dissent report explicitly flags.
        Use jury when there are clearly multiple defensible answers
        and you want the council&apos;s collective ranking instead
        of a single verdict.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">market — prediction-market aggregation</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Five rounds with confidence-weighted voting. Each model
        produces a probability claim and a justification; the judge
        aggregates the probabilities the way a prediction market
        would — weighted by each model&apos;s calibrated confidence
        on similar past questions. This is the right mode for
        forecasting (&quot;will WebAssembly replace Docker for
        serverless within 3 years?&quot;) where the deliverable is a
        probability with reasoning, not a yes/no.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">auto — let the engine pick</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Auto runs a small classifier on the topic in front of round 1
        and routes to one of the seven explicit modes. The decision
        is surfaced in the SSE stream as a{" "}
        <code>routing:decided</code> event so you can see what it
        chose and why — auto is not a black box, it&apos;s
        a default with an audit trail. If the classifier is uncertain
        it falls back to council, which is the safest non-trivial
        mode.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">How to choose</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Three rules of thumb that work in practice:
      </p>

      <ul className="mt-4 space-y-3 text-lg leading-relaxed text-muted-foreground list-disc list-inside">
        <li>
          <strong className="text-foreground">If the topic has
          a fact-of-the-matter answer, start with quick.</strong>{" "}
          You don&apos;t need debate when one round of best-of-N is
          enough.
        </li>
        <li>
          <strong className="text-foreground">If the topic has
          tradeoffs, council.</strong> The cross-examination round is
          where tradeoff analysis actually happens.
        </li>
        <li>
          <strong className="text-foreground">If the deliverable
          is structured (a vote, a probability, a security report),
          pick the matching specialized mode</strong> — jury, market,
          or redteam respectively.
        </li>
      </ul>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        And if you genuinely don&apos;t know, auto is fine. It&apos;s
        what we use as the default for unclassified incoming traffic.
      </p>

      <PostCTA />
    </>
  );
}

function GettingStartedSdkPost() {
  return (
    <>
      <p className="text-lg leading-relaxed text-muted-foreground">
        This is a five-minute walkthrough: install the CLI or one of
        the SDKs, run a debate, see the result. The unusual thing
        about Consilium&apos;s onboarding is that you can skip the
        API-key step entirely on your first try — the platform-hosted
        free-tier pool will handle the call. You add your own key
        when you&apos;re ready, not before.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Option 1 — npx (no install)</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        Fastest path. No global install, no config:
      </p>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
        <pre className="text-muted-foreground">{`npx @myconsilium/cli debate "Should I use Postgres or DynamoDB for an event store?"`}</pre>
      </div>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        That runs council mode (3 rounds) against the default model
        lineup. If you have no provider keys configured, the resolver
        routes the call through the free-tier pool and the CLI prints
        a yellow notice telling you which model substituted in for
        which paid model. The debate result is the same; only the
        upstream API calls differ.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Option 2 — install globally</h2>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
        <pre className="text-muted-foreground">{`npm install -g @myconsilium/cli

consilium debate "What causes inflation?" --mode council
consilium debate "Review this architecture" --mode redteam --file diagram.png
consilium debate "Is Rust better than Go for CLIs?" --mode blind`}</pre>
      </div>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        The <code>--file</code> flag attaches local files as context.
        You can pass code, diagrams, or both — the agent factory
        will route image inputs through the multimodal-capable
        models in your council and skip them on text-only models.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Add your own key (when you&apos;re ready)</h2>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
        <pre className="text-muted-foreground">{`consilium config set openai_key sk-...
consilium config set anthropic_key sk-ant-...
consilium config set google_key AIza...
consilium config set moonshot_key sk-...
consilium config list`}</pre>
      </div>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        Keys are stored in <code>~/.consilium/config.json</code> on
        your machine — not on our servers. BYOK always wins over the
        free-tier pool, so the moment you add a key for a provider,
        debates stop substituting and start using your key directly.
        The CLI surfaces this with no fallback notice on the next
        debate.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">Option 3 — TypeScript SDK</h2>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
        <pre className="text-muted-foreground">{`npm install @myconsilium/sdk`}</pre>
      </div>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        Same protocol, programmatic API:
      </p>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
        <pre className="text-muted-foreground">{`import { ConsiliumClient } from '@myconsilium/sdk';

const client = new ConsiliumClient({
  apiUrl: 'https://api.myconsilium.xyz',
  apiKey: process.env.CONSILIUM_API_KEY,
});

const result = await client.deliberate({
  topic: 'Should we migrate to server components?',
  mode: 'jury',
  models: ['gpt-5.4', 'claude-sonnet-4-6', 'gemini-3-flash-preview'],
});

console.log(result.verdict);
console.log(result.votes);`}</pre>
      </div>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        For real-time event handling, stream instead:
      </p>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
        <pre className="text-muted-foreground">{`for await (const event of client.streamDeliberation({
  topic: 'Evaluate our security posture',
  mode: 'redteam',
})) {
  if (event.type === 'routing:fallback') {
    console.log('Substituted models:', event.data.resolutions);
  }
  if (event.type === 'agent:complete') {
    console.log(\`\${event.agentId}: \${event.content}\`);
  }
}`}</pre>
      </div>

      <h2 className="text-2xl font-bold mt-12 mb-6">Option 4 — Python SDK</h2>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
        <pre className="text-muted-foreground">{`pip install consilium`}</pre>
      </div>

      <div className="bg-neutral-900 rounded-lg p-4 font-mono text-sm overflow-x-auto mt-4">
        <pre className="text-muted-foreground">{`from consilium import ConsiliumClient, DeliberationMode

client = ConsiliumClient(
    api_url="https://api.myconsilium.xyz",
    api_key=os.environ["CONSILIUM_API_KEY"],
)

result = client.deliberate(
    topic="What is the most energy-efficient sorting algorithm?",
    mode=DeliberationMode.COUNCIL,
    models=["gpt-5.4", "claude-sonnet-4-6", "gemini-3-flash-preview"],
)

print(result.golden_prompt)
print(result.confidence_scores)
print(result.dissent_report)`}</pre>
      </div>

      <p className="text-lg leading-relaxed text-muted-foreground mt-4">
        Both SDKs expose the same five primary methods:{" "}
        <code>deliberate</code>, <code>stream_deliberation</code>,{" "}
        <code>red_team</code>, <code>blind_eval</code>, and{" "}
        <code>estimate_cost</code>. The <code>estimate_cost</code>{" "}
        call is worth knowing about — it predicts the spend for a
        debate before you run it, using the same token estimator the
        web UI uses.
      </p>

      <h2 className="text-2xl font-bold mt-12 mb-6">What to expect on your first debate</h2>

      <p className="text-lg leading-relaxed text-muted-foreground">
        For a council-mode debate over a moderately complex topic
        with three models:
      </p>

      <ul className="mt-4 space-y-3 text-lg leading-relaxed text-muted-foreground list-disc list-inside">
        <li>
          <strong className="text-foreground">~45 seconds median latency</strong>{" "}
          — three rounds of generation plus a judge synthesis pass.
        </li>
        <li>
          <strong className="text-foreground">~$0.05–0.10 cost</strong>{" "}
          if you&apos;re on BYOK with mid-tier models. The free-tier
          fallback path is, as the name suggests, free to the user
          and runs against open models on Groq or OpenRouter.
        </li>
        <li>
          <strong className="text-foreground">A structured result object</strong>{" "}
          with the verdict, per-model votes, confidence scores, a
          dissent report when the council didn&apos;t fully converge,
          and the full claim/challenge/rebuttal trace for audit.
        </li>
      </ul>

      <h2 className="text-2xl font-bold mt-12 mb-6">Common follow-ups</h2>

      <ul className="mt-4 space-y-3 text-lg leading-relaxed text-muted-foreground list-disc list-inside">
        <li>
          <strong className="text-foreground">&quot;How do I pick
          which mode?&quot;</strong> Three rules of thumb in the
          modes post: quick for fact-of-the-matter, council for
          tradeoffs, specialized modes (jury / market / redteam)
          when the deliverable is structured.
        </li>
        <li>
          <strong className="text-foreground">&quot;Can I run it
          locally?&quot;</strong> Yes, but the source repository is
          private as of April 2026. Self-host bundles ship to
          source-licensed customers as tarballs. Email{" "}
          <a className="text-primary hover:underline" href="mailto:support@myconsilium.xyz">
            support@myconsilium.xyz
          </a>
          .
        </li>
        <li>
          <strong className="text-foreground">&quot;What if a
          model errors mid-debate?&quot;</strong> The orchestrator
          falls back to a cheaper variant via{" "}
          <code>CHEAP_VARIANTS</code> on context-too-large errors,
          and the circuit breaker skips a provider entirely if it&apos;s
          flapping. The debate completes with a partial council if
          one provider is down.
        </li>
      </ul>

      <PostCTA />
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
  "model-deprecation-calendar-2026": ModelDeprecationCalendarPost,
  "why-deliberation-beats-orchestration": WhyDeliberationBeatsOrchestrationPost,
  "introducing-8-deliberation-modes": EightDeliberationModesPost,
  "getting-started-with-consilium-sdk": GettingStartedSdkPost,
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

  const postUrl = `${SITE_URL}/blog/${post.slug}`;
  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#blogposting`,
    headline: post.title,
    description: post.excerpt ?? post.title,
    datePublished: post.date,
    dateModified: post.date,
    url: postUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    image: `${SITE_URL}/og.png`,
    author: { "@id": SAAD_AUTHOR_ID },
    publisher: { "@id": `${SITE_URL}#organization` },
    articleSection: post.category,
    keywords: [post.category.toLowerCase(), "consilium", "ai council", "multi-agent debate"],
    inLanguage: "en-US",
    isPartOf: {
      "@type": "Blog",
      name: `${SITE_NAME} blog`,
      url: `${SITE_URL}/blog`,
    },
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
