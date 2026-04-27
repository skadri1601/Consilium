# YC S26 Application Draft

**Deadline:** May 4, 2026

---

## Company

**Name:** Consilium

**One-liner:** Structured adversarial debate between AI models -- deliberation that catches errors orchestration hides.

**URL:** https://github.com/skadri1601/Consilium

**License:** MIT (open source)

---

## What are you building?

Consilium is an AI deliberation platform where language models argue, cross-examine, and vote on answers instead of cooperating in a pipeline. It implements 8 deliberation modes backed by peer-reviewed research from MIT, ACL, and ICML.

Every multi-agent framework today (CrewAI, AutoGen, LangGraph) is an orchestrator: models pass work through a pipeline. If one model hallucinates, the next model weaves it into its output. Disagreement is hidden. Confidence is self-reported. Errors propagate.

Consilium treats models as adversaries in a structured debate. Models propose claims with evidence. Other models cross-examine those claims -- factual disputes, logical objections, requests for evidence. A judge phase extracts surviving claims, resolves disputes against a weighted rubric, and synthesizes a verdict with a formal dissent report preserving minority positions.

The 8 modes: Quick (single round, ~15s), Council (3-round cross-examination), Deep (5 rounds with sub-agent research), Blind (identity-stripped to prevent anchoring bias), Red Team (adversarial attack/defense cycles), Jury (ranked-choice voting panel), Market (prediction market confidence aggregation), Auto (automatic mode selection).

