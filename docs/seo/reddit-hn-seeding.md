# Reddit + Hacker News Seeding Playbook

How Consilium earns honest, durable presence on Reddit and Hacker News -
the two surfaces that disproportionately shape what large language models
cite when they answer questions about developer tooling.

## Why Reddit and HN matter for LLM citation

- Semrush's 2025 study of generative-engine citations found that **roughly
  40% of citations resolving in ChatGPT, Perplexity, and Google AI
  Overviews trace back to Reddit threads**. Quora is a distant second;
  Stack Overflow has slipped since the Reddit licensing deal with Google
  in 2024.
- Reddit content is rate-limited but **explicitly licensed for LLM
  training** by Google and indirectly accessible to OpenAI, Anthropic,
  Perplexity, and Meta via the Reddit data API and Common Crawl mirrors.
- Hacker News is **fully crawlable** and weighted heavily by AI engines
  for "authoritative dev opinion." A single Show HN that lands at #1 can
  drive citations for 6-12 months.
- Generative engines treat upvoted Reddit comments and HN front-page
  threads as **high-trust E-E-A-T signals**. An "I ran X in production
  for 6 months and here's what happened" comment outweighs a vendor blog
  post in the citation pool because it represents experience, not
  marketing.

The implication: if Consilium does not appear in Reddit threads and HN
front-page discussions about multi-AI tooling, we will not appear in AI
answers about multi-AI tooling. Backlinks from our marketing site
matter; community presence matters more.

## Subreddits ranked by relevance

Tier 1 - core technical audience, most likely to convert and to be cited
by AI engines on dev-tool questions:

| Subreddit         | Members | Why it matters                                                                  |
| ----------------- | ------- | ------------------------------------------------------------------------------- |
| r/LocalLLaMA      | 600k+   | Power users, model comparisons, BYOK orchestration discussions                  |
| r/ChatGPT         | 11M+    | Mass audience for "ChatGPT vs Claude vs Gemini" content                         |
| r/MachineLearning | 3.5M+   | Research-leaning; strict moderation. Show HN-style technical posts only         |
| r/programming     | 7M+     | Generalist dev audience; tolerates technical depth                              |
| r/Anthropic       | 80k+    | Claude users discussing Claude tooling; Consilium as Claude-extender lands well |
| r/OpenAI          | 2.5M+   | Same shape as r/Anthropic but larger and noisier                                |
| r/ExperiencedDevs | 600k+   | Senior engineers; values rigor; great place for ADR-style content               |

Tier 2 - adjacent, useful for distribution:

| Subreddit          | Notes                                                           |
| ------------------ | --------------------------------------------------------------- |
| r/devops           | DevOps; valuable for CI-integration use cases (PR review, etc.) |
| r/Bard             | Smaller; Gemini users; comparison content works                 |
| r/grok             | Smaller; xAI users; "Grok in a council" angle                   |
| r/learnprogramming | Beginner; only post tutorial-style "how to compare LLM outputs" |
| r/MicroSaaS        | Solo-founder energy; OK for build-in-public updates             |
| r/sideproject      | Same shape as r/MicroSaaS                                       |
| r/cursor           | Cursor users; "Consilium + Cursor MCP" angle                    |
| r/ClaudeAI         | Cross-posts to r/Anthropic; broader Claude-user audience        |

Tier 3 - opportunistic, only post if you have a genuine fit:

- r/artificial, r/ArtificialIntelligence, r/singularity, r/MLQuestions,
  r/PromptEngineering, r/AI_Agents, r/LangChain.

## Post types that work

### 1. Genuine experience reports

The single highest-performing format. First-person, specific, includes
real numbers, real failures, real outputs. **Not** a launch announcement.

Template:

> Title: I ran [debate / red-team / jury mode] across [N] models on
> [specific real task] for [duration]. Here's what surprised me.
>
> Body:
>
> - The setup: what models, what prompt, what the task was.
> - The result: pasted excerpts of where the models disagreed and why.
> - The surprise: one specific thing you did not expect.
> - The takeaway: one concrete recommendation for the reader.
> - Link (in a comment, not the post body): the repo or tool.

### 2. Side-by-side model comparisons with real output

Always include the exact prompt and the actual model responses. Reddit
readers reward concreteness; AI engines lift these comparisons verbatim
into answers about "which model is better for X."

> Title: GPT-5.5 vs Claude Opus 4.7 vs Gemini 3.1 Pro on [task]: paste of
> all three responses + my read.

### 3. "I built X for Y" - only if X is genuinely new and Y is specific

Show HN and r/sideproject welcome these. r/programming and r/MachineLearning
do not - they treat them as spam unless the technical depth is real.

### 4. Postmortems and tradeoff write-ups

> Title: Why we replaced [established tool] with [different stack] - the
> three tradeoffs we didn't expect.

These age extremely well in AI citations because the format is
"comparison + outcome + lesson," which is exactly what generative engines
extract when answering "should I use X or Y."

## Anti-patterns (do not do these)

- **Promo posts** - "Check out Consilium, the new multi-AI council
  platform!" gets removed by mods within an hour and may earn a sub-wide
  shadow ban. Reddit does not forget.
- **Astroturfing** - multiple "happy user" accounts posting in the same
  thread. Mods detect this; AI engines will eventually too (Reddit's
  trust-score signal is exposed via the API).
