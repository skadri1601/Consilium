/**
 * Vanilla TS webview for the live debate panel. Bundled separately
 * from the extension via esbuild (target: browser, format: iife) so
 * it never touches Node APIs and stays small.
 *
 * Listens for postMessage from the extension host:
 *   { type: "event", event: <DebateEvent> }
 *   { type: "reset" }
 */

interface VsCodeApi {
  postMessage(message: unknown): void;
  setState(state: unknown): void;
  getState<T>(): T | undefined;
}
declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();

type DebateEvent = {
  type?: string;
  event?: string;
  agent?: string;
  text?: string;
  error?: string;
  total_cost?: number;
  total_tokens?: number;
  golden_prompt?: string;
  goldenPrompt?: string;
  topic?: string;
  mode?: string;
  id?: string;
  resolutions?: Array<{
    requested_model: string;
    effective_provider: string;
    effective_model: string;
    fallback_reason?: string;
  }>;
  [k: string]: unknown;
};

interface AgentCard {
  name: string;
  status: "thinking" | "done" | "errored";
  content: string;
  startTime: number;
  durationMs?: number;
}

const state = {
  topic: "",
  mode: "",
  agents: new Map<string, AgentCard>(),
  consensus: "",
  totalCost: undefined as number | undefined,
  totalTokens: undefined as number | undefined,
  status: "",
};

const els = {
  empty: document.getElementById("empty-state")!,
  debate: document.getElementById("debate")!,
  topic: document.getElementById("topic")!,
  meta: document.getElementById("meta")!,
  agents: document.getElementById("agents")!,
  synthesis: document.getElementById("synthesis")!,
  status: document.getElementById("status")!,
  cost: document.getElementById("cost")!,
};

function reset(): void {
  state.topic = "";
  state.mode = "";
  state.agents.clear();
  state.consensus = "";
  state.totalCost = undefined;
  state.totalTokens = undefined;
  state.status = "Starting…";
  render();
}

function render(): void {
  if (!state.topic) {
    els.empty.classList.remove("hidden");
    els.debate.classList.add("hidden");
    return;
  }
  els.empty.classList.add("hidden");
  els.debate.classList.remove("hidden");

  els.topic.textContent = state.topic;
  els.meta.textContent = state.mode ? `Mode: ${state.mode}` : "";

  els.agents.innerHTML = "";
  for (const card of state.agents.values()) {
    els.agents.appendChild(renderCard(card));
  }

  if (state.consensus) {
    els.synthesis.innerHTML = "";
    const h = document.createElement("h3");
    h.textContent = "Synthesis";
    const body = document.createElement("div");
    body.className = "synthesis-body";
    body.textContent = state.consensus;
    els.synthesis.appendChild(h);
    els.synthesis.appendChild(body);
  } else {
    els.synthesis.innerHTML = "";
  }

  els.status.textContent = state.status || "";
  if (state.totalCost !== undefined || state.totalTokens !== undefined) {
    const cost =
      state.totalCost !== undefined ? `$${state.totalCost.toFixed(4)}` : "";
    const tok =
      state.totalTokens !== undefined
        ? `${state.totalTokens.toLocaleString()} tokens`
        : "";
    els.cost.textContent = [cost, tok].filter(Boolean).join(" · ");
  } else {
    els.cost.textContent = "";
  }
}

function renderCard(card: AgentCard): HTMLElement {
  const wrap = document.createElement("article");
  wrap.className = `agent-card agent-${card.status}`;

  const header = document.createElement("header");
  header.className = "agent-header";

  const dot = document.createElement("span");
  dot.className = "agent-dot";
  dot.textContent =
    card.status === "done"
      ? "✓"
      : card.status === "errored"
        ? "✗"
        : "·";
  header.appendChild(dot);

  const name = document.createElement("span");
  name.className = "agent-name";
  name.textContent = card.name;
  header.appendChild(name);

  if (card.durationMs !== undefined) {
    const duration = document.createElement("span");
    duration.className = "agent-duration";
    duration.textContent = `${(card.durationMs / 1000).toFixed(1)}s`;
    header.appendChild(duration);
  } else {
    const elapsed = Math.floor((Date.now() - card.startTime) / 1000);
    const duration = document.createElement("span");
    duration.className = "agent-duration";
    duration.textContent = `${elapsed}s`;
    header.appendChild(duration);
  }

  wrap.appendChild(header);

  const body = document.createElement("div");
  body.className = "agent-body";
  body.textContent = card.content || (card.status === "thinking" ? "thinking…" : "");
  wrap.appendChild(body);
  return wrap;
}

function handleEvent(event: DebateEvent): void {
  const type = event.type ?? event.event;
  switch (type) {
    case "debate_start":
      state.topic = event.topic ?? state.topic ?? "(running…)";
      state.mode = event.mode ?? state.mode;
      state.status = "Council started";
      break;
    case "debate_id":
      // Optional — could surface the id for the open-in-web button
      break;
    case "agent_start": {
      const name = event.agent ?? "agent";
      state.agents.set(name, {
        name,
        status: "thinking",
        content: "",
        startTime: Date.now(),
      });
      state.status = `${name} thinking…`;
      break;
    }
    case "agent_chunk": {
      const name = event.agent ?? Array.from(state.agents.keys()).pop() ?? "";
      const card = state.agents.get(name);
      if (card && event.text) card.content += event.text;
      break;
    }
    case "agent_complete": {
      const name = event.agent ?? Array.from(state.agents.keys()).pop() ?? "";
      const card = state.agents.get(name);
      if (card) {
        card.status = "done";
        card.durationMs = Date.now() - card.startTime;
      }
      state.status = `${name} finished`;
      break;
    }
    case "consensus":
      if (event.text) state.consensus = event.text;
      break;
    case "done":
      state.status = "Done";
      if (event.total_cost !== undefined) state.totalCost = event.total_cost;
      if (event.total_tokens !== undefined)
        state.totalTokens = event.total_tokens;
      if (event.golden_prompt && !state.consensus)
        state.consensus = event.golden_prompt;
      if (event.goldenPrompt && !state.consensus)
        state.consensus = event.goldenPrompt;
      break;
    case "cancelled":
      state.status = "Cancelled";
      break;
    case "error":
      state.status = `Error: ${event.error ?? "unknown"}`;
      break;
    case "routing:fallback":
      state.status = `Routing ${event.resolutions?.length ?? 0} model(s) to free tier`;
      break;
    case "tool:call_request":
      state.status = `Tool requested: ${event.name ?? "(unknown)"}`;
      break;
    default:
      // Unknown event types are surfaced as status hints.
      if (typeof type === "string") {
        state.status = type.replace(/_/g, " ");
      }
  }
  render();
}

window.addEventListener("message", (msg) => {
  const data = msg.data as { type?: string; event?: DebateEvent };
  if (!data || typeof data !== "object") return;
  if (data.type === "reset") {
    reset();
  } else if (data.type === "event" && data.event) {
    handleEvent(data.event);
  }
});

// Tick once per second so duration counters stay live while the
// stream isn't sending events.
setInterval(() => {
  if (state.agents.size > 0) render();
}, 1000);

vscode.postMessage({ type: "ready" });
render();
