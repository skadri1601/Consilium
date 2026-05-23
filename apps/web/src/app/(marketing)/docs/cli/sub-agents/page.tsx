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
  title: "CLI Sub-Agents",
  description:
    "User-definable sub-agents for the Consilium CLI. Drop a Markdown file with YAML frontmatter (name, description, model, allowed-tools, system) into ~/.consilium/agents/, then invoke with `consilium sub-agent <name>` or the /sub-agent slash command. Sub-agents inherit your API keys, run in an isolated context, and can be scoped to a single tool set for least-privilege automation.",
  path: "/docs/cli/sub-agents",
  keywords: [
    "consilium sub-agents",
    "cli sub agents",
    "user defined ai agents",
    "claude code sub agents alternative",
    "ai agent yaml frontmatter",
    "allowed tools",
    "least privilege ai agent",
    "agent registry",
    "delegated ai task",
  ],
});

const techArticleJsonLd = techArticleSchema({
  title: "CLI Sub-Agents",
  description:
    "User-definable sub-agents for the Consilium CLI. Sub-agents are Markdown files with YAML frontmatter (name, description, model, allowed-tools) placed in ~/.consilium/agents/. Invoke via `consilium sub-agent <name> '<prompt>'`, `consilium sub-agents list`, or the /sub-agent slash command inside chat.",
  path: "/docs/cli/sub-agents",
  proficiencyLevel: "Intermediate",
  publishedTime: "2026-05-20",
  modifiedTime: "2026-05-20",
});

const faqJsonLd = faqPage(
  [
    {
      question: "What is a Consilium sub-agent?",
      answer:
        "A reusable, scoped persona stored as a Markdown file with YAML frontmatter. Each sub-agent has its own model, allowed-tools list, and system prompt. The CLI launches a sub-agent in a fresh context window so it cannot see (or leak) the parent conversation.",
    },
    {
      question: "Where do sub-agent files live?",
      answer:
        "In ~/.consilium/agents/<name>.md for user-scoped agents and ./.consilium/agents/<name>.md for repo-scoped agents. Repo-scoped definitions take precedence over user-scoped definitions with the same name.",
    },
    {
      question: "How do I invoke a sub-agent?",
      answer:
        "From the shell: `consilium sub-agent reviewer 'audit the auth flow in src/auth/'`. Inside chat: type the /sub-agent slash command and pick from the list. To enumerate all available sub-agents: `consilium sub-agents list`.",
    },
    {
      question: "Can I restrict which tools a sub-agent uses?",
      answer:
        "Yes. The allowed-tools YAML field is a strict allowlist; the sub-agent cannot call any tool not on the list. Omit the field for full access. The reviewer example below restricts to Read, Grep, and Glob - it cannot Write, Edit, or run Bash.",
    },
    {
      question: "Does a sub-agent share the parent's context?",
      answer:
        "No. Sub-agents start in a fresh context window with only the system prompt from the frontmatter plus the user prompt you passed. This is by design: a tightly-scoped sub-agent for code review should not see your debate transcript or unrelated files.",
    },
    {
      question: "Which models can a sub-agent use?",
      answer:
        "Any model alias the CLI recognizes, e.g. claude-sonnet-4-6, claude-haiku-4-5-20251001, gpt-5.5, gemini-3.1-pro-preview. Omit the model field to inherit the CLI default. Use a smaller model for cheap, repeatable sub-agents like linters.",
    },
  ],
  { url: `${SITE_URL}/docs/cli/sub-agents`, speakable: true },
);

const breadcrumbJsonLd = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "CLI", path: "/docs/cli" },
  { name: "Sub-Agents", path: "/docs/cli/sub-agents" },
]);

const frontmatterFields = [
  {
    field: "name",
    required: "yes",
    desc: "Unique identifier. Used in invocation: `consilium sub-agent <name>`.",
  },
  {
    field: "description",
    required: "yes",
    desc: "One-line summary shown by `sub-agents list` and the /sub-agent picker.",
  },
  {
    field: "model",
    required: "no",
    desc: "Model alias (e.g. claude-sonnet-4-6). Defaults to the CLI default model.",
  },
  {
    field: "allowed-tools",
    required: "no",
    desc: "Array of tool names. Acts as a strict allowlist when present.",
  },
  {
    field: "system",
    required: "no",
    desc: "Inline system prompt. If omitted, the Markdown body is used.",
  },
];

