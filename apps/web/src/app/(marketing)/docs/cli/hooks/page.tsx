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
  title: "CLI Hooks",
  description:
    "Lifecycle hooks for the Consilium CLI. Fire shell commands or HTTP webhooks on SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop, and SessionEnd. Configure in ~/.consilium/hooks.json with hooksEnabled: true. Block actions via exit-code-2 or a {block: true} JSON response. HTTP hooks restricted to URLs in allowedHookUrls allowlist.",
  path: "/docs/cli/hooks",
  keywords: [
    "consilium hooks",
    "cli lifecycle hooks",
    "ai agent hooks",
    "pre tool use hook",
    "post tool use hook",
    "claude code hooks alternative",
    "ai cli automation",
    "session start hook",
    "user prompt submit hook",
    "ai webhook",
  ],
});

const techArticleJsonLd = techArticleSchema({
  title: "CLI Hooks",
  description:
    "Lifecycle hooks for the Consilium CLI. Seven events (SessionStart, SessionEnd, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop) fire command or HTTP handlers configured in ~/.consilium/hooks.json. Hooks may block downstream actions by exiting with code 2 or returning {block: true}.",
  path: "/docs/cli/hooks",
  proficiencyLevel: "Intermediate",
  publishedTime: "2026-05-20",
  modifiedTime: "2026-05-20",
});

const faqJsonLd = faqPage(
  [
    {
      question: "What lifecycle events can I hook into?",
      answer:
        "Seven events: SessionStart, SessionEnd, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, and Stop. Each event delivers a JSON payload to your hook handler.",
    },
    {
      question: "Where do I configure hooks?",
      answer:
        "In ~/.consilium/hooks.json with hooksEnabled: true at the root. The hooks field maps event names to arrays of hook entries, each entry has a type (command or http) and a target (shell command or URL).",
    },
    {
      question: "Can hooks block an action?",
      answer:
        "Yes. A command hook that exits with code 2 sets block: true on the downstream action. An HTTP hook returns JSON of the form {block: true, message: 'reason'} to block. Other non-zero exit codes log a warning but do not block.",
    },
    {
      question: "Can HTTP hooks reach any URL?",
      answer:
        "No. Only URLs explicitly listed in allowedHookUrls in ~/.consilium/config.json are reachable. The default allowlist is empty, so HTTP hooks are opt-in per endpoint.",
    },
    {
      question: "How fast do hooks fire?",
      answer:
        "Command hooks typically dispatch in under 10 ms of overhead before your handler starts. The default timeout per hook is 5 seconds. Slow hooks block the lifecycle event they listen to, so keep handlers fast or use HTTP hooks that return immediately and process asynchronously.",
    },
    {
      question: "What payload does a hook receive?",
      answer:
        "A JSON object on stdin with the event name, sessionId, debateId (when applicable), timestamp, and event-specific fields like toolName and toolInput for PreToolUse, or prompt for UserPromptSubmit.",
    },
  ],
  { url: `${SITE_URL}/docs/cli/hooks`, speakable: true },
);

const breadcrumbJsonLd = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "CLI", path: "/docs/cli" },
  { name: "Hooks", path: "/docs/cli/hooks" },
]);

const events = [
  {
    name: "SessionStart",
    when: "When a new chat session, debate, or REPL launches.",
    payload: "{ event, sessionId, mode, models, timestamp }",
  },
  {
    name: "SessionEnd",
    when: "When the session terminates (user quit, error, or completion).",
    payload: "{ event, sessionId, durationMs, exitReason, timestamp }",
  },
  {
    name: "UserPromptSubmit",
    when: "Every time the user submits a prompt in chat or via a debate command.",
    payload: "{ event, sessionId, prompt, timestamp }",
  },
  {
    name: "PreToolUse",
    when: "Before any built-in or MCP tool is invoked. Use this to enforce policies.",
    payload: "{ event, sessionId, toolName, toolInput, timestamp }",
  },
  {
    name: "PostToolUse",
    when: "After a tool returns. Receives the tool result for logging or post-processing.",
    payload:
      "{ event, sessionId, toolName, toolResult, durationMs, timestamp }",
  },
  {
    name: "PermissionRequest",
    when: "When the CLI is about to request user approval for a sensitive operation.",
    payload: "{ event, sessionId, requestedPermission, reason, timestamp }",
  },
  {
    name: "Stop",
    when: "When the user issues Ctrl-C or /stop. Final chance to flush state.",
    payload: "{ event, sessionId, stopReason, timestamp }",
  },
];

