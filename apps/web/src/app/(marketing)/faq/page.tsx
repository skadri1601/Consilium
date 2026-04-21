import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "FAQ",
  description:
    "Answers to common questions about Consilium — how multi-AI debate works, which models are supported, BYOK, privacy, self-hosting, and pricing.",
  path: "/faq",
  keywords: ["consilium faq", "ai council faq", "multi-agent debate questions"],
});

const generalFaqs = [
  {
    id: "what-is",
    question: "What is Consilium? ",
    answer:
      "Consilium is an open-source multi-AI deliberation platform. Not orchestration — it implements formal debate where models propose claims, challenge each other with typed challenges, defend positions with categorized rebuttals (concede/refute/qualify), vote using social choice theory (Condorcet/Borda/Ranked Pairs), and converge only when mathematically verified (score >= 0.85). The result is a golden prompt with confidence scores, dissent reports, and a complete audit trail.",
  },
  {
    id: "difference",
    question: "How is this different from ChatGPT or Claude? ",
    answer:
      "Single models give you one perspective. Consilium orchestrates structured debate between multiple models — Claude, GPT-4o, Gemini, Grok, Llama — making them cross-examine each other before synthesizing. Research shows multi-agent deliberation improves factual accuracy by 8-15% over single-model responses (ICML 2024).",
  },
  {
    id: "modes",
    question: "What are the 8 deliberation modes? ",
    answer:
      "Quick (1 round, fastest), Council (3 rounds default with cross-examination), Deep (5 rounds with sub-agents), Blind (identity-stripped to eliminate model bias), Red Team (adversarial with 8 attack categories), Jury (mandatory dissent — minority opinions required), Market (probability aggregation using prediction market mechanics), and Auto (complexity-based routing that picks the best mode for your query).",
  },
  {
    id: "output",
    question: "What output do I get from a deliberation? ",
    answer:
      "A golden prompt (the synthesized consensus answer), confidence scores per model, a dissent report showing majority vs minority positions, vote results (Condorcet winner, Borda scores, Ranked Pairs outcome), a full audit trail recording every step with tokens, cost, and latency, and a total cost breakdown by model and round.",
  },
  {
    id: "free",
    question: "Is Consilium free? ",
    answer:
      "MIT licensed and free to self-host. The hosted version has a free tier (50 deliberations/month) and a Pro tier ($29/month). You pay for LLM API calls through your own keys (BYOK) — Consilium adds zero markup. Groq models (Llama 3.1 8B, 3.3 70B, Llama 4 Scout) are completely free.",
  },
  {
    id: "who-built",
    question: "Who built Consilium? ",
    answer:
      "Saad Kadri. Consilium is an MIT licensed open-source project. Contributions are welcome from developers of all skill levels.",
  },
];

const technicalFaqs = [
  {
    id: "models",
    question: "Which models are supported? ",
    answer:
      "15 models across 5 providers. Anthropic: Claude Opus 4.6, Sonnet 4.5, Haiku 4.5. OpenAI: GPT-4o, GPT-4o-mini, GPT-4.1, o3-mini. Google: Gemini 2.0 Flash, Gemini 2.5 Flash, Gemini 2.5 Pro. Groq (free): Llama 3.1 8B, Llama 3.3 70B, Llama 4 Scout. xAI: Grok 2, Grok 2 Mini.",
  },
  {
    id: "voting",
    question: "How does the voting system work? ",
    answer:
      "Condorcet method checks if any candidate beats all others in pairwise comparison. If no Condorcet winner exists, Ranked Pairs locks matchups by victory margin without creating cycles. Borda count provides confidence-weighted scoring. Copeland scoring provides comparative rankings. All votes are weighted by each model's calibrated confidence score.",
  },
  {
    id: "convergence",
    question: "What is convergence detection? ",
    answer:
      "Three metrics combined into a single score: Kendall tau (ranking correlation between rounds, weight 0.4), Jaccard similarity (proposal content overlap, weight 0.35), and concession rate (how often models yield to arguments, weight 0.25). Formula: 0.4 * ranking + 0.35 * proposal + 0.25 * concession. Deliberation converges when the combined score reaches >= 0.85.",
  },
  {
    id: "dissent",
    question: "How does dissent detection work? ",
    answer:
      "Agglomerative clustering builds a Jaccard similarity matrix between all proposals, then iteratively merges the closest clusters using a threshold of >= 0.5. A single resulting cluster means consensus. Multiple clusters indicate dissent — each cluster becomes a position with majority/minority labels, member models, and representative arguments.",
  },
  {
    id: "provider-keys",
    question: "Do I need all 5 provider API keys? ",
    answer:
      "No. You need at least one provider key. Groq is free and works as an automatic fallback when other providers fail. For best results, use 2-3 different providers to get genuine model diversity — models from the same provider tend to share similar biases.",
  },
  {
    id: "streaming",
    question: "How does streaming work? ",
    answer:
      "Server-Sent Events (SSE) to /deliberation/:id/stream. Events include: phase:proposal, agent:chunk, convergence:detected, dissent:report, cost:update, and more. Both the TypeScript and Python SDKs support streaming natively. The CLI renders streams in real-time with syntax highlighting.",
  },
];

