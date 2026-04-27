# Building Consilium: The Multi-LLM Debate Platform for Golden Prompts

Multi-model consensus represents Consilium's most defensible competitive advantage—Amazon Kiro locks users into Claude-only, Cursor offers model choice but no orchestration, and **45% of developers cite "almost right" AI code as their #1 frustration**. A platform that debates prompts across multiple LLMs with **tiered model access** could capture the emerging market for structured AI coding preparation. The technical path is clear: LangGraph for orchestration, SSE for streaming, 3 agents with 2 debate rounds as the optimal starting configuration. Realistic MVP timeline: **6-8 weeks** for a solo founder using AI tools.

---

## The competitive landscape reveals a clear positioning gap

Amazon Kiro launched with spec-driven development—generating requirements, technical designs, and task lists automatically. But its architecture creates the vulnerability Consilium should exploit: **Kiro is Claude-only with no bring-your-own-key option**, while Cursor offers model flexibility without orchestration. Neither provides the multi-model consensus that research shows reduces hallucinations and improves code quality.

**Kiro's spec-driven workflow operates in three stages**: user provides natural language prompt → Kiro generates user stories with EARS notation acceptance criteria → creates technical designs with TypeScript interfaces and database schemas → outputs sequenced implementation tasks. The output lives in `.kiro/specs/` folders containing `requirements.md`, `design.md`, and `tasks.md`. Developer feedback reveals consistent problems: code bloat (1,500+ lines for 200-line tasks), frequent context loss, and the tool "behaving like an overeager junior developer."

**Cursor's Plan Mode** takes a different approach—press Shift+Tab, and the agent researches your codebase, asks clarifying questions, then creates an editable Markdown plan. But plans and execution remain separate, requiring explicit "build from plan" actions. Background Agents run in isolated VMs and can work in parallel, but there's no native spec generation or multi-model synthesis.

**GitHub Copilot Workspace was discontinued May 2025**, leaving structured planning features orphaned. The replacement Copilot Coding Agent focuses on issue-to-PR automation within GitHub's ecosystem, not prompt optimization.

### Competitive Positioning with Model Access Tiers

| Feature | Kiro | Cursor | Consilium (Launch Strategy) |
|---------|------|--------|------------------------------|
| Multi-model orchestration | ❌ Claude only | ✅ User choice, no orchestration | ✅ **Tiered model access + debate** |
| Model flexibility | ❌ Locked to Claude | ✅ Any model, no debate | ✅ **Free to Max: single → premium models** |
| Spec generation | ✅ Native | ⚠️ Manual prompting | ✅ **Automated Golden Prompts** |
| Output format | Markdown specs | Markdown plans | ✅ **Cursor/Copilot-optimized prompts** |
| Pricing transparency | ⚠️ Credit system | Fixed $20/mo | ✅ **Clear tier-based pricing** |
| Platform lock-in | Anthropic + AWS | None | ✅ **Platform agnostic** |

**Consilium's unique differentiation:** Not just session limits, but **model access tiers** that create natural upgrade paths based on quality needs, not just volume.

---

## Developer pain points validate the Golden Prompt concept strongly

Stack Overflow's 2025 survey found **66% of developers spend more time fixing AI-generated code than writing it themselves**. The "productivity tax" is real: AI tools generate plausible-looking code that requires extensive debugging. Developer forums reveal consistent frustrations:

> "I've been testing Cursor for over a month and consistently run into issues where even basic functionality requires excessive prompting and still fails. Building a simple popup form has taken more than 8 hours and 10+ prompts."

> "The most frustrating part is fighting against context limitations and getting incomplete solutions."

**The preparation step is already valued by sophisticated developers.** MIT Technology Review profiled a CTO who built a 100,000-line platform using AI by starting "with an extended conversation with the model to develop a detailed plan for what to build and how." Products like ChatPRD already export specs "formatted perfectly for Cursor, Replit, and Lovable." The market signal: developers who invest in prompt preparation get dramatically better results.

Multi-model approaches show promising results in research. MIT/Google Brain research demonstrated multi-agent debate significantly outperforms single-model approaches on arithmetic, factual accuracy, and reducing hallucinations. AI Counsel—an open-source multi-model debate tool—shows the pattern working: 3 participants, 3 debate rounds, convergence with 0.82-0.95 confidence scores.