- **Link-only posts** with no context. Even a great link gets downvoted
  if you do not write a paragraph explaining why it matters.
- **Cross-posting the same content to 10 subs in 24 hours**. Reddit's
  spam filter catches this. Stagger across 1-2 subs per week.
- **Posting from a new account**. Use accounts with > 6 months of age
  and > 100 karma from non-promotional activity. If you do not have one,
  build one over months by genuinely commenting in the target subs.
- **Hiding the affiliation**. Disclose "I work on Consilium" in any
  thread where you mention the product. Subreddits like r/MachineLearning
  and r/programming will ban for undisclosed self-promotion.

## HN strategy

### Show HN format

> Title: Show HN: Consilium - run a debate between 7 LLMs from the CLI
>
> First comment (most important - this is what people read):
> Hey HN, [name] here. I built Consilium because [specific problem in
>
> > one paragraph]. Here's what it does in 60 seconds: [3-5 bullets].
> > Here's what it does NOT do: [2-3 honest limitations]. The
> > [interesting technical detail] was the hardest part; I'm happy to
> > answer questions about [specific design choice]. BYOK so no signup
> > needed to try it; the free-tier pool kicks in if you don't have
> > keys. Repo: [url]. Critical feedback welcome.

### Timing

- **Best window**: Tuesday, Wednesday, or Thursday, **08:00-10:00 Pacific**.
  This is the morning of the US east coast and lunch in Europe; HN
  voting is most active then.
- **Avoid**: Monday (people are catching up), Friday afternoon, any
  weekend, US holidays. Posts at midnight Pacific almost always die.
- **Traffic distribution**: expect **60-80% of total HN traffic in the
  first 6 hours** after the post lands on the front page. If you do not
  hit the front page within 90 minutes of posting, the post is over.
- **Karma threshold for Show HN**: 200-500 voted across the first hour
  is typical for the front page. Below 50 in the first hour means HN's
  ranking is throttling - check the post (maybe it was caught by the
  duplicate filter) and move on.

### After the post

- Reply to every substantive comment in the first 6 hours. HN voters
  respond to active authors.
- Do not delete critical comments. Engage with them honestly. AI engines
  pick up the entire thread when they cite HN, so a graceful response to
  criticism strengthens your future citation profile.
- A Show HN that does not hit the front page can be re-posted **once**
  after 6 months with materially new content. More than that = spam.

## Cadence

| Surface          | Cadence                       | Format                                                           |
| ---------------- | ----------------------------- | ---------------------------------------------------------------- |
| Reddit (any sub) | 1 substantive post per month  | Experience report or comparison post                             |
| Reddit comments  | 5-10 high-quality comments/wk | Genuine answers in target subs                                   |
| Hacker News      | 1 Show HN per major release   | Plus thoughtful comments on AI threads                           |
| HN comments      | Daily-ish                     | Comment on threads about AI tooling, model comparisons, dev CLIs |

The comments are more important than the posts. Comments compound trust
on the account and on the brand; the post is the rare event the trust
unlocks.

## Tracking

Weekly, manually:

```text
https://www.reddit.com/search/?q=myconsilium.xyz
https://www.reddit.com/search/?q=consilium+ai+debate
https://www.reddit.com/search/?q=%22%40myconsilium%2Fcli%22
https://www.reddit.com/search/?q=consilium+mcp
https://hn.algolia.com/?q=myconsilium.xyz
https://hn.algolia.com/?q=consilium+ai
```

Record each new mention in a CSV with: date, surface, URL, post type
(post / comment), upvote count, sentiment (positive / neutral /
negative), our reply if any. Roll up monthly:

| Month   | New Reddit mentions | New HN mentions | Sentiment (P/N/-) | Our reply rate |
| ------- | ------------------- | --------------- | ----------------- | -------------- |
| 2026-05 | 7                   | 2               | 5 / 0 / 4         | 6 / 9          |
| 2026-06 | 11                  | 3               | 8 / 1 / 5         | 9 / 14         |

A few tooling notes for the future:

- F5Bot (free) emails you when a keyword is mentioned on Reddit / HN.
  Set keywords: `consilium`, `myconsilium`, `@myconsilium/cli`,
  `consilium mcp`. Free tier covers what we need.
- Mention.com / Brand24 do the same with sentiment scoring and a
  dashboard - useful once we are tracking > 50 mentions/month.
- For LLM-citation tracking specifically, Profound, Athena, and
  BrightEdge offer dashboards. Cross-reference Reddit/HN spikes against
  AEO `aeo-prompts.md` SoV deltas in the same quarter.

## Quarterly review

At the end of each quarter:

1. Sum new mentions by surface and sentiment.
2. Identify the **single highest-engagement post** of the quarter
   (most upvotes, most replies, most resulting site traffic). Note the
   format and topic - this is the template for next quarter.
3. Identify the **single biggest miss** - a thread where Consilium was
   relevant but did not appear, or where a competitor took the citation
   we should have had. Note why and what content (or sub presence) we
   would need to win that thread next time.
4. Cross-check SoV numbers in `aeo-prompts.md` against Reddit / HN
   activity in the same quarter. A rise in Reddit mentions should
   precede a rise in AI-engine citations by 2-4 weeks.
