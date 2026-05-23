# AI Bot Log Parsing Methodology

How to extract AI crawler hit counts from production access logs so we
can track whether our AEO / GEO allow-list (see
`apps/web/src/app/robots.ts`) is actually being honored by the bots we
allowed in.

## Why this matters

Allowing a bot in `robots.txt` is necessary but not sufficient. The bot
still has to choose to crawl us. Tracking hits per bot per day tells us:

- Whether GPTBot, ClaudeBot, PerplexityBot, etc. are actually crawling.
- Which pages they prefer (informs which URLs go in `llms.txt`).
- Whether disallowed bots (Bytespider) are ignoring `robots.txt` (they
  usually do; the data justifies escalating to a WAF rule if so).
- Trend lines per bot. A drop in GPTBot hits = OpenAI changed crawl
  schedule or de-prioritized our domain.

## User-agent patterns to grep for

The patterns below match the documented user-agent strings. They are
case-sensitive in some logs (Vercel preserves case; nginx default does
too) and case-insensitive in others (Cloudflare normalizes). Use `grep
-Ei` to be safe and `grep -E` when you specifically want case-exact.

| Bot                | Pattern fragment     | Family                                                 |
| ------------------ | -------------------- | ------------------------------------------------------ |
| GPTBot             | `GPTBot`             | OpenAI training crawler                                |
| OAI-SearchBot      | `OAI-SearchBot`      | OpenAI ChatGPT Search                                  |
| ChatGPT-User       | `ChatGPT-User`       | OpenAI on-demand fetch (user clicked a link)           |
| ClaudeBot          | `ClaudeBot`          | Anthropic training crawler                             |
| Claude-Web         | `Claude-Web`         | Anthropic web search agent                             |
| Claude-User        | `Claude-User`        | Anthropic on-demand user fetch                         |
| anthropic-ai       | `anthropic-ai`       | Legacy Anthropic UA, still seen                        |
| PerplexityBot      | `PerplexityBot`      | Perplexity index crawler                               |
| Perplexity-User    | `Perplexity-User`    | Perplexity on-demand user fetch                        |
| Google-Extended    | `Google-Extended`    | Google AI / Gemini grounding (sub-UA of Googlebot)     |
| Applebot-Extended  | `Applebot-Extended`  | Apple Intelligence training                            |
| CCBot              | `CCBot`              | Common Crawl (feeds many LLMs)                         |
| cohere-ai          | `cohere-ai`          | Cohere web search                                      |
| FacebookBot        | `FacebookBot`        | Meta / Facebook training crawler                       |
| Meta-ExternalAgent | `Meta-ExternalAgent` | Meta AI on-demand fetch                                |
| YouBot             | `YouBot`             | You.com index                                          |
| Diffbot            | `Diffbot`            | Diffbot extraction                                     |
| DuckAssistBot      | `DuckAssistBot`      | DuckDuckGo AI                                          |
| MistralAI-User     | `MistralAI-User`     | Mistral on-demand fetch                                |
| ImagesiftBot       | `ImagesiftBot`       | Imagesift index                                        |
| Amazonbot          | `Amazonbot`          | Amazon (Rufus / Alexa LLM grounding)                   |
| Bytespider         | `Bytespider`         | ByteDance / TikTok (DISALLOWED - track for compliance) |

Consolidated regex for one-pass parsing (extended grep syntax):

```text
(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|Claude-User|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|CCBot|cohere-ai|FacebookBot|Meta-ExternalAgent|YouBot|Diffbot|DuckAssistBot|MistralAI-User|ImagesiftBot|Amazonbot|Bytespider)
```

## Where the logs live

| Surface | Source                                           | Format              |
| ------- | ------------------------------------------------ | ------------------- |
| Web app | Vercel project logs (Drains -> Datadog / S3)     | NDJSON, one per req |
| API     | Render service logs                              | Text, mixed         |
| Agents  | Render / DigitalOcean droplet uvicorn access log | Combined nginx-ish  |
| Edge    | Cloudflare / Vercel Edge analytics               | Per-platform UI     |

Standard nginx combined log layout:

```text
$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"
```

Vercel log drain NDJSON shape (relevant fields):

```json
{
  "timestampInMs": 0,
  "requestMethod": "GET",
  "requestUrl": "/docs",
  "statusCode": 200,
  "requestUserAgent": "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)"
}
```

## One-liners

### Daily hit counts per bot (nginx combined format)

```bash
grep -E '(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|Claude-User|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|CCBot|cohere-ai|FacebookBot|Meta-ExternalAgent|YouBot|Diffbot|DuckAssistBot|MistralAI-User|ImagesiftBot|Amazonbot|Bytespider)' /var/log/nginx/access.log \
  | awk -F'"' '{print $6}' \
  | grep -Eo '(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|Claude-User|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|CCBot|cohere-ai|FacebookBot|Meta-ExternalAgent|YouBot|Diffbot|DuckAssistBot|MistralAI-User|ImagesiftBot|Amazonbot|Bytespider)' \
  | sort | uniq -c | sort -rn
```

Output:

```text
 412 GPTBot
 287 Google-Extended
 211 ClaudeBot
 156 PerplexityBot
  74 CCBot
  48 OAI-SearchBot
  31 ChatGPT-User
  14 Bytespider
```

### Per-bot, per-day rollup (last 30 days)

