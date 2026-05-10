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
    "Answers to common questions about Consilium - agent governance, deliberation modes, MCP tools, compliance, risk scoring, and pricing.",
  path: "/faq",
  keywords: ["consilium faq", "agent governance faq", "ai compliance questions"],
});

const generalFaqs = [
  {
    id: "what-is",
    question: "What is Consilium?",
    answer:
      "Consilium is the governance and deliberation infrastructure for the agent economy. When AI agents need to make high-stakes decisions, they call Consilium for multi-model adversarial review with compliance-grade audit trails. Models propose claims, challenge each other with typed challenges, defend positions with categorized rebuttals, vote using social choice theory (Condorcet/Borda/Ranked Pairs), and converge only when mathematically verified (score >= 0.85).",
  },
  {
    id: "difference-orchestration",
    question: "How is Consilium different from LangGraph/CrewAI/AutoGen?",
    answer:
      "Those are agent orchestration frameworks. Consilium is the governance layer that sits on top. It provides policy enforcement, quorum voting, risk scoring, and audit trails - the decision-quality infrastructure that orchestration frameworks don't include. You build agents with LangGraph; you govern them with Consilium.",
  },
  {
    id: "difference-observability",
    question: "How is Consilium different from Sentrial/Moda?",
    answer:
      "Observability tools monitor agent failures after they happen. Consilium prevents failures by running adversarial review before agents act. Upstream prevention, not downstream detection. Observability tells you an agent made a bad trade; Consilium blocks the trade before execution.",
  },
  {
    id: "what-is-governance",
    question: "What is agent governance?",
    answer:
      "Governance is the structural machinery for who decides what an agent can do, how decisions are audited, and who is accountable. Unlike guardrails (input/output filtering), governance includes policy engines, quorum voting, budget controls, delegation hierarchies, and audit trails. Consilium provides this infrastructure as MCP tools and APIs.",
  },
  {
    id: "mcp-server",
    question: "What is the MCP server?",
    answer:
      "Consilium exposes 6 MCP tools (validate, deliberate, redteam, score_risk, blind_eval, quick_consensus) that any AI client - Claude Code, Cursor, custom agents - can call for governance review. One function call gives any agent access to multi-model adversarial deliberation with compliance-grade audit trails.",
  },
  {
    id: "modes",
    question: "What are the 8 deliberation modes?",
    answer:
      "Quick (1 round, fastest), Council (3 rounds default with cross-examination), Deep (5 rounds with sub-agents), Blind (identity-stripped to eliminate model bias), Red Team (adversarial with 8 attack categories), Jury (mandatory dissent - minority opinions required), Market (probability aggregation using prediction market mechanics), and Auto (complexity-based routing that picks the best mode for your query).",
  },
  {
    id: "eu-ai-act",
    question: "Is Consilium EU AI Act compliant?",
    answer:
      "Consilium produces compliance-grade audit documents for every deliberation: full reasoning chains, model attributions, dissent preservation, cost breakdowns, and confidence scores. High-risk AI obligations under the EU AI Act take effect August 2, 2026. Consilium's audit trail provides the documentation infrastructure required for conformity assessments under Article 11 and the transparency requirements under Article 13.",
  },
  {
    id: "risk-scoring",
    question: "How does risk scoring work?",
    answer:
      "One model attacks a proposal finding vulnerabilities, another defends proposing mitigations, a judge evaluates severity. The continuous risk monitor tracks scores over time and detects when an agent's risk profile drifts. Five models participate in Jury mode with MANDATORY_DISSENT - no conclusion is presented as unanimous unless mathematically verified through convergence detection.",
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

const sections = [
  { title: "General", faqs: generalFaqs },
  { title: "Technical", faqs: technicalFaqs },
  { title: "Security", faqs: securityFaqs },
  { title: "Pricing & Costs", faqs: costFaqs },
];

const allFaqs = [
  ...generalFaqs,
  ...technicalFaqs,
  ...securityFaqs,
  ...costFaqs,
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
