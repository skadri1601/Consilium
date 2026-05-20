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
  title: "CLI Sandbox",
  description:
    "OS-level sandbox for the Consilium CLI. macOS uses Seatbelt (sandbox-exec) with a project-scoped profile, Linux uses bubblewrap (bwrap) with unshared mount/PID/user namespaces, Windows falls back to a per-session git worktree. Workspace trust file at ~/.consilium/workspace-trust.json with always/session levels. Toggle with --sandbox or --no-sandbox-strict; manage trust with /trust list|add|remove|status.",
  path: "/docs/cli/sandbox",
  keywords: [
    "consilium sandbox",
    "ai cli sandbox",
    "seatbelt sandbox-exec",
    "bubblewrap bwrap ai agent",
    "workspace trust",
    "ai agent isolation",
    "claude code sandbox alternative",
    "git worktree isolation",
    "least privilege ai cli",
  ],
});

const techArticleJsonLd = techArticleSchema({
  title: "CLI Sandbox",
  description:
    "OS-level sandbox for the Consilium CLI. Seatbelt on macOS, bubblewrap on Linux, git worktree on Windows. Workspace trust file at ~/.consilium/workspace-trust.json tracks always/session approvals. --sandbox and --no-sandbox-strict flags control enforcement; /trust list|add|remove|status manages approvals interactively.",
  path: "/docs/cli/sandbox",
  proficiencyLevel: "Intermediate",
  publishedTime: "2026-05-20",
  modifiedTime: "2026-05-20",
});

const faqJsonLd = faqPage(
  [
    {
      question: "What does the Consilium sandbox protect against?",
      answer:
        "The sandbox blocks the CLI and any tool it spawns from reading or writing outside the current workspace, opening network connections to non-allowlisted hosts, or modifying user-level config files. It is a defence-in-depth layer for prompt-injection attacks where a model is tricked into running a destructive shell command.",
    },
    {
      question: "How is the sandbox implemented on each OS?",
      answer:
        "macOS uses Apple's Seatbelt via sandbox-exec with a project-scoped .sb profile. Linux uses bubblewrap (bwrap) with unshared mount, PID, and user namespaces. Windows lacks a comparable primitive, so Consilium falls back to running the agent in a per-session git worktree with restricted file ACLs.",
    },
    {
      question: "Where is the workspace trust file?",
      answer:
        "~/.consilium/workspace-trust.json. Each entry records a workspace absolute path, a trust level (always or session), and the timestamp of approval. Session-level approvals are wiped on CLI restart; always-level approvals persist until you remove them via /trust remove.",
    },
    {
      question: "How do I enable or disable the sandbox?",
      answer:
        "Pass --sandbox to a one-off command to force enforcement. Pass --no-sandbox-strict to downgrade hard blocks to warnings while you debug a profile. Set sandbox.default in ~/.consilium/config.json to make either the project-wide default.",
    },
    {
      question: "What's the difference between always and session trust?",
      answer:
        "Always trust persists across CLI restarts and is the right level for your own repos. Session trust persists only for the current CLI process and is the right level when you clone someone else's repo for a one-time review - the trust is gone when you exit.",
    },
    {
      question: "What overhead does the sandbox add?",
      answer:
        "Process startup adds roughly 30-60 ms on macOS (Seatbelt) and 10-20 ms on Linux (bwrap). Steady-state file I/O is unaffected because the kernel does the enforcement. Windows worktree creation is a one-time per-session cost of around 100-300 ms.",
    },
  ],
  { url: `${SITE_URL}/docs/cli/sandbox`, speakable: true },
);

const breadcrumbJsonLd = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
  { name: "CLI", path: "/docs/cli" },
  { name: "Sandbox", path: "/docs/cli/sandbox" },
]);

const platformMatrix = [
  {
    os: "macOS",
    primitive: "Seatbelt via sandbox-exec",
    profile: "~/.consilium/sandbox/profile.sb",
    overhead: "~30-60 ms startup",
  },
  {
    os: "Linux",
    primitive: "bubblewrap (bwrap) + namespace unshare",
    profile: "~/.consilium/sandbox/bwrap-args.json",
    overhead: "~10-20 ms startup",
  },
  {
    os: "Windows",
    primitive: "git worktree + restricted file ACLs",
    profile: "~/.consilium/sandbox/worktree-root",
    overhead: "~100-300 ms session create",
  },
];

const trustCommands = [
  { cmd: "/trust list", desc: "Show every trusted workspace with its level." },
  {
    cmd: "/trust add",
    desc: "Mark the current workspace as trusted. Prompts for always or session.",
  },
  {
    cmd: "/trust remove [path]",
    desc: "Remove a workspace from the trust file. Defaults to the current cwd.",
  },
  {
    cmd: "/trust status",
    desc: "Show whether the current workspace is trusted and at what level.",
  },
];

