# AI Grant Application Draft

---

## Project

**Consilium** -- Open-source structured adversarial debate between AI models.

**GitHub:** https://github.com/skadri1601/Consilium

**License:** MIT

---

## What does Consilium do?

Consilium makes AI models argue with each other instead of cooperating in a pipeline. It implements 8 deliberation modes where models propose claims, cross-examine each other's reasoning, rebut challenges, and vote using formal social choice theory (Condorcet method, Ranked Pairs, Borda count).

Every existing multi-agent framework (CrewAI, AutoGen, LangGraph) is an orchestrator -- models divide labor in a pipeline. If one model hallucinates, the error passes through unchallenged. Consilium's adversarial architecture forces every claim to survive cross-examination before it reaches the final verdict.

Research shows this works: Du et al. (ICML 2024) demonstrated 8-20% accuracy gains, Chen et al. (ACL 2024) showed heterogeneous councils catch hallucinations single-model chains miss, Khan et al. (ICML 2024 Best Paper) proved truth has a structural advantage in debate.

---

## What's built?

Everything. This is a working platform, not a prototype:

- **Deliberation engine:** 13 Python modules implementing 8 modes (Quick, Council, Deep, Blind, Red Team, Jury, Market, Auto) with round management, convergence detection, and 5-phase judge synthesis
- **Formal voting:** Condorcet method, Ranked Pairs (Tideman's algorithm), Borda count, Copeland scores. Confidence weights from Kendall tau correlation between successive rounds
- **Dissent reports:** Minority positions preserved, not discarded
- **3 SDKs:** TypeScript (`@consilium/sdk`), Python (`pip install consilium`), CLI (`npx @consilium/cli`)
- **Web app:** Next.js 15 with real-time SSE streaming, auth, billing
- **API:** NestJS 11 on Fastify, BullMQ async processing, Prisma ORM
- **Self-hosted Docker:** One-command deployment
- **5 LLM providers:** OpenAI, Anthropic, Google, Groq, xAI -- BYOK
- **Benchmark framework:** MMLU-Pro, TruthfulQA, HumanEval, GSM8K evaluation runner
- **CI/CD:** GitHub Actions with CodeQL, bandit, gitleaks security scanning

Built solo by Saad Kadri.

---

## Why is this open source?

The deliberation protocol should be a public primitive, not a proprietary moat. The research it's based on (multi-agent debate, social choice theory) is public knowledge. The implementation should be too.

Open source also means the community can extend deliberation modes. The 8 current modes map to specific research papers, but there are many more deliberation protocols worth implementing: Delphi method, dialectical bootstrapping, nominal group technique. A permissive license lets researchers and developers build on the platform.

The business model is managed hosting and enterprise features (SSO, audit logs, SLA), not the software itself. Free tier, Pro at $29/month, Enterprise custom. BYOK pricing means no markup on LLM inference costs.

---

## What would you use the grant for?

1. **Benchmark runs at scale.** The evaluation framework is built but full runs across MMLU-Pro (200 questions), TruthfulQA (200), HumanEval (164), and GSM8K (200) across 3 models and multiple modes require significant API spend. Estimated cost: ~$500-800 for comprehensive benchmarking.

2. **Infrastructure for public demo.** Running the hosted platform (Render, Neon, Upstash, Vercel) for public access so developers can try deliberation without self-hosting.

3. **Additional deliberation modes.** Implementing Delphi method, dialectical bootstrapping, and prediction market variants based on research literature.

---

## Why now?

Multi-model deployment is standard -- companies use GPT-4o, Claude, and Gemini routinely. Frontier inference costs dropped 10x in 18 months, making 3-model councils viable at ~$0.08 per question. The research proving debate works was published in 2023-2024. The infrastructure exists, the science is validated, but zero commercial or open-source products implement structured adversarial deliberation as a production platform.

---

## Founder

**Saad Kadri.** Built Consilium end-to-end: Python deliberation engine, TypeScript API and web app, 3 SDKs, CLI, CI/CD, infrastructure across Vercel/Render/Neon/Upstash. Currently contracting at Ascend for runway. The scope of the solo build reflects both technical depth and the conviction that this is a missing primitive in AI infrastructure.