export default function CliHooksPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-hooks-techarticle" data={techArticleJsonLd} />
      <JsonLd id="ld-hooks-faq" data={faqJsonLd} />
      <JsonLd id="ld-hooks-breadcrumbs" data={breadcrumbJsonLd} />

      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/docs/cli"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CLI
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">CLI Hooks</h1>
          <p
            data-speakable
            className="text-xl text-muted-foreground leading-relaxed"
          >
            Consilium CLI hooks fire shell commands or HTTP webhooks at seven
            lifecycle events: SessionStart, SessionEnd, UserPromptSubmit,
            PreToolUse, PostToolUse, PermissionRequest, and Stop. Hooks let you
            enforce policies, audit activity, or trigger side effects from your
            own infrastructure. Configure them once in ~/.consilium/hooks.json
            and they run for every session.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why hooks?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Hooks are the deterministic enforcement layer that complements
                model judgment. Anthropic's Claude Code documentation describes
                hooks as &ldquo;a way to customize and extend Claude Code&apos;s
                behavior by registering shell commands.&rdquo; Consilium adopts
                the same pattern but extends it with HTTP webhook support and a
                strict URL allowlist so corporate audit pipelines can subscribe
                without exposing the workstation to arbitrary destinations.
              </p>
              <p>
                Hooks dispatch in under 10 ms of CLI overhead before your
                handler starts. The default per-hook timeout is 5 seconds. Slow
                handlers block the event they listen to, so a PreToolUse hook
                that takes 3 seconds will add 3 seconds to every tool call.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              What lifecycle events can I hook into?
            </h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Fires
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Payload
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr
                      key={e.name}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-indigo-400 whitespace-nowrap">
                        {e.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {e.when}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400 hidden md:table-cell">
                        {e.payload}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              Where do I configure hooks?
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Create or edit{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                ~/.consilium/hooks.json
              </code>
              . The CLI reads this file on every session start and on SIGHUP.
              The root must have{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                hooksEnabled: true
              </code>{" "}
              for any handler to fire.
            </p>
            <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">{`{
  "hooksEnabled": true,
  "hooks": {
    "PreToolUse": [
      {
        "type": "command",
        "command": "~/.consilium/audit/check-tool.sh",
        "timeoutMs": 5000
      }
    ],
    "PostToolUse": [
      {
        "type": "http",
        "url": "https://audit.example.com/consilium/event",
        "method": "POST",
        "timeoutMs": 3000
      }
    ],
    "SessionStart": [
      { "type": "command", "command": "logger -t consilium session-start" }
    ]
  }
}`}</code>
            </pre>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              How do I write a command hook?
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              A command hook receives the event payload on stdin as JSON. Exit
              status determines whether the downstream action proceeds: 0
              allows, 2 blocks with{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                block: true
              </code>
              , any other non-zero logs a warning but does not block. The
              example below blocks every Bash call to{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                rm -rf
              </code>
              .
            </p>
            <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">{`#!/usr/bin/env bash
# ~/.consilium/audit/check-tool.sh
payload="$(cat)"
tool="$(echo "$payload" | jq -r '.toolName')"
input="$(echo "$payload" | jq -r '.toolInput.command // ""')"

if [[ "$tool" == "Bash" && "$input" == *"rm -rf"* ]]; then
  echo "blocked: rm -rf is not allowed by policy" >&2
  exit 2
fi
exit 0`}</code>
            </pre>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              How do I write an HTTP hook?
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              HTTP hooks POST the payload to your endpoint with content-type{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                application/json
              </code>
              . Your endpoint may reply with{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                {"{block: true, message: '...'}"}
              </code>{" "}
              to block, or any 2xx with empty body to allow. Non-2xx logs a
              warning and the action proceeds.
            </p>
            <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">{`// Example Express handler at https://audit.example.com/consilium/event
app.post('/consilium/event', (req, res) => {
  const { event, toolName, toolInput, sessionId } = req.body;
  auditLog.write({ event, toolName, sessionId, ts: Date.now() });
  if (toolName === 'Bash' && /sudo|rm -rf/.test(toolInput?.command ?? '')) {
    return res.json({ block: true, message: 'destructive shell blocked' });
  }
  res.status(200).end();
});`}</code>
            </pre>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                HTTP URL allowlist (security)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                HTTP hooks are restricted to URLs explicitly listed in{" "}
                <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                  allowedHookUrls
                </code>{" "}
                in{" "}
                <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                  ~/.consilium/config.json
                </code>
                . The default allowlist is empty, so HTTP hooks are opt-in per
                endpoint. This blocks supply-chain attacks where a hostile
                hooks.json (e.g. checked into a repo) tries to exfiltrate prompt
                content to an attacker-controlled host.
              </p>
              <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
                <code className="text-muted-foreground">{`{
  "allowedHookUrls": [
    "https://audit.example.com/consilium/event",
    "https://hooks.slack.com/services/T000/B000/XXXX"
  ]
}`}</code>
              </pre>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              How do I block a tool call?
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Three mechanisms:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc list-inside">
              <li>
                <strong>Command hook</strong>: exit with code 2. The CLI
                interprets exit-code-2 as a hard block and surfaces the stderr
                output as the reason.
              </li>
              <li>
                <strong>HTTP hook</strong>: return JSON{" "}
                <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                  {"{block: true, message: 'reason'}"}
                </code>
                .
              </li>
              <li>
                <strong>Hook chain</strong>: if any hook in the array for an
                event blocks, the downstream action does not proceed. Hooks run
                in array order; the first block short-circuits the chain.
              </li>
            </ul>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground leading-relaxed">
              <p>
                Hook implementation lives in the public CLI repository:{" "}
                <a
                  href="https://github.com/skadri1601/consilium-cli"
                  className="text-indigo-400 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/skadri1601/consilium-cli
                </a>
                .
              </p>
              <p>
                For the broader pattern, see Anthropic&apos;s{" "}
                <a
                  href="https://docs.claude.com/en/docs/claude-code/hooks"
                  className="text-indigo-400 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Claude Code hooks documentation
                </a>{" "}
                which defines the lifecycle vocabulary Consilium implements.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
