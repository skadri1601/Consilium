import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbList, faqPage } from "@/lib/structured-data";

export const metadata: Metadata = buildMetadata({
  title: "FAQ",
  description:
    "Answers to common questions about Consilium - how multi-AI debate works, which models are supported, BYOK, privacy, and pricing.",
  path: "/faq",
  keywords: ["consilium faq", "ai council faq", "multi-agent debate questions"],
});

const generalFaqs = [
  {
    id: "what-is",
    question: "What is Consilium?",
    answer:
      "Consilium is a multi-AI deliberation platform. Not orchestration - it implements formal debate where models propose claims, challenge each other with typed challenges, defend positions with categorized rebuttals (concede/refute/qualify), vote using social choice theory (Condorcet/Borda/Ranked Pairs), and converge only when mathematically verified (score >= 0.85). The result is a golden prompt with confidence scores, dissent reports, and a complete audit trail.",
  },
  {
    id: "difference",
    question: "How is this different from ChatGPT or Claude?",
    answer:
      "Single models give you one perspective. Consilium orchestrates structured debate between multiple models - Claude, GPT-4o, Gemini, Grok, Llama - making them cross-examine each other before synthesizing. Research shows multi-agent deliberation improves factual accuracy by 8-15% over single-model responses (ICML 2024).",
  },
  {
    id: "modes",
    question: "What are the 8 deliberation modes?",
    answer:
      "Quick (1 round, fastest), Council (3 rounds default with cross-examination), Deep (5 rounds with sub-agents), Blind (identity-stripped to eliminate model bias), Red Team (adversarial with 8 attack categories), Jury (mandatory dissent - minority opinions required), Market (probability aggregation using prediction market mechanics), and Auto (complexity-based routing that picks the best mode for your query).",
  },
  {
    id: "output",
    question: "What output do I get from a deliberation?",
    answer:
      "A golden prompt (the synthesized consensus answer), confidence scores per model, a dissent report showing majority vs minority positions, vote results (Condorcet winner, Borda scores, Ranked Pairs outcome), a full audit trail recording every step with tokens, cost, and latency, and a total cost breakdown by model and round.",
  },
  {
    id: "free",
    question: "Is Consilium free?",
    answer:
      "The hosted version has a free tier (50 deliberations/month) and a Pro tier ($29/month). You pay for LLM API calls through your own keys (BYOK) - Consilium adds zero markup. Groq models (Llama 3.1 8B, 3.3 70B, Llama 4 Scout) are completely free to use.",
  },
  {
    id: "who-built",
    question: "Who built Consilium?",
    answer:
      "Saad Kadri. Consilium is built and operated by a focused founding team.",
  },
];

const technicalFaqs = [
  {
    id: "models",
    question: "Which models are supported?",
    answer:
      "Current-generation models across 7 providers. Anthropic: Claude Opus 4.7, Opus 4.6, Sonnet 4.6, Haiku 4.5. OpenAI: GPT-5.5 Pro, GPT-5.5, GPT-5.4, GPT-5.4 Mini, GPT-5.4 Nano. Google: Gemini 3.1 Pro, Gemini 3 Flash, Gemini 3.1 Flash-Lite. Groq (free tier): Llama 3.1 8B, Llama 3.3 70B, GPT-OSS 120B/20B, Groq Compound. xAI: Grok 4.20, Grok 4.1 Fast (reasoning + non-reasoning), Grok Code Fast. Moonshot: Kimi K2.6. OpenRouter: free Llama/Gemma/Qwen tiers.",
  },
  {
    id: "voting",
    question: "How does the voting system work?",
    answer:
      "Condorcet method checks if any candidate beats all others in pairwise comparison. If no Condorcet winner exists, Ranked Pairs locks matchups by victory margin without creating cycles. Borda count provides confidence-weighted scoring. Copeland scoring provides comparative rankings. All votes are weighted by each model's calibrated confidence score.",
  },
  {
    id: "convergence",
    question: "What is convergence detection?",
    answer:
      "Three metrics combined into a single score: Kendall tau (ranking correlation between rounds, weight 0.4), Jaccard similarity (proposal content overlap, weight 0.35), and concession rate (how often models yield to arguments, weight 0.25). Formula: 0.4 * ranking + 0.35 * proposal + 0.25 * concession. Deliberation converges when the combined score reaches >= 0.85.",
  },
  {
    id: "dissent",
    question: "How does dissent detection work?",
    answer:
      "Agglomerative clustering builds a Jaccard similarity matrix between all proposals, then iteratively merges the closest clusters using a threshold of >= 0.5. A single resulting cluster means consensus. Multiple clusters indicate dissent - each cluster becomes a position with majority/minority labels, member models, and representative arguments.",
  },
  {
    id: "provider-keys",
    question: "Do I need all 5 provider API keys?",
    answer:
      "No. You need at least one provider key. Groq is free and works as an automatic fallback when other providers fail. For best results, use 2-3 different providers to get genuine model diversity - models from the same provider tend to share similar biases.",
  },
  {
    id: "streaming",
    question: "How does streaming work?",
    answer:
      "Server-Sent Events (SSE) to /deliberation/:id/stream. Events include: phase:proposal, agent:chunk, convergence:detected, dissent:report, cost:update, and more. Both the TypeScript and Python SDKs support streaming natively. The CLI renders streams in real-time with syntax highlighting.",
  },
];

