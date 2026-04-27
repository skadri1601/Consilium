# Microsoft Founders Hub Application

## Company Overview

Consilium is a structured deliberation platform where AI models engage in adversarial debate to produce higher-quality, more reliable answers. Instead of chaining LLMs in sequential pipelines, Consilium orchestrates multi-round debates with cross-examination, rebuttal, and judicial synthesis. The platform implements 8 deliberation modes, integrates 5 LLM providers, and is open source (MIT license) with a CLI, Python SDK, TypeScript SDK, and web interface.

## What We've Built

- **Deliberation Engine**: Python FastAPI service running structured multi-round debates between LLMs. Protocol: independent analysis, cross-examination, rebuttal and refinement, 5-phase judicial synthesis (claim extraction, cross-referencing, dispute resolution, rubric scoring, final synthesis).
- **8 Deliberation Modes**: Quick, Council, Deep, Blind, Red Team, Jury, Market, and Auto -- each optimized for different decision types and time constraints.
- **NestJS 11 API**: TypeScript backend on Fastify with BullMQ for async debate processing, Prisma ORM, Swagger documentation, and SSE streaming for real-time debate updates.
- **Next.js 15 Web App**: React frontend with Clerk authentication, Stripe billing, shadcn/ui components, and real-time streaming of debate rounds.
- **GitHub Actions CI/CD**: Automated lint, typecheck, security scanning (CodeQL, pip-audit, bandit, gitleaks), and Claude Code automated PR review on every push and pull request.
- **Developer Tools**: CLI published on npm (`@myconsilium/cli`), Python SDK on PyPI (`consilium`), TypeScript SDK -- all with streaming support.
- **Bot Infrastructure**: Slack bot with 3 Redis-backed workers, monitoring agent polling Sentry/SonarQube, Linear integration for project management.

## What We Already Use from Microsoft's Ecosystem

- **GitHub**: Primary code hosting, CI/CD via GitHub Actions (5 workflows: CI, security, Claude Code review, Linear sync, Claude issue response)
- **GitHub Actions**: Automated code review, security scanning, Linear project sync, and AI-powered issue responses on every PR
- **TypeScript**: Primary language for API (NestJS), web app (Next.js), CLI, and shared packages
- **VS Code**: Development environment with full TypeScript tooling

## What We Need from Microsoft Founders Hub

- **Azure Credits**: Our deliberation engine makes 18-50+ LLM API calls per debate session across multiple providers. Azure credits would let us add Azure OpenAI as a provider (lower latency, enterprise compliance), host compute-intensive services, and scale without burning runway.
- **Azure OpenAI Integration**: Adding Azure OpenAI as a first-class LLM provider would give enterprise customers a deployment option that meets their compliance requirements while using the same models they trust.
- **Deeper GitHub Actions Integration**: We're already heavily invested in GitHub Actions for CI/CD. Access to GitHub Copilot for Business and advanced GitHub features would accelerate development velocity for a solo founder.
- **Azure Infrastructure**: Azure Container Apps or AKS for the deliberation engine, Azure Cache for Redis to replace Upstash, Azure Database for PostgreSQL as an alternative to Neon -- giving enterprise customers a single-cloud deployment option.

## Technical Fit

Consilium is built on Microsoft's developer ecosystem:

- **TypeScript end-to-end**: NestJS 11 API, Next.js 15 web app, Commander.js CLI, shared type packages -- all TypeScript with strict mode
- **GitHub-native CI/CD**: 5 GitHub Actions workflows handling lint, typecheck, security (CodeQL), automated code review, and project management sync
- **Node.js runtime**: Fastify server, BullMQ job processing, Prisma ORM, SSE streaming
- **npm packages**: CLI and TypeScript SDK published to npm registry

The platform's architecture aligns naturally with Azure's PaaS offerings: the NestJS API maps to Azure Container Apps, the PostgreSQL database to Azure Database, the Redis queue to Azure Cache, and the Python deliberation engine to Azure Container Instances.

## Traction

- Open source on GitHub (MIT license) with published npm and PyPI packages
- 8 deliberation modes fully implemented
- 5 LLM provider integrations (OpenAI, Anthropic, Google, Groq, xAI)
- CLI, Python SDK, and TypeScript SDK shipped
- 5 GitHub Actions workflows in production
- Full security pipeline: CodeQL, pip-audit, bandit, gitleaks, automated code review
- Production infrastructure across Vercel, Render, DigitalOcean, Neon, Upstash

## Team

**Saad Kadri** -- Solo founder and full-stack AI engineer. Built the entire Consilium platform: deliberation engine (Python/FastAPI), API (TypeScript/NestJS), web app (Next.js), CLIs, SDKs, GitHub Actions workflows, bot infrastructure, and monitoring. Deep TypeScript expertise with production experience across the Node.js and Python ecosystems.

## Why Microsoft Founders Hub

Consilium is already deeply integrated with Microsoft's developer ecosystem -- GitHub for source control and CI/CD, TypeScript as the primary language, npm for package distribution. Azure credits and Azure OpenAI access would be the highest-leverage additions: they'd let us offer enterprise customers a fully Azure-hosted deployment while adding a compliant LLM provider. For a solo founder, the Founders Hub's technical support and Azure credits directly reduce the two biggest constraints -- infrastructure costs and development velocity. The fit is natural: we're not adopting Microsoft tools, we're already building on them.
