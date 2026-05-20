import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import { blogPosts } from "@/app/(marketing)/blog/blog-data";

/**
 * llms-full.txt - companion to /llms.txt that inlines the canonical
 * narrative for crawlers that prefer one-shot ingestion over a
 * link-list. Hand-written; intentionally NOT auto-extracted from JSX
 * because component trees produce noisy text and we want quotes that
 * read well when an AI assistant reads them aloud or cites them.
 *
 * Add new blog summaries here when posts ship; the slug list at the
 * bottom is the canonical link map back to full pages.
 */

export const dynamic = "force-static";
export const revalidate = 3600;

const SECTIONS: Array<{ heading: string; body: string }> = [
  {
    heading: "What Consilium is",
    body: [
      `${SITE_NAME} is a multi-AI council platform.`,
      "",
      "Where most AI tools route a single model, Consilium runs structured deliberation across 7 LLM providers (Anthropic, OpenAI, Google, Groq, xAI, Moonshot, OpenRouter) and synthesizes a consensus answer.",
      "",
      "Models propose claims, challenge each other with typed challenges, defend positions with categorized rebuttals (concede / refute / qualify), vote using social-choice theory (Condorcet, Borda count, Ranked Pairs, Copeland), and converge only when mathematically verified - Kendall tau ranking correlation, Jaccard proposal overlap, and concession rate combine into a single score that must reach >= 0.85 for the pipeline to declare convergence.",
      "",
      "The output is a golden prompt with confidence scores per model, a dissent report (majority and minority positions, member models, representative arguments), vote results, and a complete audit trail recording every step with tokens, cost, and latency.",
    ].join("\n"),
  },
  {
    heading: "Deliberation modes",
    body: [
      "Eight modes are supported, each backed by peer-reviewed research:",
      "",
      "- Quick - single round, fastest",
      "- Council - three rounds with cross-examination (the default)",
      "- Deep - five rounds with sub-agents researching specific points",
      "- Blind - model identity stripped to remove brand bias",
      "- Red Team - adversarial mode with eight attack categories",
      "- Jury - mandatory dissent; minority opinions are required output",
      "- Market - probability aggregation using prediction-market mechanics",
      "- Auto - complexity-based routing that picks the appropriate mode for the query",
    ].join("\n"),
  },
  {
    heading: "BYOK with a free-tier safety net",
    body: [
      "Consilium uses a BYOK (bring-your-own-keys) model: you supply provider API keys and Consilium adds zero markup to provider pricing.",
      "",
      "When a debate is requested without a key for the requested provider, the engine routes through a platform-hosted free-tier pool - Groq first, OpenRouter as backup - and surfaces the routing decision via an SSE 'routing:fallback' event so the user sees exactly what happened. The resolver lives in apps/agents/src/features/free_tier/resolver.py.",
      "",
      "Groq models (Llama 3.1 8B, Llama 3.3 70B, GPT-OSS 120B/20B, Compound) are usable for free deliberations end to end.",
    ].join("\n"),
  },
  {
    heading: "How to start",
    body: [
      "Three onboarding paths, all under five minutes:",
      "",
      "1. Web - sign up at https://myconsilium.xyz, paste at least one provider key (or use the Groq free tier), pick a mode, run a debate",
      '2. CLI - npm i -g @myconsilium/cli, then `consilium debate "your question" --mode council`',
      "3. SDK - pip install consilium-sdk (Python) or npm i @myconsilium/sdk (TypeScript)",
      "",
      "All three speak the same SSE event schema, so a debate started in one client can be resumed in another.",
    ].join("\n"),
  },
  {
    heading: "Privacy and security",
    body: [
      "Provider API keys are stored AES-256-GCM encrypted; plaintext is never written to disk and never shipped in error reports.",
      "",
      "Authentication uses Clerk (web, JWT) plus hashed long-lived tokens (CLI) - the plaintext token is shown once at creation and not stored anywhere afterward. All API traffic is HTTPS-only.",
      "",
      "Every deliberation produces a per-step audit entry: model id, input/output summary, latency, tokens in/out, cost, round number. PostHog analytics on the web app uses identified-only profiles - anonymous visitors aren't tracked. PostHog data has a 12-month retention; users can opt out via the cookie consent banner.",
    ].join("\n"),
  },
  {
    heading: "CLI feature set",
    body: [
      "The Consilium CLI (@myconsilium/cli) ships full coding-agent parity vs Claude Code, Gemini CLI, Grok Build, and Cursor CLI on every dimension we identified, while preserving the multi-AI debate moat that none of them have.",
      "",
      "Core debate engine:",
      '- consilium debate "<topic>" --mode <quick|council|deep|blind|redteam|jury|market|auto>',
      "- BYOK across 7 providers or free-tier fallback to Groq + OpenRouter",
      "- Pre-flight cost estimation with /estimate",
      "- Per-run cost cap: --max-budget-usd",
      "- Per-run turn cap: --max-turns",
      "- Reasoning depth control: --effort low|medium|high|xhigh|max (maps to Anthropic extended_thinking, OpenAI/xAI reasoning_effort)",
      "",
      "Plan mode and approval flow:",
      "- --plan flag emits a written plan and prompts approve/refine/cancel before any write tool runs",
      "- /plan slash toggles plan mode in chat REPL",
      "- Plan-mode permission state denies all writes until exited",
      "",
      "Chat REPL ergonomics:",
      "- @file path mention syntax injects file content as fenced code blocks",
      "- !shell <cmd> runs in $SHELL with [SHELL MODE] indicator and dangerous-pattern blocklist",
      "- Image paste (file path or base64) via /image or auto-detection",
      "- Vim mode (CONSILIUM_VIM_MODE=1) with NORMAL/INSERT modes",
      "- 8 themes: default, dark, light, high-contrast, matrix, ocean, sunset, monokai",
      "- Status line with cwd, branch, model, mode",
      "- TUI fullscreen mode via /tui (alt-screen rendering)",
      "- Live TODO checklist renders above agent cards during debate",
      "- Shift+Tab cycles permission modes (default, acceptEdits, auto, plan, bypass)",
      "",
      "Slash commands (50+):",
      "- Session: /checkpoint, /rewind, /fork, /new, /save, /resume, /sessions",
      "- Context: /context (colored grid), /diff (interactive navigator), /file, /image, /workspace, /scope",
      "- Plan + autonomy: /plan, /effort, /loop, /goal, /schedule",
      "- Parallel execution: /batch <N> <task>, /simplify, /ultraplan, /ultrareview",
      "- Diagnostics: /recap, /stop, /doctor, /heapdump, /usage, /insights, /team-onboarding, /memory",
      "- Extensibility: /sub-agent <name> <prompt>, /trust list|add|remove",
      "- Media: /dream, /imagine, /verify",
      "- Custom slash commands loaded from ~/.consilium/commands/*.md with $ARGUMENTS substitution",
      "",
      "Extensibility:",
      "- User-definable sub-agents in ~/.consilium/agents/*.md with YAML frontmatter (name, description, model, allowed-tools)",
      "- Lifecycle hooks: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, Stop, SessionEnd",
      "- Hook types: command (exec shell with stdin payload) and http (POST to allowlisted URL)",
      "- apiKeyHelper for shell-script-based dynamic provider auth (5min TTL cache)",
      "",
      "Isolation:",
      "- --worktree creates a fresh git worktree under ~/.consilium/worktrees/<uuid> per task",
      "- --sandbox on macOS uses Seatbelt via sandbox-exec",
      "- --sandbox on Linux uses bwrap with namespace unsharing",
      "- Workspace trust file at ~/.consilium/workspace-trust.json controls always/session/prompt-on-first-run behavior",
      "",
      "Autonomy:",
      "- consilium scheduler start runs a daemon that fires persisted /loop and /schedule registrations even with no REPL open",
      "- consilium agents manages detached background-agent processes (list/attach/stop/logs/respawn/rm)",
      "- --bg on consilium debate spawns it as a detached agent",
      "- Auto memory writes per-project MEMORY.md notes extracted from synthesis (the user prefers, constraint, remember, decision)",
      "",
      "Headless / scripting:",
      "- --output-format text|json|stream-json for SSE-line-per-event piping",
      "- --json-schema validates the final synthesis against a JSON Schema and exits 2 on mismatch",
      "- consilium setup-token generates a 365-day CI token (no browser login)",
      "- Shell completions for bash/zsh/fish via consilium completions <shell>",
      "- Man page at /usr/local/share/man/man1/consilium.1 after npm install -g",
      "",
      "Tools and grounding:",
      "- Web search: DuckDuckGo (no key), Brave (BRAVE_SEARCH_API_KEY), Google Custom Search (GOOGLE_SEARCH_API_KEY + GOOGLE_SEARCH_ENGINE_ID)",
      "- Image generation: DALL-E 3 (OpenAI), xAI image-gen; --generate-image on debate; /dream and /imagine in chat",
      "- Voice dictation: consilium voice records audio via sox/arecord/parecord and transcribes via Whisper API",
      "- /verify runs Puppeteer to capture screenshot + DOM summary (optional dep)",
      "",
      "MCP:",
      "- consilium mcp browse|search|install|uninstall with 12 seeded servers (github, filesystem, git, postgres, slack, puppeteer, brave-search, sqlite, google-drive, everart, memory, time)",
      "",
      "Permission grammar:",
      "- Per-glob rules: Bash(npm run *), Read(./src/**), Write(./out/*), WebFetch(domain:example.com), Mcp(server:tool)",
      "- Rules in ~/.consilium/permissions.json with allow/ask/deny arrays; deny wins, first match",
      "- Stored-permission notice shown when reusing a previous grant",
      "",
      "Ticket integration:",
      "- consilium linear list|view|create|update|debate for the MYC- project",
      "- LINEAR_API_KEY from env or ~/.consilium/config.json",
    ].join("\n"),
  },
  {
    heading: "VS Code extension",
    body: [
      "The consilium-vscode extension runs debates from within VS Code via a webview panel beside the active editor.",
      "",
      "Commands (Command Palette):",
      "- Consilium: New Debate (Panel)",
      "- Consilium: Debate Selected Text (also editor context menu)",
      "- Consilium: Resume Session...",
      "- Consilium: Open Status",
      "",
      "Views: Sessions tree + Models tree in the activity bar Consilium container.",
      "",
      "Webview architecture: SSE consumed in the extension host via ConsiliumClient.streamDebate; events postMessage'd to the webview which renders progress + agent cards + final synthesis as markdown. CSP-safe HTML template with nonce-only scripts.",
      "",
      "Session sync: after a debate completes (and was not canceled), the panel POSTs to v2/conversations + appendDebate so the same session id shows up in the CLI and web app. Failures surface in the Consilium output channel and a non-blocking warning toast.",
      "",
      "Settings (consilium.* in VS Code config): apiUrl, apiKey, defaultMode, defaultModels, includeWorkspaceContext, contextBudgetKB, respectGitIgnore, autoApplyGoldenPrompt.",
    ].join("\n"),
  },
  {
    heading: "Pricing",
    body: [
      "Free tier - 50 deliberations per month, no credit card. BYOK or use the Groq free fallback.",
      "Pro tier - $29/month, unlimited deliberations.",
      "Provider costs pass through at provider pricing (zero markup).",
      "",
      "Typical costs: Quick mode with GPT-5.4 Mini ~ $0.001 per debate; Council mode with three premium models over three rounds ~ $0.05-0.15; Deep mode across five models over five rounds ~ $0.20-0.50.",
    ].join("\n"),
  },
];