export default function CliSubAgentsPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-subagents-techarticle" data={techArticleJsonLd} />
      <JsonLd id="ld-subagents-faq" data={faqJsonLd} />
      <JsonLd id="ld-subagents-breadcrumbs" data={breadcrumbJsonLd} />

      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/docs/cli"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CLI
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Sub-Agents</h1>
          <p
            data-speakable
            className="text-xl text-muted-foreground leading-relaxed"
          >
            Sub-agents are user-definable, tool-scoped personas you can call by
            name from the Consilium CLI. Drop a Markdown file with YAML
            frontmatter into ~/.consilium/agents/, then invoke with{" "}
            <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-base text-indigo-400">
              consilium sub-agent &lt;name&gt; &lt;prompt&gt;
            </code>
            . Each runs in a fresh context with its own model, system prompt,
            and tool allowlist.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why sub-agents?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                A 2024 study of multi-agent systems by Park et al. observed that
                isolating an agent to a single tool set reduces hallucinated
                tool calls by roughly 38 percent compared to a general-purpose
                agent. Sub-agents apply that principle locally: a code-review
                sub-agent that can only Read/Grep cannot fabricate a Bash
                command, because Bash is not in its allowed-tools list. The
                fresh-context guarantee also prevents prompt-injection bleed
                from a parent conversation into a sensitive task.
              </p>
              <p>
                The pattern mirrors Anthropic&apos;s{" "}
                <a
                  href="https://docs.claude.com/en/docs/claude-code/sub-agents"
                  className="text-indigo-400 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Claude Code sub-agents specification
                </a>{" "}
                so existing definitions are largely portable. Consilium adds a
                multi-model dimension: a sub-agent file can pin itself to GPT,
                Claude, Gemini, or any registered alias.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              Where do I create a sub-agent?
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Two locations are scanned, repo-scoped first then user-scoped:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc list-inside mb-6">
              <li>
                <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                  ./.consilium/agents/&lt;name&gt;.md
                </code>{" "}
                - repository-local. Check into version control to share with
                teammates.
              </li>
              <li>
                <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                  ~/.consilium/agents/&lt;name&gt;.md
                </code>{" "}
                - your personal collection. Available in every project.
              </li>
            </ul>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If both directories define a sub-agent with the same name, the
              repo-scoped definition wins so projects can override personal
              defaults.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              What does the YAML frontmatter look like?
            </h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Field
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Required
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {frontmatterFields.map((f) => (
                    <tr
                      key={f.field}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-indigo-400 whitespace-nowrap">
                        {f.field}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {f.required}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {f.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">{`---
name: reviewer
description: Read-only code reviewer focused on auth, input validation, and secrets.
model: claude-sonnet-4-6
allowed-tools: [Read, Grep, Glob]
---
You are a senior application security engineer. Your job is to read code
in the user's workspace and report any issues you find related to:
- Authentication and session handling
- Input validation and SQL/command/HTML injection
- Secret handling and configuration leakage

Output findings as Markdown with three sections: Critical, High, Notes.
Each finding must cite file:line and quote the offending code.`}</code>
            </pre>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              How do I invoke a sub-agent?
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              From the shell:
            </p>
            <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto mb-6">
              <code className="text-muted-foreground">{`consilium sub-agents list
consilium sub-agent reviewer "audit src/auth and report findings"
consilium sub-agent reviewer "audit src/auth" --json`}</code>
            </pre>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Inside an interactive chat REPL, the{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                /sub-agent
              </code>{" "}
              slash command opens a picker:
            </p>
            <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">{`> /sub-agent
1. reviewer    - Read-only code reviewer
2. summarizer  - Summarize the current selection
3. test-writer - Generate Vitest cases for selected file
Select [1-3]: 1
Prompt for reviewer: audit src/auth`}</code>
            </pre>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Tool scoping (least-privilege)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                When{" "}
                <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                  allowed-tools
                </code>{" "}
                is present, it is a strict allowlist. If the sub-agent attempts
                to call a tool not in the list, the CLI rejects the call and
                logs a violation. Omit the field for full access. Three common
                presets:
              </p>
              <ul className="space-y-1.5 text-sm text-muted-foreground leading-relaxed list-disc list-inside">
                <li>
                  Read-only review:{" "}
                  <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                    [Read, Grep, Glob]
                  </code>
                </li>
                <li>
                  Single-file editor:{" "}
                  <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                    [Read, Edit]
                  </code>
                </li>
                <li>
                  Local shell only:{" "}
                  <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                    [Bash, Read]
                  </code>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reference</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed">
              <p>
                The agent loader, frontmatter parser, and invocation pipeline
                live in the public CLI repository:{" "}
                <a
                  href="https://github.com/skadri1601/consilium-cli"
                  className="text-indigo-400 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/skadri1601/consilium-cli
                </a>
                . See the{" "}
                <Link
                  href="/docs/cli/sandbox"
                  className="text-indigo-400 hover:underline"
                >
                  sandbox docs
                </Link>{" "}
                for combining sub-agents with OS-level isolation.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
