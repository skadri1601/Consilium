# Building Consilium: The Multi-LLM Debate Platform for Golden Prompts

Multi-model consensus represents Consilium's most defensible competitive advantage—Amazon Kiro locks users into Claude-only, Cursor offers model choice but no orchestration, and **45% of developers cite "almost right" AI code as their #1 frustration**. A platform that debates prompts across GPT-4o-mini, Claude Haiku, and Gemini Flash before synthesis could capture the emerging market for structured AI coding preparation. The technical path is clear: LangGraph for orchestration, SSE for streaming, 3 agents with 2 debate rounds as the optimal starting configuration. Realistic MVP timeline: **6-8 weeks** for a solo founder using AI tools.

---

## The competitive landscape reveals a clear positioning gap

Amazon Kiro launched with spec-driven development—generating requirements, technical designs, and task lists automatically. But its architecture creates the vulnerability Consilium should exploit: **Kiro is Claude-only with no bring-your-own-key option**, while Cursor offers model flexibility without orchestration. Neither provides the multi-model consensus that research shows reduces hallucinations and improves code quality.

**Kiro's spec-driven workflow operates in three stages**: user provides natural language prompt → Kiro generates user stories with EARS notation acceptance criteria → creates technical designs with TypeScript interfaces and database schemas → outputs sequenced implementation tasks. The output lives in `.kiro/specs/` folders containing `requirements.md`, `design.md`, and `tasks.md`. Developer feedback reveals consistent problems: code bloat (1,500+ lines for 200-line tasks), frequent context loss, and the tool "behaving like an overeager junior developer."

**Cursor's Plan Mode** takes a different approach—press Shift+Tab, and the agent researches your codebase, asks clarifying questions, then creates an editable Markdown plan. But plans and execution remain separate, requiring explicit "build from plan" actions. Background Agents run in isolated VMs and can work in parallel, but there's no native spec generation or multi-model synthesis.

**GitHub Copilot Workspace was discontinued May 2025**, leaving structured planning features orphaned. The replacement Copilot Coding Agent focuses on issue-to-PR automation within GitHub's ecosystem, not prompt optimization.

| Feature | Kiro | Cursor | Consilium Opportunity |
|---------|------|--------|----------------------|
| Multi-model orchestration | ❌ Claude only | ✅ User choice, no orchestration | ✅ **Debate-based synthesis** |
| Spec generation | ✅ Native | ⚠️ Manual prompting | ✅ **Automated Golden Prompts** |
| Output format | Markdown specs | Markdown plans | ✅ **Cursor/Copilot-optimized prompts** |
| AWS/Platform lock-in | Minimal but Anthropic-locked | None | ✅ **Platform agnostic** |
| Pricing | $19/mo (1,000 interactions) | $20/mo | $19/mo (50 sessions) |

---

## Developer pain points validate the Golden Prompt concept strongly

Stack Overflow's 2025 survey found **66% of developers spend more time fixing AI-generated code than writing it themselves**. The "productivity tax" is real: AI tools generate plausible-looking code that requires extensive debugging. Developer forums reveal consistent frustrations:

> "I've been testing Cursor for over a month and consistently run into issues where even basic functionality requires excessive prompting and still fails. Building a simple popup form has taken more than 8 hours and 10+ prompts."

> "The most frustrating part is fighting against context limitations and getting incomplete solutions."

**The preparation step is already valued by sophisticated developers.** MIT Technology Review profiled a CTO who built a 100,000-line platform using AI by starting "with an extended conversation with the model to develop a detailed plan for what to build and how." Products like ChatPRD already export specs "formatted perfectly for Cursor, Replit, and Lovable." The market signal: developers who invest in prompt preparation get dramatically better results.

Multi-model approaches show promising results in research. MIT/Google Brain research demonstrated multi-agent debate significantly outperforms single-model approaches on arithmetic, factual accuracy, and reducing hallucinations. AI Counsel—an open-source multi-model debate tool—shows the pattern working: 3 participants, 3 debate rounds, convergence with 0.82-0.95 confidence scores.

The gap Consilium fills: **no tool bridges planning → multi-model optimization → Cursor/Copilot-ready prompts**. ChatPRD targets PMs, not developers. AI Counsel proves the debate pattern but doesn't output prompts. Consilium can own "Golden Prompt generation through debate."

---

## LangGraph architecture enables production multi-agent debate

LangGraph is the clear choice over raw LangChain for this use case. Companies including LinkedIn (SQL recruiting bot), Uber (code migration agents), Replit (coding copilot), and Klarna (80% reduction in customer resolution time) run LangGraph in production. The graph-based architecture supports cycles, loops, and branching that chain-based LangChain cannot.

**Optimal debate configuration based on research:**

