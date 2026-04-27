# Google for Startups AI First Program Application

## Company Overview

Consilium is a structured deliberation platform where AI models engage in adversarial debate rather than sequential orchestration. Instead of chaining LLMs in a pipeline where errors propagate downstream, Consilium makes models propose, challenge, rebut, and synthesize -- producing answers that survive cross-examination. The platform implements 8 deliberation modes backed by peer-reviewed research on multi-agent debate, serves developers through CLI, Python SDK, TypeScript SDK, and a web interface, and is fully open source under the MIT license.

## What We've Built

- **Deliberation Engine**: A Python FastAPI service orchestrating structured multi-round debates between LLMs. Each debate follows a rigorous protocol: independent analysis, cross-examination, rebuttal and refinement, then a 5-phase judicial synthesis (claim extraction, cross-referencing, dispute resolution, rubric scoring, final synthesis).
- **8 Deliberation Modes**: Quick (single-round), Council (3-round cross-examination), Deep (5-round with sub-agent research), Blind (model names hidden to prevent anchoring bias), Red Team (adversarial attack/defense cycles), Jury (ranked-choice voting panel), Market (prediction market confidence aggregation), and Auto (intelligent mode selection).
- **Multi-Provider Support**: OpenAI, Anthropic, Google, Groq, and xAI models can debate each other in a single session. BYOK model -- no markup on API costs.
- **Full-Stack Platform**: Next.js 15 web app with real-time SSE streaming, NestJS 11 API with BullMQ job processing, Prisma ORM with Neon PostgreSQL, Clerk authentication, and Stripe billing.
- **Developer Tools**: CLI (`npx @myconsilium/cli deliberate "question"`), Python SDK (`pip install consilium`), TypeScript SDK, all with streaming support.
- **CI/CD Pipeline**: GitHub Actions for lint, typecheck, security scanning (CodeQL, pip-audit, bandit, gitleaks), and automated Claude Code review on every PR.

## What We Need from Google for Startups AI First

- **GCP Credits**: Our deliberation engine makes multiple concurrent LLM calls per debate (3-5 models x 3-5 rounds). Cloud infrastructure costs scale linearly with usage. GCP credits would let us scale our compute and hosting without burning runway.
- **Vertex AI Integration**: We currently support 5 LLM providers but not Vertex AI. Access to Vertex AI would let us add Google's latest models (Gemini Ultra, Gemini Pro) as first-class debate participants, and leverage Vertex AI's evaluation tools to benchmark deliberation quality.
- **Mentorship**: Guidance on scaling a multi-model orchestration platform, optimizing latency for multi-round debates, and go-to-market strategy for developer tools.

## Technical Differentiation

Consilium is the only platform implementing structured adversarial debate between LLMs as a production service. While frameworks like CrewAI and LangChain treat models as cooperative workers in a pipeline, Consilium treats them as adversaries. This matters because:

1. **Errors get caught, not propagated.** Cross-examination forces models to defend their reasoning. Claims that can't survive challenge get discarded.
2. **Confidence is calibrated.** Rather than self-reported confidence scores, Consilium measures convergence across independent models and rounds.
3. **Disagreement is a feature.** Dissent reports surface where models disagree and why, giving users transparency into uncertainty.
4. **Full audit trails.** Every claim, challenge, rebuttal, and vote is structured and queryable -- not buried in logs.

## Traction

- Open source on GitHub (MIT license) with published npm and PyPI packages
- Full CI/CD pipeline with automated security scanning and code review
- 8 deliberation modes implemented and operational
- 5 LLM provider integrations (OpenAI, Anthropic, Google, Groq, xAI)
- CLI, Python SDK, and TypeScript SDK all published and functional
- Production infrastructure running on Vercel, Render, and DigitalOcean

## Team

**Saad Kadri** -- Solo founder and full-stack AI engineer. Built the entire platform end-to-end: deliberation engine (Python/FastAPI), API layer (TypeScript/NestJS), web app (Next.js), CLIs, SDKs, CI/CD pipelines, bot infrastructure, and monitoring. Background in software engineering with deep experience across the TypeScript and Python ecosystems.

## Why Google for Startups AI First

Consilium is AI-native from day one -- the core product is a novel interaction pattern between AI models. Google's AI infrastructure (Vertex AI, TPU access, Gemini models) would directly enhance the platform's capabilities. Adding Gemini as a debate participant would make Consilium the most comprehensive cross-provider deliberation platform available. The program's mentorship network would help navigate the transition from developer tool to platform business. GCP credits would let us focus engineering time on the deliberation engine rather than infrastructure cost optimization.