```bash
zcat /var/log/nginx/access.log.*.gz /var/log/nginx/access.log \
  | awk '
      BEGIN { FS="\""; OFS="," }
      {
        match($0, /\[([^]]+)\]/, ts); split(ts[1], parts, ":"); day = parts[1];
        ua = $6;
        bots = "GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|Claude-User|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|CCBot|cohere-ai|FacebookBot|Meta-ExternalAgent|YouBot|Diffbot|DuckAssistBot|MistralAI-User|ImagesiftBot|Amazonbot|Bytespider";
        if (match(ua, bots) > 0) {
          bot = substr(ua, RSTART, RLENGTH);
          counts[day "," bot]++;
        }
      }
      END {
        for (k in counts) print k "," counts[k];
      }
    ' \
  | sort > ai-bot-hits.csv
```

Output (`day,bot,hits` CSV):

```text
18/May/2026,ClaudeBot,193
18/May/2026,GPTBot,389
18/May/2026,Google-Extended,254
19/May/2026,ClaudeBot,201
19/May/2026,GPTBot,412
...
```

### Top URLs per bot (which pages are most-crawled)

```bash
grep 'GPTBot' /var/log/nginx/access.log \
  | awk -F'"' '{print $2}' \
  | awk '{print $2}' \
  | sort | uniq -c | sort -rn | head -25
```

Use this to validate that AI bots are hitting the pages we want cited:
`/`, `/pricing`, `/docs`, `/vs-claude-code`, `/blog/*`, `/llms.txt`,
`/llms-full.txt`.

### Vercel log drain (NDJSON via jq)

```bash
cat vercel-logs.ndjson \
  | jq -r 'select(.requestUserAgent | test("GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|Claude-User|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|CCBot|cohere-ai|FacebookBot|Meta-ExternalAgent|YouBot|Diffbot|DuckAssistBot|MistralAI-User|ImagesiftBot|Amazonbot|Bytespider"))
            | [(.timestampInMs / 1000 | strftime("%Y-%m-%d")),
               (.requestUserAgent | capture("(?<bot>GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|Claude-User|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Applebot-Extended|CCBot|cohere-ai|FacebookBot|Meta-ExternalAgent|YouBot|Diffbot|DuckAssistBot|MistralAI-User|ImagesiftBot|Amazonbot|Bytespider)").bot),
               .requestUrl] | @tsv' \
  | sort | uniq -c | sort -rn > vercel-ai-bot-hits.tsv
```

### Disallowed-bot violations (Bytespider hitting allowed paths)

```bash
grep 'Bytespider' /var/log/nginx/access.log \
  | awk -F'"' '{print $2, $6}' \
  | sort | uniq -c | sort -rn
```

If Bytespider hits non-zero counts on pages outside the standard JS / CSS
asset path, escalate to a Cloudflare WAF / Vercel Firewall rule. Robots
compliance is voluntary; the WAF is not.

## Forward reference: `consilium` CLI summary command

Once parsed CSVs land in S3 / a local directory, the future-state CLI
flow is:

```bash
# Summarize last 7 days of AI bot activity
consilium seo ai-bots summary --since 7d --source ai-bot-hits.csv

# Top URLs cited by GPTBot last 30 days
consilium seo ai-bots top --bot GPTBot --since 30d

# Alert when GPTBot hits drop > 30% week-over-week
consilium seo ai-bots watch --bot GPTBot --alert-on drop --threshold 0.3
```

These subcommands are not implemented yet. When implemented they should
live in `packages/cli/src/commands/seo.ts` and call into the API
(`apps/api/src/features/seo/`) so the same data is available in the web
dashboard. Until then, run the awk / jq one-liners above and drop the
CSV into the weekly briefing.

## Expected baselines (dev-tool SaaS, well-indexed)

| Bot             | Daily hits (steady state) | Notes                                             |
| --------------- | ------------------------- | ------------------------------------------------- |
| GPTBot          | 100 - 500                 | High on doc pages; drops if you add `Crawl-delay` |
| Google-Extended | 50 - 300                  | Tracks Googlebot volume; shows up in GSC too      |
| ClaudeBot       | 50 - 250                  | Anthropic crawls less frequently than OpenAI      |
| PerplexityBot   | 30 - 150                  | Heavy on freshly published blog posts             |
| CCBot           | 20 - 80                   | Less frequent; quarterly bursts                   |
| OAI-SearchBot   | 10 - 60                   | Spikes with new content                           |
| ChatGPT-User    | 5 - 50                    | Reflects real ChatGPT users clicking links        |
| Bytespider      | 0 (target)                | Anything above 0 = WAF escalation candidate       |
| Everything else | 0 - 30                    | Often single-digit; trend matters more than abs   |

If GPTBot is under 50/day or ClaudeBot is under 25/day for a week, audit:

- `apps/web/src/app/robots.ts` - is the bot still in the allow-list?
- `apps/web/public/llms.txt` and `/llms-full.txt` - reachable, fresh?
- Sitemap submission in Google Search Console and Bing Webmaster Tools.
- Vercel firewall rules - we sometimes auto-rate-limit; check there.
- Whether the bot is hitting an alternate origin (preview deployments).

## Cadence

- **Daily**: tail the access log and graph hits per bot (Grafana / Datadog).
- **Weekly**: commit the rolled-up CSV to ops storage; eyeball for anomalies.
- **Monthly**: include in the briefing - top 5 URLs per bot, week-over-week
  deltas, any disallowed-bot violations.
- **Quarterly**: review against the SoV numbers in `aeo-prompts.md`. If SoV
  is up while bot hits are flat, content quality is improving. If both are
  flat, content investment needs to increase.
