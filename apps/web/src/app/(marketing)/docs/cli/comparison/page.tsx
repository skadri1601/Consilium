import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbList,
  techArticleSchema,
  faqPage,
} from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "CLI Comparison",
  description:
    "Feature-by-feature parity matrix comparing the Consilium CLI to Claude Code, Gemini CLI, Grok Build, and Cursor CLI. ~40 capability rows across multi-model debate, plan mode, hooks, sub-agents, sandbox, worktree, MCP, voice, image gen, headless output, slash commands, autonomy primitives, and BYOK pricing.",
  path: "/docs/cli/comparison",
  keywords: [
    "consilium vs claude code",
    "consilium vs gemini cli",
    "consilium vs grok build",
    "consilium vs cursor cli",
    "ai coding cli comparison",
    "claude code alternative",
    "cursor cli alternative",
    "multi model coding agent",
    "ai cli feature matrix",
    "byok ai cli",
  ],
});

const techArticleJsonLd = techArticleSchema({
  title: "CLI Comparison",
  description:
    "Feature-by-feature parity matrix comparing the Consilium CLI to Claude Code, Gemini CLI, Grok Build, and Cursor CLI. Around 40 capability rows covering multi-model debate, plan mode, hooks, sub-agents, sandbox, worktree, MCP marketplace, voice, image generation, headless output, slash commands, autonomy (loop, goal, schedule), and BYOK pricing.",
  path: "/docs/cli/comparison",
  proficiencyLevel: "Beginner",
  publishedTime: "2026-05-20",
  modifiedTime: "2026-05-20",
});

const faqJsonLd = faqPage(
  [
    {
      question: "What is the one feature only Consilium has?",
      answer:
        "Multi-AI debate. Consilium is the only CLI in this comparison that runs the same prompt through multiple frontier models simultaneously, has them cross-examine each other across rounds, and produces a synthesized consensus answer with voting math. Every other tool routes to a single model at a time.",
    },
    {
      question: "Does Consilium replace Claude Code?",
      answer:
        "It overlaps: hooks, sub-agents, sandbox, plan mode, and the slash command surface mirror Claude Code closely and are largely portable. The difference is that Consilium can call Claude, GPT, Gemini, Grok, Llama, and DeepSeek from the same session and have them debate, while Claude Code is Anthropic-only.",
    },
    {
      question: "How does pricing compare?",
      answer:
        "Consilium is BYOK with zero markup - you pay each provider directly at their list rate. Cursor CLI bundles its own subscription. Claude Code uses your Anthropic API key (also BYOK, but single-vendor). Gemini CLI is BYOK Google. Grok Build is BYOK xAI. Consilium also offers a Groq-backed free tier when no key is configured for the requested provider.",
    },
    {
      question: "Which CLI has the most lifecycle hooks?",
      answer:
        "Claude Code and Consilium tie at seven lifecycle events each (SessionStart, SessionEnd, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop). Cursor CLI ships four. Gemini CLI and Grok Build do not expose a lifecycle hook system at the time of writing.",
    },
    {
      question: "Do all of these CLIs support MCP?",
      answer:
        "Yes - Claude Code, Cursor CLI, Gemini CLI, Grok Build, and Consilium all support the Model Context Protocol. Consilium adds an in-CLI marketplace (`/mcp search`, `/mcp install`) backed by the same registry Anthropic publishes.",
    },
    {
      question: "Is this comparison kept up to date?",
      answer:
        "Yes - the matrix is regenerated against the published changelogs and docs of each tool. Feature gaps move quickly in this category; check the source repos linked at the bottom for the latest state.",
    },
  ],
  { url: `${SITE_URL}/docs/cli/comparison`, speakable: true },
);

const breadcrumbJsonLd = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "CLI", path: "/docs/cli" },
  { name: "Comparison", path: "/docs/cli/comparison" },
]);

