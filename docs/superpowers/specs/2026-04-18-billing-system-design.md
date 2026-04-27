# Billing System Design Spec

**Date:** 2026-04-18
**Branch:** feature/stripe-integration
**Status:** Development only — not merging to prod until Consilium gains traction

## Overview

End-to-end billing system: Stripe subscriptions, weighted token tracking, wallet credits, on-demand usage, per-action cost tracking, usage enforcement, and full audit trail. One API serves all clients (web, CLI, MCP). `STRIPE_ENABLED=false` by default — billing endpoints return mock/free-tier responses when Stripe is not configured.

## Billing model

### Core concepts

**Subscription** and **Wallet** are separate systems that never mix mid-action:

- **Subscription** = weekly token allowance included with the plan. Resets on a rolling 7-day window from sign-up date. No rollover.
- **Wallet** = separate prepaid balance. User tops up independently. Only touched when weekly allowance is fully exhausted.
- **On-demand** = optional auto-charge via Stripe when both weekly allowance AND wallet are empty. User-controlled toggle with monthly spend limit (default $25/mo).

**Usage priority (no splitting — one source per action):**
```
1. Weekly allowance has enough for estimated cost?
   YES → deduct from weekly, done
   NO  → do NOT start action, prompt user to use wallet

2. User confirms wallet (or wallet is active fallback)?
   Wallet has enough?
   YES → deduct from wallet, done
   NO  → check on-demand

3. On-demand enabled and under monthly limit?
   YES → charge Stripe directly, done
   NO  → blocked, show "top up wallet or enable on-demand"
```

**No half-and-half:** If weekly allowance has $1 left but the action costs $1.75, the action is blocked from using the allowance. The full cost comes from the next available source (wallet or on-demand). This prevents us from absorbing the $0.75 difference.

### Weighted tokens

All usage is measured in **weighted tokens**. Model weights normalize cost so our margin stays consistent regardless of which model the user picks.

**Weights (relative to Sonnet = 1x baseline):**

| Model tier | Models | Weight | Effect |
|-----------|--------|--------|--------|
| Free | Llama 3.3/3.1/4 (Groq) | 0 | Don't count against allowance |
| Budget | Gemini Flash, GPT-4o-mini, Haiku 4.5, Grok-2-mini | 0.1x | 10x more usage per token |
| Mid | GPT-4.1, o3-mini | 0.5x | 2x more usage per token |
| Standard | Sonnet 4.6, GPT-4o, Grok-2, Gemini Pro | 1x | Baseline |
| Premium | Opus 4.6 | 5x | Burns 5x faster |

**Example:** A 15K raw token debate on Opus = 75K weighted tokens deducted. Same debate on Gemini Flash = 1.5K weighted tokens.

### Tiers

| Tier | Price | Weekly allowance | Wallet | On-demand |
|------|-------|-----------------|--------|-----------|
| FREE | $0 | 50K weighted tokens (5 debates on free models) | Yes (user can top up) | Yes (with limit) |
| PRO | $29/mo or $290/yr | 500K weighted tokens (~$15/week at Sonnet rates) | Yes | Yes |
| MAX | $99/mo or $990/yr | 2M weighted tokens (~$25/week at Sonnet rates but more headroom) | Yes | Yes |

Billing intervals: MONTHLY and YEARLY (yearly = 2 months free).

**FREE tier special rules:**
- 5 debates/week cap and 20 debates/month cap (released 5 per week) regardless of tokens
- Can use any model (including premium) — this is the "bait" to upgrade
- Wallet and on-demand available for when weekly cap is hit

### Our margins

Weighted tokens normalize cost. Regardless of model mix, our cost per tier stays consistent:

| Tier | Revenue | Our cost/week (100% usage) | Our cost/month | Margin (worst) | Margin (realistic 70%) |
|------|---------|---------------------------|----------------|----------------|----------------------|
| FREE | $0 | $0 (free models) | $0 | Acquisition funnel | — |
| PRO | $29/mo | $3.90 | $16.77 | $12.23 (42%) | $17.26 (60%) |
| MAX | $99/mo | $15.60 | $67.08 | $31.92 (32%) | $52.04 (53%) |

