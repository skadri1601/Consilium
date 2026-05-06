import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "CLI",
  description:
    "Install and use the Consilium CLI - run multi-AI debates from your terminal, stream rounds over SSE, and script deliberation into your workflow.",
  path: "/docs/cli",
  keywords: ["consilium cli", "ai debate cli", "terminal llm"],
});

const commands = [
  {
    name: "debate <topic>",
    description: "Start a multi-agent debate on any topic. Models argue, critique, and synthesize consensus across multiple rounds.",
    usage: 'consilium debate "How should I architect my microservices?" --models claude,gpt4o,gemini --mode council --rounds 3',
    flags: [
      { flag: "--models <list>", desc: "Comma-separated models" },
      { flag: "--mode <mode>", desc: "council, blind, jury, deep, market, redteam, swarm, oracle" },
      { flag: "--output <fmt>", desc: "text, markdown, cursorrules, claude-md, json" },
      { flag: "--rounds <n>", desc: "Number of debate rounds" },
    ],
  },
  {
    name: "ask <topic>",
    description: "Alias for debate. Quick way to get multi-model consensus on a question.",
    usage: 'consilium ask "What is the best state management for React in 2026?"',
    flags: [],
  },
  {
    name: "redteam <content>",
    description: "Run adversarial red-team assessment. Models attack and defend to find vulnerabilities in prompts, plans, or architectures.",
    usage: 'consilium redteam "Our authentication flow uses JWT stored in localStorage" --models claude,gpt4o --categories security,injection',
    flags: [
      { flag: "--models <list>", desc: "Models for attack/defense" },
      { flag: "--categories <list>", desc: "Attack categories to test" },
    ],
  },
  {
    name: "eval <topic>",
    description: "Blind evaluation where model identities are hidden. Responses are anonymized and judged purely on quality.",
    usage: 'consilium eval "Explain quantum computing to a 10-year-old" --responses answers.json --models claude,gpt4o,gemini',
    flags: [
      { flag: "--responses <file>", desc: "JSON file with pre-generated responses" },
      { flag: "--models <list>", desc: "Models to evaluate" },
    ],
  },
  {
    name: "benchmark",
    description: "Run standardized benchmarks across models and deliberation modes. Compare performance on MMLU, TruthfulQA, and HumanEval.",
    usage: "consilium benchmark --benchmark mmlu --models claude,gpt4o --mode council -n 50 --output results.json",
    flags: [
      { flag: "--benchmark <name>", desc: "mmlu, truthfulqa, humaneval" },
      { flag: "--models <list>", desc: "Models to benchmark" },
      { flag: "--mode <mode>", desc: "Single deliberation mode" },
      { flag: "--modes <list>", desc: "Multiple modes to compare" },
      { flag: "-n <count>", desc: "Number of questions to run" },
      { flag: "--timeout <ms>", desc: "Timeout per question" },
      { flag: "--output <file>", desc: "Save results to file" },
      { flag: "--local", desc: "Use local agent server" },
    ],
  },
  {
    name: "chat",
    description: "Interactive REPL with session persistence, 20+ slash commands, and file/image support. Your full deliberation workbench.",
    usage: "consilium chat --mode council --models claude,gpt4o,gemini",
    flags: [],
  },
  {
    name: "login",
    description: "Authenticate via browser using Clerk. Token is stored in ~/.consilium/config.json.",
    usage: "consilium login",
    flags: [],
  },
  {
    name: "debug <debateId>",
    description: "Full diagnostic trace of a debate including timing, token usage, model responses, and error details.",
    usage: "consilium debug dbt_abc123",
    flags: [],
  },
  {
    name: "logs <debateId>",
    description: "Query structured logs for a specific debate or deliberation.",
    usage: "consilium logs dbt_abc123 -l warn",
    flags: [
      { flag: "-l, --level <level>", desc: "Filter by log level (debug, info, warn, error)" },
    ],
  },
  {
    name: "stats",
    description: "Model performance dashboard showing usage, costs, response times, and quality metrics.",
    usage: "consilium stats",
    flags: [],
  },
  {
    name: "sessions",
    description: "Manage chat sessions. List, resume, rename, or delete persistent sessions.",
    usage: "consilium sessions list",
    flags: [],
  },
  {
    name: "config",
    description: "Set, get, or list configuration values including API keys and defaults.",
    usage: "consilium config set anthropic-key sk-ant-...",
    flags: [],
  },
];

const slashCommands = [
  { cmd: "/ask <topic>", desc: "Start a new deliberation inline" },
  { cmd: "/mode <mode>", desc: "Switch deliberation mode" },
  { cmd: "/estimate", desc: "Estimate cost of current topic" },
  { cmd: "/output <format>", desc: "Change output format" },
  { cmd: "/file <path>", desc: "Attach a file for context" },
  { cmd: "/image <path>", desc: "Attach an image for analysis" },
  { cmd: "/workspace <path>", desc: "Set working directory for file references" },
  { cmd: "/context", desc: "Show current context window" },
  { cmd: "/clear", desc: "Clear conversation history" },
  { cmd: "/status", desc: "Show active deliberation status" },
  { cmd: "/models", desc: "List or change active models" },
  { cmd: "/save <name>", desc: "Save current conversation" },
  { cmd: "/history", desc: "Show conversation history" },
  { cmd: "/conversations", desc: "List all saved conversations" },
  { cmd: "/sessions", desc: "List chat sessions" },
  { cmd: "/search <query>", desc: "Search across all sessions" },
  { cmd: "/rename <name>", desc: "Rename current session" },
  { cmd: "/delete <id>", desc: "Delete a session" },
  { cmd: "/api", desc: "Show raw API request/response" },
  { cmd: "/help", desc: "Show all available commands" },
  { cmd: "/exit", desc: "Exit the chat REPL" },
];

