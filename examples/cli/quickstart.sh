#!/usr/bin/env bash
set -euo pipefail

MODELS="gpt-4o-mini,claude-haiku-4-5-20251001,gemini-2.0-flash"

echo "=== Consilium CLI - All 8 Deliberation Modes ==="
echo ""

echo "1. QUICK MODE - Single round, fastest response"
echo "   Topic: Best practices for database indexing in PostgreSQL"
consilium debate \
  "Best practices for database indexing in PostgreSQL for a table with 100M rows and mixed read/write workload" \
  --mode quick \
  --models "$MODELS"

echo ""
echo "---"
echo ""

echo "2. COUNCIL MODE - Multi-round deliberation"
echo "   Topic: Monorepo vs polyrepo for a 50-engineer organization"
consilium debate \
  "Should a 50-engineer organization with 12 microservices adopt a monorepo or keep separate repositories? Consider CI/CD, code sharing, and team autonomy" \
  --mode council \
  --models "$MODELS"

echo ""
echo "---"
echo ""

echo "3. DEEP MODE - Sub-agent research with 5 rounds"
echo "   Topic: Comparing edge computing architectures"
consilium debate \
  "Compare Cloudflare Workers, Deno Deploy, and Fly.io for deploying a globally distributed real-time collaboration app with WebSocket support and SQLite at the edge" \
  --mode deep \
  --models "$MODELS"

echo ""
echo "---"
echo ""

echo "4. BLIND MODE - Anonymized evaluation"
echo "   Topic: Evaluating error handling strategies"
consilium debate \
  "What is the best error handling strategy for a TypeScript API: Result types (neverthrow), Effect-TS, or traditional try/catch with custom error classes?" \
  --mode blind \
  --models "$MODELS"

echo ""
echo "---"
echo ""

echo "5. REDTEAM MODE - Adversarial assessment"
echo "   Topic: Security review of an OAuth implementation"
consilium debate \
  "Review this OAuth 2.0 + PKCE implementation for a mobile banking app: authorization code flow with refresh token rotation, 15-minute access tokens, stored in secure enclave" \
  --mode redteam \
  --models "$MODELS"

echo ""
echo "---"
echo ""

echo "6. JURY MODE - Panel deliberation with voting"
echo "   Topic: Choosing a state management approach"
consilium debate \
  "For a large-scale React dashboard with real-time data, complex forms, and offline support: Zustand + React Query, Redux Toolkit + RTK Query, or Jotai + TanStack Query?" \
  --mode jury \
  --models "$MODELS"

echo ""
echo "---"
echo ""

echo "7. MARKET MODE - Prediction market consensus"
echo "   Topic: Technology adoption forecast"
consilium debate \
  "Will WebAssembly components and WASI 0.2 replace Docker containers for serverless functions within 3 years? Consider cold start improvements, language ecosystem readiness, and cloud provider adoption" \
  --mode market \
  --models "$MODELS"

echo ""
echo "---"
echo ""

echo "8. AUTO MODE - Intelligent mode selection"
echo "   Topic: System design question"
consilium debate \
  "Design a notification system that handles 1M push notifications per minute with delivery guarantees, user preferences, rate limiting, and A/B testing of notification content" \
  --mode auto \
  --models "$MODELS"

echo ""
echo "=== All 8 modes completed ==="