const securityFaqs = [
  {
    id: "api-key-storage",
    question: "How are API keys stored?",
    answer:
      "AES-256-GCM encryption. Keys are encrypted before writing to the database and decrypted only in memory when making API calls. They are never stored in plaintext, never logged, and never included in error reports.",
  },
  {
    id: "authentication",
    question: "What authentication does Consilium use?",
    answer:
      "Clerk for web authentication (JWT-based with session management). The CLI uses hashed long-lived tokens - the plaintext is shown once at creation and never stored. The API uses Bearer token authentication. All auth flows use HTTPS.",
  },
  {
    id: "audit-trail",
    question: "Is there an audit trail?",
    answer:
      "Yes. Every deliberation records per-step: model ID, input/output summary, latency in milliseconds, tokens in/out, cost, and round number. All stored in the AuditEntry model with timestamps. Accessible via the API, SDKs, and web dashboard.",
  },
  {
    id: "compliance",
    question: "What about HIPAA, SOX, and GDPR compliance?",
    answer:
      "BYOK ensures provider API keys never leave your environment. Audit trails provide record-keeping required by most frameworks. For organizations with specific compliance requirements, contact us to discuss deployment options.",
  },
];

const costFaqs = [
  {
    id: "typical-cost",
    question: "How much does a typical deliberation cost?",
    answer:
      "Quick mode with GPT-4o-mini: ~$0.001. Council mode with 3 premium models over 3 rounds: ~$0.05-0.15. Deep mode with 5 models over 5 rounds: ~$0.20-0.50. Free with Groq models (Llama 3.1 8B, 3.3 70B, Llama 4 Scout). Consilium adds zero markup to provider costs.",
  },
  {
    id: "estimate-costs",
    question: "Can I estimate costs before running?",
    answer:
      "Yes. Use the /estimate endpoint in the API, the estimate_cost() method in the Python SDK, the estimateCost() method in the TypeScript SDK, or the --estimate flag in the CLI. All return a cost breakdown by model and round before you commit.",
  },
  {
    id: "free-options",
    question: "What are the free options?",
    answer:
      "Groq models (Llama 3.1 8B, Llama 3.3 70B, Llama 4 Scout) are completely free with no rate-limit costs. The hosted free tier includes 50 deliberations per month with no credit card required.",
  },
  {
    id: "cost-per-mode",
    question: "What's the cost difference between modes?",
    answer:
      "Quick: 1 API call per model. Council: num_models * 3 rounds. Deep: num_models * 5 rounds. Red Team: num_models * 3 phases (attack/defend/judge). Auto routes to the cheapest viable mode based on query complexity.",
  },
];