The gap Consilium fills: **no tool bridges planning → multi-model optimization → Cursor/Copilot-ready prompts** with tiered model access. ChatPRD targets PMs, not developers. AI Counsel proves the debate pattern but doesn't output prompts. Consilium can own "Golden Prompt generation through tiered model debates."

---

## Pricing & Monetization Strategy: Model Access Tiers

### The Core Innovation: Quality Ladders, Not Just Volume

**Traditional SaaS:** Free (10 sessions) → Plus (50 sessions) → Pro (200 sessions)  
**Problem:** Same quality, just different volume. No motivation beyond "I ran out."

**Consilium's Strategy:** Free (single model) → Plus (budget debate) → Pro (premium debate) → Max (cutting-edge + API)  
**Advantage:** Each tier unlocks better MODEL QUALITY. Users upgrade for better results, not just more sessions.

### Launch Tier Structure (4 Tiers)

#### **Free** - "The Proof of Concept"
**Price:** $0/month  
**Sessions:** 10/month  
**Model Access:** **Single model only (NO multi-agent debate)**

**Available Models (choose 1):**
- GPT-4o-mini
- Claude Haiku
- Gemini Flash

**Features:**
- Basic Golden Prompt generation (single model output)
- No debate, no synthesis
- Community support only
- Export to Markdown

**Cost per session:** ~$0.01-0.02  
**Purpose:** Prove the concept, show value, create upgrade desire

**UI Treatment:**
```
"Free Tier: Single model, no debate
Want multi-agent debate? Upgrade to Plus!"
```

---

#### **Plus** - "The Budget Debate Tier" 
**Price:** $19/month  
**Sessions:** 50/month  
**Model Access:** **3 budget models + budget synthesis**

**Debate Agents (select 3):**
- ✅ GPT-4o-mini ($0.15/$0.60 per 1M tokens)
- ✅ Claude Haiku ($0.25/$1.25 per 1M tokens)
- ✅ Gemini Flash ($0.075/$0.30 per 1M tokens)
- ✅ Groq Llama 3.1 70B ($0.59/$0.79 per 1M tokens) - *Optional/Experimental*

**Synthesis Model:**
- GPT-4o-mini OR Claude Haiku (budget tier only)

**Features:**
- 3-agent multi-model debate (2 rounds)
- Budget model synthesis
- Email support (48hr response)
- All export formats (Markdown, `.cursorrules`, Gist)
- Debate history

**Cost per session:** ~$0.05-0.08  
**Revenue:** $19/month  
**Margin:** $19 - (50 × $0.07) = **$15.50 profit (81% margin)**

**UI Treatment:**
```
"Plus Tier: Multi-agent debate with budget models
Want premium models? Upgrade to Pro!"
```

---

#### **Pro** - "The Premium Quality Tier"
**Price:** $49/month  
**Sessions:** 100/month (reduced from 200 to manage costs)  
**Model Access:** **Budget + Premium models + premium synthesis**

**Debate Agents (select 3 from ANY):**

**Budget Options:**
- GPT-4o-mini, Claude Haiku, Gemini Flash, Groq Llama

**Premium Options:**
- ✅ Claude Sonnet 4.5 ($3/$15 per 1M tokens)
- ✅ GPT-4o ($2.50/$10 per 1M tokens)
- ✅ Gemini Pro 1.5 ($1.25/$5 per 1M tokens)
- ✅ o1-mini ($3/$12 per 1M tokens)

**Synthesis Model:**
- Claude Sonnet 4.5 OR GPT-4o (premium synthesis)

**Features:**
- 3-agent debate with budget OR premium models
- Premium synthesis
- Priority email support (24hr response)
- Live chat support
- All export formats
- Unlimited debate history
- Custom agent personas (Beta)

**Cost per session:**
- All premium: ~$0.15-0.25
- Mixed (budget + premium): ~$0.10-0.15

**Revenue:** $49/month  
**Margin (mixed usage):** $49 - (100 × $0.15) = **$34 profit (69% margin)**

**UI Treatment:**
```
"Pro Tier: Premium models unlocked
Claude Sonnet, GPT-4o, Gemini Pro available"
```

---

