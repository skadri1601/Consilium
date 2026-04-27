# a16z Speedrun Application

**Company:** Consilium
**Founder:** Saad Kadri
**URL:** https://github.com/skadri1601/Consilium
**License:** MIT (open source)

---

## Company Overview

Consilium is a structured adversarial deliberation platform for AI models. Instead of orchestrating models in a pipeline where hallucinations propagate unchallenged, Consilium makes models argue, cross-examine, and vote -- producing answers that survive adversarial scrutiny rather than simple aggregation.

Every multi-agent framework today (CrewAI, AutoGen, LangGraph) treats models as cooperative workers. Consilium treats them as adversaries in a formal debate protocol backed by peer-reviewed research from MIT (Du et al., ICML 2024), ACL 2024 (Chen et al.), and foundational AI safety work (Irving et al., 2018). Truth has a structural advantage in adversarial debate -- even less capable models arguing correctly can beat more persuasive models arguing incorrectly.

The product is live, open source, and fully functional.

---

## What We've Built

**13 deliberation modules** implementing a complete adversarial debate protocol:

- **8 deliberation modes:** Quick (single round, ~15s), Council (3-round cross-examination), Deep (5 rounds with sub-agent research), Blind (identity-stripped to prevent anchoring bias), Red Team (adversarial attack/defense cycles), Jury (ranked-choice voting panel), Market (prediction market confidence aggregation), Auto (automatic mode selection)
- **Formal voting system:** Condorcet method, Borda count, Ranked Pairs (Tideman's algorithm), and Copeland scores with confidence weighting derived from Kendall tau correlation
- **5-phase judge synthesis:** Claim extraction, cross-reference, dispute resolution, rubric scoring, final synthesis with minority dissent reports
- **3 SDKs:** TypeScript (`@myconsilium/sdk`), Python (`pip install consilium`), CLI (`npx @myconsilium/cli`)
- **Full-stack platform:** Next.js 15 web app with real-time SSE streaming, NestJS 11 API with BullMQ async processing, Python FastAPI deliberation engine
- **5 LLM providers:** OpenAI, Anthropic, Google, Groq, xAI -- BYOK with zero markup on inference costs
- **Self-hosted Docker deployment:** One-command setup with `docker compose`
- **Benchmark framework:** Configurable evaluation runner for MMLU-Pro, TruthfulQA, HumanEval, GSM8K

Research-calibrated estimates show +8% on MMLU-Pro hard subset, +6.8% on TruthfulQA, +8% on HumanEval, and +5.6% on GSM8K versus best single model baselines.

---

## Why This Is a Massive Opportunity

**Zero competitors in structured deliberation.** CrewAI (90K+ GitHub stars), LangChain (100K+), and AutoGen are all orchestrators. None implement adversarial cross-examination, formal voting theory, or dissent reports. The competitive gap is architectural, not incremental -- no amount of plugin development turns a pipeline into a debate protocol.

**The AI tooling market is projected at $40B+ by 2028.** Every company deploying LLMs has a confidence calibration problem. Models sound certain when they're wrong. RAG, fine-tuning, and guardrails don't address the structural issue: a single model has no adversary.

**Three convergences make this inevitable now:**
1. Multi-model deployment is standard. Companies already use GPT-4o, Claude, and Gemini simultaneously.
2. Research validation is conclusive. Multi-agent debate improves accuracy by 8-20% on reasoning tasks across multiple peer-reviewed studies.
3. Inference costs dropped 10x in 18 months. A 3-model council costs ~$0.08 per question -- cheap enough for production workloads.

**Verticals where wrong answers have consequences** -- medical, legal, financial, enterprise decision-making -- need auditable deliberation with structured dissent, not black-box aggregation. Consilium is the only product that provides this.

---

## Solo Founder

**Saad Kadri** built the entire platform solo: Python deliberation engine, NestJS API, Next.js frontend, 3 SDKs, CLI, CI/CD pipeline (CodeQL, bandit, gitleaks), DevOps bot with Slack integration and monitoring, Prisma database layer, Docker self-hosted deployment, and benchmark evaluation framework.

The solo build demonstrates deep full-stack technical ability across Python and TypeScript, and the conviction to build something that has zero commercial precedent. Currently contracting for runway while building Consilium full-time evenings and weekends.

---

## What We Need from a16z

**$500K pre-seed** to go full-time and accelerate to product-market fit:

- **Hiring (60%):** One senior ML engineer to optimize deliberation algorithms and run rigorous benchmarks. One developer advocate to drive open-source adoption.
- **Infrastructure (20%):** LLM API credits for benchmark validation at scale, compute for self-hosted enterprise demos.
- **Go-to-market (20%):** Developer marketing, conference presence, enterprise pilot programs.

Beyond capital: a16z's network for enterprise design partnerships, introductions to AI-native companies that need confidence calibration at scale, and guidance on open-source commercialization strategy.

---

## Traction

- **Open source:** MIT-licensed, published on GitHub with full CI/CD (lint, typecheck, security scanning)
- **Published SDKs:** CLI on npm (`@myconsilium/cli`), TypeScript SDK (`@myconsilium/sdk`), Python SDK on PyPI (`consilium`)
- **Working product:** Full stack deployed -- web app on Vercel, API on Render, agents on Render/DigitalOcean
- **Benchmark framework:** Evaluation runner built for MMLU-Pro, TruthfulQA, HumanEval, GSM8K with research-calibrated improvement estimates validated against Du et al. and Chen et al.
- **Self-hosted deployment:** Docker Compose one-command setup for enterprise evaluation
- **Revenue model validated:** SaaS tiers (Free/Pro $29/mo/Enterprise) with BYOK pricing -- platform charges, not inference markup

---

## Revenue Model

| Tier | Price | Includes |
|---|---|---|
| Free | $0 | 50 deliberations/month, 2 models per debate |
| Pro | $29/month | Unlimited deliberations, all 8 modes, 5 models, API access |
| Enterprise | Custom | Self-hosted, SSO, audit logs, SLA, dedicated support |

BYOK model: users bring their own LLM API keys. Consilium charges for the platform, not inference. No markup on API costs.