const cliFaqs = [
  {
    id: "cli-vs-claude-code",
    question:
      "How does the Consilium CLI compare to Claude Code or Cursor CLI?",
    answer:
      "The Consilium CLI ships full coding-agent parity with Claude Code, Gemini CLI, Grok Build, and Cursor CLI on every dimension: plan mode, checkpoint/rewind, @file mentions, !shell passthrough, hooks, user-definable sub-agents, MCP server marketplace, sandbox (Seatbelt/bwrap), worktree isolation, voice dictation, image generation, web search grounding, headless output formats (json/stream-json), long-lived CI tokens, autonomy controls (/loop /goal /schedule), and a scheduler daemon. The unique addition is multi-AI debate across 7 providers — no other CLI cross-examines models against each other.",
  },
  {
    id: "cli-install",
    question: "How do I install the CLI?",
    answer:
      "npm install -g @myconsilium/cli, then `consilium login` to authenticate via browser, or `consilium setup-token --name ci` for a 365-day CI token. Shell completions via `consilium completions bash|zsh|fish`. Man page bundled in the npm package.",
  },
  {
    id: "cli-slash-commands",
    question: "What slash commands does the chat REPL support?",
    answer:
      "Over 50 commands across categories: session (/checkpoint, /rewind, /fork, /new, /save), context (/context grid, /diff navigator, /file, /workspace), planning (/plan, /effort), autonomy (/loop, /goal, /schedule), parallel execution (/batch, /simplify, /ultraplan, /ultrareview), diagnostics (/recap, /stop, /doctor, /heapdump, /insights, /team-onboarding, /memory), extensibility (/sub-agent, /trust), media (/dream, /imagine, /verify). Plus user-definable custom commands loaded from ~/.consilium/commands/*.md.",
  },
  {
    id: "cli-hooks",
    question: "Can I run shell scripts on CLI lifecycle events?",
    answer:
      "Yes. Configure ~/.consilium/hooks.json with hooks for SessionStart, SessionEnd, UserPromptSubmit, PreToolUse, PostToolUse, PermissionRequest, and Stop events. Command hooks receive JSON payload on stdin; HTTP hooks POST to allowlisted URLs. Hooks can block actions by returning exit code 2 or setting block:true in their JSON response.",
  },
  {
    id: "cli-sub-agents",
    question: "Can I define my own sub-agents?",
    answer:
      'Yes. Drop markdown files into ~/.consilium/agents/ with YAML frontmatter (name, description, model, allowed-tools). Invoke via `consilium sub-agent <name> "<prompt>"` from the shell or `/sub-agent <name> <prompt>` in the chat REPL.',
  },
  {
    id: "cli-sandbox",
    question: "Is there a sandbox for tool execution?",
    answer:
      "Yes. --sandbox uses macOS Seatbelt (sandbox-exec) or Linux bwrap to isolate file system and network access. Combined with --worktree, every task runs in a fresh git worktree under ~/.consilium/worktrees/<uuid>. Workspace trust file at ~/.consilium/workspace-trust.json lets you bless a directory once with `always` or `session` levels.",
  },
  {
    id: "cli-headless",
    question: "Can I use the CLI from CI/CD or shell pipes?",
    answer:
      "Yes. --output-format text|json|stream-json controls output, --json-schema validates the final synthesis against a schema (exits 2 on mismatch), --max-budget-usd and --max-turns enforce safety caps. `consilium setup-token` generates a 365-day token so CI doesn't need browser login. The GitHub composite action at .github/actions/consilium-debate/ wraps debate runs for workflows.",
  },
  {
    id: "cli-autonomy",
    question: "How do /loop and /schedule work?",
    answer:
      'Inside chat: /loop 5m "<prompt>" repeats the prompt every 5 minutes, /schedule daily "<prompt>" fires once per day, /goal "<text>" injects an overall goal preamble into every debate in the session. Registrations persist to ~/.consilium/autonomy/<sessionId>/ and replay when the session resumes. Run `consilium scheduler start` to keep them firing even when no REPL is open.',
  },
  {
    id: "cli-vscode",
    question: "Is there a VS Code extension?",
    answer:
      "Yes. consilium-vscode adds a sessions tree, status bar, and a webview debate panel that streams SSE events from the agents service and renders agent cards + final synthesis as markdown. Commands include `Consilium: New Debate (Panel)`, `Debate Selected Text` (also in the editor context menu), and `Resume Session...`. Debates persist back to the same session id the CLI and web app see.",
  },
  {
    id: "cli-themes",
    question: "Can I customize the CLI appearance?",
    answer:
      "Yes. 8 themes (default, dark, light, high-contrast, matrix, ocean, sunset, monokai) selectable via `consilium config set theme <name>` or CONSILIUM_THEME env var. CONSILIUM_VIM_MODE=1 enables vim keybindings in chat input. /tui toggles fullscreen alt-screen rendering. Status line template customizable via statusLineTemplate in ~/.consilium/config.json.",
  },
];

const sections = [
  { title: "General", faqs: generalFaqs },
  { title: "Technical", faqs: technicalFaqs },
  { title: "Security", faqs: securityFaqs },
  { title: "Pricing & Costs", faqs: costFaqs },
  { title: "CLI", faqs: cliFaqs },
];

const allFaqs = [
  ...generalFaqs,
  ...technicalFaqs,
  ...securityFaqs,
  ...costFaqs,
  ...cliFaqs,
];

const faqSchema = faqPage(
  allFaqs.map((faq) => ({ question: faq.question, answer: faq.answer })),
  { url: `${SITE_URL}/faq`, speakable: true },
);

const faqBreadcrumbs = breadcrumbList([
  { name: "Home", path: "/" },
  { name: "FAQ", path: "/faq" },
]);

export default function FAQPage() {
  return (
    <div className="min-h-screen">
      <JsonLd id="ld-faq" data={faqSchema} />
      <JsonLd id="ld-faq-breadcrumbs" data={faqBreadcrumbs} />
      <section className="container mx-auto px-4 py-32 md:py-48">
        <div className="max-w-3xl mx-auto">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4 text-center"
            data-speakable
          >
            Frequently Asked Questions
          </h1>
          <p className="text-center text-muted-foreground mb-16" data-speakable>
            Everything you need to know about Consilium
          </p>

          {sections.map((section) => (
            <div key={section.title} className="mb-12">
              <h2 className="text-2xl font-semibold mb-6 text-indigo-400">
                {section.title}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {section.faqs.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