#### **Max** - "The Power User & API Tier"
**Price:** $99/month  
**Sessions:** 200/month  
**Model Access:** **All models + cutting-edge + API access**

**Everything in Pro, PLUS:**

**Cutting-Edge Models:**
- ✅ Claude Opus 4 ($15/$75 per 1M tokens) - *when available*
- ✅ o1-preview ($15/$60 per 1M tokens)
- ✅ Gemini Pro 2.0 (when available)

**Advanced Features:**
- ✅ **API Access:** 1,000 API calls/month for programmatic access
- ✅ **5-agent debates** (vs 3 agents in lower tiers)
- ✅ **Custom model routing:** Auto-select best model per task type
- ✅ **Priority synthesis:** Opus or o1-preview synthesis
- ✅ **Dedicated support:** Priority Slack/Discord channel

**Cost per session:** ~$0.20-0.30 (premium-heavy usage)  
**Revenue:** $99/month  
**Margin:** $99 - (200 × $0.25) = **$49 profit (49% margin)**

**UI Treatment:**
```
"Max Tier: Cutting-edge models + API
Opus, o1-preview, API access unlocked"
```

---

#### **Team** - "Future Enhancement" (Post-Launch)
**Price:** $199/month  
**Seats:** 5 included (+$30/additional seat)  
**Sessions:** 500 shared pool  
**Model Access:** Everything in Max + team features

**Team Features:**
- Shared debate history
- Team memory (architectural preferences)
- Admin dashboard
- Usage analytics per member
- Client approval workflows
- PDF exports with branding

**Launch Timeline:** After reaching 100-200 paying individual users (3-6 months post-launch)

---

#### **Enterprise** - "Future Enhancement" (Post-Launch)
**Price:** Custom (starting $999/month)  
**Everything in Team, PLUS:**
- Unlimited sessions
- Unlimited seats
- Self-hosted deployment option
- Custom SLA (99.9% uptime)
- SSO/SAML
- Dedicated account manager
- Custom model fine-tuning
- White-label option

**Launch Timeline:** After proving Team tier demand (6-12 months post-launch)

---

## Cost Optimization with Model Access Tiers

### Per-Session Cost Breakdown by Tier

#### Free Tier (Single Model, No Debate)
```
Single model inference: ~2,000 tokens
Model: GPT-4o-mini or Haiku
Cost: $0.01-0.02 per session
```

#### Plus Tier (Budget Models Debate)
```
Round 1 (3 agents):
- GPT-4o-mini: 2K tokens × $0.0015 = $0.003
- Claude Haiku: 2K tokens × $0.0015 = $0.003
- Gemini Flash: 2K tokens × $0.001 = $0.002

Round 2 (Refinement):
- 3 agents × ~1.5K tokens = ~$0.006

Synthesis (Budget):
- GPT-4o-mini or Haiku: 3K tokens × $0.002 = $0.006

Total: ~$0.05-0.08 per session
```

#### Pro Tier (Premium Models Debate)
```
Round 1 (3 agents, all premium):
- Claude Sonnet: 2K tokens × $0.015 = $0.03
- GPT-4o: 2K tokens × $0.0125 = $0.025
- Gemini Pro: 2K tokens × $0.00625 = $0.0125

Round 2 (Refinement):
- 3 agents × ~1.5K tokens = ~$0.05

Synthesis (Premium):
- Claude Sonnet: 3K tokens × $0.045 = $0.135

Total: ~$0.15-0.25 per session (all premium)
Total: ~$0.10-0.15 per session (mixed budget/premium)
```

#### Max Tier (Cutting-Edge Models)
```
Round 1 (5 agents, cutting-edge):
- Claude Opus: 2K tokens × $0.045 = $0.09
- o1-preview: 2K tokens × $0.0375 = $0.075
- GPT-4o: 2K tokens × $0.0125 = $0.025
- Claude Sonnet: 2K tokens × $0.015 = $0.03
- Gemini Pro: 2K tokens × $0.00625 = $0.0125

Round 2 (Refinement):
- 5 agents × ~1.5K tokens = ~$0.12

Synthesis (Opus or o1-preview):
- Claude Opus: 3K tokens × $0.135 = $0.405

Total: ~$0.20-0.30 per session (typical)
Total: ~$0.40-0.50 per session (Opus-heavy)
```

