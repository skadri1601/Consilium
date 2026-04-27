# Why Deliberation Beats Orchestration

Multi-agent AI frameworks are everywhere. CrewAI, AutoGen, LangGraph -- they all promise that multiple models working together produce better results than one model alone. They're right about the premise. They're wrong about the mechanism.

These frameworks are **orchestrators**. They route tasks through pipelines, assign roles, and merge outputs. What they don't do is let models *disagree productively*. When GPT-4o says one thing and Claude says another, orchestrators either pick one or concatenate both. There is no formal mechanism to surface dissent, challenge weak reasoning, or measure whether models are actually converging on truth.

## The Problem: Orchestration Hides Disagreement

Consider a typical CrewAI workflow: Model A researches, Model B writes, Model C reviews. This is division of labor, not intellectual rigor. If Model A hallucinates a statistic, Model B weaves it into prose, and Model C -- primed by the same context -- rubber-stamps it.

Orchestration frameworks have three structural failures:

1. **Disagreement is hidden.** When agents produce conflicting outputs, the framework picks a winner or merges naively. Minority positions vanish.
2. **Confidence is self-reported.** A model saying "I'm 95% confident" tells you nothing about calibration. There's no external check.
3. **Errors propagate.** Sequential pipelines pass mistakes downstream. No agent is incentivized to challenge upstream work.

These aren't implementation bugs. They're architectural choices that optimize for throughput over accuracy.

## The Solution: Structured Adversarial Debate

Consilium implements a different architecture: **adversarial deliberation**. Models don't cooperate on a task. They argue about an answer.

### 8 Deliberation Modes

Each mode is designed for a different decision type:

| Mode | Rounds | Use case |
|------|--------|----------|
| **Quick** | 1 | Low-stakes, fast answers (~15s) |
| **Council** | 3 | Default deliberation with cross-examination (~45s) |
| **Deep** | 5 | High-stakes with sub-agent research (~90s) |
| **Blind** | 3 | Identity-stripped evaluation, no anchoring bias (~45s) |
| **Red Team** | 4 | Adversarial attack/defense stress-testing (~120s) |
| **Jury** | 3 | Panel deliberation with ranked-choice voting (~60s) |
| **Market** | 5 | Prediction market confidence aggregation (~90s) |
| **Auto** | varies | Automatic mode selection by topic (~45s) |

Every mode follows the same formal argumentation structure:

```
Claim → Challenge → Rebuttal → Evaluation
```

Each model submits a **Proposal** with typed claims. Other models issue **Challenges** -- factual disputes, logical objections, requests for evidence. The challenged model responds with **Rebuttals**: concede, refute, qualify, or redirect. A judge phase extracts surviving claims, cross-references them, resolves disputes, scores against a weighted rubric, and synthesizes a final verdict.

### Voting via Social Choice Theory

Most "voting" in multi-agent systems is majority rule. This fails when there are more than two options (Arrow's impossibility theorem).

Consilium implements social choice theory properly. Each evaluating model produces a ranked ballot weighted by calibrated confidence:

- **Condorcet method** -- Finds the candidate that wins every pairwise comparison, if one exists. This is the strongest possible winner.
- **Borda count** -- Positional scoring with confidence-based weights for continuous ranking.
- **Ranked Pairs** -- Tideman's algorithm locks in the strongest pairwise victories while detecting and avoiding cycles. The fallback when no Condorcet winner exists.
- **Copeland scores** -- Net pairwise wins for overall dominance measurement.

Confidence weights aren't self-reported. They're derived from **Kendall tau correlation** between successive voting rounds -- how consistently a model's rankings align over time. Models that flip-flop get downweighted. Models that hold stable, defensible positions get upweighted.

### Dissent Preservation

The most important architectural difference: Consilium doesn't silence losing positions. Every deliberation produces a **Dissent Report** that surfaces minority clusters -- groups of claims with meaningful support that didn't make the final verdict. Minority positions are often correct. The dissenting model may have identified an edge case or hidden assumption that the majority missed. Orchestrators throw this information away by design.

## The Evidence

This isn't theoretical. Multi-agent debate has peer-reviewed results:

**Du et al., "Improving Factuality and Reasoning in Language Models through Multiagent Debate" (ICML 2024).** Structured debate between language models improves math and reasoning benchmarks by ~8% over single-model baselines. The key finding: models catch each other's mistakes in ways that self-consistency alone cannot. Debate produces gains even when all agents are copies of the same model, because the adversarial structure forces verification of claims each instance might otherwise accept.

**ReConcile, "Round-Table Conference Improves Reasoning via Consensus Among Diverse LLMs" (ACL 2024).** Cross-examination across heterogeneous models -- not copies of the same model -- catches hallucinations that single-model chains miss entirely. Their round-table protocol, where models explicitly address each other's reasoning, is the direct inspiration for Consilium's Council mode. Model diversity amplifies the effect because genuine differences in training data surface genuine blind spots.

**Khan et al., "Debating with More Persuasive LLMs Leads to More Truthful Answers" (ICML 2024, Best Paper).** Truth has a structural advantage in debate. Even when a less capable model argues for the correct answer against a more persuasive model arguing for the wrong one, judges can reliably identify truth. This validates the adversarial framing: debate is asymmetrically useful for finding correct answers.

The pattern across all three papers: structured disagreement between models produces measurably better outputs than any form of sequential cooperation or naive aggregation.

## Try It

CLI:

```bash
npx @myconsilium/cli deliberate "Should we use microservices or a monolith?"
```

Python:

```python
from consilium import ConsiliumClient

client = ConsiliumClient(api_key="your-key")
result = client.deliberate(
    topic="What causes inflation?",
    mode="council",
    models=["gpt-4o", "claude-sonnet-4-5", "gemini-2.0-flash"],
)
print(result.verdict)
print(result.dissent_report)
```

Install via `pip install consilium` or `npm install -g @myconsilium/cli`.

Source: [github.com/skadri1601/Consilium](https://github.com/skadri1601/Consilium)

---

Orchestration gives you the average of N models. Deliberation gives you the output that survived challenge by N models. These are not the same thing.