const rows: {
  feature: string;
  consilium: string;
  claudeCode: string;
  geminiCli: string;
  grokBuild: string;
  cursorCli: string;
}[] = [
  {
    feature: "Multi-AI debate (council/jury/red-team)",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Cross-model arbitration / consensus voting",
    consilium: "Yes (Condorcet + Borda)",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Models per session",
    consilium: "1-5 (any vendor)",
    claudeCode: "1 (Anthropic)",
    geminiCli: "1 (Google)",
    grokBuild: "1 (xAI)",
    cursorCli: "1 (configurable)",
  },
  {
    feature: "BYOK at zero markup",
    consilium: "Yes",
    claudeCode: "Yes (Anthropic only)",
    geminiCli: "Yes (Google only)",
    grokBuild: "Yes (xAI only)",
    cursorCli: "Subscription",
  },
  {
    feature: "Free tier fallback (no key required)",
    consilium: "Yes (Groq)",
    claudeCode: "No",
    geminiCli: "Limited",
    grokBuild: "No",
    cursorCli: "Subscription",
  },
  {
    feature: "Plan mode (read-only planning, then exec)",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "Partial",
    grokBuild: "Partial",
    cursorCli: "Yes",
  },
  {
    feature: "Lifecycle hooks",
    consilium: "7 events",
    claudeCode: "7 events",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "4 events",
  },
  {
    feature: "HTTP webhook hooks (not just shell)",
    consilium: "Yes",
    claudeCode: "No (shell only)",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "User-defined sub-agents (YAML frontmatter)",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Yes",
  },
  {
    feature: "Per-sub-agent tool allowlist",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Partial",
  },
  {
    feature: "OS-level sandbox (macOS Seatbelt)",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Yes",
  },
  {
    feature: "OS-level sandbox (Linux bwrap)",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Partial",
  },
  {
    feature: "Windows sandbox fallback (worktree+ACL)",
    consilium: "Yes",
    claudeCode: "Partial",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Partial",
  },
  {
    feature: "Workspace trust prompt (always/session)",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Yes",
  },
  {
    feature: "Git worktree isolation per session",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Yes",
  },
  {
    feature: "MCP client",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "Yes",
    grokBuild: "Yes",
    cursorCli: "Yes",
  },
  {
    feature: "MCP marketplace (search/install in CLI)",
    consilium: "Yes",
    claudeCode: "Partial",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Partial",
  },
  {
    feature: "Slash commands in chat",
    consilium: "50+",
    claudeCode: "30+",
    geminiCli: "10+",
    grokBuild: "10+",
    cursorCli: "20+",
  },
  {
    feature: "Voice dictation (Whisper)",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Partial",
  },
  {
    feature: "Image generation (DALL-E / Imagen)",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "Yes (Imagen)",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Image input (vision)",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "Yes",
    grokBuild: "Yes",
    cursorCli: "Yes",
  },
  {
    feature: "Web search grounding",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "Yes",
    grokBuild: "Yes (live)",
    cursorCli: "Yes",
  },
  {
    feature: "Headless JSON output",
    consilium: "Yes (--output json)",
    claudeCode: "Yes",
    geminiCli: "Yes",
    grokBuild: "Partial",
    cursorCli: "Yes",
  },
  {
    feature: "Headless stream-JSON output",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "Partial",
    grokBuild: "No",
    cursorCli: "Partial",
  },
  {
    feature: "Long-lived CI tokens",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "Yes",
    grokBuild: "Yes",
    cursorCli: "Yes",
  },
  {
    feature: "Session persistence (~/.<cli>/sessions/*.json)",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "Yes",
    grokBuild: "Partial",
    cursorCli: "Yes",
  },
  {
    feature: "Cross-session search",
    consilium: "Yes (/search)",
    claudeCode: "Partial",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Partial",
  },
  {
    feature: "Autonomy: /loop recurring task",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Autonomy: /goal long-running objective",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Autonomy: /schedule cron-style",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Output: cursorrules / claude-md preset",
    consilium: "Yes",
    claudeCode: "Partial",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Yes (.cursorrules)",
  },
  {
    feature: "Red-team adversarial mode (built in)",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Benchmark runner (MMLU/HumanEval/TruthfulQA)",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Probabilistic / market consensus mode",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Mandatory dissent (jury mode)",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "No",
  },
  {
    feature: "Cost estimator before run (/estimate)",
    consilium: "Yes",
    claudeCode: "No",
    geminiCli: "No",
    grokBuild: "No",
    cursorCli: "Partial",
  },
  {
    feature: "Per-model usage dashboard (consilium stats)",
    consilium: "Yes",
    claudeCode: "Partial",
    geminiCli: "Partial",
    grokBuild: "No",
    cursorCli: "Yes (dashboard)",
  },
  {
    feature: "VS Code companion extension",
    consilium: "Yes",
    claudeCode: "Yes",
    geminiCli: "Partial",
    grokBuild: "No",
    cursorCli: "Yes (native)",
  },
  {
    feature: "TypeScript SDK",
    consilium: "Yes (@myconsilium/sdk)",
    claudeCode: "Yes",
    geminiCli: "Yes",
    grokBuild: "Yes",
    cursorCli: "No",
  },
  {
    feature: "Python SDK",
    consilium: "Yes (consilium on PyPI)",
    claudeCode: "Yes",
    geminiCli: "Yes",
    grokBuild: "Yes",
    cursorCli: "No",
  },
];

