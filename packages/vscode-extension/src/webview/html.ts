import * as vscode from "vscode";

export function getWebviewHtml(
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  nonce: string,
): string {
  const cssUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "chat.css"),
  );
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, "media", "chat.js"),
  );
  const csp = [
    `default-src 'none'`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    `img-src ${webview.cspSource} https: data:`,
    `font-src ${webview.cspSource}`,
  ].join("; ");

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consilium Council</title>
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  <header class="cn-header">
    <div class="cn-title"><span class="cn-dot"></span>Consilium Council</div>
    <div class="cn-status" id="cn-status">Idle</div>
  </header>
  <main class="cn-transcript" id="cn-transcript">
    <div class="cn-empty" id="cn-empty">
      <p>Start a debate or red-team a snippet from the editor.</p>
      <ul>
        <li><kbd>Ctrl/Cmd+Alt+C</kbd> — New debate</li>
        <li><kbd>Ctrl/Cmd+Alt+D</kbd> — Debate selection</li>
        <li><kbd>Ctrl/Cmd+Alt+R</kbd> — Red-team selection</li>
      </ul>
    </div>
  </main>
  <footer class="cn-composer">
    <div class="cn-composer-row">
      <select id="cn-mode" class="cn-select" aria-label="Mode">
        <option value="quick">quick — 1 round</option>
        <option value="council" selected>council — 3 rounds</option>
        <option value="deep">deep — 5 rounds + sub-agents</option>
        <option value="blind">blind — names hidden</option>
        <option value="redteam">redteam — adversarial</option>
        <option value="jury">jury — voting panel</option>
        <option value="market">market — confidence aggregation</option>
        <option value="auto">auto — pick mode</option>
      </select>
      <button id="cn-cancel" class="cn-button cn-cancel" hidden>Cancel</button>
    </div>
    <textarea
      id="cn-input"
      class="cn-input"
      rows="3"
      placeholder="Ask the council… (Shift+Enter for newline, Enter to send)"
    ></textarea>
    <div class="cn-composer-row">
      <span class="cn-hint" id="cn-context-hint">Workspace context will be included.</span>
      <button id="cn-submit" class="cn-button cn-primary">Start debate</button>
    </div>
  </footer>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}
