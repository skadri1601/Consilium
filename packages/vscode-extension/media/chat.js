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
    if (empty && empty.parentNode === transcript) {
      transcript.removeChild(empty);
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

  window.addEventListener("message", (event) => {
    // Verify the origin of incoming messages (SonarQube S2819).
    // VS Code dispatches extension messages from the parent workbench frame,
    // which targets this webview's own origin. Reject anything from a foreign
    // origin or unexpected source as defense-in-depth on top of the strict CSP.
    const trustedOrigin =
      !event.origin ||
      event.origin === window.origin ||
      event.origin === "null" ||
      /^vscode-/.test(event.origin);
    if (!trustedOrigin) return;
    if (event.source !== window.parent && event.source !== window) return;
    const msg = event.data;
    if (!msg || typeof msg !== "object") return;
    switch (msg.type) {
      case "init":
        if (msg.workspaceContext) {
          contextHint.textContent = `Workspace context: ${msg.workspaceContext.sent}/${msg.workspaceContext.scanned} files`;
        }
        return;
      case "auth":
        if (msg.authenticated) {
          setStatus("Idle");
          submit.disabled = false;
        } else {
          setStatus("Signed out", "error");
          submit.disabled = true;
          appendSystem("Sign in to start a debate. Run: Consilium: Sign In.");
        }
        return;
      case "started":
        clearTranscript();
        appendUser(msg.topic, msg.mode);
        setStatus(`Running · ${msg.mode}`, "running");
        setActive(true);
        return;
      case "event":
        handleEvent(msg.event);
        return;
      case "completed":
        setStatus("Completed", "done");
        setActive(false);
        return;
      case "error":
        appendError(msg.message);
        setStatus("Error", "error");
        setActive(false);
        return;
      case "cancelled":
        appendSystem("Debate cancelled.");
        setStatus("Cancelled");
        setActive(false);
        return;
      case "clear":
        clearTranscript();
        setStatus("Idle");
        return;
    }
  });

  function handleEvent(ev) {
    if (!ev || typeof ev !== "object") return;
    const eventType = ev.event || ev.type;
    switch (eventType) {
      case "debate_start":
      case "deliberation_start":
        appendSystem(
          `Started · models: ${(ev.models || []).join(", ") || "—"}`,
        );
        return;
      case "round_start":
        appendSystem(`Round ${ev.round}: ${ev.description || ""}`);
        return;
      case "agent_start": {
        const node = getOrCreateAgentNode(ev.agentId || "agent");
        if (node.meta && ev.roundNumber !== undefined) {
          node.meta.textContent = `Round ${ev.roundNumber}`;
        }
        return;
      }
      case "agent_chunk": {
        const node = getOrCreateAgentNode(ev.agentId || "agent");
        node.body.textContent += ev.chunk || "";
        transcript.scrollTop = transcript.scrollHeight;
        return;
      }
      case "agent_complete": {
        const node = getOrCreateAgentNode(ev.agentId || "agent");
        if (node.meta) {
          const cost =
            typeof ev.cost === "number" ? `$${ev.cost.toFixed(3)}` : "";
          const tokens =
            typeof ev.tokens === "number" ? `${ev.tokens} tok` : "";
          node.meta.textContent = [tokens, cost].filter(Boolean).join(" · ");
        }
        return;
      }
      case "convergence_detected":
        appendSystem(
          `Convergence detected · similarity ${
            ev.similarity ? ev.similarity.toFixed(2) : "?"
          }${ev.skippingRounds ? " · skipping rounds" : ""}`,
        );
        return;
      case "phase_change":
        appendSystem(`Phase: ${ev.phase || "?"}`);
        return;
      case "vote_cast":
        appendSystem(
          `Vote cast: ${(ev.vote && ev.vote.modelId) || "?"} → ${(ev.vote && ev.vote.choice) || "?"}`,
        );
        return;
      case "dissent_detected":
        appendSystem(
          `Dissent detected: ${(ev.dissent && ev.dissent.summary) || "—"}`,
        );
        return;
      case "cost_update":
        if (typeof ev.totalCost === "number") {
          status.textContent = `Running · $${ev.totalCost.toFixed(3)}`;
        }
        return;
      case "judge_start":
        appendSystem(`Judge starting${ev.judgeModel ? ` · ${ev.judgeModel}` : ""}`);
        return;
      case "consensus":
        appendConsensus(ev.goldenPrompt, ev.totalCost);
        return;
      case "routing:fallback":
        appendSystem(
          `Routing fallback applied${
            ev.resolutions
              ? ` · ${JSON.stringify(ev.resolutions)}`
              : ""
          }`,
        );
        return;
      case "tool:call_request":
        appendSystem(`Tool call requested: ${ev.name || "?"}`);
        return;
      case "tool:call_completed":
        appendSystem(`Tool call completed: ${ev.name || "?"}`);
        return;
      case "tool:call_failed":
        appendSystem(`Tool call failed: ${ev.name || "?"} — ${ev.message || "?"}`);
        return;
      case "done":
      case "deliberation_complete":
        appendSystem(
          `Done · status: ${ev.status || "?"}${
            typeof ev.totalCost === "number"
              ? ` · $${ev.totalCost.toFixed(3)}`
              : ""
          }`,
        );
        if (ev.goldenPrompt && !document.querySelector(".cn-msg.consensus")) {
          appendConsensus(ev.goldenPrompt, ev.totalCost);
        }
        return;
      case "error":
        appendError(ev.message || "Unknown error");
        return;
      case "debate:cancelled":
        appendSystem(`Cancelled: ${ev.reason || "user request"}`);
        return;
      case "keepalive":
      case "timeout":
        return;
      default:
        if (eventType) {
          appendSystem(`[${eventType}]`);
        }
    }
  }

  vscode.postMessage({ type: "ready" });
})();
