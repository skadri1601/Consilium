# SEO vs AEO vs GEO - Research Notes

Source: two infographics shared on 2026-05-02. This document distills the
content, defines each discipline precisely, and maps it to Consilium's
current marketing surface (`apps/web/`) so we can decide what to invest in.

## TL;DR

| Discipline | What you optimise | Where the user sees you | Primary surface in 2026 |
|------------|-------------------|--------------------------|--------------------------|
| **SEO** - Search Engine Optimisation | Ranking of a *link* | Blue-link list on a SERP | Google, Bing |
| **AEO** - Answer Engine Optimisation | Extraction of a *short answer* | Featured snippet, AI Overview, voice answer | Google AI Overviews, Bing Copilot, Alexa, Siri |
| **GEO** - Generative Engine Optimisation | Citation inside a *generated paragraph* | Cited reference in a long-form AI answer | ChatGPT, Perplexity, Claude, Gemini, Copilot |

They form a funnel of intent depth, not a replacement chain. Most users still start at Google for navigational queries; they go to ChatGPT/Perplexity for synthesis-heavy or comparison queries - exactly the queries Consilium itself answers.

---

## 1. SEO - getting the link to appear

The classic discipline. You're optimising so a Googlebot-style crawler indexes a page and ranks it for a query the user types into a search box. The deliverable is a clickable result; the success metric is rank position and CTR.

What matters in 2026:

- **Crawlability** - `robots.txt`, `sitemap.xml`, canonical tags, no orphan pages.
- **On-page signals** - `<title>`, meta description, H1, semantic HTML, internal links.
- **Topical authority** - clusters of related pages that link to a pillar.
- **Backlinks** - still the strongest off-page signal.
- **Core Web Vitals** - LCP, INP, CLS. Google folds these into ranking.
- **E-E-A-T** - Experience, Expertise, Authoritativeness, Trust. Author bios, citations, real company info.

Consilium status: solid baseline. `apps/web/src/app/layout.tsx` sets canonical, robots, OG, Twitter; `app/sitemap.ts` and `app/robots.ts` exist; structured-data builders live at `apps/web/src/lib/structured-data.ts`.

## 2. AEO - getting extracted into the answer box

AEO targets *zero-click* answers. Google's AI Overview, featured snippets, "People Also Ask", voice assistants, and Bing's answer panes all extract a fragment of your page and present it without requiring a click. The deliverable is the extracted span; the success metric is impression share inside the answer surface and (where shown) brand attribution.

What matters:

- **Question-shaped content** - H2s phrased as the literal question, followed by a 40–60-word direct answer in the first paragraph under the heading.
- **Schema.org markup** - `FAQPage`, `HowTo`, `QAPage`, `Article`, `Product`, `SoftwareApplication`. Note: Google narrowed `FAQPage` rich-result eligibility to gov/health in 2023, but the markup still feeds AI Overview extraction even when no rich result renders.
- **Definition pattern** - open with `"<Term> is a <category> that <does X>"` so extractors can lift the sentence.
- **Tables and lists** - extractors prefer them for "compare X vs Y", "best N for Y", "how to X" queries.
- **Concise, attributable claims** - short factual sentences with sources beat long prose.

Consilium status: partial. Pages are rich content but don't lead with the
question→answer pattern. Easy wins below.

## 3. GEO - getting cited in generative answers

GEO is the newest of the three. It targets long-form AI responses where the
model writes a paragraph and includes citations, e.g. ChatGPT with browsing,
Perplexity, Claude with web search, Gemini with grounding, Copilot. The
deliverable is a footnote/citation; the success metric is citation share and
referral traffic from the AI surface.

