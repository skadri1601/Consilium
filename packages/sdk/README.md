# @myconsilium/sdk

TypeScript SDK for the Consilium AI Council Platform.

> The Consilium source repository is **private** as of April 2026. The SDK is publicly distributed via npm; the hosted API is at `https://api.myconsilium.xyz`. Bring your own LLM keys (OpenAI, Anthropic, Google, Groq, xAI, Moonshot, OpenRouter), or run without keys and Consilium falls back to a platform-hosted free-tier pool (Groq + OpenRouter) so debates keep running at zero cost.

## Install

```bash
npm install @myconsilium/sdk
```

## Quick Start

```typescript
import { ConsiliumClient } from '@myconsilium/sdk';

const client = new ConsiliumClient({
  apiUrl: 'https://api.myconsilium.xyz',
  apiKey: 'your-api-key',
});

const result = await client.deliberate({
  topic: 'Should we migrate to microservices?',
  mode: 'council',
});

console.log(result.goldenPrompt);
console.log(result.confidenceScores);
```

## Deliberation Modes

| Mode | Description |
|------|-------------|
| `quick` | Single round, fastest response |
| `council` | Multi-round deliberation |
| `deep` | Multi-round with sub-agent research |
| `blind` | Names hidden until scored |
| `redteam` | Adversarial red team assessment |
| `jury` | Panel deliberation with voting |
| `market` | Prediction market style confidence |
| `auto` | Automatically selects best mode |

## Red Team

```typescript
const report = await client.redTeam({
  content: 'Our new authentication flow uses...',
  categories: ['injection', 'auth-bypass'],
});

console.log(report.overallScore);
console.log(report.vulnerabilityCount);
```

## Blind Evaluation

```typescript
const evaluation = await client.blindEval({
  topic: 'Explain quantum computing',
  responses: [responseA, responseB, responseC],
});

console.log(evaluation.rankings);
console.log(evaluation.scores);
```

## Streaming

```typescript
for await (const event of client.streamDeliberation({
  topic: 'Evaluate our security posture',
  mode: 'deep',
})) {
  switch (event.type) {
    case 'round_start':
      console.log(`Round ${event.round}`);
      break;
    case 'argument':
      console.log(`${event.model}: ${event.content}`);
      break;
    case 'result':
      console.log('Final:', event.data);
      break;
  }
}
```

## Cost Estimation

```typescript
const estimate = await client.estimateCost({
  topic: 'Complex analysis topic',
  mode: 'deep',
});

console.log(`Estimated: $${estimate.estimatedCost}`);
console.log(estimate.breakdown);
```

## Health Check

```typescript
const health = await client.healthCheck();
console.log(health.status);
console.log(health.services);
```

## Configuration

```typescript
const client = new ConsiliumClient({
  apiUrl: 'https://api.myconsilium.xyz',
  apiKey: 'your-api-key',
  timeout: 60_000,
  maxRetries: 3,
  retryDelay: 1_000,
});
```

## Error Handling

```typescript
import {
  ConsiliumError,
  AuthenticationError,
  TimeoutError,
  ServerError,
  RateLimitError,
} from '@myconsilium/sdk';

try {
  await client.deliberate({ topic: '...', mode: 'council' });
} catch (err) {
  if (err instanceof RateLimitError) {
    console.log(`Retry after ${err.retryAfter}s`);
  } else if (err instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (err instanceof TimeoutError) {
    console.log('Request timed out');
  } else if (err instanceof ServerError) {
    console.log(`Server error: ${err.statusCode}`);
  }
}
```

## License

Proprietary - © Consilium. All rights reserved. The TypeScript SDK is distributed publicly via npm; the source repository is private. Contact <support@myconsilium.xyz> for source access or self-hosting.
