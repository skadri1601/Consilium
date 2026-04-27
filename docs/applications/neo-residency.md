# Neo Residency Application Draft

---

## Who are you?

Saad Kadri. Solo technical founder building Consilium, an open-source platform for structured adversarial debate between AI models. MIT licensed. Currently contracting at Ascend for runway.

I built the entire platform alone: a Python deliberation engine with 8 research-backed modes, a NestJS API layer, a Next.js web app, 3 SDKs (TypeScript, Python, CLI), CI/CD with automated security scanning, and infrastructure across Vercel, Render, Neon, and Upstash. The codebase spans two languages, six deployed services, and five LLM provider integrations.

---

## What are you building?

Consilium makes AI models argue with each other instead of cooperating in a pipeline.

Every multi-agent framework today (CrewAI, AutoGen, LangGraph) is an orchestrator: tasks flow through a pipeline, and if one model hallucinates, the error propagates unchallenged. Consilium implements adversarial deliberation -- models propose claims, cross-examine each other, rebut challenges, and vote using formal social choice theory (Condorcet method, Ranked Pairs, Borda count).

The platform has 8 deliberation modes: Quick, Council, Deep, Blind (identity-stripped), Red Team, Jury, Market (prediction market aggregation), and Auto. Each follows a formal Claim-Challenge-Rebuttal-Evaluation structure. A 5-phase judge synthesizes the final verdict with a dissent report preserving minority positions.

This is backed by peer-reviewed research: Du et al. (ICML 2024) showed 8-20% accuracy gains from multi-agent debate, Chen et al. (ACL 2024) proved heterogeneous model councils catch hallucinations single-model chains miss, and Khan et al. (ICML 2024 Best Paper) demonstrated truth has a structural advantage in adversarial debate.

There are zero commercial products doing structured adversarial deliberation between language models.

---

## Why are you the right person to build this?

I can architect and ship across the full stack -- Python ML infrastructure, TypeScript web/API layers, DevOps, and infrastructure -- which is exactly what this product requires. Consilium isn't a wrapper around an API call. It's a multi-service platform with real-time streaming, async job processing, formal voting algorithms, and production deployment across multiple cloud providers.

The solo build is the proof. Not a demo, not a prototype -- a deployed platform with 3 SDKs, Docker self-hosting, benchmark evaluation framework, and CI/CD pipelines including CodeQL security analysis, automated code review, and GitHub-Linear-Slack sync.

---

## What's your ambition?

Deliberation should be the default primitive for high-stakes AI decisions. Today, if you ask an LLM a question, you get one answer with self-reported confidence. Tomorrow, every consequential AI query should go through adversarial deliberation -- medical diagnoses, legal analysis, financial decisions, code review, security assessments.

Consilium is the infrastructure layer that makes this possible. The short-term product is a developer platform with SDKs and APIs. The long-term vision is that "deliberate before deciding" becomes as standard as "test before deploying."

---

## What do you want from Neo?

Access to founders who've navigated the open-source-to-commercial transition. Consilium is MIT licensed by design -- the deliberation protocol should be open. The business question is how to build a sustainable company around open infrastructure. I want to learn from people who've done this at companies like Vercel, Supabase, PostHog, and similar open-core businesses.

Community of technical founders who can pressure-test the architecture and product direction. This is a research-informed product and benefits from people who think carefully about hard problems.
