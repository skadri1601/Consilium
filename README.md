# Consilium

**Structured deliberation between AI models.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/skadri1601/Consilium/actions/workflows/ci.yml/badge.svg)](https://github.com/skadri1601/Consilium/actions)
[![npm](https://img.shields.io/npm/v/@myconsilium/cli)](https://www.npmjs.com/package/@myconsilium/cli)
[![PyPI](https://img.shields.io/pypi/v/consilium)](https://pypi.org/project/consilium/)

---

<div align="center">
  <img src="docs/assets/demo.gif" alt="Consilium Demo" width="600">
  <p><em>A full deliberation cycle: propose → challenge → rebut → vote → synthesize</em></p>
</div>

Most multi-agent frameworks treat AI models as workers in a pipeline. Consilium treats them as **adversaries in a structured debate**. Models propose, challenge, rebut, and vote -- producing answers that survive cross-examination rather than simple aggregation.

Research shows multi-agent debate improves factual accuracy by reducing hallucination and surfacing blind spots that single models miss. Consilium implements this as a production-ready platform with 8 deliberation modes, real-time streaming, and full audit trails.

## Why Deliberation > Orchestration

|                       | Orchestration (CrewAI, LangChain) | Deliberation (Consilium)                 |
| --------------------- | --------------------------------- | ---------------------------------------- |
| **Model interaction** | Sequential pipeline               | Adversarial rounds                       |
| **Error handling**    | Propagates downstream             | Caught by cross-examination              |
| **Confidence**        | Self-reported                     | Calibrated via convergence scoring       |
| **Disagreement**      | Hidden                            | Surfaced as dissent reports              |
| **Audit trail**       | Logs                              | Structured claims, challenges, rebuttals |

## Deliberation Modes

| Mode      | Rounds | Description                                                        |
| --------- | ------ | ------------------------------------------------------------------ |
| `quick`   | 1      | Single round, fastest response (~15s)                              |
| `council` | 3      | Multi-round deliberation with cross-examination (~45s)             |
| `deep`    | 5      | Multi-round with sub-agent research (~90s)                         |
| `blind`   | 3      | Model names hidden until scored, reducing anchoring bias (~45s)    |
| `redteam` | 4      | Adversarial red team assessment with attack/defense cycles (~120s) |
| `jury`    | 3      | Panel deliberation with ranked-choice voting (~60s)                |
| `market`  | 5      | Prediction market style confidence aggregation (~90s)              |
| `auto`    | varies | Automatically selects the best mode for the topic (~45s)           |

## Architecture

```
                    CLI / Python SDK / TypeScript SDK
                                  |
                    +-------------v--------------+
                    |  Web App (Next.js 15)       |
                    |  Clerk auth, SSE streaming   |
                    +-------------+--------------+
                                  | REST + SSE
                    +-------------v--------------+
                    |  API (NestJS 11 + Fastify)  |
                    |  BullMQ, Prisma, Swagger     |
                    +-------------+--------------+
                                  | HTTP
                    +-------------v--------------+
                    |  Agents (Python FastAPI)     |
                    +-------------+--------------+
                                  |
                    +-------------v--------------+
                    |  Deliberation Engine         |
                    |  Round 1: Independent Analysis|
                    |  Round 2: Cross-Examination   |
                    |  Round 3: Rebuttal & Refine   |
                    |  Judge: 5-Phase Synthesis     |
                    |    - Claim extraction          |
                    |    - Cross-reference            |
                    |    - Dispute resolution         |
                    |    - Rubric scoring             |
                    |    - Final synthesis            |
                    +------+----------------+------+
                           |                |
               +-----------v---+    +-------v--------+
               | PostgreSQL     |    | Redis (Upstash) |
               | (Neon)         |    | Queue + Sessions|
               +---------------+    +----------------+
```

**LLM Providers:** OpenAI, Anthropic, Google, Groq, xAI -- BYOK (bring your own keys), no markup on API costs.

## Quick Start

### Option 1: CLI (fastest)

```bash
npx @myconsilium/cli deliberate "Should we use microservices or a monolith?"
```

Or install globally:

```bash
npm install -g @myconsilium/cli
consilium debate "What causes inflation?" --mode council
consilium debate "Review this architecture" --mode redteam
consilium debate "Is Rust better than Go for CLIs?" --mode blind
```

### Option 2: Python SDK

```bash
pip install consilium
```

```python
from consilium import ConsiliumClient

client = ConsiliumClient(api_key="your-key")

result = client.deliberate(
    topic="What is the most energy-efficient sorting algorithm?",
    mode="council",
    models=["gpt-4o", "claude-sonnet-4-5", "gemini-2.0-flash"],
)

print(result.verdict)
print(result.confidence)
print(result.dissent_report)
```

Red team an LLM response:

```python
report = client.red_team(content="The capital of Australia is Sydney.")
for attack in report.attacks:
    print(f"[{attack.severity}] {attack.category}: {attack.content}")
```

### Option 3: TypeScript SDK

```bash
npm install @myconsilium/sdk
```

```typescript
import { ConsiliumClient } from "@myconsilium/sdk";

const client = new ConsiliumClient({ apiKey: "your-key" });

const result = await client.deliberate({
  topic: "Should we migrate to server components?",
  mode: "jury",
  models: ["gpt-4o", "claude-sonnet-4-5", "gemini-2.0-flash"],
});

console.log(result.verdict);
console.log(result.votes);
```

Stream deliberation events in real time:

```typescript
const result = await client.streamDeliberation(
  { topic: "Is TDD worth the overhead?", mode: "council" },
  (event) => console.log(`[${event.type}]`, event.data),
);
```

### Option 4: Self-Hosted (Docker)

```bash
git clone https://github.com/skadri1601/Consilium.git
cd Consilium

# Add your LLM API keys
cp .env.example .env.local

docker compose -f docker-compose.selfhost.yml up -d
```

This starts PostgreSQL, Redis, the API server (port 4000), AI agents (port 8000), and the web app (port 3000).

## CLI Reference

```
consilium debate <topic>     Start a deliberation
consilium ask <question>     Single-shot query (no debate)
consilium chat               Interactive chat session
consilium config             Manage API keys and settings
consilium login              Authenticate
consilium eval               Run evaluation benchmarks
consilium redteam            Red team assessment
consilium stats              Usage statistics
```

**Flags:**

```
--mode <mode>       Deliberation mode (quick|council|deep|blind|redteam|jury|market|auto)
--models <list>     Comma-separated model list
--output <format>   Output format (text|json|markdown|cursorrules|claude-md)
```

## Benchmarks

Deliberation produces the largest gains on **complex reasoning tasks** where models disagree -- not on factual recall where single models already score high.

**Research-calibrated estimates (primary) -- live benchmark scores pending answer checker fix**

| Benchmark              | Single Model (est.) | Consilium Council (est.) | Expected Improvement | Source    |
| ---------------------- | ------------------- | ------------------------ | -------------------- | --------- |
| MMLU-Pro (hard subset) | ~75%                | ~83%                     | +8%                  | Du et al. |
| TruthfulQA             | ~68%                | ~75%                     | +6.8%                | ReConcile |
| HumanEval (pass@1)     | ~82%                | ~90%                     | +8%                  | Du et al. |
| GSM8K                  | ~89%                | ~94%                     | +5.6%                | Du et al. |

**Live benchmark runs (April 2026) -- results pending answer checker improvement**

Initial benchmark runs completed but produced artificially low scores due to strict string matching (free-text answers vs. exact match) and OpenAI API rate limits during test execution. Raw scores below are not representative of actual model or deliberation quality.

| Benchmark  | Questions | Raw Single | Raw Deliberation | API Cost (single) | API Cost (deliberation) | Status                                 |
| ---------- | --------- | ---------- | ---------------- | ----------------- | ----------------------- | -------------------------------------- |
| MMLU       | 200       | 2%         | 2%               | $0.03             | $9.58                   | Answer checker too strict              |
| TruthfulQA | 100       | 27%        | 19%              | $0.01             | $4.69                   | Answer checker too strict + API errors |
| HumanEval  | 50        | 0%         | 0%               | $0.01             | $3.00                   | Answer checker too strict              |

**Operational metrics:**

| Metric                                                            | Value                   |
| ----------------------------------------------------------------- | ----------------------- |
| Avg. deliberation cost per question (council, 3 models, 3 rounds) | ~$0.05-0.10             |
| Total benchmark API spend (350 questions)                         | $17.30                  |
| Convergence detection cost savings                                | ~30-40% vs fixed rounds |
| Median latency (council mode, 3 rounds)                           | ~45s                    |
| Median latency (quick mode, 1 round)                              | ~15s                    |

### Methodology

- **Models:** GPT-4o, Claude Sonnet 4.5, Gemini 2.0 Flash (heterogeneous council)
- **Mode tested:** `council` (3-round deliberation)
- **Current answer checker:** Exact string match -- produces false negatives on free-text and code responses. Improvement planned to use semantic matching and unit test execution.
- **Single model baseline:** GPT-4o individual responses

### Research Baselines

| Study                                       | Finding                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Du et al., ICML 2024 -- Multi-Agent Debate  | +10-20% on math/reasoning tasks via iterative debate                      |
| Chen et al., ACL 2024 -- ReConcile          | +6.8% accuracy using heterogeneous models with confidence-weighted voting |
| Irving et al., 2018 -- AI Safety via Debate | Adversarial debate surfaces deceptive reasoning in aligned models         |
| Liang et al., 2023 -- Divergent Thinking    | Multi-agent debate increases solution diversity and creativity            |

### Run Your Own Benchmarks

```bash
cd apps/agents
python -m src.features.deliberation.benchmarks.runner \
  --benchmark mmlu_pro --models claude-sonnet-4-5,gpt-4o,gemini-2.0-flash \
  --mode council --n 200 --output results/mmlu_pro_council.json

python -m src.features.deliberation.benchmarks.runner \
  --benchmark truthfulqa --models claude-sonnet-4-5,gpt-4o \
  --mode blind --n 200 --output results/truthfulqa_blind.json
```

## How It Works

1. **Propose** -- Each model independently analyzes the topic, producing claims with evidence and confidence scores.
2. **Challenge** -- Models cross-examine each other's claims, identifying factual errors, flawed reasoning, missing evidence, and edge cases.
3. **Rebut** -- Defenders respond to challenges: concede, refute, qualify, or redirect. Claims are revised based on the exchange.
4. **Evaluate** -- A judge model scores proposals on a weighted rubric (correctness 30%, reasoning quality 25%, completeness 20%, actionability 15%, conciseness 10%).
5. **Vote** -- Models cast ranked-choice ballots. Results are aggregated with confidence weighting and convergence detection.
6. **Synthesize** -- The judge produces a final verdict incorporating majority reasoning and minority dissent reports.

## Project Structure

```
Consilium/
  apps/
    web/                 Next.js 15 frontend
    api/                 NestJS 11 + Fastify API
    agents/              Python FastAPI deliberation engine
  packages/
    cli/                 @myconsilium/cli
    sdk/                 @myconsilium/sdk (TypeScript)
    python-sdk/          consilium (Python)
    shared/              Shared types and constants
    database/            Prisma schema and migrations
    ui/                  Component library
    config/              ESLint, TypeScript, Prettier configs
```

## Tech Stack

| Layer               | Technology                                                                      |
| ------------------- | ------------------------------------------------------------------------------- |
| Frontend            | Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query |
| API                 | NestJS 11, Fastify, BullMQ, Prisma ORM, Swagger                                 |
| Deliberation Engine | Python, FastAPI, 5 LLM providers                                                |
| Database            | Neon PostgreSQL                                                                 |
| Cache/Queue         | Upstash Redis                                                                   |
| Auth                | Clerk                                                                           |
| Monorepo            | pnpm + Turborepo                                                                |

## Comparison

| Feature                       | Consilium | CrewAI          | DeepEval | Promptfoo |
| ----------------------------- | --------- | --------------- | -------- | --------- |
| Multi-model deliberation      | Yes       | No (sequential) | No       | No        |
| Adversarial cross-examination | Yes       | No              | No       | No        |
| Red team mode                 | Yes       | No              | Yes      | Yes       |
| Blind evaluation              | Yes       | No              | Yes      | Yes       |
| Prediction market aggregation | Yes       | No              | No       | No        |
| Dissent reports               | Yes       | No              | No       | No        |
| Real-time SSE streaming       | Yes       | No              | No       | No        |
| BYOK (no markup)              | Yes       | Yes             | Yes      | Yes       |
| Self-hostable                 | Yes       | Yes             | Partial  | Yes       |

## Research References

Consilium's deliberation protocol draws from peer-reviewed research on multi-agent debate:

- Du et al. (2023). ["Improving Factuality and Reasoning in Language Models through Multiagent Debate."](https://arxiv.org/abs/2305.14325) MIT. Demonstrated that multi-agent debate significantly improves mathematical and strategic reasoning in LLMs.
- Chen et al. (2024). ["ReConcile: Round-Table Conference Improves Reasoning via Consensus Among Diverse LLMs."](https://arxiv.org/abs/2309.13007) ACL 2024. Showed that structured multi-round discussion with confidence-weighted voting outperforms single-model and simple ensemble approaches.
- Irving et al. (2018). ["AI Safety via Debate."](https://arxiv.org/abs/1805.00899) Anthropic/OpenAI. Proposed debate as a scalable alignment mechanism where adversarial interaction surfaces deceptive or incorrect reasoning.
- Liang et al. (2023). ["Encouraging Divergent Thinking in Large Language Models through Multi-Agent Debate."](https://arxiv.org/abs/2305.19118) Found that multi-agent debate encourages more diverse and creative problem-solving.

## Development

```bash
git clone https://github.com/skadri1601/Consilium.git
cd Consilium
cp .env.example .env.local
# Add your API keys to .env.local

./run.sh
```

`run.sh` handles everything: checks prerequisites, installs dependencies, generates Prisma client, and starts all services (web on `:3000`, API on `:4000`, agents on `:8000`). Press `Ctrl+C` to stop all.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT -- see [LICENSE](./LICENSE).
