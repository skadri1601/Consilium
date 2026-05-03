// Webview script for the Consilium council panel.
// Communicates with the extension host via vscode.postMessage.
(function () {
  "use strict";
  const vscode = acquireVsCodeApi();

  const transcript = document.getElementById("cn-transcript");
  const empty = document.getElementById("cn-empty");
  const input = document.getElementById("cn-input");
  const submit = document.getElementById("cn-submit");
  const cancel = document.getElementById("cn-cancel");
  const modeSelect = document.getElementById("cn-mode");
  const status = document.getElementById("cn-status");
  const dot = document.querySelector(".cn-dot");
  const contextHint = document.getElementById("cn-context-hint");

  const persisted = vscode.getState() || {};
  if (persisted.lastMode) modeSelect.value = persisted.lastMode;

  const agentNodes = new Map();

  function setStatus(text, cls) {
    status.textContent = text;
    dot.classList.remove("running", "error", "done");
    if (cls) dot.classList.add(cls);
  }

  function setActive(active) {
    submit.disabled = active;
    cancel.hidden = !active;
    modeSelect.disabled = active;
  }

  function clearEmpty() {
    if (empty?.parentNode === transcript) {
      empty.remove();
    }
  }

  function appendNode(node) {
    clearEmpty();
    transcript.appendChild(node);
    transcript.scrollTop = transcript.scrollHeight;
  }

  function makeMessageNode(kind, header) {
    const wrapper = document.createElement("div");
    wrapper.className = `cn-msg ${kind}`;
    if (header) {
      const head = document.createElement("div");
      head.className = "cn-msg-header";
      const name = document.createElement("span");
      name.className = "cn-agent-name";
      name.textContent = header;
      head.appendChild(name);
      const meta = document.createElement("span");
      meta.className = "cn-agent-meta";
      head.appendChild(meta);
      wrapper.appendChild(head);
    }
    const body = document.createElement("div");
    body.className = "cn-msg-body";
    wrapper.appendChild(body);
    return { wrapper, body, meta: wrapper.querySelector(".cn-agent-meta") };
  }

  function appendUser(topic, mode) {
    const { wrapper, body } = makeMessageNode("user", `You · ${mode}`);
    body.textContent = topic;
    appendNode(wrapper);
  }

  function appendSystem(text) {
    const { wrapper, body } = makeMessageNode("system");
    body.textContent = text;
    appendNode(wrapper);
  }

  function appendError(text) {
    const { wrapper, body } = makeMessageNode("error", "Error");
    body.textContent = text;
    appendNode(wrapper);
  }

  function getOrCreateAgentNode(agentId) {
    let node = agentNodes.get(agentId);
    if (!node) {
      node = makeMessageNode("agent", agentId);
      appendNode(node.wrapper);
      agentNodes.set(agentId, node);
    }
    return node;
  }

  function appendConsensus(goldenPrompt, totalCost) {
    const { wrapper, body, meta } = makeMessageNode(
      "consensus",
      "Consensus · Golden Prompt",
    );
    body.textContent = goldenPrompt || "(empty)";
    if (meta && typeof totalCost === "number") {
      meta.textContent = `$${totalCost.toFixed(3)}`;
    }
    const actions = document.createElement("div");
    actions.className = "cn-actions";

    const insertBtn = document.createElement("button");
    insertBtn.className = "cn-action-btn";
    insertBtn.textContent = "Insert at cursor";
    insertBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "insertGoldenPrompt", goldenPrompt });
    });
    actions.appendChild(insertBtn);

    const copyBtn = document.createElement("button");
    copyBtn.className = "cn-action-btn";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "copyGoldenPrompt", goldenPrompt });
    });
    actions.appendChild(copyBtn);

    const newBtn = document.createElement("button");
    newBtn.className = "cn-action-btn";
    newBtn.textContent = "New file";
    newBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "openInNewFile", goldenPrompt });
    });
    actions.appendChild(newBtn);

    wrapper.appendChild(actions);
    appendNode(wrapper);
  }

  function clearTranscript() {
    transcript.innerHTML = "";
    transcript.appendChild(empty);
    agentNodes.clear();
  }

  submit.addEventListener("click", () => {
    const topic = input.value.trim();
    if (!topic) return;
    const mode = modeSelect.value;
    vscode.setState({ ...persisted, lastMode: mode });
    vscode.postMessage({ type: "submit", topic, mode });
    input.value = "";
  });

  cancel.addEventListener("click", () => {
    vscode.postMessage({ type: "cancel" });
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit.click();
    }
  });

  const messageHandlers = {
    init: (msg) => {
      if (msg.workspaceContext) {
        contextHint.textContent = `Workspace context: ${msg.workspaceContext.sent}/${msg.workspaceContext.scanned} files`;
      }
    },
    auth: (msg) => {
      if (msg.authenticated) {
        setStatus("Idle");
        submit.disabled = false;
      } else {
        setStatus("Signed out", "error");
        submit.disabled = true;
        appendSystem("Sign in to start a debate. Run: Consilium: Sign In.");
      }
    },
    started: (msg) => {
      clearTranscript();
      appendUser(msg.topic, msg.mode);
      setStatus(`Running · ${msg.mode}`, "running");
      setActive(true);
    },
    event: (msg) => handleEvent(msg.event),
    completed: () => {
      setStatus("Completed", "done");
      setActive(false);
    },
    error: (msg) => {
      appendError(msg.message);
      setStatus("Error", "error");
      setActive(false);
    },
    cancelled: () => {
      appendSystem("Debate cancelled.");
      setStatus("Cancelled");
      setActive(false);
    },
    clear: () => {
      clearTranscript();
      setStatus("Idle");
    },
  };

  globalThis.addEventListener("message", (event) => {
    // Verify the origin of incoming messages (SonarQube javascript:S2819).
    // VS Code webview messages arrive from the workbench parent frame and
    // carry a vscode-webview:// origin (or "null"/empty under some sandbox
    // contexts). Reject anything else as defense-in-depth on top of the
    // strict CSP we set on the panel HTML.
    if (
      event.origin !== globalThis.origin &&
      event.origin !== "null" &&
      event.origin !== "" &&
      !event.origin.startsWith("vscode-")
    ) {
      return;
    }
    if (event.source !== globalThis.parent && event.source !== globalThis) return;
    const msg = event.data;
    if (!msg || typeof msg !== "object") return;
    const handler = messageHandlers[msg.type];
    if (handler) handler(msg);
  });

  function appendDebateStart(ev) {
    appendSystem(`Started · models: ${(ev.models || []).join(", ") || "—"}`);
  }

  function appendRoundStart(ev) {
    appendSystem(`Round ${ev.round}: ${ev.description || ""}`);
  }

  function handleAgentStart(ev) {
    const node = getOrCreateAgentNode(ev.agentId || "agent");
    if (node.meta && ev.roundNumber !== undefined) {
      node.meta.textContent = `Round ${ev.roundNumber}`;
    }
  }

  function handleAgentChunk(ev) {
    const node = getOrCreateAgentNode(ev.agentId || "agent");
    node.body.textContent += ev.chunk || "";
    transcript.scrollTop = transcript.scrollHeight;
  }

  function handleAgentComplete(ev) {
    const node = getOrCreateAgentNode(ev.agentId || "agent");
    if (!node.meta) return;
    const cost = typeof ev.cost === "number" ? `$${ev.cost.toFixed(3)}` : "";
    const tokens = typeof ev.tokens === "number" ? `${ev.tokens} tok` : "";
    node.meta.textContent = [tokens, cost].filter(Boolean).join(" · ");
  }

  function appendConvergence(ev) {
    const similarity = ev.similarity ? ev.similarity.toFixed(2) : "?";
    const skipping = ev.skippingRounds ? " · skipping rounds" : "";
    appendSystem(`Convergence detected · similarity ${similarity}${skipping}`);
  }

  function appendPhaseChange(ev) {
    appendSystem(`Phase: ${ev.phase || "?"}`);
  }

  function appendVoteCast(ev) {
    const modelId = ev.vote?.modelId || "?";
    const choice = ev.vote?.choice || "?";
    appendSystem(`Vote cast: ${modelId} → ${choice}`);
  }

  function appendDissentDetected(ev) {
    const summary = ev.dissent?.summary || "—";
    appendSystem(`Dissent detected: ${summary}`);
  }

  function applyCostUpdate(ev) {
    if (typeof ev.totalCost === "number") {
      status.textContent = `Running · $${ev.totalCost.toFixed(3)}`;
    }
  }

  function appendJudgeStart(ev) {
    const judgeSuffix = ev.judgeModel ? ` · ${ev.judgeModel}` : "";
    appendSystem(`Judge starting${judgeSuffix}`);
  }

  function appendConsensusEvent(ev) {
    appendConsensus(ev.goldenPrompt, ev.totalCost);
  }

  function appendRoutingFallback(ev) {
    const detail = ev.resolutions ? ` · ${JSON.stringify(ev.resolutions)}` : "";
    appendSystem(`Routing fallback applied${detail}`);
  }

  function appendToolRequest(ev) {
    appendSystem(`Tool call requested: ${ev.name || "?"}`);
  }

  function appendToolCompleted(ev) {
    appendSystem(`Tool call completed: ${ev.name || "?"}`);
  }

  function appendToolFailed(ev) {
    appendSystem(`Tool call failed: ${ev.name || "?"} — ${ev.message || "?"}`);
  }

  function appendDone(ev) {
    const costSuffix =
      typeof ev.totalCost === "number" ? ` · $${ev.totalCost.toFixed(3)}` : "";
    appendSystem(`Done · status: ${ev.status || "?"}${costSuffix}`);
    if (ev.goldenPrompt && !document.querySelector(".cn-msg.consensus")) {
      appendConsensus(ev.goldenPrompt, ev.totalCost);
    }
  }

  function appendErrorEvent(ev) {
    appendError(ev.message || "Unknown error");
  }

  function appendDebateCancelled(ev) {
    appendSystem(`Cancelled: ${ev.reason || "user request"}`);
  }

  function noop() {}

  const eventHandlers = {
    debate_start: appendDebateStart,
    deliberation_start: appendDebateStart,
    round_start: appendRoundStart,
    agent_start: handleAgentStart,
    agent_chunk: handleAgentChunk,
    agent_complete: handleAgentComplete,
    convergence_detected: appendConvergence,
    phase_change: appendPhaseChange,
    vote_cast: appendVoteCast,
    dissent_detected: appendDissentDetected,
    cost_update: applyCostUpdate,
    judge_start: appendJudgeStart,
    consensus: appendConsensusEvent,
    "routing:fallback": appendRoutingFallback,
    "tool:call_request": appendToolRequest,
    "tool:call_completed": appendToolCompleted,
    "tool:call_failed": appendToolFailed,
    done: appendDone,
    deliberation_complete: appendDone,
    error: appendErrorEvent,
    "debate:cancelled": appendDebateCancelled,
    keepalive: noop,
    timeout: noop,
  };

  function handleEvent(ev) {
    if (!ev || typeof ev !== "object") return;
    const eventType = ev.event || ev.type;
    const handler = eventHandlers[eventType];
    if (handler) {
      handler(ev);
    } else if (eventType) {
      appendSystem(`[${eventType}]`);
    }
  }

  vscode.postMessage({ type: "ready" });
})();
