# Consilium Examples

Runnable examples demonstrating every deliberation mode and vertical template.

## Setup

### Python SDK

```bash
pip install consilium
export CONSILIUM_API_KEY="your-api-key"
```

### TypeScript SDK

```bash
npm install @myconsilium/sdk
```

### CLI

```bash
npm install -g @myconsilium/cli
consilium config set apiKey "your-api-key"
```

## Examples

### Python

| File | Mode | Description |
|------|------|-------------|
| [council_debate.py](python/council_debate.py) | `council` | Multi-round deliberation on software architecture decisions |
| [blind_evaluation.py](python/blind_evaluation.py) | `blind` | Anonymized comparison of competing model outputs |
| [red_team_assessment.py](python/red_team_assessment.py) | `redteam` | Adversarial security assessment of an API endpoint |
| [truth_market.py](python/truth_market.py) | `market` | Prediction market consensus on emerging technology trends |
| [healthcare_diagnosis.py](python/healthcare_diagnosis.py) | `council` | Differential diagnosis using the healthcare vertical template |
| [legal_review.py](python/legal_review.py) | `jury` | Contract clause analysis using the legal vertical template |
| [cost_routing.py](python/cost_routing.py) | `auto` | Cost-aware routing that selects the optimal mode automatically |

### TypeScript

| File | Mode | Description |
|------|------|-------------|
| [council-debate.ts](typescript/council-debate.ts) | `council` | Multi-round deliberation with async/await |
| [streaming.ts](typescript/streaming.ts) | `council` | Real-time SSE streaming with event handling |

### CLI

| File | Description |
|------|-------------|
| [quickstart.sh](cli/quickstart.sh) | Shell script demonstrating all 8 deliberation modes |

## Deliberation Modes

| Mode | Rounds | Description |
|------|--------|-------------|
| `quick` | 1 | Single round, fastest response (~15s) |
| `council` | 3 | Multi-round deliberation (~45s) |
| `deep` | 5 | Multi-round with sub-agent research (~90s) |
| `blind` | 3 | Names hidden until scored (~45s) |
| `redteam` | 4 | Adversarial red team assessment (~120s) |
| `jury` | 3 | Panel deliberation with voting (~60s) |
| `market` | 5 | Prediction market confidence aggregation (~90s) |
| `auto` | 3 | Automatically selects best mode for topic (~45s) |