**Wallet/on-demand:** User pays actual compute cost × 1.2 markup. Our cut is always 20%.

**Wallet expiration:** All wallet funds expire 1 year after deposit. FIFO — oldest credits drain first.

### Feature matrix

#### Freemium (FREE) — $0/forever

Purpose: Let people try Consilium, get hooked on multi-model debate.

| Category | What they get |
|----------|--------------|
| Debates | 5/week, 20/month, max 2 models per debate |
| Modes | 3 basic modes (Roundtable, Confidence-Weighted, Structured Debate) |
| Web | Full access to council page, debate history (30 days retention) |
| CLI | Basic `consilium debate` command, no codebase context |
| MCP | No access |
| Models | All models available (free models don't count against allowance) |
| Compute | 50K weighted tokens/week + BYOK for own API keys |
| Wallet | Yes — top up for extra usage beyond weekly limit |
| On-demand | Yes — with monthly spend limit |
| Export | Markdown export only |
| Analytics | Basic debate stats (win/loss per model) |
| Templates | 3 starter templates |
| History | 30 days, no search |
| Support | Community (GitHub Discussions) |

#### PRO — $29/mo or $290/yr

Purpose: Power users and indie devs who use it daily.

| Category | What they get |
|----------|--------------|
| Debates | No debate cap (token-limited only) |
| Modes | All 8 deliberation modes |
| Web | Full dashboard + billing settings + comparison page |
| CLI | Full CLI with codebase context, project scanning, slash commands |
| MCP | Basic MCP access (integrate into your IDE/workflow) |
| Models | All models — 500K weighted tokens/week included |
| Compute | 500K weighted tokens/week (~$15 at Sonnet rates) |
| Wallet | Yes — top up for overages |
| On-demand | Yes — with adjustable monthly spend limit |
| Export | Markdown + JSON export |
| Analytics | Full analytics — diversity scores, quality heatmaps, minority reports |
| Templates | All 8 templates + custom template creation |
| History | Unlimited retention + full-text search |
| Digest | Weekly email digest of debate activity |
| Support | Priority email support |

#### MAX — $99/mo or $990/yr

Purpose: Developers who need trustworthy, verified, cost-optimized deliberation with full transparency.

| Category | What they get |
|----------|--------------|
| Debates | No debate cap |
| Modes | All 8 + early access to new modes |
| Web | Everything in PRO |
| CLI | Everything in PRO + parallel debates, batch mode, file output |
| MCP | Full MCP with streaming, multi-session |
| Models | All models — 2M weighted tokens/week included |
| Compute | 2M weighted tokens/week (~$25 at Sonnet rates but more headroom) |
| Wallet | Yes |
| On-demand | Yes — with adjustable monthly spend limit |
| Export | Markdown + JSON + PDF export |
| Analytics | Everything in PRO + debate replay, cost optimization insights |
| Templates | Everything in PRO + share templates publicly |
| History | Unlimited + API access to history |
| Digest | Weekly + daily digest options |
| RSS | Private RSS feed of your debates |
| API | Direct REST API access for automation |
| Support | Priority support + direct founder access |
| **Conformal safety gate** | Statistical verification layer that catches incorrect consensus — 81.9% of wrong agreements intercepted. Results show "verified" badge when confidence passes calibration threshold. (Wang et al., 2026) |
| **Progressive deepening** | Starts with cheap models, escalates to premium only on disagreement. Saves 80-92% tokens on easy questions — weekly allowance stretches 2-5x further. (iMAD/RouteMoA research) |
| **Disagreement map** | Visual breakdown of exactly where and why models diverged — which specific claims each model disagrees on, with reasoning. No competitor offers this level of transparency. |
| **Debate collapse detection** | Auto-detects when models sycophantically converge on wrong answers through social pressure. Flags false consensus with uncertainty scores before presenting results. (Tang et al., 2026) |
| **Argument graph** | Interactive visualization of the deliberation tree — which arguments survived cross-examination, which were refuted, the chain of reasoning from claim to conclusion. Based on TreeDebater (2025) architecture. |
| **Persistent project memory** | Context carries across sessions. Debates reference past decisions. "We chose X over Y in debate #47 because..." |
| **Decision audit trail** | Searchable history of all deliberation reasoning across sessions. Answer "why did we pick this approach?" with the actual model arguments, votes, and dissent reports. |

### Key upgrade drivers

- FREE to PRO: All 8 modes, CLI codebase context, 10x tokens, MCP access, unlimited history
- PRO to MAX: 4x tokens, verified deliberation (safety gate + collapse detection), disagreement maps, argument graphs, persistent memory, decision audit trail, progressive deepening (tokens stretch 2-5x further), parallel/batch CLI, REST API access

### Research foundations for MAX features

These features are based on cutting-edge research (2025-2026) not yet implemented in any production product:

| Feature | Paper | Key finding |
|---------|-------|-------------|
| Conformal safety gate | Wang et al., "From Debate to Decision" (arXiv 2604.07667, Apr 2026) | Agreement among agents is NOT evidence of correctness. Conformal prediction intercepts 81.9% of incorrect consensus at alpha=0.05 |
| Debate collapse detection | Tang et al., "The Value of Variance" (arXiv 2602.07186, Feb 2026) | 3-level uncertainty quantification (intra-agent, inter-agent, system) detects and prevents sycophantic convergence |
| Progressive deepening | Fan et al., "iMAD" (arXiv 2511.11306, Nov 2025) + Wang et al., "RouteMoA" (arXiv 2601.18130, Jan 2026) | 41-feature classifier skips debate for easy questions (92% token savings). Pre-filtering selects optimal model subset (89.8% cost reduction) |
| Argument graph | "TreeDebater" (arXiv 2505.14886, 2025) | Rehearsal trees + debate flow trees track addressed vs. unaddressed points. Human evaluators preferred 1.5-2.5x over baselines |
| Disagreement map | Zhu et al., "Demystifying Multi-Agent Debate" (arXiv 2601.19921, Jan 2026) | Diversity initialization + calibrated confidence communication improve debate effectiveness. Inter-model divergence is a first-class signal, not noise |
| Memory masking | Tian et al., "MAD-M2" (arXiv 2603.20215, Mar 2026) | Agents selectively forget flawed arguments between rounds, preventing error propagation |
| Capability-weighted aggregation | Zhang et al., "Key Decision-Makers" (arXiv 2511.11040, Nov 2025) | "Truth Last" strategy (strongest model speaks last) improves performance by 22%. Judge must know model capability tiers |

Additional validated research supporting Consilium's core architecture:
- Lang et al., AAAI 2025 (peer-reviewed): Debate enables weaker models to extract trustworthy information from stronger models — validates multi-model deliberation over single-model
- Pappu et al. (arXiv 2602.01011, Feb 2026): Teams exhibit "integrative compromise" — capability-weighted aggregation prevents weak models from dragging down expert reasoning

## 1. Database Schema

All models in `packages/database/prisma/schema.prisma`. Single Neon PostgreSQL database shared by all clients.

### Existing models — modifications

**Subscription** — add fields:
```
billingEmail      String?
billingName       String?
billingInterval   BillingInterval  @default(MONTHLY)
onDemandEnabled   Boolean          @default(false)
onDemandLimitCents Int             @default(2500)   // $25/mo default cap
onDemandSpentCents Int             @default(0)      // resets monthly
weeklyResetDay    DateTime?                          // rolling 7-day anchor from sign-up
```

**Wallet** — add field:
```
// No structural changes, but WalletTransaction gets expiresAt (see below)
```

**New enums:**
```
enum BillingInterval {
  MONTHLY
  YEARLY
}
```

### New models

**PaymentRecord** — every dollar in/out, immutable audit trail
```
model PaymentRecord {
  id                       String        @id @default(cuid())
  userId                   String
  user                     User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId           String?
  type                     PaymentType
  amountCents              Int
  currency                 String        @default("usd")
  status                   PaymentStatus
  stripePaymentIntentId    String?       @unique
  stripeCheckoutSessionId  String?       @unique
  stripeInvoiceId          String?
  billingEmail             String?
  billingName              String?
  description              String
  metadata                 Json?
  refundedFromId           String?
  createdAt                DateTime      @default(now())

  @@index([userId])
  @@index([stripePaymentIntentId])
  @@index([createdAt])
}

enum PaymentType {
  SUBSCRIPTION
  WALLET_TOPUP
  REFUND
}

enum PaymentStatus {
  SUCCEEDED
  FAILED
  PENDING
  REFUNDED
}
```

**PlanChangeLog** — upgrade/downgrade/cancel history
```
model PlanChangeLog {
  id                    String           @id @default(cuid())
  userId                String
  user                  User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  fromTier              SubscriptionTier
  toTier                SubscriptionTier
  fromInterval          BillingInterval?
  toInterval            BillingInterval?
  reason                PlanChangeReason
  stripeSubscriptionId  String?
  createdAt             DateTime         @default(now())

  @@index([userId])
  @@index([createdAt])
}

enum PlanChangeReason {
  UPGRADE
  DOWNGRADE
  CANCEL
  REACTIVATE
  TRIAL_END
  PAYMENT_FAILED
}
```

**UsageCostRecord** — per-action itemized cost receipt (debates, CLI tasks, MCP calls)
```
model UsageCostRecord {
  id                    String        @id @default(cuid())
  userId                String
  user                  User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  debateId              String?
  debateSession         DebateSession? @relation(fields: [debateId], references: [id])
  actionType            UsageActionType
  platform              UsagePlatform
  models                Json                  // array of models used
  inputTokens           Int
  outputTokens          Int
  weightedTokensUsed    Int                   // total after applying model weights
  costCentsBreakdown    Json                  // per-model cost detail
  totalCostCents        Int                   // actual dollar cost
  deductedFrom          UsageDeductionSource  // WEEKLY_ALLOWANCE, WALLET, ON_DEMAND
  walletTransactionId   String?
  tier                  SubscriptionTier
  createdAt             DateTime      @default(now())

  @@index([userId])
  @@index([debateId])
  @@index([createdAt])
  @@index([platform])
}

enum UsageActionType {
  DEBATE
  CLI_TASK
  MCP_CALL
}

enum UsagePlatform {
  WEB
  CLI
  MCP
}

enum UsageDeductionSource {
  WEEKLY_ALLOWANCE
  WALLET
  ON_DEMAND
}
```

**WeeklyUsagePeriod** — rolling 7-day token tracking (replaces old UsagePeriod)
```
model WeeklyUsagePeriod {
  id                    String           @id @default(cuid())
  userId                String
  user                  User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  tier                  SubscriptionTier
  periodStart           DateTime
  periodEnd             DateTime
  weightedTokensUsed    Int              @default(0)
  weightedTokensLimit   Int                              // 50K, 500K, or 2M
  debatesCount          Int              @default(0)     // for FREE tier debate cap
  costCentsUsed         Int              @default(0)
  createdAt             DateTime         @default(now())
  updatedAt             DateTime         @updatedAt

  @@unique([userId, periodStart])
  @@index([userId])
  @@index([periodEnd])
}
```

**WalletTransaction** — add expiration field for FIFO:
```
// Add to existing WalletTransaction model:
expiresAt    DateTime?    // set to createdAt + 1 year for CREDIT transactions, null for DEBIT
```

When deducting from wallet, query oldest non-expired CREDIT transactions with remaining balance first (FIFO). Expired credits are skipped and periodically cleaned up.

### Model weight configuration

Stored in `packages/shared/src/billing/weights.ts`:

```typescript
export const MODEL_WEIGHTS: Record<string, number> = {
  // Free (0x) — don't count against allowance
  "llama-3.3-70b-versatile": 0,
  "llama-3.1-8b-instant": 0,
  "llama-4-scout": 0,
  // Budget (0.1x)
  "gemini-2.0-flash": 0.1,
  "gemini-2.5-flash": 0.1,
  "gpt-4o-mini": 0.1,
  "claude-haiku-4-5-20251001": 0.1,
  "grok-2-mini": 0.1,
  // Mid (0.5x)
  "gpt-4.1": 0.5,
  "o3-mini": 0.5,
  // Standard (1x baseline)
  "claude-sonnet-4-6": 1,
  "claude-sonnet-4-20250514": 1,
  "gpt-4o": 1,
  "grok-2-1212": 1,
  "gemini-2.5-pro": 1,
  // Premium (5x)
  "claude-opus-4-6": 5,
};

export function getModelWeight(modelId: string): number {
  return MODEL_WEIGHTS[modelId] ?? 1;
}

export function calculateWeightedTokens(
  modelId: string,
  rawTokens: number,
): number {
  return Math.ceil(rawTokens * getModelWeight(modelId));
}
```

### Queryability guarantees

Every billing record links to `userId` for cross-referencing. Stripe reference IDs (`stripePaymentIntentId`, `stripeCheckoutSessionId`, `stripeInvoiceId`, `stripeSubscriptionId`) are indexed and unique where applicable. This enables future support tooling to trace any payment dispute from user → payment → subscription → usage in a single query chain.

## 2. NestJS Billing API

### Module structure

```
apps/api/src/features/billing/
├── billing.module.ts
├── billing.controller.ts       — GET endpoints (reads)
├── checkout.controller.ts      — POST endpoints (writes)
├── webhook.controller.ts       — Stripe webhook (raw body)
├── stripe.service.ts           — Stripe SDK wrapper (sole Stripe touchpoint)
├── subscription.service.ts     — Subscription CRUD, tier resolution
├── wallet.service.ts           — Balance, credit/debit, transactions
├── usage.service.ts            — Tracking, limit enforcement, periods
└── plans.service.ts            — Tier limits, model pricing (wraps shared/billing)
```

### Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /billing/subscription | ClerkAuthGuard | Current tier, status, period, billing info |
| GET | /billing/usage | ClerkAuthGuard | Weekly tokens used/remaining, breakdown by platform, debate count |
| POST | /billing/on-demand | ClerkAuthGuard | Toggle on-demand mode, set monthly spend limit |
| GET | /billing/wallet | ClerkAuthGuard | Balance, recent transactions (paginated) |
| GET | /billing/plans | Public | Available tiers with features and pricing |
| POST | /billing/checkout | ClerkAuthGuard | Create Stripe Checkout session for plan upgrade |
| POST | /billing/wallet/topup | ClerkAuthGuard | Create Stripe Checkout for wallet credit |
| POST | /billing/portal | ClerkAuthGuard | Generate Stripe Customer Portal URL |
| POST | /billing/cancel | ClerkAuthGuard | Cancel subscription at period end |
| POST | /webhooks/stripe | Stripe signature | Handle Stripe events |

### Service responsibilities

**stripe.service.ts** — Only file that imports Stripe SDK
- Checks `STRIPE_ENABLED` env var on initialization
- When disabled: all methods return mock/no-op responses
- When enabled: wraps Stripe API calls (createCustomer, createCheckoutSession, etc.)
- Handles webhook signature verification

**subscription.service.ts**
- `getOrCreate(userId)` — ensures Subscription row exists (defaults to FREE)
- `getDetails(userId)` — returns subscription + wallet + usage summary
- `updateFromStripe(stripeEvent)` — syncs tier/status from webhook events
- `cancel(userId)` — sets cancelAtPeriodEnd=true
- Logs all plan changes to PlanChangeLog

**wallet.service.ts**
- `getOrCreate(userId)` — ensures Wallet row exists
- `getBalance(userId)` — returns current non-expired balance
- `credit(userId, amountCents, description, stripePaymentIntentId?)` — atomic credit + transaction log, sets expiresAt to 1 year from now
- `debit(userId, amountCents, description, debateId?)` — FIFO deduction from oldest non-expired credits, fails if insufficient
- `getTransactions(userId, page, limit)` — paginated transaction history with expiration dates
- `cleanupExpiredCredits()` — periodic job to zero out expired credit balances

**usage.service.ts**
- `getCurrentWeek(userId)` — get/create rolling 7-day WeeklyUsagePeriod from sign-up anchor
- `estimateWeightedTokens(models, estimatedRawTokens)` — calculate weighted cost before action starts
- `checkAllowance(userId, estimatedWeightedTokens)` — returns which source will be used (WEEKLY_ALLOWANCE, WALLET, ON_DEMAND) or throws if all exhausted
- `checkDebateCap(userId)` — for FREE tier: throws if 5/week or 20/month debate cap hit
- `recordUsage(userId, action)` — creates UsageCostRecord, deducts from determined source, increments WeeklyUsagePeriod
  - `action`: { debateId?, actionType, platform, models, inputTokens, outputTokens }
- `getUsageSummary(userId)` — returns weekly tokens used/remaining, wallet balance, on-demand spend, breakdown by platform

**plans.service.ts**
- Thin wrapper around `packages/shared/src/billing/` constants
- `getAll()` — returns all tiers with features/limits/pricing
- `getStripePriceId(tier, interval)` — resolves env var based on tier + interval (e.g., STRIPE_PRO_PRICE_ID for monthly, STRIPE_PRO_YEARLY_PRICE_ID for yearly)

### STRIPE_ENABLED=false behavior

| Action | Behavior when disabled |
|--------|----------------------|
| GET subscription | Returns FREE tier, ACTIVE status |
| GET usage | Returns real usage from DB (tracking still works) |
| GET wallet | Returns real wallet balance from DB |
| GET plans | Returns all plans normally |
| POST checkout | Returns 400 "Payments not configured" |
| POST wallet/topup | Returns 400 "Payments not configured" |
| POST portal | Returns 400 "Payments not configured" |
| POST cancel | Returns 400 "Payments not configured" |
| Webhook | Returns 400 "Payments not configured" |
| Debate/usage checks | Enforced based on FREE tier limits (50K tokens/week, 5 debates/week) |
| On-demand toggle | Returns 400 "Payments not configured" |

### Webhook events handled

| Stripe Event | Action |
|--------------|--------|
| checkout.session.completed | Create PaymentRecord, update Subscription tier, credit wallet (if topup), log PlanChangeLog |
| customer.subscription.updated | Sync tier/status/period dates, log plan change if tier changed |
| customer.subscription.deleted | Set tier to FREE, log CANCEL in PlanChangeLog |
| invoice.payment_succeeded | Create PaymentRecord with SUCCEEDED status |
| invoice.payment_failed | Create PaymentRecord with FAILED status, log PAYMENT_FAILED |

### Usage enforcement integration

In `apps/api/src/features/debates/debates.service.ts`, before starting any debate:

```
1. usage.checkDebateCap(userId)                              — FREE tier: 5/week, 20/month
2. estimatedTokens = usage.estimateWeightedTokens(models, ~15K)
3. source = usage.checkAllowance(userId, estimatedTokens)    — returns WEEKLY/WALLET/ON_DEMAND or throws
4. Show user: "This will cost ~X tokens from [source]"
```

After debate completes (actual tokens known):
```
5. usage.recordUsage(userId, {
     debateId, actionType: DEBATE, platform: WEB|CLI|MCP,
     models, inputTokens, outputTokens
   })
```

Same flow applies to CLI tasks and MCP calls — just with different `actionType` and `platform`.

## 3. Web UI

### New pages

**`/settings/billing`** — Main billing dashboard
- Current plan card: tier badge, status, billing interval, renewal date, billing email
- Usage section: weekly tokens used/remaining (progress bar), resets in X days, breakdown by platform (web/CLI/MCP)
- On-demand toggle: enable/disable, monthly spend limit (adjustable), current month spend
- Wallet section: balance (with expiration notice), "Add Credits" button, recent transactions list
- Payment history table: date, description, amount, status, Stripe receipt link, deduction source
- Actions: "Upgrade Plan", "Manage in Stripe" (portal), "Cancel Plan"

**`/settings/billing/checkout`** — Plan selection
- PRO and MAX cards side-by-side with feature comparison
- Monthly/yearly toggle (yearly shows "2 months free" badge)
- "Subscribe" button → POST /billing/checkout → redirect to Stripe

**`/settings/billing/success`** — Post-checkout confirmation
- Reads `session_id` from URL query params
- Shows success message with new plan details
- "Go to Dashboard" button

**`/settings/billing/cancel`** — Cancellation confirmation
- Shows what they'll lose (feature comparison: current tier vs FREE)
- "Keep My Plan" primary CTA, "Cancel Anyway" secondary
- POST /billing/cancel → confirmation message

### Dashboard sidebar widget

Added to `apps/web/src/app/(dashboard)/layout.tsx`:
- Tier badge (colored: FREE=gray, PRO=blue, MAX=purple)
- Compact token usage bar (125K / 500K tokens — resets in 3d)
- Wallet balance ($12.40)
- On-demand status indicator (if enabled)
- "Upgrade" link (shown for FREE and PRO tiers)

### Component structure

```
apps/web/src/features/billing/
├── components/
│   ├── billing-dashboard.tsx      — Main /settings/billing page content
│   ├── plan-cards.tsx             — PRO/MAX comparison cards
│   ├── usage-stats.tsx            — Progress bars for debates/compute
│   ├── wallet-panel.tsx           — Balance + topup + transactions
│   ├── payment-history.tsx        — Paginated payment table
│   ├── sidebar-billing-widget.tsx — Compact sidebar display
│   ├── cancel-confirmation.tsx    — Cancel flow UI
│   └── checkout-success.tsx       — Success page content
├── hooks/
│   └── use-billing.ts             — SWR/fetch hooks for billing endpoints
└── lib/
    └── billing-api.ts             — API client functions
```

## 4. CLI Integration

Already built in `packages/cli/src/billing/`. The `billing-service.ts` calls `GET /api/v1/billing/subscription` and caches with 5-min TTL. The `tier-display.ts` renders box-drawn dashboards.

Once the API exists, CLI billing works automatically. No changes needed.

## 5. Dependencies

### apps/api/package.json — add:
```
"stripe": "^17.0.0"
```

### No other dependency changes needed.

## 6. Environment variables (existing in .env.example)

```
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRO_PRICE_ID=""
STRIPE_MAX_PRICE_ID=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_ENABLED=false
```

Add for yearly pricing:
```
STRIPE_PRO_YEARLY_PRICE_ID=""
STRIPE_MAX_YEARLY_PRICE_ID=""
```

## 7. Security considerations

- Stripe webhook signature validation on every event (reject if invalid)
- All billing endpoints (except plans + webhook) behind ClerkAuthGuard
- Wallet debit is atomic — check balance + debit in single transaction to prevent race conditions
- PaymentRecord.stripePaymentIntentId is unique — prevents duplicate credit from webhook retries (idempotency)
- billingEmail/billingName snapshot at payment time for dispute resolution
- No Stripe secret keys exposed to client — all Stripe calls server-side only
- STRIPE_ENABLED flag prevents accidental charges in development

## 8. Future integration hook

Schema is designed for automated support tooling: given a userId or stripePaymentIntentId, a support tool can join across Subscription → PaymentRecord → WalletTransaction → UsageCostRecord → WeeklyUsagePeriod to build a complete billing timeline. All reference IDs (Stripe, internal) are indexed for fast lookup.

## 9. Implementation scope

### In scope (this spec)
- NestJS billing API (9 endpoints, 6 services)
- Database schema (3 new models + modifications)
- Web UI (4 pages + sidebar widget)
- Stripe integration (checkout, webhooks, portal)
- Weighted token tracking + usage enforcement
- Wallet with FIFO expiration
- On-demand mode with monthly cap
- Model weight configuration in shared package
- STRIPE_ENABLED feature flag

### MAX features — separate implementation phases
The research-backed MAX features (conformal safety gate, progressive deepening, disagreement maps, argument graphs, debate collapse detection, persistent memory, decision audit trail) are designed and spec'd here but will be implemented in follow-up cycles after the core billing infrastructure ships. They require deliberation engine changes in apps/agents/ in addition to API/web work.

### Out of scope
- Automated email receipts (Stripe handles this)
- Tax calculation (Stripe Tax can be added later)
- Team/org billing — reserved for future Enterprise tier with proper funding
- Support investigator MCP (separate project, builds on this schema)
- Merging to production (stays on feature branch until Consilium gains traction)
- RUMAD dynamic topology optimization (requires RL training infrastructure)
- Evolved constitutions per domain (future research integration)
- Self-play debate mode (future deliberation mode)