What matters (synthesised from Princeton's GEO paper, Profound/Bright Edge tracking, and Perplexity engineering posts through 2025):

- **Statistics and numbers** - pages with concrete numbers get cited disproportionately. Generative models prefer to cite a number to a claim.
- **Direct quotes from named experts** - quoted sentences with attribution survive paraphrasing because they're easy to lift.
- **Authoritative tone** - first-person plural, declarative, no hedge words.
- **Original research and benchmarks** - proprietary data is more cite-worthy than a re-write of someone else's article.
- **Clear page structure** - H2/H3 hierarchy, short paragraphs, descriptive anchors. AI crawlers chunk by heading.
- **`llms.txt`** - emerging convention (Answer.AI, 2024) at the site root that points AI crawlers to a curated index of your most cite-worthy URLs. Not a standard yet, but cheap to ship.
- **Don't block AI crawlers wholesale** - `GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`, `CCBot`. Blocking them removes you from the citation pool. Block selectively only if you need to.

Consilium status: untouched. We have nothing aimed at this surface today.

---

## 4. The eight common SEO mistakes (second infographic)

Quick audit of each item against the current state of `apps/web/`. This is a sanity check, not a deep audit.

| # | Mistake | Consilium status | Action |
|---|---------|------------------|--------|
| 1 | Poor keyword targeting | We rank for "ai council" / "multi-agent debate" - small head terms. Long-tail comparison queries ("Claude vs GPT-5 reasoning", "best multi-LLM debate platform") are not covered. | Build a comparison-query content cluster; see §5. |
| 2 | Weak on-page SEO | Title/meta/H1 generally present via `metadata` blocks. Some marketing pages lack a single H1 or have multiple. | Audit `apps/web/src/app/(marketing)/**/page.tsx` for single-H1 + descriptive title. |
| 3 | Low-quality / thin content | Marketing pages are decent; blog cadence is the gap. | Treat blog as the AEO/GEO investment vehicle (§5). |
| 4 | No backlinks | Limited; relies on organic mentions. | Out-of-scope for this doc, but worth a separate plan. |
| 5 | Slow website speed | Next.js 15 + Vercel + local font (`Inter.woff2`) is good. CWV not actively tracked in CI. | Add Lighthouse CI on PRs; track LCP/INP/CLS budgets. |
| 6 | Not mobile-friendly | Tailwind responsive classes used throughout. | No action; spot-check on real devices once per release. |
| 7 | No indexing / technical issues | `sitemap.ts` and `robots.ts` exist. Unclear whether GSC is wired up for `myconsilium.xyz`. | Verify Google Search Console + Bing Webmaster Tools coverage. |
| 8 | Ignoring local SEO | N/A - Consilium is a SaaS, not a local business. | Skip. |

---

## 5. Recommended next moves for Consilium

Ordered by leverage, not by effort.

1. **Ship a `llms.txt` at the site root.** `apps/web/public/llms.txt` listing the canonical URLs for landing, pricing, docs, and the deliberation-mode pages. Cheap, signals to AI crawlers what to read.
2. **Add a "Compare" content cluster** under `(marketing)/compare/<provider-vs-provider>/`. Each page leads with a 50-word direct answer ("Consilium runs Claude and GPT-5 against the same prompt and synthesises a verdict - here's how they differ on…"). This single move targets all three: SEO (long-tail), AEO (question-shaped H2s), GEO (extractable comparison tables and stats).
3. **Re-enable `FAQPage` JSON-LD on pricing and use-case pages.** The `structured-data.ts` comment notes we skipped it because rich results were restricted, but AI Overview still mines it for extraction.
4. **Publish at least one piece of original benchmark data** per quarter - e.g. "We ran 500 debates across these 5 providers, here are the disagreement rates." Numbers + methodology = GEO citation magnet.
5. **Author bios on every blog post** with `Person` schema linking to a real LinkedIn/X. E-E-A-T for SEO, and AI engines weight named-author content higher.
6. **Add a citation-tracking dashboard.** Profound/Athena/BrightEdge if budget allows; otherwise weekly manual checks: "Does ChatGPT/Perplexity/Claude cite myconsilium.xyz when asked about multi-agent debate platforms?" Track the answer over time.
7. **Lighthouse CI in `ci.yml`** with budgets - fail PRs that regress LCP > 2.5s or INP > 200ms on the homepage and pricing.
8. **Verify GSC + Bing Webmaster Tools** coverage and submit `sitemap.xml`. One-time, but blocks indexing problems from going unnoticed.

---

## 6. References for the curious

- Princeton "GEO: Generative Engine Optimization" paper (Aggarwal et al., 2024).
- Google Search Central "Helpful content" and "AI Overview" guidance.
- Answer.AI `llms.txt` proposal (2024).
- Perplexity engineering posts on citation ranking (2024–2025).
- Profound and BrightEdge generative-search tracking reports (2025).

URLs intentionally omitted - verify current canonical sources before
linking from production pages.