### Revenue & Margin Analysis (25-35% Target Profit)

#### Scenario: 100 Paying Users at Launch

| Tier | Users | Price | Sessions | Cost/Session | Total Cost | Revenue | Gross Profit | Margin |
|------|-------|-------|----------|--------------|------------|---------|--------------|--------|
| Free | 300 | $0 | 10 | $0.02 | $600 | $0 | -$600 | N/A |
| Plus | 50 | $19 | 50 | $0.07 | $175 | $950 | $775 | 81% |
| Pro | 35 | $49 | 100 | $0.15 | $525 | $1,715 | $1,190 | 69% |
| Max | 15 | $99 | 200 | $0.25 | $750 | $1,485 | $735 | 49% |
| **Totals** | **100** | | | | **$2,050** | **$4,150** | **$2,100** | **51%** |

**Infrastructure Costs:**
- Railway (Backend + AI Workers): $20
- Neon PostgreSQL: $19
- Upstash Redis: $10
- Vercel (Frontend): $0
- **Total Infra:** $49

**Net Profit:**
- Gross Profit: $2,100
- Infrastructure: -$49
- **Net Profit: $2,051 (49% net margin)**

**Applying 25-35% Target:**
- Revenue: $4,150
- Target Profit (30%): $1,245
- **Reinvestment Budget:** $2,905 (70% of revenue)

**Reinvestment Allocation:**
```
LLM API Costs: $2,050
Infrastructure: $49
Remaining: $806

Use $800 for:
- Observability (LangSmith/Langfuse): $50/mo
- Monitoring (Sentry): $26/mo
- Better infrastructure (Railway Pro, Neon Scale)
- Marketing (ProductHunt, content)
- Reserve buffer
```

**This strategy achieves your 25-35% profit target while maintaining high service quality.**

---

## LangGraph architecture enables production multi-agent debate

LangGraph is the clear choice over raw LangChain for this use case. Companies including LinkedIn (SQL recruiting bot), Uber (code migration agents), Replit (coding copilot), and Klarna (80% reduction in customer resolution time) run LangGraph in production. The graph-based architecture supports cycles, loops, and branching that chain-based LangChain cannot.

**Optimal debate configuration based on research:**

- **3 agents minimum** for Plus/Pro (computational cost tradeoff)
- **5 agents maximum** for Max tier (diminishing returns after 5)
- **2 debate rounds** as baseline (performance continues improving through 4, but cost multiplies)
- **Meta-model synthesis** using tier-appropriate model (budget for Plus, premium for Pro/Max)

### Multi-Tier Debate Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Consilium LangGraph Workflow                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  FREE TIER (Single Model - No Debate)                        │
│  ┌─────────────┐                                             │
│  │ GPT-4o-mini │ → Direct Output                             │
│  │  OR Haiku   │                                             │
│  └─────────────┘                                             │
│                                                               │
│  PLUS TIER (3 Budget Models + Budget Synthesis)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ GPT-4o-mini │  │ Claude Haiku│  │ Gemini Flash│  Round 1 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         └────────────────┼────────────────┘                  │
│                          ▼ Critique                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Refined A   │  │ Refined B   │  │ Refined C   │  Round 2 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         └────────────────┼────────────────┘                  │
│                          ▼                                   │
│              ┌─────────────────────┐                         │
│              │ GPT-4o-mini/Haiku   │  Budget Synthesis       │
│              │  (Golden Prompt)    │                         │
│              └─────────────────────┘                         │
│                                                               │
│  PRO TIER (3 Premium Models + Premium Synthesis)             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │Claude Sonnet│  │   GPT-4o    │  │ Gemini Pro  │  Round 1 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         └────────────────┼────────────────┘                  │
│                          ▼ Critique                          │
│                     [Round 2 Refinement]                     │
│                          ▼                                   │
│              ┌─────────────────────┐                         │
│              │Claude Sonnet/GPT-4o │  Premium Synthesis      │
│              │  (Golden Prompt)    │                         │
│              └─────────────────────┘                         │
│                                                               │
│  MAX TIER (5 Cutting-Edge + Opus/o1 Synthesis)               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │  Opus  │ │o1-prev │ │ GPT-4o │ │ Sonnet │ │Gem Pro │ R1  │
│  └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘ └────┬───┘    │
│       └────────────────┼─────────────────────────┘          │
│                        ▼ Advanced Critique                   │
│                   [Round 2 Refinement]                       │
│                        ▼                                     │
│            ┌─────────────────────────┐                       │
│            │ Claude Opus/o1-preview  │  Elite Synthesis      │
│            │   (Golden Prompt)       │                       │
│            └─────────────────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

