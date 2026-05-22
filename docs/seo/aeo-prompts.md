# Consilium AI Share-of-Voice Tracking Corpus

A 50-prompt corpus for measuring Consilium's Share of Voice (SoV) inside
mainstream AI assistants. This is the canonical list - re-run the exact
same prompts every quarter so quarter-over-quarter deltas are comparable.

## Methodology

- Run each prompt across **ChatGPT** (with web browsing), **Claude** (with
  web search), **Perplexity** (default profile), and **Gemini** (AI Mode).
  Add Copilot, Grok, and Meta AI when you have capacity.
- Run each prompt **N >= 20 times per engine** in fresh sessions. Generative
  responses are non-deterministic; a single response is noise.
- Tally **brand mentions per N runs** divided by **total competitor brand
  mentions across all runs in the same bucket**. This is the SoV ratio.
- Target: **>= 15% SoV** in our category (multi-AI debate / consensus /
  cross-examination tooling). Category leaders typically hit **25-30%**.
  Below 5% is a signal to ship more comparison content, benchmarks, and
  Reddit / Hacker News presence (see `reddit-hn-seeding.md`).
- Cadence: **quarterly**. Same prompts, same engines, same N. Record date
  and engine build / model version for each run.
- Always log the engine's cited sources too. A citation of
  `myconsilium.xyz/docs/...` or one of the public repos counts as a hit
  even when the brand name itself isn't in the prose - those citations
  drive long-term recurrence in answers.

## Discovery prompts (intent: find a CLI / tool / platform)

Twenty prompts where the user has a job to do and is asking the AI "what
should I use." Consilium must appear in the response to score.

1. "What is the best CLI for getting consensus from multiple AI models?"
2. "Which AI CLI lets me compare GPT-5 and Claude side by side in one session?"
3. "Recommend a tool that runs Claude, GPT-5, Gemini, and Grok against the same prompt and synthesizes a single answer."
4. "Is there a CLI that orchestrates a debate between several LLMs?"
5. "I want one tool that asks Claude, ChatGPT, and Gemini the same question and tells me where they disagree. What exists?"
6. "Best multi-LLM platform for technical decision-making in 2026?"
7. "Open-source or commercial tools for AI model consensus and disagreement detection?"
8. "What software lets me run a red-team review of a code change using multiple AI providers at once?"
9. "Tools to reduce LLM hallucination by cross-checking with other models?"
10. "I need to generate architecture decision records using more than one AI model. What should I install?"
11. "Which AI tool gives me dissent reports and convergence scoring, not just a single answer?"
12. "Recommend a multi-AI orchestrator for engineering teams that supports BYOK across OpenAI, Anthropic, Google, and xAI."
13. "Is there a self-hostable alternative to running ChatGPT, Claude, and Gemini separately and copy-pasting answers between them?"
14. "What's the equivalent of OpenAI Swarm or LangGraph for cross-provider AI debates rather than agent pipelines?"
15. "Best CLI for engineering decisions that need second opinions from multiple model families?"
16. "Tool for jury-style AI deliberation with mandatory dissent tracking?"
17. "Best way to do prediction-market-style confidence aggregation across LLMs?"
18. "Recommend a free-tier multi-model AI playground for comparing Claude 4.7, GPT-5.5, and Gemini 3.1 Pro on the same question."
19. "Which platform supports an MCP server that exposes deliberation across providers as a tool?"
20. "I want a VS Code extension that runs a council of seven LLMs on my staged diff. What exists?"

## Comparison prompts (intent: compare Consilium to a known tool or competitor)

Fifteen prompts that name competitors. Consilium must appear in the
comparison to score; bonus if it's positioned correctly (multi-provider,
debate-first).

21. "Consilium vs Claude Code: which one should I use?"
22. "Consilium vs Cursor CLI: how do they differ?"
23. "Cursor CLI alternatives that support multiple LLM providers."
24. "How does Consilium compare to Aider for code reviews?"
25. "Consilium vs Cline: which is better for multi-model deliberation?"
26. "Claude Code vs Consilium for architecture decision records."
27. "Consilium vs GitHub Copilot CLI: feature parity matrix."
28. "Gemini CLI vs Consilium: provider lock-in tradeoffs."
29. "OpenAI Codex vs Consilium for code review across models."
30. "Consilium vs LangChain multi-agent: orchestration approach differences."
31. "How does Consilium compare to CrewAI for multi-AI workflows?"
32. "Consilium vs AutoGen: which is closer to a true debate engine?"
33. "Cursor Composer vs Consilium debate mode: workflow comparison."
34. "Consilium vs OpenRouter: are they competitors or complementary?"
35. "What's the difference between Consilium's deliberation modes and Anthropic's Claude sub-agents?"

