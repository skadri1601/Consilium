---
description: Architecture mapping and codebase understanding
globs: ["**"]
---

- Before starting large tasks, check the graphify knowledge graph at `graphify-out/` for codebase structure:
  - `graphify-out/GRAPH_REPORT.md` — 3,295 nodes, 5,286 edges, 477 communities mapping the entire codebase
  - `graphify-out/obsidian/` — Obsidian vault with community hubs for navigating architecture
  - Key communities: Deliberation Engine, Agent Factory, Blind Evaluation, SDK Client, Web API Routes, Debate Routing
- Use `/graphify` to regenerate the graph after major structural changes
- When exploring unfamiliar code areas, check the relevant community hub first to understand relationships
- The graph maps: file dependencies, function calls, type references, module boundaries, and inferred relationships