export default function CliSandboxPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-sandbox-techarticle" data={techArticleJsonLd} />
      <JsonLd id="ld-sandbox-faq" data={faqJsonLd} />
      <JsonLd id="ld-sandbox-breadcrumbs" data={breadcrumbJsonLd} />

      <section className="container mx-auto px-4 py-32 md:py-40">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/docs/cli"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to CLI
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            OS-Level Sandbox
          </h1>
          <p
            data-speakable
            className="text-xl text-muted-foreground leading-relaxed"
          >
            The Consilium CLI sandbox isolates every spawned tool from the rest
            of your machine. On macOS it uses Apple Seatbelt via sandbox-exec.
            On Linux it uses bubblewrap with unshared mount, PID, and user
            namespaces. On Windows it falls back to a per-session git worktree
            with restricted ACLs. Workspaces are gated by a trust file at
            ~/.consilium/workspace-trust.json.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why a sandbox?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Anthropic&apos;s 2024 research on prompt-injection attacks
                reported that &ldquo;agent systems with shell access remain
                vulnerable to indirect prompt injection even when the
                top-of-stack model rejects the request, because intermediate
                tool calls can be hijacked by adversarial content in the
                workspace.&rdquo; A workspace-scoped sandbox is the
                industry-standard mitigation: even if a tool is hijacked, it
                cannot reach files or hosts outside the approved boundary.
              </p>
              <p>
                The performance cost is modest. Seatbelt adds ~30-60 ms of
                startup overhead per spawned process and zero steady-state file
                I/O overhead because the kernel does the enforcement. Bubblewrap
                on Linux is even cheaper at ~10-20 ms. Windows pays a one-time
                ~100-300 ms cost to materialise the worktree at session start.
              </p>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              How is the sandbox implemented on each OS?
            </h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      OS
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Primitive
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                      Profile path
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Overhead
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {platformMatrix.map((p) => (
                    <tr
                      key={p.os}
                      className="border-b border-white/[0.06] last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">{p.os}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {p.primitive}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-emerald-400 hidden md:table-cell">
                        {p.profile}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {p.overhead}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              What does a Seatbelt profile look like (macOS)?
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              The CLI generates a project-scoped{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                .sb
              </code>{" "}
              file at session start and passes it to{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                sandbox-exec -f
              </code>
              :
            </p>
            <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">{`(version 1)
(deny default)
(allow process-exec)
(allow process-fork)
(allow file-read*)
(allow file-write* (subpath "/Users/you/myrepo"))
(allow file-write* (subpath "/tmp"))
(allow network-outbound
  (remote ip "api.anthropic.com:443")
  (remote ip "api.openai.com:443"))`}</code>
            </pre>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              What does the bwrap call look like (Linux)?
            </h2>
            <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">{`bwrap \\
  --unshare-pid \\
  --unshare-user \\
  --unshare-net \\
  --ro-bind / / \\
  --bind /home/you/myrepo /home/you/myrepo \\
  --bind /tmp /tmp \\
  --proc /proc \\
  --dev /dev \\
  --share-net \\
  --setenv CONSILIUM_SANDBOX 1 \\
  -- /usr/local/bin/consilium-tool "$@"`}</code>
            </pre>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              Network is unshared then explicitly re-shared so the CLI can
              insert a slirp4netns-backed allowlist for outbound LLM API hosts.
              The mount namespace makes everything outside the workspace
              read-only.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              How is the Windows fallback different?
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Windows does not expose a primitive comparable to Seatbelt or user
              namespaces from userspace. The CLI instead creates a per session{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                git worktree add
              </code>{" "}
              under{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                ~/.consilium/sandbox/worktree-root
              </code>{" "}
              and applies restrictive ACLs so the spawned tools see only the
              worktree, not the original repo. This is weaker than the
              kernel-enforced sandboxes but still blocks the most common
              prompt-injection patterns (delete sibling files, exfiltrate from
              parent directories, modify shell rc files).
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-6">
              How does workspace trust work?
            </h2>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              The first time the CLI is launched in a new workspace, it prompts
              for a trust decision. The choice is persisted to{" "}
              <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                ~/.consilium/workspace-trust.json
              </code>{" "}
              with one of two levels:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground leading-relaxed list-disc list-inside mb-6">
              <li>
                <strong>always</strong> - trusted across restarts. Right level
                for your own long-lived repos.
              </li>
              <li>
                <strong>session</strong> - trusted only for the current CLI
                process. Right level when reviewing untrusted code.
              </li>
            </ul>
            <pre className="rounded-lg bg-neutral-900 p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">{`{
  "workspaces": [
    {
      "path": "/Users/you/myrepo",
      "level": "always",
      "trustedAt": "2026-05-20T14:02:31Z"
    },
    {
      "path": "/tmp/review-pr-129",
      "level": "session",
      "trustedAt": "2026-05-20T14:11:18Z"
    }
  ]
}`}</code>
            </pre>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Trust slash commands (/trust)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <table className="w-full text-sm">
                  <tbody>
                    {trustCommands.map((c) => (
                      <tr
                        key={c.cmd}
                        className="border-b border-white/[0.06] last:border-0"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-indigo-400 whitespace-nowrap">
                          {c.cmd}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {c.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">CLI flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                    --sandbox
                  </code>{" "}
                  - force sandbox enforcement for this invocation, even if the
                  workspace is not trusted.
                </li>
                <li>
                  <code className="rounded bg-neutral-900 px-1.5 py-0.5 text-xs text-indigo-400">
                    --no-sandbox-strict
                  </code>{" "}
                  - downgrade hard blocks to warnings. Useful while iterating on
                  a profile. Never use in CI.
                </li>
              </ul>
              <p>
                The full implementation (profile generators, trust store, slash
                command handlers) lives in the public CLI repository:{" "}
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
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
