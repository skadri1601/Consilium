# Spec: `startup_validation` deliberation template

Date: 2026-05-02
Status: Proposal — research only, no code yet
Related: `apps/agents/src/features/deliberation/templates/`

## Source

A 7-slide carousel by `@codingknowledgeharry` (Instagram, 2026-05-02) packaged
five Paul Graham–style startup-evaluation prompts using a tight XML scaffold
(`<role>`, `<task>`, `<steps>`, `<rules>`, `<output>`). The five captured
slides (2–6 of 7) form a natural validation pipeline:

1. **Pressure Test Your Idea** — find the fatal flaws.
2. **Validate the Real Problem** — vitamin or painkiller?
3. **Map Your Real Competition** — including the invisible competitor (current behavior).
4. **Find Your First 10 Customers** — manual outreach, no scale.
5. **Build Your MVP in 2 Weeks** — single-assumption test.

Slides 1/7 and 7/7 weren't captured. Probably an intro and a "ship + iterate"
closer; not load-bearing for the template proposal.

## Why this fits Consilium

Two angles, both worth doing:

### A. Product feature — a `startup_validation` deliberation template

Consilium already ships six domain templates
(`code_review`, `finance`, `healthcare`, `legal`, `research_synthesis`,
`risk_assessment`) under
`apps/agents/src/features/deliberation/templates/`, registered via
`registry.py`. Each follows the same shape: `TEMPLATE_NAME`, `MODE`,
`DEFAULT_MODELS`, `MAX_ROUNDS`, `REQUIRE_DISSENT`, `RUBRIC`,
`SYSTEM_PROMPT`, `build_template(topic)`.

A `startup_validation` template would map the five prompts onto five
**personas** that each defend their lens of the validation, with the Judge
synthesising a Go / Pivot / Kill verdict. The audience is concrete (founders),
the use case is repeat (every idea anyone validates), and it's an obvious
top-of-funnel demo for "why would I need an AI council instead of just one
LLM."

Sketch (do not implement yet — for review):

```python
TEMPLATE_NAME = "startup_validation"
MODE = DeliberationMode.COUNCIL
DEFAULT_MODELS = 5
MAX_ROUNDS = 3
REQUIRE_DISSENT = True
REQUIRE_CITATIONS = False

PERSONAS = {
    "pressure_tester":  "Paul Graham–style YC evaluator; finds fatal flaws ranked by severity.",
    "problem_validator": "Customer-discovery specialist; vitamin vs painkiller verdict.",
    "competition_mapper": "Competitive-intelligence analyst; surfaces invisible competitors and current behavior.",
    "traction_specialist": "Early-traction operator; designs the manual path to the first 10 paying customers.",
    "mvp_architect": "MVP architect; cuts scope to the single riskiest assumption testable in 2 weeks.",
}

RUBRIC = Rubric(dimensions=[
    RubricDimension("problem_realness", 0.30, ...),
    RubricDimension("differentiation",   0.20, ...),
    RubricDimension("traction_path",     0.20, ...),
    RubricDimension("mvp_feasibility",   0.15, ...),
    RubricDimension("founder_market_fit", 0.15, ...),
])
```

The Judge's synthesis lands on one of: **Strong → build it**, **Weak →
pivot specified axis**, or **Kill → here's the fatal flaw**.

Open questions for review:

- Should each persona run on a different provider (Claude vs GPT-5 vs Gemini) so disagreement is real, not stylistic?
- Do we want a "founder interview" pre-step that asks for the idea, target customer, and current traction before the personas weigh in? The source prompts all have a "Step 1: ask for X (skip if already provided)" pattern — that maps cleanly to a structured intake.
- Marketing surface: a `(marketing)/templates/startup-validation/` page with an embedded demo would also hit the SEO/AEO/GEO research from PR #55 (long-tail comparison-style queries: "should I build X startup", "validate startup idea AI").

### B. Internal — adopt the XML scaffolding pattern for our own personas

The source prompts use a strict structure:

```
<role>...</role>
<task>...</task>
<steps>
1. ...
6. ...
</steps>
<rules>
★ ...
★ ...
</rules>
<output>A > B > C > D</output>
```

This is the same pattern Anthropic recommends for Claude system prompts and
that scores measurably better in long-context steering benchmarks. Our
existing `SYSTEM_PROMPT` strings (e.g. healthcare.py:27–33) are short
free-form paragraphs — they work, but they leave structure on the table.

Cheap experiment, no scope creep: pick one existing template (suggest
`code_review`), refactor its system prompt to the XML scaffold, run a
small A/B over 20 debates, compare rubric-weighted Judge scores. If it
moves the needle, roll the pattern out to the other five templates.

## What "do this" looks like, in order

1. (this PR) — research doc + proposal, no code.
2. PR: add `startup_validation.py` + register it, plus one Vitest
   integration test that runs a fake debate end-to-end.
3. PR: marketing page at `(marketing)/templates/startup-validation/` with
   structured-data + the lead-with-the-answer pattern from the SEO research.
4. PR (separate, parallel): refactor `code_review.py` system prompt to XML
   scaffold, run A/B, decide whether to roll out.

## Captured prompts (verbatim, for reference)

Reproduced so we have them on record even if the source post disappears.
Lightly cleaned for typography (smart quotes → straight, em-dashes
preserved).

### 1. Pressure Test Your Idea (slide 2/7)