Voting uses social choice theory: Condorcet method, Borda count, Ranked Pairs (Tideman's algorithm), and Copeland scores. Confidence weights are derived from Kendall tau correlation between successive voting rounds -- models that flip-flop get downweighted, models with stable defensible positions get upweighted.

---

## Why does this matter?

Every LLM-powered application has a confidence problem. Models sound certain when they're wrong. The industry response has been RAG, fine-tuning, and guardrails. None of these address the structural issue: a single model has no adversary.

Research shows multi-agent debate improves factual accuracy by 8-20% on reasoning tasks (Du et al., ICML 2024). Heterogeneous model councils catch hallucinations that single-model chains miss entirely (Chen et al., ACL 2024). Truth has a structural advantage in adversarial debate -- even less capable models arguing correctly can beat more persuasive models arguing incorrectly (Khan et al., ICML 2024 Best Paper).

Orchestration gives you the average of N models. Deliberation gives you the output that survived challenge by N models.

---

## What have you built?

The full platform is working:

- **Deliberation engine:** 13 Python modules implementing all 8 modes with round management, convergence detection, and 5-phase judge synthesis (claim extraction, cross-reference, dispute resolution, rubric scoring, final synthesis)
- **3 SDKs:** TypeScript SDK (`@consilium/sdk`), Python SDK (`pip install consilium`), CLI (`npx @consilium/cli`)
- **Web app:** Next.js 15 with real-time SSE streaming, Clerk auth, Stripe billing
- **API:** NestJS 11 on Fastify with BullMQ async processing, Prisma ORM, Swagger docs
- **Infrastructure:** Neon PostgreSQL, Upstash Redis, GitHub Actions CI/CD (lint, typecheck, security scanning with CodeQL/bandit/gitleaks), automated code review
- **Benchmark runner:** Configurable evaluation framework for MMLU-Pro, TruthfulQA, HumanEval, GSM8K
- **Self-hosted Docker:** One-command deployment with `docker compose`
- **5 LLM providers:** OpenAI, Anthropic, Google, Groq, xAI -- BYOK with no markup

Research-calibrated benchmark estimates (pending full runs): +7.9% on MMLU-Pro hard subset, +12.5% on TruthfulQA, +7.9% on HumanEval, +5.6% on GSM8K vs best single model.

---

## How far along are you?

Working product. The full stack is built and deployed: web app on Vercel, API on Render, agents on Render/DigitalOcean. CLI published on npm, Python SDK on PyPI. CI/CD pipeline running. Benchmark framework built with initial test runs completed (full evaluation runs pending API quota scaling). Open source with MIT license.

---

## Revenue model

**SaaS tiers:**
- **Free:** 50 deliberations/month, 2 models per debate, community support
- **Pro ($29/month):** Unlimited deliberations, all 8 modes, 5 models per debate, API access, priority support
- **Enterprise (custom):** Self-hosted deployment, SSO, audit logs, dedicated support, SLA

**Self-hosted:** Free forever (MIT license). Revenue comes from managed hosting, not the software.

**BYOK model:** Users bring their own LLM API keys. Consilium charges for the platform, not the inference. No markup on API costs.

---

## Solo Founder

**Saad Kadri**

Built the entire platform solo: backend API, Python deliberation engine, web frontend, 3 SDKs, CLI, CI/CD, infrastructure, DevOps bot with Slack integration and monitoring. Currently contracting at Ascend for runway while building Consilium full-time evenings and weekends.

The solo build demonstrates two things: deep full-stack technical ability across Python and TypeScript, and the conviction to build something nobody else is building. There are zero commercial products doing structured adversarial deliberation between language models.

---

## Market size

The AI developer tooling market is projected at $40B+ by 2028. Every company deploying LLMs needs confidence calibration. The immediate addressable market is the ~500K developers using multi-agent frameworks (CrewAI has 90K+ GitHub stars, LangChain 100K+). These users already believe in multi-model approaches but are stuck with orchestration. Consilium is the upgrade path.

The broader market is any LLM-powered application where wrong answers have consequences: medical, legal, financial, enterprise decision-making. These verticals need auditable deliberation with dissent reports, not black-box aggregation.

---

## Competitors

| Competitor | What they do | What they don't do |
|---|---|---|
| CrewAI | Role-based agent orchestration | No adversarial debate, no cross-examination, no formal voting |
| AutoGen | Multi-agent conversation framework | Sequential chat, no structured argumentation rounds |
| LangGraph | Stateful agent workflows | Graph-based orchestration, no deliberation protocol |
| DeepEval | LLM evaluation | Testing tool, not a deliberation engine |
| Promptfoo | Prompt testing | Evaluation only, no multi-model debate |

None of these do adversarial deliberation. They are orchestrators optimizing for throughput. Consilium optimizes for accuracy through structured disagreement. The competitive gap is architectural, not incremental.

---

## Why now?

Three things converged:

1. **Multi-model is standard.** Companies routinely use GPT-4o, Claude, and Gemini. The infrastructure for heterogeneous model deployment exists. But the framework for making them productively disagree does not.

2. **Research validation.** Three major papers in 2023-2024 (ICML, ACL) proved that structured debate between models produces measurably better outputs than any form of sequential cooperation. The science is settled; the product doesn't exist.

3. **Cost parity.** Frontier model inference costs dropped 10x in 18 months. Running a 3-model council costs ~$0.08 per question. Deliberation is now cheap enough for production workloads.

---

## 1-Minute Video Script Outline

**0:00-0:10** -- Problem setup. "Every multi-agent framework treats AI models as workers. What if they were adversaries instead?"

**0:10-0:25** -- Show the failure mode. Side-by-side: CrewAI pipeline where a hallucination propagates through 3 agents. "Orchestration hides disagreement. The error passes through unchallenged."

**0:25-0:45** -- Consilium demo. Terminal: `consilium debate "Should we use microservices or a monolith?" --mode council`. Show real-time streaming of Round 1 (proposals), Round 2 (cross-examination where Claude challenges GPT-4o's claim), Round 3 (rebuttal), then verdict with confidence score and dissent report.

**0:45-0:55** -- The pitch. "8 deliberation modes. Formal voting with Condorcet and Ranked Pairs. Dissent reports that preserve minority positions. 3 SDKs. MIT open source. Zero commercial competitors."

**0:55-1:00** -- Close. "Consilium. Deliberation, not orchestration."