function buildLlmsFullTxt(): string {
  const sortedPosts = [...blogPosts].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    `Site: ${SITE_URL}`,
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    ...SECTIONS.flatMap((s) => [`## ${s.heading}`, "", s.body, ""]),
    "## Recent posts",
    "",
    ...sortedPosts.map(
      (post) =>
        `- [${post.title}](${SITE_URL}/blog/${post.slug}) (${post.date}, ${post.category}, ${post.readingTime}): ${post.excerpt}`,
    ),
    "",
    "## Canonical pages",
    "",
    "- " +
      [
        "/",
        "/pricing",
        "/use-cases",
        "/faq",
        "/about",
        "/research",
        "/docs",
        "/docs/getting-started",
        "/docs/how-it-works",
        "/docs/modes",
        "/docs/architecture",
        "/docs/api",
        "/docs/cli",
        "/docs/cli/reference",
        "/docs/cli/slash-commands",
        "/docs/cli/hooks",
        "/docs/cli/sub-agents",
        "/docs/cli/sandbox",
        "/docs/cli/comparison",
        "/docs/providers",
        "/docs/python-sdk",
        "/docs/typescript-sdk",
        "/vs-cursor",
        "/vs-aider",
        "/vs-cline",
        "/vs-claude-code",
        "/vs-copilot",
      ]
        .map((p) => `${SITE_URL}${p}`)
        .join("\n- "),
    "",
  ].join("\n");
}

export function GET(): Response {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