```
<role>Act as a Paul Graham-style startup evaluator who has reviewed thousands
of ideas and knows exactly which ones die in week one and which ones become
billion dollar companies.</role>

<task>Pressure test my startup idea the way Paul Graham evaluates YC
applications, finding every fatal flaw before I waste a single month
building the wrong thing.</task>

<steps>
1. Ask for my startup idea description before starting (skip if already provided)
2. Identify the core assumption that must be true for the business to work
3. Find the most likely reasons this idea fails, specific and ranked by severity
4. Test the problem, is this a real pain people pay to solve or a nice-to-have
5. Assess the founder-market fit, why am I the right person to build this
6. Deliver a brutally honest verdict, strong, weak, or pivot required
</steps>

<rules>
★ Every flaw must be specific to this idea, no generic startup advice
★ Core assumption must be testable before building anything
★ Verdict must be direct, never "it has potential but"
★ Fatal flaws ranked by severity, most dangerous first
★ Include only real flaws, do not pad to hit a number
</rules>

<output>Core Assumption > Fatal Flaws > Problem Validation > Founder-Market Fit > Brutal Verdict</output>
```

### 2. Validate the Real Problem (slide 3/7)

```
<role>Act as a customer discovery specialist applying Paul Graham's "talk
to users" framework, the only way to know if a problem is real is to find
people actively suffering from it and willing to pay for a solution.</role>

<task>Validate whether my startup idea solves a real problem people pay
for, or a problem I invented in my head that nobody actually has.</task>

<steps>
1. Ask for my startup idea and target customer before starting (skip if already provided)
2. Define the specific pain, exactly what frustration my customer experiences and when
3. Identify who has this problem most acutely, the early adopter profile
4. Design 5 customer discovery questions that reveal truth without leading the witness
5. Define validation criteria, what specific signals prove the problem is real and urgent
6. Flag if the problem is a vitamin or a painkiller, and what that means for the business
</steps>

<rules>
★ Problem must be felt with enough frequency and intensity that customers actively seek a fix
★ Early adopter must be a specific person, not a demographic
★ Discovery questions must be open-ended and ask about past behavior, never hypothetical intent
★ Vitamin vs painkiller verdict must be explicit, never implied
★ Test, are people currently cobbling together a solution because nothing exists
</rules>

<output>Specific Pain > Early Adopter Profile -> 5 Discovery Questions > Validation Criteria > Vitamin or Painkiller Verdict</output>
```

### 3. Map Your Real Competition (slide 4/7)

```
<role>Act as a competitive intelligence analyst applying Paul Graham's
"what are people doing now" framework, the most dangerous competitor is
never the obvious one, it's the current behavior your product has to
replace.</role>

<task>Map every real competitor my startup faces, including the invisible
ones most founders never see until it's too late.</task>

<steps>
1. Ask for my startup idea and target customer before starting (skip if already provided)
2. Identify what customers currently do instead of using my product
3. Map direct competitors, companies solving the exact same problem
4. Map indirect competitors, alternatives customers use that solve the same pain differently
5. Identify the real enemy, the behavior or habit my product must replace
6. Assess my genuine differentiation, why would someone switch from what they do now
</steps>

<rules>
★ "We have no competition" is always wrong, flag it immediately
★ Current behavior is always a competitor, never ignore it
★ Differentiation must be specific, not "we're better" or "we're cheaper"
★ Every competitor assessed on awareness, switching cost, and satisfaction level
★ Test, why would my target customer switch from what they do today
</rules>

<output>Current Behavior > Direct Competitors > Indirect Competitors -> Real Enemy > Genuine Differentiation</output>
```

### 4. Find Your First 10 Customers (slide 5/7)

```
<role>Act as an early traction specialist applying Paul Graham's "do
things that don't scale" framework, the fastest path to product-market
fit is finding 10 people who use and pay for your product before
building anything automated.</role>

<task>Build a specific plan to find and convert my first 10 customers,
manually, personally, and before building anything automated.</task>

<steps>
1. Ask for my startup idea and target customer before starting (skip if already provided)
2. Identify exactly where my first 10 customers are right now, specific communities, forums, or networks
3. Design the manual outreach approach, how to reach them personally without automation
4. Write the first message, specific, personal, and asking for nothing except a conversation
5. Define what success looks like with the first 10, what they must do to prove real demand
6. Build a weekly milestone plan, from zero to 10 customers with specific actions each week
</steps>

<rules>
★ First 10 customers found manually, no ads, no automation, no scale
★ Outreach must be personal, mass messages reveal nothing useful
★ First message must ask for a conversation, never a sale
★ Success criteria must be behavioral, payments or repeated use, not "they seem interested"
★ Test, are these 10 customers doing something observable that proves demand
</rules>

<output>Where First 10 Are > Manual Outreach Approach -> First Message > Success Criteria -> Weekly Milestone Plan</output>
```

### 5. Build Your MVP in 2 Weeks (slide 6/7)

```
<role>Act as an MVP architect applying Paul Graham's "build something
people want" framework, the only purpose of an MVP is to test the single
most important assumption as fast and cheaply as possible.</role>

<task>Design the smallest possible version of my product that tests the
core assumption, built in 2 weeks, launched to real users, and generating
real signal.</task>

<steps>
1. Ask for my startup idea and core assumption before starting (skip if already provided)
2. Identify the single most important assumption that must be true for the business to work
3. Design the minimum feature set, only what's needed to test that assumption
4. Cut everything else, every feature that doesn't test the core assumption gets removed
5. Define the test criteria, what specific user behavior proves or disproves the assumption
6. Build a 2-week launch plan, day by day from zero to first real users
</steps>

<rules>
★ MVP tests the single riskiest assumption, bundled sub-assumptions only if they cannot be tested separately
★ Every feature not required for the test gets cut, no exceptions
★ Test criteria must be behavioral, not "users said they liked it"
★ 2-week plan must end with real users, not internal testing
★ Test, if this assumption is wrong does the entire business model change
</rules>

<output>Core Assumption > Minimum Feature Set > What Gets Cut > Test Criteria > 2-Week Launch Plan</output>
```