- **3 agents minimum** (computational cost tradeoff—diminishing returns after 4-5)
- **2 debate rounds** as baseline (performance continues improving through 4, but cost multiplies)
- **Meta-model synthesis** using a premium model (Claude Sonnet or GPT-4o) to aggregate

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI + LangGraph                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ GPT-4o-mini │  │ Claude Haiku│  │ Gemini Flash│  Round 1 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         └────────────────┼────────────────┘                  │
│                          ▼ Share & Critique                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Refined A   │  │ Refined B   │  │ Refined C   │  Round 2 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         └────────────────┼────────────────┘                  │
│                          ▼                                   │
│              ┌─────────────────────┐                         │
│              │ Claude Sonnet/GPT-4o│  Synthesis              │
│              │  (Golden Prompt)    │                         │
│              └─────────────────────┘                         │
└─────────────────────────────────────────────────────────────┘
```

**State management pattern:**

```python
from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages

class DebateState(TypedDict):
    topic: str
    round_number: int
    agent_responses: dict[str, list[str]]  # agent_id -> responses per round
    critiques: dict[str, str]
    synthesis_context: str
    golden_prompt: str | None
    error_count: int
```

**Error handling must include circuit breakers** to prevent runaway loops—set `max_steps` to 3 retries, implement exponential backoff with `RetryPolicy(max_attempts=3, initial_interval=1.0)`, and track error counts in state.

---

## Technical architecture recommendations prioritize simplicity

**Streaming: Use Server-Sent Events over WebSockets.** SSE is the de facto standard for LLM streaming (used by OpenAI, Anthropic), works through standard HTTP infrastructure, includes auto-reconnect, and handles the unidirectional server→client pattern that token streaming requires. Reserve WebSockets only if you add collaborative features later.

**Queue pattern: BullMQ on Redis for long-running debate tasks.** Configure jobs with 5-minute timeouts, exponential backoff for API rate limits, and progress tracking via `job.updateProgress()` that broadcasts to SSE clients. Each agent inference becomes a child job of the parent debate session.

**Database schema for Neon PostgreSQL:**

```sql
CREATE TABLE debate_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    topic TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE debate_rounds (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES debate_sessions(id),
    round_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE agent_messages (
    id UUID PRIMARY KEY,
    round_id UUID REFERENCES debate_rounds(id),
    agent_id VARCHAR(50),
    content TEXT NOT NULL,
    model_used VARCHAR(100),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    latency_ms INTEGER
);
```

**Caching strategy: Implement semantic caching from day one.** Traditional exact-match caching has ~10-30% hit rates for debates (unique contexts), but semantic caching via vector similarity can improve this significantly. Use Redis with pgvector embeddings—check cache before each LLM call, store responses with topic embeddings.

**NestJS + Python integration: gRPC for performance, but REST is acceptable.** gRPC offers strong typing via Protocol Buffers and native streaming support, but adds setup complexity. For an MVP, REST calls from NestJS to FastAPI workers are simpler and sufficient. Migrate to gRPC when you need the performance gains.

---

## Phased development plan with realistic timelines

**Phase 1: Concierge MVP (Weeks 1-2)**
- Build landing page with waitlist
- Manually run debates via terminal/notebook for first 10-20 users
- Collect feedback on prompt quality, output format preferences
- Validate pricing tolerance with "founding member" offers

**Phase 2: Technical MVP (Weeks 3-6)**
- Core LangGraph debate workflow (3 agents, 2 rounds)
- FastAPI service for agent orchestration
- Basic Next.js frontend with SSE streaming
- Neon PostgreSQL for session storage
- Single-user flow (no auth initially)

**Phase 3: Launch-Ready (Weeks 7-8)**
- Authentication (Clerk or NextAuth)
- Stripe integration for subscriptions
- Rate limiting and usage tracking
- Basic dashboard showing debate history
- Railway deployment

**Features to defer to v2:**
- Background agent execution
- Custom agent personas/prompts
- Team/workspace features
- VS Code extension
- Direct Cursor integration
- Advanced analytics

**Testing strategy for AI agents:** Focus on golden path integration tests over unit tests. Create 10-15 canonical test cases with expected output quality (not exact matches). Use LangSmith or Langfuse for observability from day one—you need visibility into agent behavior, latency per node, and token costs per session.

---

## Cost optimization makes the business model viable

**Per-session cost estimates using the debate architecture:**

| Component | Model | Tokens (est.) | Cost |
|-----------|-------|---------------|------|
| Agent 1 (GPT-4o-mini) | Input + Output | ~2,000 | $0.003 |
| Agent 2 (Claude Haiku) | Input + Output | ~2,000 | $0.003 |
| Agent 3 (Gemini Flash) | Input + Output | ~2,000 | ~$0.002 |
| Round 2 (3 agents) | | ~4,000 | ~$0.008 |
| Synthesis (Claude Sonnet) | Input + Output | ~3,000 | ~$0.06 |
| **Total per session** | | | **~$0.08-0.12** |

At $19/month for 50 sessions, cost per session is $0.38—leaving **~70% gross margin** even before caching. Implement the "LLM cascade" pattern: start with cheap models, escalate only when quality thresholds aren't met. Research shows this achieves 94% cost reduction while maintaining quality.

**Caching reduces costs further.** Expect 20-30% cache hit rate for similar debate topics. Store successful Golden Prompts and serve from cache when semantic similarity exceeds threshold (0.85+).

---

## Differentiation from Kiro centers on flexibility and output format

Kiro's strengths to acknowledge: spec-driven development creates documentation automatically, agent hooks enable proactive automation, and the structured workflow appeals to teams needing institutional memory.

**Where Consilium wins:**

1. **Multi-model consensus vs. Claude monoculture.** Kiro users are locked into Anthropic pricing and capabilities. Consilium's debate produces demonstrably better results through cross-model validation.

2. **Output format optimized for existing tools.** Kiro generates specs for itself. Consilium generates Golden Prompts designed to paste into Cursor, Copilot, or any AI coding tool—complementary, not competitive.

3. **Transparent pricing without "interaction" ambiguity.** Kiro's credit system is opaque. Consilium's session-based pricing is predictable.

4. **No platform lock-in.** Kiro requires their IDE. Consilium is web-first, outputs copy-pasteable prompts.

**Messaging position:** "Consilium prepares the perfect prompt. Your coding AI executes it." Emphasize enhancement over replacement.

---

## Validation experiments to run before full build

**Experiment 1: Manual debate service (Week 1)**
- Offer free "Golden Prompt" generation via a Typeform → manual process → email delivery
- Target: 20 developers complete the flow
- Measure: Did they use the prompt? Did it improve their results?
- Cost: Your time only

**Experiment 2: Landing page with pricing (Week 1)**
- A/B test Free/Plus/Pro tiers vs. single Pro tier
- Track: Which tier gets most interest? Do prices cause friction?
- Use Stripe "payment links" to gauge willingness to pay

**Experiment 3: Reddit/Twitter content (Weeks 1-3)**
- Post "I'm building a multi-AI debate tool for coding prompts—what would you want?" on r/LocalLLaMA, r/webdev
- Share debate output examples as content
- Measure: Engagement, DMs, waitlist signups

**Kill criteria:** If <50 waitlist signups after 2 weeks of content, revisit positioning. If manual users report no improvement from Golden Prompts, revisit the core value prop.

---

## Launch strategy maximizes early traction through community building

**Pre-launch (8-12 weeks before):**
- Start building in public immediately on Twitter/X—3x weekly updates
- Engage in ProductHunt community (required for featuring)
- Create `.cursorrules` templates and prompt guides as free content
- Build email list via "Coming Soon" page

**ProductHunt launch:**
- Target Tuesday-Thursday, 12:01 AM Pacific
- Prepare demo video showing debate in action → Golden Prompt → Cursor success
- Email waitlist single CTA: "Upvote & comment"
- Expected results: 5,000-40,000 sessions, 200-500 signups from front page

**Reddit strategy:**
- r/LocalLLaMA (594K+): Best for multi-model discussion
- r/SideProject (131K): Encouraged self-promotion
- r/webdev (3.1M): Large audience, careful with promo rules
- Content format: Educational flowcharts, technical comparisons, "Show HN" style

**Critical rule:** Developers hate marketing speak. Be technical, specific, and transparent. "I'm the founder, here's what I built, here's how" works. "Revolutionary AI-powered platform" gets downvoted.

---

## Key decisions and next steps

**Architecture decisions (recommended):**
- LangGraph over raw LangChain ✅
- SSE over WebSockets for MVP ✅
- BullMQ for job queuing ✅
- PostgreSQL with JSONB over specialized DBs ✅
- REST over gRPC for MVP (migrate later if needed) ✅

**What to build first:** Backend agents → streaming infrastructure → basic frontend → auth/payments. The core differentiator is the debate quality—prove that works before polishing UI.

**Realistic timeline:** MVP in 6-8 weeks, first paying customer in 10-14 weeks, ProductHunt launch at week 12-16.

**Budget:** $50-200/month for API costs during MVP. Scale costs proportionally with users.

The market signal is clear: developers want better AI coding results, current tools leave a preparation gap, and multi-model approaches improve quality. Consilium's positioning as the "prompt preparation layer" that enhances rather than replaces existing tools avoids direct competition with Cursor and Kiro while capturing underserved demand. Execute on the technical architecture outlined here, validate with manual testing first, and launch with building-in-public momentum.