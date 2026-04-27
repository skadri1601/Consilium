# South Park Commons Application Draft

---

## What are you exploring?

The structural question: how should multiple AI models resolve disagreement?

The entire multi-agent AI ecosystem -- CrewAI, AutoGen, LangGraph -- adopted orchestration as the default architecture. Models cooperate in pipelines, divide labor, merge outputs. This optimizes for throughput but has three structural failures: disagreement is hidden, confidence is self-reported, and errors propagate downstream unchallenged.

I'm building Consilium to test the alternative: adversarial deliberation. Models propose, cross-examine, rebut, and vote using formal social choice theory. The hypothesis is that structured disagreement produces measurably better outputs than any form of sequential cooperation.

This hypothesis has strong research support. Du et al. (ICML 2024) demonstrated 8-20% accuracy gains from multi-agent debate. Chen et al. (ACL 2024) showed heterogeneous model councils catch hallucinations that single-model chains miss. Khan et al. (ICML 2024 Best Paper) proved truth has a structural advantage in adversarial debate -- the correct answer tends to win even against more persuasive opposition.

---

## What have you built so far?

Consilium is a working platform with:

- 8 deliberation modes (Quick, Council, Deep, Blind, Red Team, Jury, Market, Auto), each implementing a different research-backed deliberation protocol
- Formal voting using social choice theory: Condorcet method, Ranked Pairs (Tideman's algorithm), Borda count, Copeland scores, with confidence weights derived from Kendall tau correlation
- Dissent reports that preserve minority positions instead of discarding them
- 13 Python modules for the deliberation engine with 5-phase judge synthesis
- 3 SDKs (TypeScript, Python, CLI), a Next.js web app, NestJS API, and Docker self-hosting
- Benchmark evaluation framework for MMLU-Pro, TruthfulQA, HumanEval, GSM8K
- MIT open source, 5 LLM provider integrations, BYOK pricing

I built this solo while contracting at Ascend for runway.

---

## Why SPC?

Consilium sits at an intersection that benefits from intellectual community: multi-agent systems, social choice theory, adversarial ML, and AI alignment. The research lineage is clear (Irving's "AI Safety via Debate" from Anthropic/OpenAI is a direct ancestor), but translating research into production infrastructure raises questions I'd benefit from thinking through with others.

Specific open questions:

- **Deliberation economics.** Running a 3-model council costs ~$0.08 per question today. At what price point does deliberation become the default over single-model inference for different use cases?
- **Mode selection.** When should you use blind evaluation vs. red team vs. prediction market aggregation? The "auto" mode needs better heuristics, potentially learned from usage patterns.
- **Convergence detection.** Current implementation saves ~30-40% cost by detecting when models stop changing their positions. Can this be made more principled with information-theoretic measures?
- **Dissent preservation.** Minority positions are often correct. How do you surface dissent effectively without overwhelming users with noise?

SPC's research-oriented community is the right place to work through these questions.

---

## Background

Saad Kadri. Full-stack engineer with deep experience across Python ML infrastructure and TypeScript web/API development. Built Consilium end-to-end: deliberation engine, web app, API, 3 SDKs, CLI, CI/CD, infrastructure. Currently contracting at Ascend.

The solo build across this scope reflects the conviction that structured deliberation is a missing primitive in AI infrastructure, and the technical ability to prove it by shipping a working platform with zero commercial competitors in the space.
