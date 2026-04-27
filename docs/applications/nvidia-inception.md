# NVIDIA Inception Program Application

## Company Overview

Consilium is a structured deliberation platform where AI models engage in adversarial debate to produce higher-quality answers. Rather than treating LLMs as workers in a pipeline, Consilium orchestrates multi-round debates with cross-examination, rebuttal, and judicial synthesis. The platform supports 8 deliberation modes, 5 LLM providers, and ships as an open source CLI, Python SDK, TypeScript SDK, and web application under the MIT license.

## What We've Built

- **Deliberation Engine**: Python FastAPI service running structured multi-round debates. Each session follows a protocol: independent analysis from multiple models, cross-examination where models challenge each other's claims, rebuttal and refinement, then a 5-phase judicial synthesis (claim extraction, cross-referencing, dispute resolution, rubric scoring, final synthesis).
- **8 Deliberation Modes**: Quick (1 round, ~15s), Council (3 rounds with cross-examination, ~45s), Deep (5 rounds with sub-agent research, ~90s), Blind (hidden model identities to prevent anchoring, ~45s), Red Team (adversarial attack/defense cycles, ~120s), Jury (ranked-choice voting, ~60s), Market (prediction market confidence aggregation, ~90s), Auto (intelligent mode selection).
- **Multi-Model Orchestration**: 5 LLM providers (OpenAI, Anthropic, Google, Groq, xAI) can debate within a single session. The engine handles concurrent API calls, response normalization, and structured argument extraction across heterogeneous model outputs.
- **Production Infrastructure**: Next.js 15 web app, NestJS 11 API with BullMQ async processing, Prisma/Neon PostgreSQL, Redis (Upstash) for queuing and sessions, real-time SSE streaming, Clerk auth, and Stripe billing.
- **Developer Ecosystem**: CLI (`npx @consilium/cli deliberate`), Python SDK, TypeScript SDK, Swagger API documentation.

## What We Need from NVIDIA Inception

- **GPU Credits**: Running local/fine-tuned models for deliberation would dramatically reduce latency and cost per debate round. GPU access would let us benchmark open-weight models (Llama, Mistral, Phi) as debate participants alongside commercial APIs.
- **NVIDIA Hardware Integration**: TensorRT-LLM optimization for serving multiple models simultaneously during a debate. Multi-model concurrent inference is our core workload -- the deliberation engine needs 3-5 models responding in parallel per round.
- **Benchmark Infrastructure**: We need GPU compute to run systematic quality benchmarks comparing deliberation outputs against single-model baselines across standardized evaluation sets. This research validates the core thesis that adversarial debate improves factual accuracy.
- **NeMo/NIMs Access**: NVIDIA NIM microservices would let us offer self-hosted deliberation with optimized inference, important for enterprise customers with data sovereignty requirements.

## Technical Depth

### Deliberation Engine Architecture

The engine orchestrates concurrent LLM inference across multiple providers in structured rounds:

```
Round 1: N models produce independent analyses (parallel inference)
Round 2: Each model receives all other outputs, produces cross-examinations (N*(N-1) inference calls)
Round 3: Models rebut challenges and refine positions (N inference calls)
Judge: 5-phase synthesis pipeline (5 sequential inference calls)
```

A single Council-mode debate with 3 models generates ~18 LLM inference calls. Deep mode with 5 models and 5 rounds generates 50+. This creates a workload profile where parallel multi-model inference throughput directly impacts user experience.

### GPU Computing Needs

1. **Local Model Serving**: Running Llama 3, Mistral, and Phi models locally for low-latency debate rounds. Current API-only approach adds 2-5s of network latency per round.
2. **Concurrent Multi-Model Inference**: A single debate requires multiple models running simultaneously. GPU memory management across 3-5 loaded models is the primary technical challenge.
3. **Benchmark Suite**: Systematic evaluation of deliberation quality requires thousands of debate runs across controlled conditions. This is computationally intensive and latency-insensitive -- ideal for batch GPU workloads.
4. **Fine-Tuning**: Training specialized debater and judge models that are optimized for the adversarial deliberation protocol rather than general instruction following.

## Traction

- Open source on GitHub (MIT license) with npm and PyPI packages published
- 8 deliberation modes fully implemented and operational
- 5 LLM provider integrations with BYOK model
- CLI, Python SDK, TypeScript SDK shipped
- Full CI/CD with automated security scanning (CodeQL, bandit, gitleaks)
- Production infrastructure running across Vercel, Render, DigitalOcean, Neon, and Upstash

## Team

**Saad Kadri** -- Solo founder and full-stack AI engineer. Designed and built the complete platform: deliberation engine (Python/FastAPI), multi-provider LLM integration, API layer (TypeScript/NestJS), web app (Next.js 15), SDKs, CLI, CI/CD pipelines, monitoring infrastructure, and bot systems. Deep expertise in both the Python ML ecosystem and TypeScript production systems.

## Why NVIDIA Inception

Consilium's core workload -- parallel multi-model inference across structured debate rounds -- is fundamentally GPU-bound. Moving from API-only to hybrid local+API inference would reduce latency by 60-80% for supported models and unlock open-weight models as debate participants. NVIDIA's inference optimization stack (TensorRT-LLM, NIMs, Triton) is purpose-built for the multi-model serving pattern that deliberation requires. The Inception program's go-to-market support and technical resources would accelerate our path from developer tool to enterprise-ready platform with self-hosted deployment options.