**State management pattern:**

```python
from typing import TypedDict, Annotated, Literal
from langgraph.graph.message import add_messages

class DebateState(TypedDict):
    topic: str
    user_tier: Literal["FREE", "PLUS", "PRO", "MAX"]
    round_number: int
    agent_responses: dict[str, list[str]]
    critiques: dict[str, str]
    synthesis_context: str
    golden_prompt: str | None
    error_count: int
    models_used: list[str]  # Track which models were used
    total_cost: float  # Track session cost
```

**Tier-based agent selection:**

```python
TIER_CONFIG = {
    "FREE": {
        "agents": 1,
        "models": ["gpt-4o-mini", "claude-haiku", "gemini-flash"],
        "synthesis": None,
        "debate_rounds": 0,
    },
    "PLUS": {
        "agents": 3,
        "models": ["gpt-4o-mini", "claude-haiku", "gemini-flash", "groq-llama"],
        "synthesis": ["gpt-4o-mini", "claude-haiku"],
        "debate_rounds": 2,
    },
    "PRO": {
        "agents": 3,
        "models": [
            "gpt-4o-mini", "claude-haiku", "gemini-flash",  # Budget
            "claude-sonnet-4.5", "gpt-4o", "gemini-pro-1.5", "o1-mini"  # Premium
        ],
        "synthesis": ["claude-sonnet-4.5", "gpt-4o"],
        "debate_rounds": 2,
    },
    "MAX": {
        "agents": 5,
        "models": [
            # All Pro models +
            "claude-opus-4", "o1-preview", "gemini-pro-2.0"
        ],
        "synthesis": ["claude-opus-4", "o1-preview", "claude-sonnet-4.5"],
        "debate_rounds": 2,
        "custom_routing": True,
    },
}
```

**Error handling must include circuit breakers** to prevent runaway loops—set `max_steps` to 3 retries, implement exponential backoff with `RetryPolicy(max_attempts=3, initial_interval=1.0)`, and track error counts in state.

---

## Technical architecture recommendations prioritize simplicity

**Streaming: Use Server-Sent Events over WebSockets.** SSE is the de facto standard for LLM streaming (used by OpenAI, Anthropic), works through standard HTTP infrastructure, includes auto-reconnect, and handles the unidirectional server→client pattern that token streaming requires. Reserve WebSockets only if you add collaborative features later.

**Queue pattern: BullMQ on Redis for long-running debate tasks.** Configure jobs with 5-minute timeouts, exponential backoff for API rate limits, and progress tracking via `job.updateProgress()` that broadcasts to SSE clients. Each agent inference becomes a child job of the parent debate session.

**Database schema for Neon PostgreSQL:**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    tier VARCHAR(20) DEFAULT 'FREE',
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE debate_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    topic TEXT NOT NULL,
    tier VARCHAR(20) NOT NULL,  -- Track tier at time of debate
    status VARCHAR(20) DEFAULT 'pending',
    models_used JSONB DEFAULT '[]',  -- Track which models were used
    total_cost DECIMAL(10, 4) DEFAULT 0,  -- Track session cost
    config JSONB DEFAULT '{}',
    golden_prompt TEXT,
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
    cost DECIMAL(10, 6),  -- Track cost per message
    latency_ms INTEGER
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    tier VARCHAR(20) NOT NULL,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(20),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for usage tracking
CREATE INDEX idx_debates_user_period ON debate_sessions(user_id, created_at);
CREATE INDEX idx_users_tier ON users(tier);
```

**Caching strategy: Implement semantic caching from day one.** Traditional exact-match caching has ~10-30% hit rates for debates (unique contexts), but semantic caching via vector similarity can improve this significantly. Use Redis with pgvector embeddings—check cache before each LLM call, store responses with topic embeddings.

**Rate limiting by tier:**

```typescript
// backend/src/shared/guards/tier-rate-limit.guard.ts
const TIER_LIMITS = {
  FREE: 10,
  PLUS: 50,
  PRO: 100,
  MAX: 200,
};