const selfHostingFaqs = [
  {
    id: "self-host",
    question: "How do I self-host Consilium? ",
    answer:
      "Docker Compose: clone the repo, cp .env.example .env, add your API keys, then docker compose -f docker-compose.selfhost.yml up. This starts 5 services: PostgreSQL, Redis, the API server, the Agents engine, and the Web UI.",
  },
  {
    id: "infrastructure",
    question: "What infrastructure do I need? ",
    answer:
      "Minimum: 2GB RAM + Docker. Recommended: 4GB RAM, 2 vCPUs. Required services: PostgreSQL 16 (or Neon), Redis 7 (or Upstash). Runtime: Node.js 20+ for the API and Web, Python 3.11+ for the Agents engine.",
  },
  {
    id: "kubernetes",
    question: "Can I deploy to Kubernetes? ",
    answer:
      "Yes. Each service (web, api, agents) has its own Dockerfile in its respective apps/ directory. Use the docker-compose.selfhost.yml as a reference for environment variables, service dependencies, and health checks.",
  },
  {
    id: "data-storage",
    question: "How is data stored? ",
    answer:
      "PostgreSQL via Prisma ORM. All debate sessions, rounds, messages, audit entries, and user data are stored relationally. API keys are encrypted with AES-256-GCM before being written to the database. The Prisma schema lives in packages/database/.",
  },
];

const securityFaqs = [
  {
    id: "api-key-storage",
    question: "How are API keys stored? ",
    answer:
      "AES-256-GCM encryption. Keys are encrypted before writing to the database and decrypted only in memory when making API calls. They are never stored in plaintext, never logged, and never included in error reports.",
  },
  {
    id: "authentication",
    question: "What authentication does Consilium use? ",
    answer:
      "Clerk for web authentication (JWT-based with session management). The CLI uses hashed long-lived tokens — the plaintext is shown once at creation and never stored. The API uses Bearer token authentication. All auth flows use HTTPS.",
  },
  {
    id: "audit-trail",
    question: "Is there an audit trail? ",
    answer:
      "Yes. Every deliberation records per-step: model ID, input/output summary, latency in milliseconds, tokens in/out, cost, and round number. All stored in the AuditEntry model with timestamps. Accessible via the API, SDKs, and web dashboard.",
  },
  {
    id: "compliance",
    question: "What about HIPAA, SOX, and GDPR compliance? ",
    answer:
      "Self-hosted Consilium can be deployed within compliant infrastructure you control. BYOK ensures API keys never leave your environment. Audit trails provide record-keeping required by most frameworks. Data residency is fully under your control when self-hosted.",
  },
];

const costFaqs = [
  {
    id: "typical-cost",
    question: "How much does a typical deliberation cost? ",
    answer:
      "Quick mode with GPT-4o-mini: ~$0.001. Council mode with 3 premium models over 3 rounds: ~$0.05-0.15. Deep mode with 5 models over 5 rounds: ~$0.20-0.50. Free with Groq models (Llama 3.1 8B, 3.3 70B, Llama 4 Scout). Consilium adds zero markup to provider costs.",
  },
  {
    id: "estimate-costs",
    question: "Can I estimate costs before running? ",
    answer:
      "Yes. Use the /estimate endpoint in the API, the estimate_cost() method in the Python SDK, the estimateCost() method in the TypeScript SDK, or the --estimate flag in the CLI. All return a cost breakdown by model and round before you commit.",
  },
  {
    id: "free-options",
    question: "What are the free options? ",
    answer:
      "Groq models (Llama 3.1 8B, Llama 3.3 70B, Llama 4 Scout) are completely free with no rate-limit costs. Self-hosting is free — you only pay for your own infrastructure. The hosted free tier includes 50 deliberations per month with no credit card required.",
  },
  {
    id: "cost-per-mode",
    question: "What's the cost difference between modes? ",
    answer:
      "Quick: 1 API call per model. Council: num_models * 3 rounds. Deep: num_models * 5 rounds. Red Team: num_models * 3 phases (attack/defend/judge). Auto routes to the cheapest viable mode based on query complexity.",
  },
];

const sections = [
  { title: "General", faqs: generalFaqs },
  { title: "Technical", faqs: technicalFaqs },
  { title: "Self-Hosting", faqs: selfHostingFaqs },
  { title: "Security", faqs: securityFaqs },
  { title: "Pricing & Costs", faqs: costFaqs },
];

export default function FAQPage() {
  return (
    <div>
      <section className="pt-28 pb-16 border-b border-white/[0.08]">
        <div className="container-narrow">
          <div className="eyebrow mb-5">FAQ</div>
          <h1 className="display text-[clamp(40px,6vw,72px)] leading-[1.02] max-w-[900px]">
            Frequently <em>asked.</em>
          </h1>
          <p className="mt-6 max-w-[560px] text-[17px] leading-[1.55] text-ink-secondary">
            Everything worth knowing about Consilium — modes, models, BYOK,
            privacy, self-hosting, and cost.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="container-narrow max-w-[780px]">
          {sections.map((section) => (
            <div key={section.title} className="mb-14">
              <div className="eyebrow mb-4">{section.title}</div>
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
