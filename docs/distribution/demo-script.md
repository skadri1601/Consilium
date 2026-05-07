# Landing-page demo recording script

This doc describes the asciinema cast that should land on the
marketing page hero. The actual `.cast` file goes at
`apps/web/public/demo/consilium-council.cast`. This PR ships a
placeholder cast and the embed component; record the real thing as
a follow-up before promoting the page externally.

## Why we need it

Verified gap: today the landing page has a CLI install snippet and a
provider logo strip but **nothing that shows the wedge in motion**.
Developers don't believe "multi-provider in one CLI" until they see
all 7 logos echo back in real time during a single run.

## What the cast should show (under 45s)

1. **0:00–0:03** - fresh terminal. `consilium debate "Should we use Postgres or Neon?"`
2. **0:03–0:06** - Consilium banner, project auto-detection log:
   ```
     Loaded 47 context files (412 KB)
     Attached git context (branch: main - no uncommitted changes)
     Loaded project memory (3 prior debates in .consilium/memory.md)
     [tools] 7 built-in (read/edit/grep/...) + 0 from MCP servers
   ```
3. **0:06–0:09** - Routing log if free-tier:
   ```
     Using Consilium free tier for 3 model(s).
       claude-sonnet-4-6  -> groq:llama-3.3-70b-versatile
       gpt-5.4            -> groq:llama-3.3-70b-versatile
       gemini-3.1-pro-preview -> openrouter:nvidia/nemotron-3-super-120b-a12b:free
   ```
4. **0:09–0:25** - Council in progress. Per-model rounded cards live-updating:
   - Claude Sonnet 4.6: thinking → done (4.1s)
   - GPT-5.4: thinking → done (3.7s)
   - Gemini 3.1 Pro: thinking → done (5.2s)
5. **0:25–0:30** - Cross-examination phase ticks. Convergence climbs 0% → 81%.
6. **0:30–0:38** - `## Synthesis` panel renders. Final golden prompt with the trade-off analysis.
7. **0:38–0:42** - `✓ Debate complete.` + cost line: `$0.0431 · 5,421 tokens`.
8. **0:42–0:45** - fade.

## How to record

```bash
# Terminal sized 100x30, dark background, big readable font (16-18pt)
asciinema rec apps/web/public/demo/consilium-council.cast --idle-time-limit 1.5 --rows 30 --cols 100

# Inside the recording:
clear
consilium debate "Should we use Postgres or Neon?" --mode council \
  -m claude-sonnet-4-6 gpt-5.4 gemini-3.1-pro-preview

# Wait for the synthesis to render, then exit:
exit
```

## How to embed

The marketing page imports `<AsciinemaPlayer>` from
`apps/web/src/components/asciinema-player.tsx` (added in this PR).
That component lazy-loads `asciinema-player` from a CDN so we
don't bloat the bundle.

Drop in:

```tsx
<AsciinemaPlayer
  src="/demo/consilium-council.cast"
  cols={100}
  rows={30}
  autoPlay
  loop
  idleTimeLimit={1.5}
  poster="npt:0:08" // start at the most-visual moment
/>
```

## Variants worth recording later

- **debate-pr** - `consilium debate-pr 123` showing the council reviewing a real GitHub PR diff
- **debate-failing** - running a project's tests, hitting a failure, debating the fix
- **MCP from Cursor** - Cursor pane on the left, Consilium MCP progress + synthesis on the right
- **/apply** - the council proposes structured edits, user runs `/apply`, files change with rollback id

Each variant gets its own embed slot on a different page (use-cases / docs).

## Placeholder cast

Until the real recording is captured, `consilium-council.cast` ships
a minimal placeholder so the embed renders something valid in the
preview environment. Replace it before the marketing push.