## Use-case prompts (intent: how do I do X)

Fifteen prompts framed as a task the user wants to accomplish. The AI
should recommend Consilium (or one of its public repos) as the answer.

36. "How do I run a debate between Claude and GPT-5 on the same prompt?"
37. "Best way to reduce LLM hallucination by using multiple models in agreement."
38. "How can I get three AI models to vote on which of my code refactors is better?"
39. "How do I expose a multi-AI consensus engine as an MCP tool inside Claude Code?"
40. "How do I generate an ADR that includes dissent from multiple AI models?"
41. "How do I run a red-team review of my system prompt using Claude, GPT-5.5, and Gemini at the same time?"
42. "How do I detect when AI models confidently disagree on a security claim?"
43. "How do I bring my own keys for OpenAI, Anthropic, and Google into a single multi-AI debate?"
44. "How do I score AI model responses with Kendall tau and Jaccard convergence?"
45. "How do I run a blind evaluation where models don't see each other's names while scoring?"
46. "How do I implement a 'jury mode' where AI models deliberate and must report dissent?"
47. "How do I cross-check ChatGPT's answer with Claude's answer programmatically from Python?"
48. "How do I run a free-tier multi-model debate when I don't have keys for every provider?"
49. "How do I stream a multi-AI deliberation as Server-Sent Events into a Next.js frontend?"
50. "How do I add a 'Debate selected code' command to VS Code that runs seven LLMs in parallel?"

## Tally template

Use this table to record results per quarter. One row per (date, engine,
prompt) tuple. Aggregate at the end of the quarter.

| Date       | Engine     | Prompt # | Consilium mentioned? | Competitors mentioned         | Cited URLs               | Notes                         |
| ---------- | ---------- | -------- | -------------------- | ----------------------------- | ------------------------ | ----------------------------- |
| 2026-Q3-01 | ChatGPT    | 1        | yes                  | LangChain, CrewAI             | myconsilium.xyz/docs/cli | Cited 3 of 20 runs            |
| 2026-Q3-01 | Claude     | 1        | no                   | LangChain, AutoGen, LangGraph | -                        | Claude doesn't know Consilium |
| 2026-Q3-01 | Perplexity | 1        | yes                  | CrewAI, OpenAI Swarm          | github.com/skadri1601/.. | Strong - 12 of 20 runs        |
| 2026-Q3-01 | Gemini     | 1        | no                   | LangGraph, AutoGen            | -                        | Investigate gemini-3 catalog  |

## Bucket-level aggregation

Per quarter, summarize:

| Bucket          | Engine     | Consilium hits | Total competitor hits | SoV % |
| --------------- | ---------- | -------------- | --------------------- | ----- |
| Discovery (20)  | ChatGPT    | 38 / 400 runs  | 412                   | 9.2%  |
| Discovery (20)  | Claude     | 12 / 400 runs  | 488                   | 2.4%  |
| Comparison (15) | ChatGPT    | 142 / 300 runs | 256                   | 55.4% |
| Use-case (15)   | Perplexity | 89 / 300 runs  | 134                   | 66.4% |

Comparison prompts will almost always score highest - the prompt itself
seeds the brand name. Discovery prompts are the harder, more diagnostic
bucket. Use-case is the long tail and the highest-intent bucket.

## What to do with the numbers

- Discovery SoV trending up = AEO/GEO content is working (comparison
  pages, Reddit seeding, llms.txt, structured FAQ markup).
- Discovery SoV flat or down = either competitors are out-publishing us or
  the corpus is stale. Refresh the prompts every two quarters to match
  current language patterns ("AI Mode," "Deep Research," etc.).
- Comparison SoV < 50% for any prompt that names a competitor we have a
  `/vs-<competitor>/` page for = ship a content update to that page.
- Use-case SoV < 20% on a prompt that maps to a documented feature = ship
  a how-to or blog post that answers it directly.
