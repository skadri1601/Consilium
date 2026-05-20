# consilium-js

> Consilium JS is the TypeScript / JavaScript SDK for the Consilium multi-AI council platform - call `deliberate()` or `streamDeliberation()` to run a structured debate across Claude, GPT-5, Gemini, Grok, Groq, Kimi, and OpenRouter models and get a synthesized answer with confidence scores and dissent.

[![npm version](https://img.shields.io/npm/v/@myconsilium/sdk)](https://www.npmjs.com/package/@myconsilium/sdk)
[![license](https://img.shields.io/npm/l/@myconsilium/sdk)](LICENSE)
[![tests](https://img.shields.io/github/actions/workflow/status/skadri1601/consilium-js/ci.yml?label=tests)](https://github.com/skadri1601/consilium-js/actions)
[![node](https://img.shields.io/node/v/@myconsilium/sdk)](https://www.npmjs.com/package/@myconsilium/sdk)

## What it is

Consilium JS is the official TypeScript SDK for the Consilium API. It
gives you a typed `ConsiliumClient` with both promise-based methods
(`deliberate`, `redTeam`, `blindEval`, `estimateCost`, `healthCheck`)
and an async-iterable streaming method (`streamDeliberation`) for
real-time SSE events. Ships ESM and CJS, native `fetch`, no runtime
dependencies. Works in Node.js >= 20, modern browsers, Bun, Deno, edge
runtimes, and Cloudflare Workers.

## Why Consilium JS

- **One typed client** for all 8 deliberation modes - `quick`, `council`, `deep`, `blind`, `redteam`, `jury`, `market`, `auto`.
- **7 first-class LLM providers** in a single debate: OpenAI, Anthropic, Google, xAI, Groq, Moonshot, OpenRouter.
- **Promise + async-iterable patterns** - `await client.deliberate(...)` for fire-and-forget, `for await (const event of client.streamDeliberation(...))` for SSE.
- **Native fetch, ESM + CJS**, zero runtime dependencies. Tree-shakes cleanly.
- **Pydantic-equivalent typed responses** - `goldenPrompt`, `confidenceScores`, `votes`, `dissentReport`, `rankings`, all fully typed.
- **Built-in retry with exponential backoff** for HTTP 429 (respects `Retry-After`) and 5xx. Configurable timeout, max retries, retry delay.
- **Free-tier fallback** - run without keys and Consilium routes through a managed Groq + OpenRouter pool. BYOK always wins when a key is present.

## Quickstart

```bash
npm install @myconsilium/sdk
# or: pnpm add @myconsilium/sdk / yarn add @myconsilium/sdk / bun add @myconsilium/sdk
```

```typescript
import { ConsiliumClient } from "@myconsilium/sdk";

const client = new ConsiliumClient({
  apiUrl: "https://api.myconsilium.xyz",
  apiKey: process.env.CONSILIUM_API_KEY,
});

const result = await client.deliberate({
  topic: "Should we migrate to microservices?",
  mode: "council",
});

console.log(result.goldenPrompt);
console.log(result.confidenceScores);
```

Under 60 seconds end-to-end including install.

## API surface

### `deliberate` - promise-based

```typescript
const result = await client.deliberate({
  topic: "Postgres vs DynamoDB for time-series",
  models: ["claude-sonnet-4-6", "gpt-5.4", "gemini-3.1-pro-preview"],
  mode: "deep",
  maxRounds: 5,
});

result.goldenPrompt; // synthesized answer
result.confidenceScores; // per-model
result.votes; // per-round votes
result.dissentReport; // recorded disagreements
result.cost; // total cost across providers
```

### `streamDeliberation` - async iterable over SSE

```typescript
for await (const event of client.streamDeliberation({
  topic: "Evaluate our security posture",
  mode: "deep",
})) {
  switch (event.type) {
    case "round_start":
      console.log(`Round ${event.round}`);
      break;
    case "argument":
      console.log(`${event.model}: ${event.content}`);
      break;
    case "challenge":
      console.log(`Challenge: ${event.kind} - ${event.content}`);
      break;
    case "vote":
      console.log(`${event.model} voted ${event.value}`);
      break;
    case "routing:fallback":
      console.log(`Free-tier fallback engaged for ${event.provider}`);
      break;
    case "result":
      console.log("Final:", event.data);
      break;
  }
}
```

### `redTeam` - adversarial review

```typescript
const report = await client.redTeam({
  content: "Our new authentication flow uses...",
  categories: ["injection", "auth-bypass", "data-exfiltration"],
});

report.overallScore;
report.vulnerabilityCount;
report.attacks; // per-attack pass/fail
```

### `blindEval` - rank candidate responses

```typescript
const evaluation = await client.blindEval({
  topic: "Explain quantum computing",
  responses: [responseA, responseB, responseC],
});

evaluation.rankings;
evaluation.scores;
```

### `estimateCost`

```typescript
const estimate = await client.estimateCost({
  topic: "Complex analysis topic",
  mode: "deep",
  models: ["claude-sonnet-4-6", "gpt-5.4", "gemini-3.1-pro-preview"],
});

estimate.estimatedCost;
estimate.breakdown;
```

### `healthCheck`

```typescript
const health = await client.healthCheck();
health.status;
health.services;
```

## Configuration

```typescript
const client = new ConsiliumClient({
  apiUrl: "https://api.myconsilium.xyz", // or self-hosted
  apiKey: "consilium_...",
  timeout: 60_000,
  maxRetries: 3,
  retryDelay: 1_000,
});
```

## Error handling

```typescript
import {
  ConsiliumError,
  AuthenticationError,
  TimeoutError,
  ServerError,
  RateLimitError,
} from "@myconsilium/sdk";

try {
  await client.deliberate({ topic: "...", mode: "council" });
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(`Retry after ${err.retryAfter}s`);
  } else if (err instanceof AuthenticationError) {
    console.log("Invalid API key");
  } else if (err instanceof TimeoutError) {
    console.log("Request timed out");
  } else if (err instanceof ServerError) {
    console.log(`Server error: ${err.statusCode}`);
  }
}
```

## Comparison

| Feature                | Consilium SDK                 | Vercel AI SDK               | LangChain JS | OpenAI SDK      | Anthropic SDK   |
| ---------------------- | ----------------------------- | --------------------------- | ------------ | --------------- | --------------- |
| Multi-provider debate  | yes - 7 providers in one call | streamText across providers | agent chains | single provider | single provider |
| Convergence detection  | yes - Kendall tau + Jaccard   | no                          | no           | no              | no              |
| Mandatory dissent      | yes                           | no                          | no           | no              | no              |
| Typed response models  | yes                           | yes                         | partial      | yes             | yes             |
| Streaming (async iter) | yes                           | yes                         | yes          | yes             | yes             |
| Built-in retry/backoff | yes                           | yes                         | partial      | yes             | yes             |
| Free-tier fallback     | yes - Groq + OpenRouter pool  | no                          | no           | no              | no              |
| Cost estimation        | yes                           | no                          | no           | no              | no              |
| Red-team mode          | yes                           | no                          | partial      | no              | no              |
| Blind evaluation       | yes                           | no                          | no           | no              | no              |

## Runtime support

- Node.js >= 20
- Bun >= 1.0
- Deno >= 1.40
- Cloudflare Workers
- Vercel Edge / AWS Lambda@Edge
- Modern browsers (with CORS configured on the API)

## Docs

- [TypeScript SDK reference](https://myconsilium.xyz/docs/typescript-sdk)
- [Quickstart](https://myconsilium.xyz/docs/getting-started)
- [How it works](https://myconsilium.xyz/docs/how-it-works)
- [Deliberation modes](https://myconsilium.xyz/docs/modes)
- [Provider catalog](https://myconsilium.xyz/docs/providers)

## License

MIT
