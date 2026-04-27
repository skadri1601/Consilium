# Conviction Embed Application Draft

---

## What's the deep tech conviction?

Single-model inference is structurally incapable of reliable confidence calibration. No amount of prompting, fine-tuning, or RAG changes the fact that one model has no adversary. The only way to know if an answer survives scrutiny is to subject it to scrutiny.

Consilium implements this as structured adversarial deliberation between AI models. Models propose claims with evidence, cross-examine each other's reasoning, rebut challenges, and vote using formal social choice theory. The output is an answer that survived challenge -- not an answer that a single model produced and self-rated as confident.

This is a fundamental architectural shift, not an incremental improvement. Orchestration frameworks (CrewAI, AutoGen, LangGraph) optimize for throughput by dividing labor across models in a pipeline. Consilium optimizes for accuracy by making models productively disagree.

---

## Why is this a long-term bet?

Three structural reasons:

**1. The accuracy gap grows with stakes.** For casual questions, single-model inference is fine. For medical diagnoses, legal analysis, financial decisions, security assessments, and autonomous systems -- anywhere wrong answers have consequences -- you need adversarial verification. As AI deployment moves into higher-stakes domains, the demand for deliberation grows monotonically.

**2. Multi-model is the equilibrium.** No single provider will dominate frontier AI. Companies already use GPT-4o, Claude, Gemini, and open models. The infrastructure for heterogeneous model deployment exists. What's missing is the framework for making these models productively disagree rather than sequentially cooperate.

**3. The research is settled.** Du et al. (ICML 2024): 8-20% accuracy gains from multi-agent debate. Chen et al. (ACL 2024): heterogeneous councils catch hallucinations single-model chains miss. Khan et al. (ICML 2024 Best Paper): truth has a structural advantage in adversarial debate. The mechanism is proven; the production implementation doesn't exist.

---

## What's built?

A complete platform, built solo:

- **8 deliberation modes:** Quick, Council (3-round cross-examination), Deep (5 rounds + sub-agent research), Blind (identity-stripped), Red Team (attack/defense cycles), Jury (ranked-choice voting), Market (prediction market aggregation), Auto
- **Formal voting:** Condorcet method finds candidates that win every pairwise comparison. Ranked Pairs (Tideman's algorithm) handles cycles. Borda count provides continuous scoring. Copeland scores measure overall dominance. Confidence weights derived from Kendall tau correlation -- models that hold stable positions get upweighted, models that flip-flop get downweighted
- **Dissent preservation:** Every deliberation produces a dissent report surfacing minority clusters. Minority positions are often correct -- the dissenting model may have identified an edge case the majority missed
- **5-phase judge synthesis:** Claim extraction, cross-reference, dispute resolution, rubric scoring (correctness 30%, reasoning 25%, completeness 20%, actionability 15%, conciseness 10%), final verdict
- **3 SDKs + CLI:** TypeScript, Python, CLI. `pip install consilium` or `npx @consilium/cli`
- **Full infrastructure:** Next.js 15 web app, NestJS 11 API on Fastify, Python FastAPI deliberation engine, Neon PostgreSQL, Upstash Redis, Docker self-hosting, GitHub Actions CI/CD with security scanning
- **MIT open source.** 5 LLM providers (OpenAI, Anthropic, Google, Groq, xAI), BYOK pricing

---

## What's the 10-year vision?

"Deliberate before deciding" becomes as standard as "test before deploying."

Year 1-2: Developer platform. SDKs, CLI, managed hosting. Establish deliberation as a known primitive in AI tooling. Target the ~500K developers using multi-agent frameworks who already believe in multi-model approaches but are stuck with orchestration.

Year 3-5: Vertical expansion. Purpose-built deliberation modes for medical, legal, financial, and security domains. Regulatory pressure for AI auditability drives demand for structured deliberation with full audit trails and dissent reports.

Year 5-10: Infrastructure layer. Consilium becomes the deliberation protocol -- the TCP/IP of multi-model decision-making. Every consequential AI query passes through adversarial deliberation before producing a final answer. The protocol is open (MIT); the managed infrastructure is the business.

---

## Founder

**Saad Kadri.** Built the entire platform solo: Python deliberation engine, TypeScript API and web app, 3 SDKs, CLI, CI/CD, DevOps bot with Slack/Linear/Sentry integration, infrastructure across five cloud providers. Currently contracting at Ascend for runway.

Zero commercial competitors in structured adversarial deliberation. The conviction: this is a missing primitive, and the solo build proves both the technical capability and the belief that it matters enough to build before anyone is paying for it.