async function checkTierLimit(userId: string): Promise<boolean> {
  const user = await getUser(userId);
  const usage = await getMonthlyUsage(userId);
  
  const limit = TIER_LIMITS[user.tier];
  if (usage >= limit) {
    throw new HttpException(
      `Monthly limit reached (${limit} sessions). Upgrade to continue.`,
      429
    );
  }
  
  return true;
}
```

**NestJS + Python integration: REST for MVP.** gRPC offers strong typing via Protocol Buffers and native streaming support, but adds setup complexity. For an MVP, REST calls from NestJS to FastAPI workers are simpler and sufficient. Migrate to gRPC when you need the performance gains.

---

## Phased development plan with realistic timelines

### Phase 1: Concierge MVP (Weeks 1-2)
- Build landing page with waitlist
- Show 4-tier pricing table (Free/Plus/Pro/Max)
- Manually run debates via terminal/notebook for first 10-20 users
- Test model access differentiation manually
- Collect feedback on prompt quality, model preferences
- Validate: "Do users value premium models over budget models?"

**Validation Metrics:**
- 50+ waitlist signups
- 10+ manual debate sessions completed
- User feedback on model quality differences

---

### Phase 2: Technical MVP (Weeks 3-6)

**Week 3-4: Core Debate Engine**
- Core LangGraph debate workflow (3 agents, 2 rounds)
- FastAPI service for agent orchestration
- Implement tier-based model routing
- Model cost tracking per session

**Week 5: Frontend + Backend Integration**
- Basic Next.js frontend with SSE streaming
- NestJS API for debate management
- Clerk authentication
- Neon PostgreSQL for session storage
- Tier assignment (manual for MVP - all users get "FREE")

**Week 6: Tier Differentiation**
- Free tier: Single model only (no debate)
- Plus tier: 3 budget models + budget synthesis
- Pro tier: Mixed budget/premium models
- Max tier: All models including cutting-edge

**Features to defer:**
- Stripe integration (manual tier assignment for MVP)
- Model selector UI (auto-select based on tier)
- Custom agent personas

---

### Phase 3: Launch-Ready (Weeks 7-8)

**Week 7: Payments & Subscriptions**
- Stripe Checkout integration
- Tier upgrade/downgrade flows
- Usage tracking per billing cycle
- Stripe webhook handlers

**Week 8: Polish & Deploy**
- Rate limiting by tier
- Usage dashboard showing remaining sessions
- Model access indicator ("🔒 Premium models: Upgrade to Pro")
- Railway deployment (Backend + AI Workers)
- Vercel deployment (Frontend)

**Launch checklist:**
- ✅ 4 tiers functional (Free/Plus/Pro/Max)
- ✅ Model access gates working
- ✅ Stripe payments processing
- ✅ Usage limits enforced
- ✅ Basic analytics dashboard
- ✅ ProductHunt assets ready

---

### Features Deferred to Post-Launch

**v2 Features (Months 2-4):**
- Team tier implementation
- API access for Max users
- Custom agent personas
- VS Code extension
- GitHub repo indexing

**v3 Features (Months 5-8):**
- Enterprise tier
- Self-hosted deployment
- Advanced analytics
- Bring-your-own-API-keys option

---

## Differentiation from Kiro centers on flexibility and tiered access

Kiro's strengths to acknowledge: spec-driven development creates documentation automatically, agent hooks enable proactive automation, and the structured workflow appeals to teams needing institutional memory.

**Where Consilium wins:**

1. **Multi-model consensus vs. Claude monoculture.** Kiro users are locked into Anthropic pricing and capabilities. Consilium offers model choice AND multi-model debate.

2. **Tiered model access creates upgrade paths.** Kiro has one pricing tier. Consilium offers Free → Plus → Pro → Max progression based on model quality needs.

3. **Output format optimized for existing tools.** Kiro generates specs for itself. Consilium generates Golden Prompts designed to paste into Cursor, Copilot, or any AI coding tool.

4. **Transparent tier-based pricing.** Kiro's credit system is opaque. Consilium's session + model access tiers are clear.

5. **No platform lock-in.** Kiro requires their IDE. Consilium is web-first, outputs copy-pasteable prompts.

**Messaging position:** "Consilium prepares the perfect prompt. Your coding AI executes it. Choose your model quality tier."

---

## Validation experiments to run before full build

**Experiment 1: Manual debate service with tier testing (Week 1)**
- Offer free "Golden Prompt" generation via Typeform
- Manually run debates with different model combinations
- Track: Do users notice quality difference between budget vs premium models?
- Measure: Conversion interest when shown pricing tiers

**Experiment 2: Landing page with 4-tier pricing (Week 1)**
- A/B test tier positioning and messaging
- Track: Which tier generates most interest?
- Use Stripe payment links to gauge willingness to pay
- Measure: Click-through rates per tier

**Experiment 3: Model quality comparison (Weeks 1-2)**
- Show same prompt debated by:
  - Single model (Free tier example)
  - 3 budget models (Plus tier example)
  - 3 premium models (Pro tier example)
- Collect feedback: "Which output would you use?"
- Validate: Does premium model quality justify higher pricing?

**Kill criteria:**
- <50 waitlist signups after 2 weeks = revisit positioning
- Users can't distinguish budget vs premium quality = collapse tiers
- <5% willing to pay for Plus tier = pricing too high

---

## Launch strategy maximizes early traction through community building

**Pre-launch (8-12 weeks before):**
- Build in public on Twitter/X—3x weekly updates
- Show model comparison examples
- Create `.cursorrules` templates as free content
- Engage in ProductHunt community
- Build email list with tier preference survey

**ProductHunt launch:**
- Target Tuesday-Thursday, 12:01 AM Pacific
- Demo video: Free → Plus → Pro tier progression
- Emphasize: "Start free, upgrade when you need premium models"
- Email waitlist: "We're live! Claim your free tier"

**Reddit strategy:**
- r/LocalLLaMA (594K+): "I built a multi-model debate tool with tiered access"
- r/SideProject (131K): Show tier comparison examples
- r/webdev (3.1M): Focus on Golden Prompt quality improvements
- **Don't over-promote:** Share technical insights, not sales pitches

**Content angle:** "I tested GPT-4o-mini vs Claude Sonnet for code planning. Here's what I learned."

---

## Key decisions and next steps

**Architecture decisions (recommended):**
- LangGraph over raw LangChain ✅
- SSE over WebSockets for MVP ✅
- BullMQ for job queuing ✅
- PostgreSQL with tier tracking ✅
- REST over gRPC for MVP ✅

**Pricing decisions (confirmed):**
- 4 launch tiers: Free/Plus/Pro/Max ✅
- Model access differentiation (not just sessions) ✅
- Team/Enterprise deferred to post-launch ✅
- 25-35% profit target with 65-75% reinvestment ✅

**What to build first:** 
1. Backend debate engine with tier routing
2. Model cost tracking infrastructure
3. Basic frontend with tier gates
4. Auth + Stripe integration
5. Usage tracking and limits

**Realistic timeline:** MVP in 6-8 weeks, first paying customer in 10-14 weeks, ProductHunt launch at week 12-16.

**Budget:** 
- Pre-launch: $50-100/month (API testing)
- Launch (100 users): $2,100/month LLM costs + $49 infrastructure
- Reinvestment budget: 65-75% of revenue (~$2,900 at 100 users)

---

## Final Strategic Summary

The market signal is clear: developers want better AI coding results, current tools leave a preparation gap, and multi-model approaches improve quality. Consilium's positioning as the "prompt preparation layer with tiered model access" creates:

1. **Natural upgrade paths** based on quality (not just volume)
2. **Cost protection** via tier-appropriate model selection
3. **Competitive moat** through multi-model orchestration
4. **Clear value ladders** that users understand and want

Execute on this technical architecture, validate model quality differences early, and launch with building-in-public momentum. The 25-35% profit margin with 65-75% reinvestment ensures sustainable growth while maintaining service quality.

**Next immediate steps:**
1. Build Concierge MVP landing page with 4-tier pricing
2. Manually test model quality differences with 10-20 users
3. Validate that users perceive value in premium models
4. Begin LangGraph implementation with tier routing
5. Launch in 6-8 weeks