const outputFormats = [
  { format: "text", desc: "Pretty-printed terminal output with colors and formatting" },
  { format: "markdown", desc: "Full document with metadata, rounds, and synthesis sections" },
  { format: "cursorrules", desc: "Numbered rules extracted from consensus, ready for .cursorrules" },
  { format: "claude-md", desc: "Structured Decisions, Guidelines, and Context sections for CLAUDE.md" },
  { format: "json", desc: "Complete metadata, rounds, messages, and synthesis in JSON" },
];

export default function CliReferencePage() {
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/docs"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Docs
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            CLI Reference
          </h1>
          <p className="text-xl text-muted-foreground">
            Run deliberations from your terminal
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Installation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-emerald-400">npm install -g @myconsilium/cli</code>
              </pre>
              <p className="text-sm text-muted-foreground">
                Or with your preferred package manager:
              </p>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto space-y-1">
                <code className="text-muted-foreground block">yarn global add @myconsilium/cli</code>
                <code className="text-muted-foreground block">pnpm add -g @myconsilium/cli</code>
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Start</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`consilium login
consilium config set anthropic-key sk-ant-...
consilium config set openai-key sk-...
consilium debate "How should I architect my microservices?" --mode council`}</code>
              </pre>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">Commands</h2>
            <div className="space-y-4">
              {commands.map((cmd) => (
                <Card key={cmd.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-mono">
                      <span className="text-indigo-400">consilium</span>{" "}
                      {cmd.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {cmd.description}
                    </p>
                    <pre className="rounded-lg bg-neutral-900 p-3 text-sm overflow-x-auto">
                      <code className="text-muted-foreground">{cmd.usage}</code>
                    </pre>
                    {cmd.flags.length > 0 && (
                      <div className="rounded-lg border border-white/[0.06] overflow-hidden mt-2">
                        <table className="w-full text-sm">
                          <tbody>
                            {cmd.flags.map((f) => (
                              <tr key={f.flag} className="border-b border-white/[0.06] last:border-0">
                                <td className="px-4 py-2 font-mono text-xs text-indigo-400 whitespace-nowrap">{f.flag}</td>
                                <td className="px-4 py-2 text-xs text-muted-foreground">{f.desc}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Chat Slash Commands</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Available inside the interactive chat REPL. Type any command to execute.
            </p>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Command</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {slashCommands.map((row) => (
                    <tr key={row.cmd} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-6 py-3 font-mono text-xs text-indigo-400 whitespace-nowrap">{row.cmd}</td>
                      <td className="px-6 py-3 text-muted-foreground">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">Output Formats</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Control how results are formatted with <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">--output</code> or the <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">/output</code> slash command.
            </p>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Format</th>
                    <th className="px-6 py-3 text-left font-medium text-muted-foreground">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {outputFormats.map((row) => (
                    <tr key={row.format} className="border-b border-white/[0.06] last:border-0">
                      <td className="px-6 py-3 font-mono text-xs text-emerald-400">{row.format}</td>
                      <td className="px-6 py-3 text-muted-foreground">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Chat sessions are persisted to <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">~/.consilium/sessions/*.json</code> and can be resumed, searched, renamed, or deleted.
              </p>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`consilium sessions list
consilium sessions resume sess_abc123
consilium sessions rename sess_abc123 "Architecture Discussion"
consilium sessions delete sess_abc123`}</code>
              </pre>
              <p className="text-sm text-muted-foreground">
                Sessions automatically save conversation history, model selections, mode, and attached files. Use <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">/search &lt;query&gt;</code> inside chat to search across all sessions.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Flag</th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { flag: "--mode <mode>", desc: "Deliberation mode (council, blind, jury, deep, market, redteam, swarm, oracle)" },
                      { flag: "--models <list>", desc: "Comma-separated list of models to use" },
                      { flag: "--rounds <n>", desc: "Number of debate rounds (default: 3)" },
                      { flag: "--output <format>", desc: "Output format: text, markdown, cursorrules, claude-md, json" },
                      { flag: "--verbose", desc: "Show detailed round-by-round output" },
                      { flag: "--no-stream", desc: "Disable streaming (wait for final result)" },
                      { flag: "--api-url <url>", desc: "Custom API server URL" },
                      { flag: "--timeout <ms>", desc: "Request timeout in milliseconds" },
                      { flag: "--json", desc: "Force JSON output for scripting" },
                      { flag: "--quiet", desc: "Suppress non-essential output" },
                      { flag: "--version", desc: "Show CLI version" },
                      { flag: "--help", desc: "Show help for any command" },
                    ].map((row) => (
                      <tr key={row.flag} className="border-b border-white/[0.06] last:border-0">
                        <td className="px-6 py-3 font-mono text-indigo-400">{row.flag}</td>
                        <td className="px-6 py-3 text-muted-foreground">{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