export default function CliComparisonPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-comparison-techarticle" data={techArticleJsonLd} />
      <JsonLd id="ld-comparison-faq" data={faqJsonLd} />
      <JsonLd id="ld-comparison-breadcrumbs" data={breadcrumbJsonLd} />

      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/docs/cli"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CLI
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            CLI Comparison
          </h1>
          <p
            data-speakable
            className="text-xl text-muted-foreground leading-relaxed"
          >
            Multi-AI debate is the one capability only Consilium ships. The CLI
            runs the same prompt through multiple frontier models, has them
            cross-examine each other across rounds, and produces a synthesized
            consensus answer with formal voting math. Every other CLI in this
            matrix routes to a single model at a time. The table below scores
            roughly 40 capabilities against Claude Code, Gemini CLI, Grok Build,
            and Cursor CLI.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                The Consilium moat (one line)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              <p>
                Every other CLI in this list is essentially{" "}
                <em>one model with a workbench</em>. Consilium is{" "}
                <em>
                  a workbench that runs many models against each other and
                  converges on an answer
                </em>
                . If your use case is high-stakes (architecture, security,
                compliance) or contested (correctness-critical,
                multi-perspective), the debate primitive is the difference. If
                your use case is fast single-shot completion, any of these tools
                is fine and Consilium will still let you run in single-model
                mode.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">
            Feature-by-feature parity matrix
          </h2>
          <div className="rounded-xl border border-white/[0.06] overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-indigo-400">
                    Consilium
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Claude Code
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Gemini CLI
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Grok Build
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Cursor CLI
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.feature}
                    className="border-b border-white/[0.06] last:border-0"
                  >
                    <td className="px-4 py-3 text-xs">{r.feature}</td>
                    <td className="px-4 py-3 text-xs text-indigo-400 font-medium">
                      {r.consilium}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.claudeCode}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.geminiCli}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.grokBuild}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {r.cursorCli}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-5xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">When to pick each tool</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-white">Pick Consilium when:</strong> you
                want multiple models to debate a high-stakes decision; you care
                about formal consensus (Condorcet/Borda) rather than a single
                model&apos;s opinion; you want jury, red-team, or market modes
                that no single-model CLI ships; or you want one tool that
                subsumes Claude, GPT, Gemini, Grok, Llama, and DeepSeek without
                vendor lock-in.
              </p>
              <p>
                <strong className="text-white">Pick Claude Code when:</strong>{" "}
                you are all-in on Anthropic and want the most Anthropic-native
                surface (deepest hook coverage, model-tuned prompt cache,
                official Anthropic support).
              </p>
              <p>
                <strong className="text-white">Pick Gemini CLI when:</strong>{" "}
                you live inside Google Cloud, you want Imagen image generation
                in the loop, or you need first-party Vertex integration.
              </p>
              <p>
                <strong className="text-white">Pick Grok Build when:</strong>{" "}
                you want xAI&apos;s live X/Twitter web grounding and the fastest
                Grok-tuned coding loop.
              </p>
              <p>
                <strong className="text-white">Pick Cursor CLI when:</strong>{" "}
                you already use Cursor&apos;s editor, want the IDE and CLI to
                share state, and prefer a subscription pricing model.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Source links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>
                Consilium CLI source:{" "}
                <a
                  href="https://github.com/skadri1601/consilium-cli"
                  className="text-indigo-400 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/skadri1601/consilium-cli
                </a>
              </p>
              <p>
                Comparison data is regenerated against the published changelogs
                of each tool; gaps move quickly in this category. See related
                pages for deep dives:{" "}
                <Link
                  href="/docs/cli/hooks"
                  className="text-indigo-400 hover:underline"
                >
                  Hooks
                </Link>
                ,{" "}
                <Link
                  href="/docs/cli/sub-agents"
                  className="text-indigo-400 hover:underline"
                >
                  Sub-Agents
                </Link>
                ,{" "}
                <Link
                  href="/docs/cli/sandbox"
                  className="text-indigo-400 hover:underline"
                >
                  Sandbox
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
