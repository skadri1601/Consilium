import * as vscode from "vscode";

export interface DebatePanelHtmlOptions {
  webview: vscode.Webview;
  nonce: string;
  topic: string;
  mode: string;
  models: string[];
  etaSeconds?: number;
}

export function renderDebatePanelHtml(opts: DebatePanelHtmlOptions): string {
  const { webview, nonce, topic, mode, models, etaSeconds } = opts;
  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    `img-src ${webview.cspSource} https: data:`,
    `font-src ${webview.cspSource}`,
  ].join("; ");

  const safeTopic = escapeHtml(topic);
  const safeMode = escapeHtml(mode);
  const safeModels = models.map(escapeHtml).join(", ") || "—";
  const etaText =
    typeof etaSeconds === "number"
      ? `~${Math.max(1, Math.round(etaSeconds))}s`
      : "—";

  return html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="Content-Security-Policy" content="${csp}" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Consilium Debate</title>
        <style nonce="${nonce}">
          :root {
            color-scheme: light dark;
          }
          * {
            box-sizing: border-box;
          }
          html,
          body {
            margin: 0;
            padding: 0;
            height: 100%;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background: var(--vscode-editor-background);
          }
          body {
            display: flex;
            flex-direction: column;
          }
          header.dp-head {
            padding: 12px 16px;
            border-bottom: 1px solid var(--vscode-panel-border);
            background: var(--vscode-sideBarSectionHeader-background);
          }
          .dp-topic {
            font-weight: 600;
            font-size: 14px;
            margin: 0 0 6px 0;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .dp-meta {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            font-size: 12px;
            opacity: 0.85;
          }
          .dp-meta-row {
            display: flex;
            gap: 6px;
            align-items: center;
          }
          .dp-meta-label {
            opacity: 0.6;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.05em;
          }
          .dp-status {
            margin-left: auto;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
          }
          main#stream {
            flex: 1;
            overflow-y: auto;
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .dp-evt {
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            padding: 8px 10px;
            background: var(
              --vscode-editor-inactiveSelectionBackground,
              transparent
            );
          }
          .dp-evt.system {
            border-style: dashed;
            font-size: 12px;
            opacity: 0.8;
          }
          .dp-evt.error {
            border-color: var(--vscode-errorForeground);
            color: var(--vscode-errorForeground);
          }
          .dp-evt.consensus {
            border-color: var(--vscode-charts-green, #4caf50);
          }
          .dp-evt-head {
            font-weight: 600;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .dp-evt-meta {
            opacity: 0.7;
            font-weight: 400;
            font-size: 11px;
          }
          .dp-evt-body {
            white-space: pre-wrap;
            word-break: break-word;
            font-family: var(--vscode-editor-font-family);
            font-size: var(--vscode-editor-font-size);
            line-height: 1.5;
          }
          .md-body h1,
          .md-body h2,
          .md-body h3 {
            margin: 0.6em 0 0.3em;
          }
          .md-body h1 {
            font-size: 1.3em;
          }
          .md-body h2 {
            font-size: 1.15em;
          }
          .md-body h3 {
            font-size: 1em;
          }
          .md-body ul {
            padding-left: 1.2em;
            margin: 0.3em 0;
          }
          .md-body code {
            font-family: var(--vscode-editor-font-family);
            background: var(--vscode-textCodeBlock-background);
            padding: 1px 4px;
            border-radius: 3px;
          }
          .md-body pre {
            background: var(--vscode-textCodeBlock-background);
            border-radius: 4px;
            padding: 8px;
            overflow-x: auto;
          }
          .md-body pre code {
            background: transparent;
            padding: 0;
          }
          .dp-actions {
            padding: 8px 16px;
            display: flex;
            gap: 8px;
            border-top: 1px solid var(--vscode-panel-border);
            background: var(--vscode-sideBar-background);
          }
          button.dp-btn {
            padding: 4px 12px;
            border-radius: 3px;
            border: 1px solid var(--vscode-button-border, transparent);
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            font-size: 12px;
            cursor: pointer;
          }
          button.dp-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
          }
          button.dp-btn.danger {
            background: var(--vscode-inputValidation-errorBackground, #5a1d1d);
            color: var(--vscode-inputValidation-errorForeground, #f48771);
          }
          button.dp-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        </style>
      </head>
      <body>
        <header class="dp-head">
          <p class="dp-topic" id="dp-topic">${safeTopic}</p>
          <div class="dp-meta">
            <div class="dp-meta-row">
              <span class="dp-meta-label">Mode</span>
              <span id="dp-mode">${safeMode}</span>
            </div>
            <div class="dp-meta-row">
              <span class="dp-meta-label">Models</span>
              <span id="dp-models">${safeModels}</span>
            </div>
            <div class="dp-meta-row">
              <span class="dp-meta-label">ETA</span>
              <span id="dp-eta">${etaText}</span>
            </div>
            <span class="dp-status" id="dp-status">Starting…</span>
          </div>
          <div
            class="dp-meta"
            id="dp-session-row"
            style="margin-top: 6px; display: none;"
          >
            <div class="dp-meta-row">
              <span class="dp-meta-label">Saved</span>
              <a
                href="#"
                id="dp-session-link"
                style="color: var(--vscode-textLink-foreground); text-decoration: none;"
              ></a>
            </div>
          </div>
        </header>
        <main id="stream"></main>
        <footer class="dp-actions">
          <button class="dp-btn danger" id="dp-cancel">Cancel</button>
          <button class="dp-btn" id="dp-copy" disabled>
            Copy Golden Prompt
          </button>
          <button class="dp-btn" id="dp-insert" disabled>
            Insert at Cursor
          </button>
          <button class="dp-btn" id="dp-newfile" disabled>
            Open in New File
          </button>
        </footer>
        <script nonce="${nonce}">
          (function () {
            "use strict";
            const vscode = acquireVsCodeApi();
            const stream = document.getElementById("stream");
            const status = document.getElementById("dp-status");
            const cancelBtn = document.getElementById("dp-cancel");
            const copyBtn = document.getElementById("dp-copy");
            const insertBtn = document.getElementById("dp-insert");
            const newFileBtn = document.getElementById("dp-newfile");
            const etaEl = document.getElementById("dp-eta");
            const modelsEl = document.getElementById("dp-models");

            const agentNodes = new Map();
            let goldenPrompt = "";
            let finished = false;

            cancelBtn.addEventListener("click", () => {
              if (finished) return;
              vscode.postMessage({ type: "cancel" });
            });
            copyBtn.addEventListener("click", () => {
              if (goldenPrompt)
                vscode.postMessage({ type: "copyGoldenPrompt", goldenPrompt });
            });
            insertBtn.addEventListener("click", () => {
              if (goldenPrompt)
                vscode.postMessage({
                  type: "insertGoldenPrompt",
                  goldenPrompt,
                });
            });
            newFileBtn.addEventListener("click", () => {
              if (goldenPrompt)
                vscode.postMessage({ type: "openInNewFile", goldenPrompt });
            });

            function setStatus(text) {
              status.textContent = text;
            }
            function setFinished(text) {
              finished = true;
              setStatus(text);
              cancelBtn.disabled = true;
            }

            function appendNode(node) {
              stream.appendChild(node);
              stream.scrollTop = stream.scrollHeight;
            }

            function makeEvt(kind, header, meta) {
              const wrap = document.createElement("div");
              wrap.className = "dp-evt " + (kind || "");
              if (header) {
                const head = document.createElement("div");
                head.className = "dp-evt-head";
                const name = document.createElement("span");
                name.textContent = header;
                head.appendChild(name);
                const m = document.createElement("span");
                m.className = "dp-evt-meta";
                if (meta) m.textContent = meta;
                head.appendChild(m);
                wrap.appendChild(head);
              }
              const body = document.createElement("div");
              body.className = "dp-evt-body";
              wrap.appendChild(body);
              return { wrap, body, meta: wrap.querySelector(".dp-evt-meta") };
            }

            function appendSystem(text) {
              const { wrap, body } = makeEvt("system");
              body.textContent = text;
              appendNode(wrap);
            }
            function appendError(text) {
              const { wrap, body } = makeEvt("error", "Error");
              body.textContent = text;
              appendNode(wrap);
            }

            function getOrCreateAgent(id, roundLabel) {
              let node = agentNodes.get(id);
              if (!node) {
                node = makeEvt("agent", id, roundLabel || "");
                appendNode(node.wrap);
                agentNodes.set(id, node);
              } else if (roundLabel && node.meta) {
                node.meta.textContent = roundLabel;
              }
              return node;
            }

            function escapeHtml(text) {
              return String(text)
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#39;");
            }

            function renderMarkdown(src) {
              const lines = String(src || "").split(/\\r?\\n/);
              const out = [];
              let inCode = false;
              let codeLang = "";
              let codeBuf = [];
              let listOpen = false;

              function flushList() {
                if (listOpen) {
                  out.push("</ul>");
                  listOpen = false;
                }
              }

              for (const raw of lines) {
                const line = raw;
                const fence = line.match(/^\`\`\`([^\\s\`]*)\\s*$/);
                if (fence) {
                  if (inCode) {
                    out.push(
                      '<pre><code class="lang-' +
                        escapeHtml(codeLang) +
                        '">' +
                        escapeHtml(codeBuf.join("\\n")) +
                        "</code></pre>",
                    );
                    inCode = false;
                    codeBuf = [];
                    codeLang = "";
                  } else {
                    flushList();
                    inCode = true;
                    codeLang = fence[1] || "";
                  }
                  continue;
                }
                if (inCode) {
                  codeBuf.push(line);
                  continue;
                }
                const h = line.match(/^(#{1,3})\\s+(.*)$/);
                if (h) {
                  flushList();
                  const level = h[1].length;
                  out.push(
                    "<h" + level + ">" + escapeHtml(h[2]) + "</h" + level + ">",
                  );
                  continue;
                }
                const bullet = line.match(/^\\s*[-*]\\s+(.*)$/);
                if (bullet) {
                  if (!listOpen) {
                    out.push("<ul>");
                    listOpen = true;
                  }
                  out.push("<li>" + inlineMd(bullet[1]) + "</li>");
                  continue;
                }
                if (line.trim() === "") {
                  flushList();
                  out.push("");
                  continue;
                }
                flushList();
                out.push("<p>" + inlineMd(line) + "</p>");
              }
              if (inCode) {
                out.push(
                  "<pre><code>" +
                    escapeHtml(codeBuf.join("\\n")) +
                    "</code></pre>",
                );
              }
              flushList();
              return out.join("\\n");
            }

            function inlineMd(text) {
              let t = escapeHtml(text);
              t = t.replace(/\`([^\`]+)\`/g, "<code>$1</code>");
              t = t.replace(/\\*\\*([^*]+)\\*\\*/g, "<strong>$1</strong>");
              t = t.replace(/_([^_]+)_/g, "<em>$1</em>");
              return t;
            }

            function renderConsensus(prompt, totalCost) {
              goldenPrompt = prompt || "";
              const { wrap, body, meta } = makeEvt(
                "consensus",
                "Consensus · Golden Prompt",
              );
              body.className = "dp-evt-body md-body";
              body.innerHTML = renderMarkdown(goldenPrompt);
              if (meta && typeof totalCost === "number") {
                meta.textContent = "$" + totalCost.toFixed(3);
              }
              appendNode(wrap);
              if (goldenPrompt) {
                copyBtn.disabled = false;
                insertBtn.disabled = false;
                newFileBtn.disabled = false;
              }
            }

            const eventHandlers = {
              debate_start: (ev) => {
                if (Array.isArray(ev.models) && ev.models.length) {
                  modelsEl.textContent = ev.models.join(", ");
                }
                appendSystem("Debate started.");
              },
              deliberation_start: (ev) => {
                appendSystem("Deliberation started.");
              },
              round_start: (ev) => {
                appendSystem(
                  "Round " +
                    (ev.round || "?") +
                    (ev.description ? ": " + ev.description : ""),
                );
              },
              agent_start: (ev) => {
                getOrCreateAgent(
                  ev.agentId || "agent",
                  ev.roundNumber !== undefined ? "Round " + ev.roundNumber : "",
                );
              },
              agent_chunk: (ev) => {
                const node = getOrCreateAgent(ev.agentId || "agent");
                node.body.textContent += ev.chunk || "";
                stream.scrollTop = stream.scrollHeight;
              },
              agent_complete: (ev) => {
                const node = getOrCreateAgent(ev.agentId || "agent");
                if (!node.meta) return;
                const parts = [];
                if (typeof ev.tokens === "number")
                  parts.push(ev.tokens + " tok");
                if (typeof ev.cost === "number")
                  parts.push("$" + ev.cost.toFixed(3));
                node.meta.textContent = parts.join(" · ");
              },
              convergence_detected: (ev) => {
                const sim =
                  typeof ev.similarity === "number"
                    ? ev.similarity.toFixed(2)
                    : "?";
                appendSystem("Convergence detected · similarity " + sim);
              },
              phase_change: (ev) => appendSystem("Phase: " + (ev.phase || "?")),
              vote_cast: (ev) =>
                appendSystem(
                  "Vote: " +
                    (ev.vote?.modelId || "?") +
                    " → " +
                    (ev.vote?.choice || "?"),
                ),
              cost_update: (ev) => {
                if (typeof ev.totalCost === "number") {
                  setStatus("Running · $" + ev.totalCost.toFixed(3));
                }
                if (typeof ev.etaSeconds === "number") {
                  etaEl.textContent =
                    "~" + Math.max(1, Math.round(ev.etaSeconds)) + "s";
                }
              },
              judge_start: (ev) =>
                appendSystem(
                  "Judge starting" +
                    (ev.judgeModel ? " · " + ev.judgeModel : ""),
                ),
              consensus: (ev) => renderConsensus(ev.goldenPrompt, ev.totalCost),
              "routing:fallback": (ev) => {
                appendSystem(
                  "Routing fallback applied" +
                    (ev.resolutions
                      ? " · " + JSON.stringify(ev.resolutions)
                      : ""),
                );
              },
              "tool:call_request": (ev) =>
                appendSystem("Tool call: " + (ev.name || "?")),
              "tool:call_completed": (ev) =>
                appendSystem("Tool completed: " + (ev.name || "?")),
              "tool:call_failed": (ev) =>
                appendSystem("Tool failed: " + (ev.name || "?")),
              done: (ev) => {
                if (ev.goldenPrompt && !goldenPrompt)
                  renderConsensus(ev.goldenPrompt, ev.totalCost);
                const cost =
                  typeof ev.totalCost === "number"
                    ? " · $" + ev.totalCost.toFixed(3)
                    : "";
                setFinished("Done · " + (ev.status || "completed") + cost);
              },
              deliberation_complete: (ev) => {
                if (ev.goldenPrompt && !goldenPrompt)
                  renderConsensus(ev.goldenPrompt, ev.totalCost);
                setFinished("Done");
              },
              error: (ev) => {
                appendError(ev.message || "Unknown error");
                setFinished("Error");
              },
              "debate:cancelled": () => {
                appendSystem("Debate cancelled.");
                setFinished("Cancelled");
              },
              keepalive: () => {},
              timeout: () => {},
            };

            function handleEvent(ev) {
              if (!ev || typeof ev !== "object") return;
              const kind = ev.event || ev.type;
              const handler = Object.hasOwn(eventHandlers, kind)
                ? eventHandlers[kind]
                : null;
              if (handler) handler(ev);
              else if (kind) appendSystem("[" + kind + "]");
            }

            const sessionRow = document.getElementById("dp-session-row");
            const sessionLink = document.getElementById("dp-session-link");
            if (sessionLink) {
              sessionLink.addEventListener("click", (e) => {
                e.preventDefault();
                const id = sessionLink.dataset.sessionId;
                if (id) {
                  vscode.postMessage({
                    type: "openSavedSession",
                    sessionId: id,
                  });
                }
              });
            }

            const messageHandlers = {
              event: (msg) => handleEvent(msg.payload),
              status: (msg) => setStatus(String(msg.text || "")),
              completed: () => setFinished("Completed"),
              cancelled: () => {
                appendSystem("Cancelled.");
                setFinished("Cancelled");
              },
              error: (msg) => {
                appendError(String(msg.message || "Unknown error"));
                setFinished("Error");
              },
              sessionSaved: (msg) => {
                if (!sessionRow || !sessionLink) return;
                const title = String(
                  msg.sessionTitle || msg.sessionId || "session",
                );
                sessionLink.textContent = title;
                sessionLink.dataset.sessionId = String(msg.sessionId || "");
                sessionRow.style.display = "flex";
                appendSystem("Saved to session: " + title);
              },
            };

            window.addEventListener("message", (event) => {
              if (
                event.origin !== window.origin &&
                event.origin !== "null" &&
                event.origin !== "" &&
                !event.origin.startsWith("vscode-")
              ) {
                return;
              }
              const msg = event.data;
              if (!msg || typeof msg !== "object") return;
              const handler = Object.hasOwn(messageHandlers, msg.type)
                ? messageHandlers[msg.type]
                : null;
              if (handler) handler(msg);
            });

            vscode.postMessage({ type: "ready" });
          })();
        </script>
      </body>
    </html>`;
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  let out = "";
  for (let i = 0; i < strings.length; i++) {
    out += strings[i];
    if (i < values.length) {
      out += String(values[i] ?? "");
    }
  }
  return out;
}
